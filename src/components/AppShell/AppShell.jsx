import {
  Surface,
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  Tooltip,
} from '@cladd-ui/react';
import { BarChart3, Code2, MapPinned, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const GITHUB_URL = 'https://github.com/secantxx/free-geoguessr-clone';

function AppShell({ active, children }) {
  return (
    <div className="app-shell bg-cladd-bg text-cladd-fg">
      <header className="app-header">
        <div className="app-header-inner">
          <Link to="/" className="brand-lockup" aria-label="Free GeoGuessr home">
            <Surface
              outline
              color="brand"
              variant="gradient"
              className="brand-mark rounded-xl"
              contentClassName="grid place-items-center"
            >
              <MapPinned aria-hidden="true" />
            </Surface>
            <span>
              <strong>Free GeoGuessr</strong>
              <small>Street View challenge</small>
            </span>
          </Link>

          <Toolbar size="md" className="app-nav" aria-label="Primary navigation">
            <Tooltip tooltip="Play" position="bottom">
              <ToolbarButton
                as={Link}
                to="/"
                color={active === 'play' ? 'brand' : undefined}
                variant={active === 'play' ? 'gradient' : 'transparent'}
                outline={active === 'play'}
                aria-current={active === 'play' ? 'page' : undefined}
              >
                <Play aria-hidden="true" />
                <span className="nav-label">Play</span>
              </ToolbarButton>
            </Tooltip>
            <Tooltip tooltip="Stats" position="bottom">
              <ToolbarButton
                as={Link}
                to="/stats"
                color={active === 'stats' ? 'brand' : undefined}
                variant={active === 'stats' ? 'gradient' : 'transparent'}
                outline={active === 'stats'}
                aria-current={active === 'stats' ? 'page' : undefined}
              >
                <BarChart3 aria-hidden="true" />
                <span className="nav-label">Stats</span>
              </ToolbarButton>
            </Tooltip>
            <ToolbarSeparator />
            <Tooltip tooltip="Source code" position="bottom">
              <ToolbarButton
                as="a"
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Source code"
              >
                <Code2 aria-hidden="true" />
              </ToolbarButton>
            </Tooltip>
          </Toolbar>
        </div>
      </header>

      {children}

      <footer className="app-footer">
        <span>Free GeoGuessr</span>
        <span className="footer-links">
          <span>Progress stays in this browser.</span>
          <Link to="/privacy">Privacy</Link>
        </span>
      </footer>
    </div>
  );
}

export default AppShell;
