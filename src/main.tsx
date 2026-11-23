// App entry point. Stage 1 placeholder: the real UI arrives in stage 2.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('Missing #root element in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <p>JobFit — UI coming in stage 2.</p>
  </StrictMode>,
);
