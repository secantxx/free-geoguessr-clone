import { useState } from 'react';
import {
  Button,
  Chip,
  SectionTitle,
  Select,
  Surface,
  SurfaceCut,
  Switch,
} from '@cladd-ui/react';
import {
  ArrowRight,
  Compass,
  ExternalLink,
  Globe2,
  KeyRound,
  MapPin,
  Route,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import AppShell from '../../components/AppShell/AppShell';
import api from '../../config/api';
import gameConfig from '../../config/game.json';

const REGION_IDS = Object.keys(gameConfig.regionNames);

function Home() {
  const navigate = useNavigate();
  const [region, setRegion] = useState('wrl');
  const [showTimer, setShowTimer] = useState(true);
  const [showCompass, setShowCompass] = useState(true);

  const startGame = () => {
    const params = new URLSearchParams({
      region,
      timer: showTimer ? 'on' : 'off',
      compass: showCompass ? 'on' : 'off',
    });
    navigate(`/game?${params}`);
  };

  return (
    <AppShell active="play">
      <main className="home-main">
        <div className="home-heading">
          <div>
            <Chip color="green" icon={ShieldCheck} rounded>
              Free to play
            </Chip>
            <h1>Free GeoGuessr</h1>
            <p>Drop into Street View, read the landscape, and place your best guess.</p>
          </div>
        </div>

        <Surface
          level={1}
          outline
          className="setup-surface rounded-3xl"
          contentClassName="setup-grid"
        >
          <section className="setup-controls">
            <div>
              <SectionTitle>New game</SectionTitle>
              <h2>Choose your field</h2>
            </div>

            <div className="control-stack">
              <div className="field-group">
                <span className="field-label">Region</span>
                <Select
                  className="w-full"
                  size="xl"
                  surface="cut"
                  color="brand"
                  indicatorColor="brand"
                  title="Region"
                  options={REGION_IDS}
                  value={region}
                  onChange={setRegion}
                  renderOption={({ value }) => gameConfig.regionNames[value]}
                  icon={<Globe2 />}
                >
                  {gameConfig.regionNames[region]}
                </Select>
              </div>

              <div className="preference-list">
                <label>
                  <span className="preference-copy">
                    <Compass aria-hidden="true" />
                    <span>
                      <strong>Compass</strong>
                      <small>Keep north in view</small>
                    </span>
                  </span>
                  <Switch
                    as="span"
                    checked={showCompass}
                    onChange={setShowCompass}
                    color="brand"
                  />
                </label>
                <label>
                  <span className="preference-copy">
                    <Timer aria-hidden="true" />
                    <span>
                      <strong>Timer</strong>
                      <small>Track every second</small>
                    </span>
                  </span>
                  <Switch
                    as="span"
                    checked={showTimer}
                    onChange={setShowTimer}
                    color="brand"
                  />
                </label>
              </div>
            </div>

            {!api.googleMapsApiKey && (
              <Surface
                outline
                color="yellow"
                variant="solid"
                className="key-warning rounded-2xl"
                contentClassName="key-warning-content"
              >
                <KeyRound aria-hidden="true" />
                <div>
                  <strong>Maps key required</strong>
                  <span>Add it to <code>.env.local</code> before starting a round.</span>
                </div>
                <Button
                  as="a"
                  href="https://developers.google.com/maps/documentation/javascript/demo-key"
                  target="_blank"
                  rel="noreferrer"
                  color="yellow"
                  variant="transparent"
                  outline={false}
                  aria-label="Get a Google Maps demo key"
                >
                  <ExternalLink aria-hidden="true" />
                </Button>
              </Surface>
            )}

            <Button
              size="xl"
              color="brand"
              variant="gradient-fill"
              disabled={!api.googleMapsApiKey}
              onClick={startGame}
              className="start-button w-full"
            >
              Start round
              <ArrowRight aria-hidden="true" />
            </Button>
          </section>

          <SurfaceCut
            outline
            className="mission-preview rounded-3xl"
            contentClassName="mission-preview-content"
          >
            <div className="map-grid" aria-hidden="true">
              <span className="route-line route-line-one" />
              <span className="route-line route-line-two" />
              <MapPin className="preview-pin preview-pin-one" />
              <MapPin className="preview-pin preview-pin-two" />
              <MapPin className="preview-pin preview-pin-three" />
            </div>
            <div className="preview-overlay">
              <Chip color="brand" icon={Route} rounded>
                One round
              </Chip>
              <div>
                <h2>{gameConfig.regionNames[region]}</h2>
                <p>Street View panorama and an interactive world map.</p>
              </div>
              <div className="preview-meta">
                <span><MapPin /> Random start</span>
                <span><Globe2 /> Precise scoring</span>
              </div>
            </div>
          </SurfaceCut>
        </Surface>
      </main>
    </AppShell>
  );
}

export default Home;
