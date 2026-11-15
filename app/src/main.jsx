import React from 'react';
import { createRoot } from 'react-dom/client';
import '@arcgis/core/assets/esri/themes/light/main.css';
import './styles.css';
import './theme.css';
import './motion.css';
import App from './App.jsx';
import { LangProvider } from './lib/i18n';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LangProvider>
      <App />
    </LangProvider>
  </React.StrictMode>,
);
