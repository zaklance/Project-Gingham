import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import '../../assets/css/index.css';

function Login({ handlePopup }) {
    const [loginEmail, setLoginEmail] = useState('');  // Use email instead of username
    const [loginPassword, setLoginPassword] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupFirstName, setSignupFirstName] = useState('');
    const [signupLastName, setSignupLastName] = useState('');
    const [signupAddress1, setSignupAddress1] = useState('');
    const [signupAddress2, setSignupAddress2] = useState('');
    const [signupCity, setSignupCity] = useState('');
    const [signupState, setSignupState] = useState('');
    const [signupZipCode, setSignupZipCode] = useState('');

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
    
                // Navigate to home page
                window.location.href = '/';
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
                address1: signupAddress1,
                address2: signupAddress2,
                city: signupCity,
                state: signupState,
                zip: signupZipCode
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
            <button className="btn btn-large x-btn" onClick={handlePopup}>X</button>
            <div className='wrapper'>
                <h1>WELCOME TO GINGHAM!</h1>
                <div className="form">
                    <form onSubmit={handleLogin}>
                        <h2 className='margin-b-24'>Login</h2>
                        <div className="form-group form-login">
                            <label className=''>Email:</label>
                            <input
                                type="email"
                                value={loginEmail}
                                placeholder="enter your email"
                                onChange={(event) => setLoginEmail(event.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group form-login">
                            <label>Password:</label>
                            <input
                                type="password"
                                value={loginPassword}
                                placeholder="enter your password"
                                onChange={(event) => setLoginPassword(event.target.value)}
                                required
                            />
                        </div>
                        <div className='flex-center-align flex-space-around margin-t-16'>
                            <button className='btn btn-login' type="submit">Login</button>
                            <p className="forgot-password" onClick={() => {
                                navigate('/user/reset-request');
                                window.location.reload();
                            }}>
                                Forgot password?
                            </p>
                        </div>
                    </form>
                </div>
                <div>
                    <form onSubmit={handleSignup} className="form">
                        <h2 className='margin-b-24'>Signup</h2>
                        <div className="form-group form-login">
                            <label>Email: </label>
                            <input
                                type="email"
                                value={signupEmail}
                                placeholder="enter your email"
                                onChange={(event) => setSignupEmail(event.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group form-login">
                            <label>Password: </label>
                            <input
                                type="password"
                                value={signupPassword}
                                placeholder='enter a password'
                                onChange={(event) => setSignupPassword(event.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group form-login">
                            <label>First Name: </label>
                            <input
                                type="text"
                                value={signupFirstName}
                                placeholder='enter your first name'
                                onChange={(event) => setSignupFirstName(event.target.value)}
                                required
                            />
                        </div>
                        <div className='form-group form-login'>
                            <label>Last Name: </label>
                            <input
                                type="text"
                                value={signupLastName}
                                placeholder='enter your last name'
                                onChange={(event) => setSignupLastName(event.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group form-login">
                            <label>Address 1:</label>
                            <input 
                                type="text"
                                value={signupAddress1}
                                placeholder='enter your address 1'
                                onChange={(event => setSignupAddress1(event.target.value))}
                                required
                            />
                        </div>
                        <div className="form-group form-login">
                            <label>Address 2:</label>
                            <input 
                                type="text"
                                value={signupAddress2}
                                placeholder='enter your address 2'
                                onChange={(event => setSignupAddress2(event.target.value))}
                                required
                            />
                        </div>
                        <div className="form-group form-login">
                            <label>City:</label>
                            <input 
                                type="text"
                                value={signupCity}
                                placeholder='enter your city'
                                onChange={(event => setSignupCity(event.target.value))}
                                required
                            />
                        </div>
                        <div className="form-group form-login">
                            <label>State:</label>
                            <input 
                                type="text"
                                value={signupState}
                                placeholder='enter your state'
                                onChange={(event => setSignupState(event.target.value))}
                                required
                            />
                        </div>
                        <div className="form-group form-login">
                            <label>Zip Code:</label>
                            <input 
                                type="text"
                                value={signupZipCode}
                                placeholder='enter your Zip Code'
                                onChange={(event => setSignupZipCode(event.target.value))}
                                required
                            />
                        </div>
                        <div className='flex-center margin-t-16'>
                            <button className='btn-login' type="submit">Signup</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;