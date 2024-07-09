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
            localStorage.setItem('userId', data.id);
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
        <div>
            <h1>WELCOME TO GINGHAM!</h1>
            <div className='container'>
                <div>
                    <form onSubmit={handleLogin} className="form">
                        <h2>Login</h2>
                        <div className="form-group">
                            <label>Username:</label>
                            <input
                                type="username"
                                value={loginUsername}
                                placeholder="enter your username"
                                onChange={(event) => setLoginUsername(event.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Password:</label>
                            <input
                                type="password"
                                value={loginPassword}
                                placeholder="enter your password"
                                onChange={(event) => setLoginPassword(event.target.value)}
                                required
                            />
                        </div>
                        <button type="submit">Login</button>
                    </form>
                </div>
                <div>
                    <form onSubmit={handleSignup} className="form">
                        <h2>Signup</h2>
                        <div className="form-group">
                            <label>Email: </label>
                            <input
                                type="email"
                                value={signupEmail}
                                placeholder="enter your email"
                                onChange={(event) => setSignupEmail(event.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Username: </label>
                            <input
                                type="text"
                                value={signupUsername}
                                placeholder='enter a username'
                                onChange={(event) => setSignupUsername(event.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Password: </label>
                            <input
                                type="password"
                                value={signupPassword}
                                placeholder='enter a password'
                                onChange={(event) => setSignupPassword(event.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>First Name: </label>
                            <input
                                type="text"
                                value={signupFirstName}
                                placeholder='enter your first name'
                                onChange={(event) => setSignupFirstName(event.target.value)}
                                required
                            />
                            <label>Last Name: </label>
                            <input
                                type="text"
                                value={signupLastName}
                                placeholder='enter your last name'
                                onChange={(event) => setSignupLastName(event.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Address:</label>
                            <input 
                                type="text"
                                value={signupAddress}
                                placeholder='enter your address'
                                onChange={(event => setSignupAddress(event.target.value))}
                                required
                            />
                        </div>
                        <button type="submit">Signup</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;