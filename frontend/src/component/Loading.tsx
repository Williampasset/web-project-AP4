import './Loading.css';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  overlay?: boolean;
}

/**
 * Composant Loading - Affiche un indicateur de chargement
 * 
 * @param message - Message à afficher sous le spinner (optionnel)
 * @param size - Taille du spinner ('small', 'medium', 'large')
 * @param overlay - Si true, affiche un overlay sombre derrière le loading
 */
export default function Loading({
  message = 'Chargement...',
  size = 'medium',
  overlay = false
}: LoadingProps) {
  const containerClass = overlay ? 'loading-overlay' : 'loading-container';
  
  return (
    <div className={containerClass}>
      <div className={`loading-spinner ${size}`}>
        <div className="spinner"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
}