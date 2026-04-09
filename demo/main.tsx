import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import JuleDemo from './JuleDemo';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <JuleDemo />
  </StrictMode>
);
