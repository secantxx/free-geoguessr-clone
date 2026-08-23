import { useCallback, useEffect, useRef, useState } from 'react';
import { Status, Wrapper } from '@googlemaps/react-wrapper';
import {
  Button,
  Chip,
  SectionTitle,
  Spinner,
  Surface,
  SurfaceCut,
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  Tooltip,
  useDialog,
} from '@cladd-ui/react';
import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Compass,
  Crosshair,
  ExternalLink,
  Flag,
  Globe2,
  Home,
  Info,
  LocateFixed,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  RotateCcw,
  Timer as TimerIcon,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import GuessMap from '../../components/GoogleMaps/GuessMap';
import ResultsMap from '../../components/GoogleMaps/ResultsMap';
import StreetViewScene from '../../components/GoogleMaps/StreetViewScene';
import api from '../../config/api';
import gameConfig from '../../config/game.json';
import { getPreferences, saveRound } from '../../lib/storage';
import calcAccuracy from '../../utils/calc/calc-accuracy';
import calcGeoDistance from '../../utils/calc/calc-geo-distance';
import calcPoints from '../../utils/calc/calc-points';
import geoUrl from '../../utils/geo-url';
import readableDistance from '../../utils/readable/readable-distance';
import readablePercentage from '../../utils/readable/readable-percentage';
import readableTime from '../../utils/readable/readable-time';

const FORMULAS = `Accuracy = max(1 - distance / (earth circumference / 4), 0)

Time effect = 0.02 x floor(seconds / 60) + 1

Points = floor(accuracy / time effect x 25,000)`;

function FullScreenNotice({ children, icon: Icon, text, title }) {
  return (
    <main className="game-notice bg-cladd-bg text-cladd-fg">
      <Surface
        level={1}
        outline
        className="game-notice-surface rounded-3xl"
        contentClassName="game-notice-content"
      >
        <Icon aria-hidden="true" />
        <h1>{title}</h1>
        <p>{text}</p>
        <div className="notice-actions">{children}</div>
      </Surface>
    </main>
  );
}

function MapLoader({ status }) {
  const failed = status === Status.FAILURE;
  return (
    <FullScreenNotice
      icon={failed ? Info : MapIcon}
      title={failed ? 'Google Maps could not load' : 'Opening the world'}
      text={failed ? 'Check the browser key, domain restriction, and enabled APIs.' : 'Loading map data...'}
    >
      {failed ? (
        <Button as={Link} to="/" color="brand">
          <ArrowLeft aria-hidden="true" />
          Back home
        </Button>
      ) : (
        <Spinner size="xl" color="brand" />
      )}
    </FullScreenNotice>
  );
}

function MapGate({ children }) {
  if (!api.googleMapsApiKey) {
    return (
      <FullScreenNotice
        icon={Info}
        title="Google Maps key missing"
        text="Add VITE_GOOGLE_MAPS_API_KEY to .env.local, then restart the development server."
      >
        <Button
          as="a"
          href="https://developers.google.com/maps/documentation/javascript/demo-key"
          target="_blank"
          rel="noreferrer"
          color="brand"
        >
          Get a demo key
          <ExternalLink aria-hidden="true" />
        </Button>
        <Button as={Link} to="/">
          <ArrowLeft aria-hidden="true" />
          Back home
        </Button>
      </FullScreenNotice>
    );
  }

  return (
    <Wrapper apiKey={api.googleMapsApiKey} render={(status) => <MapLoader status={status} />}>
      {children}
    </Wrapper>
  );
}

function Game() {
  return (
    <MapGate>
      <GameRound />
    </MapGate>
  );
}

