import React, { useState } from 'react';
import '../assets/css/index.css';

function Login() {
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupUsername, setSignupUsername] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupAddress, setSignupAddress] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        console.log('Login:', { loginEmail, loginPassword });
    };

    const handleSignup = (e) => {
        e.preventDefault();
        console.log('Signup:', { signupEmail, signupUsername, signupPassword, signupAddress });
    };

    return (
        <div className="center-container">
            <form onSubmit={handleLogin} className="form">
                <h2>Login</h2>
                <div className="form-group">
                    <label>Email:</label>
                    <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Password:</label>
                    <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Login</button>
            </form>

            <form onSubmit={handleSignup} className="form">
                <h2>Signup</h2>
                <div className="form-group">
                    <label>Email: </label>
                    <input
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Username: </label>
                    <input
                        type="text"
                        value={signupUsername}
                        onChange={(e) => setSignupUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Password: </label>
                    <input
                        type="password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Address: </label>
                    <input
                        type="text"
                        value={signupAddress}
                        onChange={(e) => setSignupAddress(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Signup</button>
            </form>
        </div>
    );
}

export default Login;