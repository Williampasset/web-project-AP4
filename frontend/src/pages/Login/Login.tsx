import { useState, type FormEvent } from 'react';
import './login.css';
import { useNavigate } from 'react-router';
import { jwtDecode } from 'jwt-decode';
import type { TokenPayload } from '@type/token.type';
import { useLogin } from '../../hooks/login.hooks';

export default function Login() {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const { mutate, isPending } = useLogin();

  /**
   * Handle form submission for user login, including validation and error handling.
   * @param event - The form submission event triggered by the user.
   * @returns void
   */
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!userName.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    mutate(
      {
        matricule: userName.trim(),
        password: password.trim(),
      },
      {
        onSuccess: async (data) => {
          try {
            if (!data.access_token) {
              setError('Token non reçu du serveur');
              return;
            }

            localStorage.setItem('token', data.access_token);

            const userData = await decodeAccessToken();

            if (!userData) {
              setError('Erreur lors du décodage du token');
              localStorage.removeItem('token');
              return;
            }

            localStorage.setItem('user', JSON.stringify(userData));

            navigateByRole(userData.role);
          } catch (err) {
            setError('Erreur lors du traitement du login');
          }
        },

        onError: (err: any) => {
          setError(err.message || 'Identifiants invalides');
        },
      },
    );
  };

  /**
   * Send the user to the appropriate page based on their role
   * @param role - The role of the user (e.g., MANAGER, MAGASINIER)
   */
  const navigateByRole = (role: string): void => {
    const roleRoutes: Record<string, string> = {
      MANAGER: '/commande',
      MAGASINIER: '/operateur',
    };

    const route = roleRoutes[role] || '/';
    navigate(route);
  };

  /**
   * Decode the JWT token stored in localStorage
   *
   * @returns {TokenPayload | null} The decoded token data or null in case of error
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
      <img src='/cargoflow-logo.png' alt='Logo' className='logo' />
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
          disabled={isPending}
          required
        />

        {/* Champ Mot de passe */}
        <input
          type='password'
          placeholder='Mot de passe'
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isPending}
          required
        />

        {/* Bouton de connexion */}
        <button type='submit' className='login-button' disabled={isPending}>
          {isPending ? 'Connexion en cours...' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
