import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// Deliberate single application mount: its worker bootstrap is also guarded.
createRoot(document.getElementById('root')).render(<App />);
