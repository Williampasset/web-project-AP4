import { useState, type FormEvent } from 'react';
import './login.css';
import { useNavigate } from 'react-router';

export default function Login() {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const result = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matricule: userName,
          password: password,
        }),
      });
      if (result.ok) {
        console.log('Success');
        const resObj = result.json();
        navigate('/commande');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className='login-container'>
      <form className='form' onSubmit={handleSubmit}>
        <h1>Connexion</h1>
        <input
          type='text'
          value={userName}
          onChange={(event) => setUserName(event.target.value)}
        />
        <input
          type='text'
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button type='submit' className='login-button'>
          Se connecter
        </button>
      </form>
    </div>
  );
}
