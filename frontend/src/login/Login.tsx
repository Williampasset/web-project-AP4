import { useState, type FormEvent } from 'react';
import './login.css';
import { useNavigate } from 'react-router';

export default function Login(){
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        console.log("UserName=",userName);
    }
    
    return (
        <div className="login-container">
            <div className='form' onSubmit={handleSubmit}>
                <h1>Connexion</h1>
                <input type="text" value={userName} onChange={(event) => setUserName(event.target.value)}/>
                <input type="text" value={password} onChange={(event) => setPassword(event.target.value)}/>
                <button type="submit" className='login-button'>Se connecter</button>
            </div>
        </div>
    );
}