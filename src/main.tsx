import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import '@fontsource/lato/latin-ext-400.css';
import '@fontsource/lato/latin-ext-700.css';
import '@fontsource/lato/latin-400.css';
import '@fontsource/lato/latin-700.css';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Sovelluksen juurielementti puuttuu.');
createRoot(root).render(<StrictMode><App /></StrictMode>);
