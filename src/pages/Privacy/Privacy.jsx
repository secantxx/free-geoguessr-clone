import { Chip, SectionTitle } from '@cladd-ui/react';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import AppShell from '../../components/AppShell/AppShell';

function Privacy() {
  return (
    <AppShell>
      <main className="privacy-main">
        <header>
          <Chip color="green" icon={ShieldCheck} rounded>Local-first</Chip>
          <h1>Privacy</h1>
          <p>Free GeoGuessr does not operate accounts, analytics, or a gameplay database.</p>
        </header>

        <article className="privacy-copy">
          <section>
            <SectionTitle>Browser data</SectionTitle>
            <h2>Round history stays on this device</h2>
            <p>
              Completed rounds and preferences are saved in this browser's local storage and remain
              on this device. You can export, replace, pause, or delete that history from the{' '}
              <Link to="/stats">Stats</Link> screen.
            </p>
          </section>

          <section>
            <SectionTitle>Map service</SectionTitle>
            <h2>Google Maps powers the game world</h2>
            <p>
              The browser connects directly to Google Maps Platform to load maps and Street View.
              Those requests are governed by the{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
                Google Privacy Policy <ExternalLink aria-hidden="true" />
              </a>
              . This app does not receive your Google account information.
            </p>
          </section>

          <section>
            <SectionTitle>API key</SectionTitle>
            <h2>The Maps browser key is public by design</h2>
            <p>
              It authorizes this website to load Google Maps and is restricted by website origin,
              enabled API, and quota. It is not a credential for a player account.
            </p>
          </section>
        </article>
      </main>
    </AppShell>
  );
}

export default Privacy;
