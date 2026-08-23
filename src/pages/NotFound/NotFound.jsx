import { Button, Surface } from '@cladd-ui/react';
import { ArrowLeft, MapPinOff } from 'lucide-react';
import { Link } from 'react-router-dom';

import AppShell from '../../components/AppShell/AppShell';

function NotFound() {
  return (
    <AppShell>
      <main className="empty-page">
        <Surface
          outline
          className="empty-surface rounded-3xl"
          contentClassName="empty-content"
        >
          <MapPinOff aria-hidden="true" />
          <h1>Off the map</h1>
          <p>This route does not exist.</p>
          <Button as={Link} to="/" color="brand">
            <ArrowLeft aria-hidden="true" />
            Back to play
          </Button>
        </Surface>
      </main>
    </AppShell>
  );
}

export default NotFound;
