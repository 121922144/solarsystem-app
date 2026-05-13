import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import '@arco-design/web-react/dist/css/arco.css';
import '@/styles/index.scss';
import 'virtual:uno.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
