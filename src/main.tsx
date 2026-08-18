import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { iniciarFilaBackground } from './services/fila';

// Inicializa a fila de integração assíncrona em background ao carregar a aplicação
iniciarFilaBackground();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
