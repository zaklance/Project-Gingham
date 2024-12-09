import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import '../../assets/css/index.css';

function VendorLogin({ handlePopup }) {
    const [loginEmail, setLoginEmail] = useState('');
    const [signupConfirmEmail, setSignupConfirmEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupFirstName, setSignupFirstName] = useState('');
    const [signupLastName, setSignupLastName] = useState('');
    const [signupPhone, setSignupPhone] = useState('');

    const navigate = useNavigate();

    const startLogoutTimer = (timeout) => {
        setTimeout(() => {
            navigate('/user/logout');
            alert('You have been logged out due to session expiration.')
        }, timeout);
    };

    const handleLogin = async (event) => {
        event.preventDefault();
        const lowercaseEmail = loginEmail.toLowerCase();
    
        try {
            const response = await fetch('http://127.0.0.1:5555/api/vendor/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: lowercaseEmail,
                    password: loginPassword
                }),
                credentials: 'include'
            });
    
            if (response.ok) {
                const data = await response.json();

                globalThis.localStorage.removeItem('admin_user_id');
                globalThis.localStorage.removeItem('user_id');
                globalThis.localStorage.removeItem('admin_jwt-token');
                globalThis.localStorage.removeItem('user_jwt-token');
    
                globalThis.localStorage.setItem('vendor_jwt-token', data.access_token);
                globalThis.localStorage.setItem('vendor_user_id', data.vendor_user_id);
                console.log('Login successful:', data);

                const vendor_id = globalThis.localStorage.getItem('vendor_user_id');

                startLogoutTimer(12 * 60 * 60 * 1000);
    
                handlePopup();
                navigate(`/vendor/dashboard/${vendor_id}`);
            } else {
                alert('Login failed:', errorData.error);
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

        try {
            const response = await fetch('http://127.0.0.1:5555/api/vendor-signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: signupEmail,
                    password: signupPassword,
                    first_name: signupFirstName,
                    last_name: signupLastName,
                    phone: signupPhone
                }),
                credentials: 'include'
            });
    
            if (response.ok) {
                alert("Sign Up Successful. Please log in!");
                setSignupEmail('');
                setSignupConfirmEmail('');
                setSignupPassword('');
                setSignupConfirmPassword('');
                setSignupFirstName('');
                setSignupLastName('');
                setSignupPhone('');
            } else {
                const errorData = await response.json();
                console.log('Full error response:', errorData);
                alert("Signup failed: " + (errorData.error || "Unknown error"));
            }
        } catch (error) {
            console.error('Error during signup:', error);
            alert('An error occurred. Please try again.');
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
                            <label>Email:</label>
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
                                navigate('/vendor/reset-request');
                                window.location.reload();
                            }}>
                                Forgot password?
                            </p>
                        </div>
                    </form>
                </div>
                <br/>
                <br/>
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
                        <div className="form-group form-login">
                            <label>Phone:</label>
                            <input 
                                type="tel"
                                value={signupPhone}
                                placeholder='enter your phone number'
                                onChange={(event => setSignupPhone(event.target.value))}
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

export default VendorLogin;