function GameRound() {
  const dialog = useDialog();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedRegion = searchParams.get('region') || 'wrl';
  const region = gameConfig.regionNames[requestedRegion] ? requestedRegion : 'wrl';
  const showCompass = searchParams.get('compass') !== 'off';
  const showTimer = searchParams.get('timer') !== 'off';

  const panoramaRef = useRef(null);
  const startedAtRef = useRef(0);
  const [roundKey, setRoundKey] = useState(0);
  const [phase, setPhase] = useState('loading');
  const [error, setError] = useState('');
  const [realPosition, setRealPosition] = useState(null);
  const [guessPosition, setGuessPosition] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [heading, setHeading] = useState(0);

  const handleReady = useCallback((position) => {
    startedAtRef.current = Date.now();
    setRealPosition(position);
    setElapsed(0);
    setError('');
    setPhase('playing');
  }, []);
  const handleSceneError = useCallback((message) => {
    setError(message);
    setPhase('error');
  }, []);
  const handleHeadingChange = useCallback((value) => setHeading(value), []);
  const handleGuessChange = useCallback((value) => setGuessPosition(value), []);

  useEffect(() => {
    if (phase !== 'playing') return undefined;
    const updateTime = () => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1000)));
    };
    const interval = window.setInterval(updateTime, 1000);
    return () => window.clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'playing') return undefined;
    const guard = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [phase]);

  const restartRound = () => {
    setPhase('loading');
    setError('');
    setRealPosition(null);
    setGuessPosition(null);
    setElapsed(0);
    setHeading(0);
    startedAtRef.current = 0;
    setRoundKey((value) => value + 1);
  };

  const finishRound = () => {
    if (!realPosition || !guessPosition) return;
    const finalTime = Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1000));
    setElapsed(finalTime);

    if (!getPreferences().pauseProgress) {
      try {
        saveRound({
          rg: region,
          gp: guessPosition,
          rp: realPosition,
          tm: finalTime,
          dt: Date.now(),
        });
      } catch {
        dialog.alert({
          title: 'Progress was not saved',
          text: 'The round is complete, but browser storage was unavailable.',
        });
      }
    }
    setPhase('results');
  };

  const confirmGuess = () => {
    if (!guessPosition || phase !== 'playing') return;
    dialog.confirm({
      title: 'Lock in this location?',
      text: 'Your marker will become the final guess for this round.',
      confirmButtonText: 'Lock guess',
      confirmButtonColor: 'brand',
      onConfirm: finishRound,
    });
  };

  const confirmQuit = () => {
    dialog.confirm({
      title: 'Leave this round?',
      text: 'The current round will not be added to your stats.',
      confirmButtonText: 'Leave round',
      confirmButtonColor: 'red',
      onConfirm: () => navigate('/'),
    });
  };

  if (phase === 'results' && realPosition && guessPosition) {
    return (
      <RoundResults
        elapsed={elapsed}
        guessPosition={guessPosition}
        onReplay={restartRound}
        realPosition={realPosition}
        region={region}
      />
    );
  }

  return (
    <main className="game-screen">
      <StreetViewScene
        key={roundKey}
        instanceRef={panoramaRef}
        onError={handleSceneError}
        onHeadingChange={handleHeadingChange}
        onReady={handleReady}
        region={region}
      />

      {phase === 'loading' && (
        <div className="scene-loading" role="status">
          <Surface
            outline
            className="rounded-2xl"
            contentClassName="flex items-center gap-3 px-4 py-3"
          >
            <Spinner color="brand" size="lg" />
            <span>Finding Street View coverage...</span>
          </Surface>
        </div>
      )}

      {phase === 'error' && (
        <div className="scene-loading" role="alert">
          <Surface
            outline
            color="red"
            className="scene-error rounded-2xl"
            contentClassName="scene-error-content"
          >
            <Info aria-hidden="true" />
            <div>
              <strong>Could not start the round</strong>
              <span>{error}</span>
            </div>
            <Button color="red" onClick={restartRound}>
              <RotateCcw aria-hidden="true" />
              Retry
            </Button>
          </Surface>
        </div>
      )}

      <GameHud
        elapsed={elapsed}
        guessDisabled={!guessPosition || phase !== 'playing'}
        heading={heading}
        onGuess={confirmGuess}
        onGuessChange={handleGuessChange}
        onQuit={confirmQuit}
        onResetView={() => realPosition && panoramaRef.current?.setPosition({
          lat: realPosition[0],
          lng: realPosition[1],
        })}
        onZoom={(amount) => {
          const panorama = panoramaRef.current;
          if (panorama) panorama.setZoom(panorama.getZoom() + amount);
        }}
        region={region}
        roundKey={roundKey}
        showCompass={showCompass}
        showTimer={showTimer}
      />
    </main>
  );
}

