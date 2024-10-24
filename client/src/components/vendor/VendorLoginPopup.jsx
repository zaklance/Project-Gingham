import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import '../../assets/css/index.css';

function VendorLogin({ handlePopup }) {
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupFirstName, setSignupFirstName] = useState('');
    const [signupLastName, setSignupLastName] = useState('');
    const [signupPhone, setSignupPhone] = useState('');

    const navigate = useNavigate();

    const handleLogin = async (event) => {
        event.preventDefault();
        const lowercaseEmail = loginEmail.toLowerCase();
    
        try {
            const response = await fetch('http://127.0.0.1:5555/vendor/login', {
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
    
                globalThis.sessionStorage.setItem('jwt-token', data.access_token);
                globalThis.sessionStorage.setItem('vendor_user_id', data.vendor_user_id);
                console.log('Login successful:', data);
    
                navigate(`/vendor/dashboard`);
                window.location.reload();
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
        try {
            const response = await fetch('http://127.0.0.1:5555/vendor_signup', {
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
                <h1 className='title'>VENDOR PORTAL</h1>
                <div>
                    <form onSubmit={handleLogin} className="form">
                        <h2>Login</h2>
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
                        <button className='btn-login' type="submit">Login</button>
                    </form>
                </div>
                <br/>
                <br/>
                <div>
                    <form onSubmit={handleSignup} className="form">
                        <h2>Signup</h2>
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
                            <label>Phone:</label>
                            <input 
                                type="tel"
                                value={signupPhone}
                                placeholder='enter your phone number'
                                onChange={(event => setSignupPhone(event.target.value))}
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

export default VendorLogin;