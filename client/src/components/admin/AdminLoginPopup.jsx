import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PasswordStrengthBar from 'react-password-strength-bar';
import PasswordChecklist from "react-password-checklist"
import { formatPhoneNumber } from '../../utils/helpers';
import PulseLoader from 'react-spinners/PulseLoader';
import PhoneInput, { isPossiblePhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

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
    const [showPassword, setShowPassword] = useState({ pw1: false, pw2:false, pw3: false });
    const [termsConditions, setTermsConditions] = useState(false);
    const [isValid, setIsValid] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (event) => {
        event.preventDefault();
    
        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: loginEmail.toLowerCase(),
                    password: loginPassword
                }),
                credentials: 'include'
            });
    
            if (response.ok) {
                const data = await response.json();

                globalThis.localStorage.removeItem('user_id');
                globalThis.localStorage.removeItem('vendor_user_id');
                globalThis.localStorage.removeItem('admin_jwt-token');
                globalThis.localStorage.removeItem('vendor_jwt-token');
    
                globalThis.localStorage.setItem('admin_jwt-token', data.access_token);
                globalThis.localStorage.setItem('admin_user_id', data.admin_user_id);
    
                // console.log('Login successful:', data);
    
                // Navigate to the user's profile or refresh the page
                handlePopup();
                navigate(`/admin/profile/${globalThis.localStorage.getItem('admin_user_id', data.admin_user_id) }`);
            } else {
                const errorData = await response.json();
                alert('Login failed:' + (errorData.error || "Unknown error"));
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
        if (!isValid) {
            alert("Password does not meet requirements.");
            return;
        }
        if (!isPossiblePhoneNumber(signupPhone)) {
            alert("Not a possible phone number");
            return;
        }
        if (!termsConditions) {
            alert("You must agree to Terms & Conditions to signup.");
            return;
        }
        if (isLoading) {
            return;
        }

        setIsLoading(true);
        const response = await fetch('/api/admin-signup', {
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
            const data = await response.json();
            setSignupEmail('');
            setSignupConfirmEmail('');
            setSignupPassword('');
            setSignupConfirmPassword('');
            setSignupFirstName('');
            setSignupLastName('');
            setSignupPhone('');
            setTermsConditions(false);
            setIsSignUp(false);
            alert("Signup successful! A verification email has been sent. Please click the link to activate your account.");
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
            setIsLoading(false);
        }
        setIsLoading(false);
    };

    const togglePasswordVisibility = (field) => {
        setShowPassword((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
        setTimeout(() => {
            setShowPassword(prev => ({ ...prev, [field]: false }));
        }, 8000);
    };


    return (
        <div className='login-bar'>
            <button className="btn btn-large x-btn" onClick={handlePopup}>X</button>
            <div className='wrapper'>
                <div>
                    {!isSignUp && (
                        <form className="form">
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
                                <div className='badge-container-strict'>
                                    <input
                                        type={showPassword.pw1 ? 'text' : 'password'}
                                        value={loginPassword}
                                        placeholder="enter your password"
                                        onChange={(event) => setLoginPassword(event.target.value)}
                                        required
                                    />
                                    <i className={showPassword.pw1 ? 'icon-eye-alt' : 'icon-eye'} onClick={() => togglePasswordVisibility('pw1')}>&emsp;</i>
                                </div>
                            </div>
                            <div className='flex-center-align flex-center flex-gap-16 margin-t-16'>
                                <button className='btn-login' onClick={handleLogin}>Login</button>
                                <p className="forgot-password" onClick={() => {
                                    navigate('/admin/password-reset-request');
                                    window.location.reload();
                                }}>
                                    Forgot password?
                                </p>
                            </div>
                            <div className='flex-center-align flex-center flex-gap-16 margin-t-16'>
                                <p className='margin-t--8'>Need an account: <span className='forgot-password' onClick={() => setIsSignUp(!isSignUp)}>click here!</span></p>
                            </div>
                        </form>
                    )}
                </div>
                {isSignUp === true && (
                    <div>
                        <form className="form min-width">
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
                                <label></label>
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
                                <div className='badge-container-strict'>
                                    <input
                                        type={showPassword.pw2 ? 'text' : 'password'}
                                        value={signupPassword}
                                        placeholder='enter a password'
                                        onChange={(event) => setSignupPassword(event.target.value)}
                                        required
                                    />
                                    <i className={showPassword.pw2 ? 'icon-eye-alt' : 'icon-eye'} onClick={() => togglePasswordVisibility('pw2')}>&emsp;</i>
                                </div>
                            </div>
                            <div className="form-group form-login">
                                <label></label>
                                <div className='badge-container-strict'>
                                    <input
                                        type={showPassword.pw3 ? 'text' : 'password'}
                                        value={signupConfirmPassword}
                                        placeholder="re-enter your password"
                                        onChange={(event) => setSignupConfirmPassword(event.target.value)}
                                        required
                                    />
                                    <i className={showPassword.pw3 ? 'icon-eye-alt' : 'icon-eye'} onClick={() => togglePasswordVisibility('pw3')}>&emsp;</i>
                                </div>
                                <PasswordChecklist
                                    className='password-checklist'
                                    style={{ padding: '0 12px' }}
                                    rules={["minLength", "specialChar", "number", "capital", "match",]}
                                    minLength={5}
                                    value={signupPassword}
                                    valueAgain={signupConfirmPassword}
                                    onChange={(isValid) => { setIsValid(isValid) }}
                                    iconSize={14}
                                    validColor='#00bda4'
                                    invalidColor='#ff4b5a'
                                />
                                <PasswordStrengthBar className='password-bar' minLength={5} password={signupPassword} />
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
                                <PhoneInput
                                    className='input-phone margin-l-8'
                                    countryCallingCodeEditable={false}
                                    withCountryCallingCode
                                    country='US'
                                    defaultCountry='US'
                                    placeholder="enter your phone number"
                                    value={signupPhone}
                                    onChange={(event) => setSignupPhone(event)}
                                />
                                {/* <input 
                                    type="text"
                                    value={signupPhone}
                                    placeholder='enter your phone number'
                                    onChange={(event => setSignupPhone(formatPhoneNumber(event.target.value)))}
                                    required
                                /> */}
                            </div>
                            <div className='flex-center margin-t-16'>
                                {isLoading ? (
                                    <PulseLoader
                                        className='margin-t-12'
                                        color={'#ff806b'}
                                        size={10}
                                        aria-label="Loading Spinner"
                                        data-testid="loader"
                                    />
                                ) : (
                                    <div className='flex-center-align flex-space-around margin-t-16 flex-gap-16'>
                                        <button className='btn-login' onClick={handleSignup}>Signup</button>
                                        <button className='btn-login' onClick={() => setIsSignUp(false)}>Cancel</button>
                                        <div className='flex-start flex-center-align'>
                                            <input
                                                type='checkbox'
                                                name="terms"
                                                value={termsConditions}
                                                onChange={(event) => setTermsConditions(!termsConditions)}
                                                className='scale-fix-125'
                                            />
                                            <p className="forgot-password" onClick={() => window.open('/terms-service', '_blank')}>
                                                Terms & Conditions
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Login;