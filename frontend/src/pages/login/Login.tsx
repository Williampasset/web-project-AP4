import { useState, type FormEvent } from 'react';
import './login.css';
import { useNavigate } from 'react-router';
import { jwtDecode } from 'jwt-decode';
import type { TokenPayload } from 'types/TokenPayload.type';

export default function Login() {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  /**
   * Gère la soumission du formulaire de connexion
   *
   * @param event - Événement du formulaire
   *
   * Process:
   * 1. Valide les données d'entrée
   * 2. Envoie les identifiants à l'API
   * 3. Stocke le token JWT en cas de succès
   * 4. Decode le token pour récupérer les infos utilisateur
   * 5. Redirige vers la page appropriée selon le rôle
   */
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    // Réinitialiser les erreurs précédentes
    setError('');

    // Valider les champs obligatoires
    if (!userName.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    try {
      setIsLoading(true);

      // Envoyer la requête de connexion
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matricule: userName.trim(),
          password: password.trim(),
        }),
      });

      // Gérer l'erreur HTTP
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(
          errorData.message || 'Identifiants invalides. Veuillez réessayer.',
        );
        return;
      }

      // Récupérer et stocker le token
      const data = await response.json();
      if (!data.access_token) {
        setError('Erreur: Token non reçu du serveur');
        return;
      }

      localStorage.setItem('token', data.access_token);

      // Décoder le token pour accéder aux informations utilisateur
      const userData = await decodeAccessToken();
      if (!userData) {
        setError('Erreur lors du décodage du token');
        localStorage.removeItem('token');
        return;
      }

      // Rediriger selon le rôle de l'utilisateur
      navigateByRole(userData.role);
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      setError(
        'Erreur de connexion. Veuillez vérifier votre connexion et réessayer.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Redirige l'utilisateur vers la page appropriée selon son rôle
   *
   * @param role - Le rôle de l'utilisateur (MANAGER, ADMIN, USER, etc.)
   */
  const navigateByRole = (role: string): void => {
    const roleRoutes: Record<string, string> = {
      MANAGER: '/commande',
      ADMIN: '/affectation',
      USER: '/stock',
    };

    const route = roleRoutes[role] || '/stock';
    navigate(route);
  };

  /**
   * Decode le JWT token stocké dans le localStorage
   *
   * @returns {TokenPayload | null} Les données décodées du token ou null en cas d'erreur
   */
  const decodeAccessToken = async (): Promise<TokenPayload | null> => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('Aucun token trouvé');
        return null;
      }

      const decodedToken = jwtDecode<TokenPayload>(token);
      return decodedToken;
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
      return null;
    }
  };

  return (
    <div className='login-container'>
      <form className='form' onSubmit={handleSubmit}>
        <h1>Connexion</h1>

        {/* Affichage des messages d'erreur */}
        {error && (
          <div
            className='error-message'
            style={{ color: 'red', marginBottom: '1rem' }}
          >
            {error}
          </div>
        )}

        {/* Champ Matricule */}
        <input
          type='text'
          placeholder='Matricule'
          value={userName}
          onChange={(event) => setUserName(event.target.value)}
          disabled={isLoading}
          required
        />

        {/* Champ Mot de passe */}
        <input
          type='password'
          placeholder='Mot de passe'
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isLoading}
          required
        />

        {/* Bouton de connexion */}
        <button type='submit' className='login-button' disabled={isLoading}>
          {isLoading ? 'Connexion en cours...' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
