// App entry point: builds the real dependencies and hands them to the React tree.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MatchService } from './core/MatchService';
import { LocalStorageRepository } from './storage/LocalStorageRepository';
import { App } from './ui/App';
import './ui/styles.css';

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('Missing #root element in index.html');
}

// The only place that knows which implementations are used. Swapping to a backend later
// means changing this line, not the UI.
const repository = new LocalStorageRepository(window.localStorage);
const matchService = MatchService.createDefault();

// StrictMode runs extra checks in development (for example, running effects twice to catch
// missing cleanup). It has no effect in the production build.
createRoot(rootElement).render(
  <StrictMode>
    <App repository={repository} matchService={matchService} />
  </StrictMode>,
);
