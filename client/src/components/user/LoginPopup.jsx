import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { states } from '../../utils/common';
// import '../../assets/css/index.css';

function Login({ handlePopup }) {
    const [loginEmail, setLoginEmail] = useState('');
    const [signupConfirmEmail, setSignupConfirmEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupFirstName, setSignupFirstName] = useState('');
    const [signupLastName, setSignupLastName] = useState('');
    const [signupPhone, setSignupPhone] = useState('');
    const [signupAddress1, setSignupAddress1] = useState('');
    const [signupAddress2, setSignupAddress2] = useState('');
    const [signupCity, setSignupCity] = useState('');
    const [signupState, setSignupState] = useState('');
    const [signupZipCode, setSignupZipCode] = useState('');

    const navigate = useNavigate();
    
    const startLogoutTimer = (timeout) => {
        setTimeout(() => {
            navigate('/user/logout');
            alert('You have been logged out due to session expiration.')
        }, timeout);
    };

    const handleLogin = async (event) => {
        event.preventDefault();
    
        try {
            const response = await fetch('http://127.0.0.1:5555/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: loginEmail,
                    password: loginPassword,
                }),
                credentials: 'include',
            });
    
            if (response.ok) {
                const data = await response.json();
    
                // Clear any existing admin or vendor_user session data
                globalThis.localStorage.removeItem('admin_user_id');
                globalThis.localStorage.removeItem('vendor_user_id');
                globalThis.localStorage.removeItem('admin_jwt-token');
                globalThis.localStorage.removeItem('vendor_jwt-token');

                // Store token and user info in localStorage
                globalThis.localStorage.setItem('user_jwt-token', data.access_token);
                globalThis.localStorage.setItem('user_id', data.user_id);
    
                // Start the logout timer
                startLogoutTimer(12 * 60 * 60 * 1000);
    
                console.log('Login successful:', data);
    
                handlePopup();
                // navigate('/');
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
    
        if (signupEmail !== signupConfirmEmail) {
            alert("Emails do not match.");
            return;
        }
    
        if (signupPassword !== signupConfirmPassword) {
            alert("Passwords do not match.");
            return;
        }
    
        // Proceed with the API request if validation passes
        const response = await fetch('http://127.0.0.1:5555/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: signupEmail,
                password: signupPassword,
                first_name: signupFirstName,
                last_name: signupLastName,
                phone: signupPhone,
                address1: signupAddress1,
                address2: signupAddress2,
                city: signupCity,
                state: signupState,
                zipcode: signupZipCode
            }),
            credentials: 'include'
        });
    
        if (response.ok) {
            const data = await response.json();
            alert("Sign Up Successful. Please log in!");
            setSignupEmail('');
            setSignupConfirmEmail('');
            setSignupPassword('');
            setSignupConfirmPassword('');
            setSignupFirstName('');
            setSignupLastName('');
            setSignupPhone('');
            setSignupAddress1('');
            setSignupAddress2('');
            setSignupCity('');
            setSignupState('');
            setSignupZipCode('');
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
                alert("Signup failed. Please check your details and try again.");
            }
        }
    };

    return (
        <div className='login-bar'>
            <button className="btn btn-large x-btn" onClick={handlePopup}>X</button>
            <div className='wrapper'>
                <h1>WELCOME TO GINGHAM!</h1>
                <div>
                    <form onSubmit={handleLogin} className="form">
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
                            <label>Confirm Email: </label>
                            <input
                                type="email"
                                value={signupConfirmEmail}
                                placeholder="re-enter your email"
                                onChange={(event) => setSignupConfirmEmail(event.target.value)}
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
                            <label>Confirm Password: </label>
                            <input
                                type="password"
                                value={signupConfirmPassword}
                                placeholder="re-enter your password"
                                onChange={(event) => setSignupConfirmPassword(event.target.value)}
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
                        <div className='form-group form-login'>
                            <label>Phone: </label>
                            <input 
                                type="tel"
                                value={signupPhone}
                                placeholder='enter your phone number'
                                onChange={(event) => setSignupPhone(event.target.value)}
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
                            <select className='select-state'
                                name="state"
                                value={signupState}
                                onChange={(event => setSignupState(event.target.value))}
                            >
                                <option value="">Select</option>
                                {states.map((state, index) => (
                                    <option key={index} value={state}>
                                        {state}
                                    </option>
                                ))}
                            </select>
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