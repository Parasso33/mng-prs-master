import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FavoritesProvider } from './contexts/FavoritesContext';

createRoot(document.getElementById("root")!).render(
  <FavoritesProvider>
    <App />
  </FavoritesProvider>
);
