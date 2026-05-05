import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = isRegister ? 'register' : 'login';
        const body = isRegister ? { username, email, password } : { email, password };

        try {
            const res = await fetch(`http://localhost:5221/api/auth/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (isRegister) {
                if (res.ok) {
                    alert("Registration successful! Please login.");
                    setIsRegister(false);
                } else {
                    alert(data.message || "Registration failed");
                }
            } else {
                if (data.token) {
                    const userData = data.user || { email };
                    login(userData, data.token);
                    navigate('/');
                } else {
                    alert(data.message || "Login failed");
                }
            }
        } catch (err) {
            console.error(err);
            alert("Server not reachable");
        }
    };

    const handleGoogleLogin = () => {
        // Redirect to your backend's Google Auth endpoint
        window.location.href = 'http://localhost:5221/api/auth/google-login';
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>ConnectHub</h2>
                <p className="subtitle">{isRegister ? 'Create your account' : 'Welcome back!'}</p>
                
                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <input 
                            type="text" 
                            placeholder="Username" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                        />
                    )}
                    <input 
                        type="email" 
                        placeholder="Email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />
                    <button type="submit" className="main-btn">
                        {isRegister ? 'CREATE ACCOUNT' : 'LOGIN'}
                    </button>
                </form>

                <div className="divider">
                    <span>OR</span>
                </div>

                <button onClick={handleGoogleLogin} className="google-btn">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_Reference_icon.svg" alt="Google" width="18" />
                    Sign in with Google
                </button>

                <p className="toggle-text">
                    {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <span onClick={() => setIsRegister(!isRegister)}>
                        {isRegister ? 'Login' : 'Create one'}
                    </span>
                </p>
            </div>

        </div>
    );
};

export default Login;
