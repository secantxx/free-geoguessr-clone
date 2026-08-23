import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CladdProvider } from '@cladd-ui/react';

import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CladdProvider theme="dark" accentColor="brand">
      <App />
    </CladdProvider>
  </StrictMode>,
);