function GameHud({
  elapsed,
  guessDisabled,
  heading,
  onGuess,
  onGuessChange,
  onQuit,
  onResetView,
  onZoom,
  region,
  roundKey,
  showCompass,
  showTimer,
}) {
  const [mapSize, setMapSize] = useState(1);
  const [collapsed, setCollapsed] = useState(false);
  const resizeKey = `${roundKey}-${mapSize}-${collapsed}`;

  return (
    <div className="game-hud">
      <div className="game-status-row">
        <Toolbar size="md" className="game-status" aria-label="Round status">
          <Chip color="brand" icon={Globe2} size="md">
            {gameConfig.regionNames[region]}
          </Chip>
          {showTimer && (
            <Chip icon={TimerIcon} size="md">
              {readableTime(elapsed)}
            </Chip>
          )}
          {showCompass && (
            <Chip size="md" aria-label={`Compass heading ${Math.round(heading)} degrees`}>
              <Compass aria-hidden="true" style={{ transform: `rotate(${heading}deg)` }} />
              {Math.round(heading)}°
            </Chip>
          )}
        </Toolbar>
      </div>

      <div className="game-actions">
        <Toolbar size="lg" aria-label="Street View controls">
          <Tooltip tooltip="Quit round">
            <ToolbarButton onClick={onQuit} color="red" aria-label="Quit round">
              <X aria-hidden="true" />
            </ToolbarButton>
          </Tooltip>
          <ToolbarSeparator />
          <Tooltip tooltip="Return to start">
            <ToolbarButton onClick={onResetView} aria-label="Return to start">
              <Flag aria-hidden="true" />
            </ToolbarButton>
          </Tooltip>
          <Tooltip tooltip="Zoom in">
            <ToolbarButton onClick={() => onZoom(0.5)} aria-label="Zoom in">
              <ZoomIn aria-hidden="true" />
            </ToolbarButton>
          </Tooltip>
          <Tooltip tooltip="Zoom out">
            <ToolbarButton onClick={() => onZoom(-0.5)} aria-label="Zoom out">
              <ZoomOut aria-hidden="true" />
            </ToolbarButton>
          </Tooltip>
        </Toolbar>
      </div>

      <Surface
        outline
        className={`guess-panel guess-panel-size-${mapSize} rounded-3xl`}
        wrapContent={false}
        data-collapsed={collapsed}
      >
        <div className="guess-panel-header relative">
          <div className="guess-panel-title">
            <LocateFixed aria-hidden="true" />
            <span>Place your guess</span>
          </div>
          <Toolbar size="md" variant="transparent" outline={false} aria-label="Map controls">
            <Tooltip tooltip="Smaller map">
              <ToolbarButton
                onClick={() => setMapSize((value) => Math.max(0, value - 1))}
                disabled={mapSize === 0}
                aria-label="Smaller map"
              >
                <Minimize2 aria-hidden="true" />
              </ToolbarButton>
            </Tooltip>
            <Tooltip tooltip="Larger map">
              <ToolbarButton
                onClick={() => setMapSize((value) => Math.min(2, value + 1))}
                disabled={mapSize === 2}
                aria-label="Larger map"
              >
                <Maximize2 aria-hidden="true" />
              </ToolbarButton>
            </Tooltip>
            <Tooltip tooltip={collapsed ? 'Open map' : 'Collapse map'}>
              <ToolbarButton
                onClick={() => setCollapsed((value) => !value)}
                aria-label={collapsed ? 'Open map' : 'Collapse map'}
              >
                {collapsed ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
              </ToolbarButton>
            </Tooltip>
          </Toolbar>
        </div>
        <SurfaceCut
          outline
          className="guess-map-slot relative rounded-2xl"
          contentClassName="h-full overflow-hidden rounded-2xl"
        >
          <GuessMap key={roundKey} onGuessChange={onGuessChange} resizeKey={resizeKey} />
        </SurfaceCut>
        <div className="guess-panel-footer relative">
          <Button
            className="w-full"
            size="xl"
            color="brand"
            variant="gradient-fill"
            disabled={guessDisabled}
            onClick={onGuess}
          >
            <Crosshair aria-hidden="true" />
            {guessDisabled ? 'Choose a location' : 'Lock guess'}
          </Button>
        </div>
      </Surface>
    </div>
  );
}

function RoundResults({ elapsed, guessPosition, onReplay, realPosition, region }) {
  const dialog = useDialog();
  const distance = calcGeoDistance(guessPosition, realPosition);
  const accuracy = calcAccuracy(distance);
  const points = calcPoints(accuracy, elapsed);
  const coordinate = (value) => value.map((number) => number.toFixed(4)).join(', ');

  return (
    <main className="results-screen bg-cladd-bg text-cladd-fg">
      <header className="results-header">
        <div>
          <Chip color="green" icon={Flag} rounded>Round complete</Chip>
          <h1>{points.toLocaleString()} points</h1>
        </div>
        <Toolbar size="md">
          <Tooltip tooltip="Home" position="bottom">
            <ToolbarButton as={Link} to="/" aria-label="Home">
              <Home aria-hidden="true" />
            </ToolbarButton>
          </Tooltip>
          <Tooltip tooltip="Stats" position="bottom">
            <ToolbarButton as={Link} to="/stats" aria-label="Stats">
              <BarChart3 aria-hidden="true" />
            </ToolbarButton>
          </Tooltip>
        </Toolbar>
      </header>

      <div className="results-layout">
        <Surface
          level={1}
          outline
          className="results-map-shell rounded-3xl"
          contentClassName="h-full overflow-hidden rounded-3xl"
        >
          <ResultsMap actualPosition={realPosition} guessPosition={guessPosition} />
          <div className="map-legend">
            <Chip color="brand" rounded>Your guess</Chip>
            <Chip color="green" rounded>Actual</Chip>
          </div>
        </Surface>

        <section className="results-summary">
          <div>
            <SectionTitle>{gameConfig.regionNames[region]}</SectionTitle>
            <h2>Round breakdown</h2>
          </div>
          <div className="result-metrics">
            <ResultMetric label="Distance" value={readableDistance(distance)} />
            <ResultMetric label="Accuracy" value={readablePercentage(accuracy)} />
            <ResultMetric label="Time" value={readableTime(elapsed)} />
            <ResultMetric label="Score" value={points.toLocaleString()} color="green" />
          </div>

          <SurfaceCut
            outline
            className="coordinate-panel rounded-2xl"
            contentClassName="coordinate-content"
          >
            <a href={geoUrl(guessPosition)} target="_blank" rel="noreferrer">
              <span>Your guess</span>
              <strong>{coordinate(guessPosition)}</strong>
              <ExternalLink aria-hidden="true" />
            </a>
            <a href={geoUrl(realPosition)} target="_blank" rel="noreferrer">
              <span>Actual</span>
              <strong>{coordinate(realPosition)}</strong>
              <ExternalLink aria-hidden="true" />
            </a>
          </SurfaceCut>

          <Toolbar size="lg" className="results-actions">
            <ToolbarButton color="brand" variant="gradient-fill" onClick={onReplay}>
              <RotateCcw aria-hidden="true" />
              Play again
            </ToolbarButton>
            <ToolbarButton
              onClick={() => dialog.alert({
                title: 'Scoring formula',
                text: <pre className="formula-text">{FORMULAS}</pre>,
              })}
            >
              <Info aria-hidden="true" />
              Scoring
            </ToolbarButton>
          </Toolbar>
        </section>
      </div>
    </main>
  );
}

function ResultMetric({ color, label, value }) {
  return (
    <Surface
      outline
      color={color}
      className="result-metric rounded-2xl"
      contentClassName="result-metric-content"
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </Surface>
  );
}

export default Game;
