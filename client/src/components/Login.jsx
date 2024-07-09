import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/css/index.css';

function Login() {
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupUsername, setSignupUsername] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupFirstName, setSignupFirstName] = useState('');
    const [signupLastName, setSignupLastName] = useState('');
    const [signupAddress, setSignupAddress] = useState('');

    const navigate = useNavigate();

    const handleLogin = async (event) => {
        event.preventDefault();
        const response = await fetch('http://127.0.0.1:5555/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: loginUsername, password: loginPassword }),
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            console.log('Login successful:', data);
            navigate(`/profile/${data.id}`);
        } else {
            console.log('Login failed');
        }
    };

    const handleSignup = async (event) => {
        event.preventDefault();
        const response = await fetch('http://127.0.0.1:5555/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: signupEmail,
                username: signupUsername,
                password: signupPassword,
                first_name: signupFirstName,
                last_name: signupLastName,
                address: signupAddress
            }),
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            console.log('Signup successful:', data);
        } else {
            console.log('Signup failed');
        }
    };

    return (
        <div className="center-container">
            <form onSubmit={handleLogin} className="form">
                <h2>Login</h2>
                <div className="form-group">
                    <label>Username:</label>
                    <input
                        type="text"
                        value={loginUsername}
                        onChange={(event) => setLoginUsername(event.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Password:</label>
                    <input
                        type="password"
                        value={loginPassword}
                        onChange={(event) => setLoginPassword(event.target.value)}
                        required
                    />
                </div>
                <button type="submit">Login</button>
            </form>

            <form onSubmit={handleSignup} className="form">
                <h2>Signup</h2>
                <div className="form-group">
                    <label>Email:</label>
                    <input
                        type="email"
                        value={signupEmail}
                        onChange={(event) => setSignupEmail(event.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Username:</label>
                    <input
                        type="text"
                        value={signupUsername}
                        onChange={(event) => setSignupUsername(event.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Password:</label>
                    <input
                        type="password"
                        value={signupPassword}
                        onChange={(event) => setSignupPassword(event.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>First Name:</label>
                    <input
                        type="text"
                        value={signupFirstName}
                        onChange={(event) => setSignupFirstName(event.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Last Name:</label>
                    <input
                        type="text"
                        value={signupLastName}
                        onChange={(event) => setSignupLastName(event.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Address:</label>
                    <input
                        type="text"
                        value={signupAddress}
                        onChange={(event) => setSignupAddress(event.target.value)}
                    />
                </div>
                <button type="submit">Signup</button>
            </form>
        </div>
    );
}

export default Login;