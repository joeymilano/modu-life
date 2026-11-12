import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import StallArcade from './components/StallArcade';
import './styles.css';
import './game-interface.css';

createRoot(document.getElementById('root')!).render(<StrictMode><StallArcade /></StrictMode>);
