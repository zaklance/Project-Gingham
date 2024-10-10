import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/css/index.css';

function Login({ handlePopup }) {
    const [loginEmail, setLoginEmail] = useState('');  // Use email instead of username
    const [loginPassword, setLoginPassword] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupFirstName, setSignupFirstName] = useState('');
    const [signupLastName, setSignupLastName] = useState('');
    const [signupAddress, setSignupAddress] = useState('');

    const navigate = useNavigate();

    const handleLogin = async (event) => {
        event.preventDefault();
    
        try {
            const response = await fetch('http://127.0.0.1:5555/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: loginEmail,
                    password: loginPassword
                }),
                credentials: 'include'
            });
    
            if (response.ok) {
                const data = await response.json();
    
                // Store token in sessionStorage
                globalThis.sessionStorage.setItem('jwt-token', data.access_token);
    
                // Store user ID if necessary
                globalThis.sessionStorage.setItem('user_id', data.user_id);
    
                console.log('Login successful:', data);
    
                // Navigate to the user's profile or refresh the page
                window.location.reload();
            } else {
                alert('Login failed');
            }
        } catch (error) {
            console.error('Error during login:', error);
            alert('An error occurred. Please try again.');
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
                password: signupPassword,
                first_name: signupFirstName,
                last_name: signupLastName,
                address: signupAddress
            }),
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            alert("Sign Up Successful. Please log in!");
        } else {
            const errorData = await response.json();
            if (errorData.error) {
                if (errorData.error.includes('email')) {
                    alert("This email is already in use. Please sign in or use a different email.");
                } else {
                    alert("Signup failed: " + errorData.error);
                    console.log('Signup failed');
                }
            } else {
                alert("Signup failed. Please check your details and try again.")
            }
        }
    };

    return (
        <div className='login-bar'>
            <button className="btn x-btn" onClick={handlePopup}>X</button>
            <div className='wrapper'>
                <h1 className='title'>WELCOME TO GINGHAM!</h1>
                <div>
                    <form onSubmit={handleLogin} className="form">
                        <h2>Login</h2>
                        <div className="form-group">
                            <label>Email:</label>
                            <input
                                type="email"
                                value={loginEmail}
                                placeholder="enter your email"
                                onChange={(event) => setLoginEmail(event.target.value)}
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
                        <button className='btn-login' type="submit">Login</button>
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
                        </div>
                        <div className='form-group'>
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
                        <button className='btn-login' type="submit">Signup</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;