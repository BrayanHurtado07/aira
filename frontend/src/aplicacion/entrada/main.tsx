import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Arranque } from './arranque';

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <Arranque />
  </StrictMode>,
);
