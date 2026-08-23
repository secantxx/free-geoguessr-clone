import { useMemo, useRef, useState } from 'react';
import {
  Button,
  Chip,
  SectionTitle,
  Surface,
  SurfaceCut,
  Switch,
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  Tooltip,
  useDialog,
} from '@cladd-ui/react';
import {
  Clock3,
  Download,
  ExternalLink,
  FileUp,
  MapPin,
  Play,
  Target,
  Trash2,
  Trophy,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import AppShell from '../../components/AppShell/AppShell';
import gameConfig from '../../config/game.json';
import {
  clearHistory,
  getHistory,
  getPreferences,
  parseHistoryFile,
  replaceHistory,
  serializeHistory,
  setPreferences,
} from '../../lib/storage';
import calcAccuracy from '../../utils/calc/calc-accuracy';
import calcGeoDistance from '../../utils/calc/calc-geo-distance';
import calcPoints from '../../utils/calc/calc-points';
import geoUrl from '../../utils/geo-url';
import readableDistance from '../../utils/readable/readable-distance';
import readablePercentage from '../../utils/readable/readable-percentage';
import readableTime from '../../utils/readable/readable-time';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function deriveRounds(rounds) {
  return rounds.map((round, index) => {
    const distance = calcGeoDistance(round.gp, round.rp);
    const accuracy = calcAccuracy(distance);
    return {
      ...round,
      id: index + 1,
      distance,
      accuracy,
      points: calcPoints(accuracy, round.tm),
    };
  });
}

function summarize(rounds) {
  if (!rounds.length) {
    return {
      rounds: 0,
      totalPoints: 0,
      averageAccuracy: 0,
      bestScore: 0,
      totalTime: 0,
    };
  }

  const totals = rounds.reduce(
    (result, round) => ({
      points: result.points + round.points,
      accuracy: result.accuracy + round.accuracy,
      time: result.time + round.tm,
      best: Math.max(result.best, round.points),
    }),
    { points: 0, accuracy: 0, time: 0, best: 0 },
  );

  return {
    rounds: rounds.length,
    totalPoints: totals.points,
    averageAccuracy: totals.accuracy / rounds.length,
    bestScore: totals.best,
    totalTime: totals.time,
  };
}

function Stats() {
  const dialog = useDialog();
  const fileInputRef = useRef(null);
  const [rawHistory, setRawHistory] = useState(() => getHistory());
  const [pauseProgress, setPauseProgress] = useState(() => getPreferences().pauseProgress);
  const rounds = useMemo(() => deriveRounds(rawHistory), [rawHistory]);
  const summary = useMemo(() => summarize(rounds), [rounds]);

  const exportHistory = () => {
    if (!rawHistory.length) return;
    const url = URL.createObjectURL(
      new Blob([serializeHistory(rawHistory)], { type: 'application/json' }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `free-geoguessr-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const applyImport = (nextHistory) => {
    const saved = replaceHistory(nextHistory);
    setRawHistory(saved);
  };

  const importHistory = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const nextHistory = parseHistoryFile(await file.text());
      if (rawHistory.length) {
        dialog.confirm({
          title: 'Replace your field log?',
          text: `${nextHistory.length} imported rounds will replace ${rawHistory.length} saved rounds.`,
          confirmButtonText: 'Replace log',
          confirmButtonColor: 'red',
          requireConfirmText: 'IMPORT',
          onConfirm: () => applyImport(nextHistory),
        });
      } else {
        applyImport(nextHistory);
      }
    } catch (error) {
      dialog.alert({
        title: 'Import failed',
        text: error instanceof Error ? error.message : 'The selected file could not be imported.',
      });
    }
  };

  const deleteHistory = () => {
    dialog.confirm({
      title: 'Delete your field log?',
      text: 'This permanently removes this app\'s saved rounds from this browser.',
      confirmButtonText: 'Delete log',
      confirmButtonColor: 'red',
      requireConfirmText: 'DELETE',
      onConfirm: () => {
        clearHistory();
        setRawHistory([]);
      },
    });
  };

  const updatePauseProgress = (checked) => {
    setPauseProgress(checked);
    setPreferences({ pauseProgress: checked });
  };

  return (
    <AppShell active="stats">
      <main className="stats-main">
        <header className="stats-heading">
          <div>
            <Chip color="brand" icon={MapPin} rounded>
              {summary.rounds} {summary.rounds === 1 ? 'round' : 'rounds'}
            </Chip>
            <h1>Your field log</h1>
            <p>A local record of every completed round.</p>
          </div>
          <Button as={Link} to="/" size="lg" color="brand" variant="gradient-fill">
            <Play aria-hidden="true" />
            New round
          </Button>
        </header>

        <section className="stats-grid" aria-label="Summary">
          <StatCard icon={MapPin} label="Rounds" value={String(summary.rounds)} />
          <StatCard icon={Trophy} label="Total points" value={summary.totalPoints.toLocaleString()} />
          <StatCard
            icon={Target}
            label="Average accuracy"
            value={readablePercentage(summary.averageAccuracy)}
          />
          <StatCard icon={Trophy} label="Best score" value={summary.bestScore.toLocaleString()} color="green" />
          <StatCard icon={Clock3} label="Time exploring" value={readableTime(summary.totalTime)} />
        </section>

        <section className="history-section">
          <div className="section-heading-row">
            <div>
              <SectionTitle>History</SectionTitle>
              <h2>Recent rounds</h2>
            </div>
            <Chip>{rounds.length}</Chip>
          </div>

          {rounds.length ? (
            <Surface outline className="history-surface rounded-3xl" wrapContent={false}>
              <div className="history-table-wrap relative">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Round</th>
                      <th>Region</th>
                      <th>Distance</th>
                      <th>Accuracy</th>
                      <th>Time</th>
                      <th>Points</th>
                      <th>Date</th>
                      <th><span className="sr-only">Map links</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...rounds].reverse().map((round) => (
                      <tr key={round.dt}>
                        <td data-label="Round">#{round.id}</td>
                        <td data-label="Region">{gameConfig.regionNames[round.rg]}</td>
                        <td data-label="Distance">{readableDistance(round.distance)}</td>
                        <td data-label="Accuracy">{readablePercentage(round.accuracy)}</td>
                        <td data-label="Time">{readableTime(round.tm)}</td>
                        <td data-label="Points"><strong>{round.points.toLocaleString()}</strong></td>
                        <td data-label="Date">{dateFormatter.format(round.dt)}</td>
                        <td className="round-links">
                          <Tooltip tooltip="Open guess in Google Maps">
                            <Button
                              as="a"
                              href={geoUrl(round.gp)}
                              target="_blank"
                              rel="noreferrer"
                              square
                              aria-label="Open guess in Google Maps"
                            >
                              <MapPin aria-hidden="true" />
                            </Button>
                          </Tooltip>
                          <Tooltip tooltip="Open actual location in Google Maps">
                            <Button
                              as="a"
                              href={geoUrl(round.rp)}
                              target="_blank"
                              rel="noreferrer"
                              square
                              color="green"
                              aria-label="Open actual location in Google Maps"
                            >
                              <ExternalLink aria-hidden="true" />
                            </Button>
                          </Tooltip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Surface>
          ) : (
            <SurfaceCut
              outline
              className="history-empty rounded-3xl"
              contentClassName="history-empty-content"
            >
              <MapPin aria-hidden="true" />
              <h3>No rounds yet</h3>
              <p>Your first completed round will appear here.</p>
              <Button as={Link} to="/" color="brand">
                <Play aria-hidden="true" />
                Start playing
              </Button>
            </SurfaceCut>
          )}
        </section>

        <Surface
          level={1}
          outline
          className="data-surface rounded-3xl"
          contentClassName="data-surface-content"
        >
          <div>
            <SectionTitle>Local data</SectionTitle>
            <h2>Progress controls</h2>
            <p>Rounds are stored only in this browser unless you export them.</p>
          </div>

          <label className="pause-row">
            <span>
              <strong>Pause progress</strong>
              <small>Play without adding rounds to the field log.</small>
            </span>
            <Switch
              as="span"
              checked={pauseProgress}
              onChange={updatePauseProgress}
              color="brand"
            />
          </label>

          <Toolbar size="lg" className="data-actions">
            <ToolbarButton onClick={exportHistory} disabled={!rawHistory.length}>
              <Download aria-hidden="true" />
              Export
            </ToolbarButton>
            <ToolbarButton onClick={() => fileInputRef.current?.click()}>
              <FileUp aria-hidden="true" />
              Import
            </ToolbarButton>
            <ToolbarSeparator />
            <ToolbarButton color="red" onClick={deleteHistory} disabled={!rawHistory.length}>
              <Trash2 aria-hidden="true" />
              Delete
            </ToolbarButton>
          </Toolbar>
          <input
            ref={fileInputRef}
            className="sr-only"
            type="file"
            accept="application/json,.json"
            onChange={importHistory}
            tabIndex={-1}
          />
        </Surface>
      </main>
    </AppShell>
  );
}

function StatCard({ color, icon: Icon, label, value }) {
  return (
    <Surface
      outline
      color={color}
      className="stat-card rounded-2xl"
      contentClassName="stat-card-content"
    >
      <Icon aria-hidden="true" />
      <strong>{value}</strong>
      <span>{label}</span>
    </Surface>
  );
}

export default Stats;
