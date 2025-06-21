import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PasswordStrengthBar from 'react-password-strength-bar';
import PasswordChecklist from "react-password-checklist"
import { states } from '../../utils/common';
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
    const [signupAddress1, setSignupAddress1] = useState('');
    const [signupAddress2, setSignupAddress2] = useState('');
    const [signupCity, setSignupCity] = useState('');
    const [signupState, setSignupState] = useState('');
    const [signupZipCode, setSignupZipCode] = useState('');
    const [showPassword, setShowPassword] = useState({ pw1: false, pw2:false, pw3: false });
    const [addressResults, setAddressResults] = useState();
    const [showAddressDropdown, setShowAddressDropdown] = useState(false);
    const [resultCoordinates, setResultCoordinates] = useState();
    const [termsConditions, setTermsConditions] = useState(false);
    const [isValid, setIsValid] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [bgIndex, setBgIndex] = useState(0);

    const navigate = useNavigate();
    const dropdownAddressRef = useRef(null);
    const debounceTimeout = useRef(null);

    // const { password } = this.state;
    
    const handleLogin = async (event) => {
        event.preventDefault();
    
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: loginEmail.toLowerCase(),
                    password: loginPassword,
                }),
                credentials: 'include',
            });
            
            const data = await response.json();

            if (response.ok) {
                // Clear any existing admin or vendor_user session data
                globalThis.localStorage.removeItem('admin_user_id');
                globalThis.localStorage.removeItem('vendor_user_id');
                globalThis.localStorage.removeItem('admin_jwt-token');
                globalThis.localStorage.removeItem('vendor_jwt-token');

                // Store token and user info in localStorage
                globalThis.localStorage.setItem('user_jwt-token', data.access_token);
                globalThis.localStorage.setItem('user_id', data.user_id);
    
                // console.log('Login successful:', data);
                handlePopup();
            } else {
                alert('Login failed:' + data.error || 'Login failed');

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
        if (!signupAddress1 | !signupCity | !signupState | !signupZipCode) {
            alert("Please fill in the missing fields");
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
        const apiKey = import.meta.env.VITE_RADAR_KEY;
        const query = `${signupAddress1} ${signupCity} ${signupState} ${signupZipCode}`;
    
        try {
            if (!resultCoordinates) {
                const responseRadar = await fetch(
                    `https://api.radar.io/v1/geocode/forward?query=${encodeURIComponent(query)}`,
                    {
                        method: "GET",
                        headers: { Authorization: apiKey },
                    }
                );
    
                const data = await responseRadar.json();
                if (data.addresses && data.addresses.length > 0) {
                    const { latitude, longitude } = data.addresses[0];
                    setResultCoordinates({ lat: latitude, lng: longitude });
    
                    const signupResponse = await fetch("/api/signup", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
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
                            zipcode: signupZipCode,
                            coordinates: { lat: latitude, lng: longitude },
                        }),
                    });
    
                    const result = await signupResponse.json();
    
                    if (!signupResponse.ok) {
                        if (signupResponse.status === 400 && result.error.includes("already registered")) {
                            alert("This email is already registered. Please log in or use a different email.");
                        } else {
                            alert(result.error || "Signup failed.");
                        }
                        return;
                    }
    
                    resetSignupForm();
                    alert("Signup successful! A confirmation email has been sent.");
                } else {
                    alert("Unable to geocode the address. Please try again.");
                }
            } else {
                const signupResponse = await fetch("/api/signup", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
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
                        zipcode: signupZipCode,
                        coordinates: { lat: resultCoordinates.lat, lng: resultCoordinates.lng },
                    }),
                });
    
                const result = await signupResponse.json();
    
                if (!signupResponse.ok) {
                    if (signupResponse.status === 400 && result.error.includes("already registered")) {
                        alert("This email is already registered. Please log in or use a different email.");
                    } else {
                        alert(result.error || "Signup failed.");
                    }
                    return;
                }
    
                resetSignupForm();
                alert("Signup successful! A verification email has been sent. Please click the link to activate your account.");
            }
        } catch (error) {
            console.error("Error during signup:", error);
            setIsLoading(false);
            alert("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const resetSignupForm = () => {
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
        setTermsConditions(false);
        setIsSignUp(false);
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

    const handleAddress = (event) => {
        const query = event.target.value;
        // Clear the previous debounce timer
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        // Start a new debounce timer
        debounceTimeout.current = setTimeout(() => {
            if (query.trim() !== '') {
                handleSearchAddress(query);
            }
        }, 400);
    };

    const handleBlur = () => {
        debounceTimeout.current = setTimeout(() => {
            setShowAddressDropdown(false)
        }, 200);
    };

    const handleSearchAddress = async (query) => {
        const apiKey = import.meta.env.VITE_RADAR_KEY;

        try {
            const responseRadar = await fetch(`https://api.radar.io/v1/search/autocomplete?query=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: {
                    'Authorization': apiKey,
                },
            });
            if (responseRadar.ok) {
                const data = await responseRadar.json();
                setAddressResults(data.addresses);
                setShowAddressDropdown(true);

                if (data.addresses && data.addresses.length > 0) {
                    const { latitude, longitude } = data.addresses[0];
                }
            }
        } catch (error) {
            console.error('Error fetching address:', error);
        }
    };

    const handleClickOutsideAddressDropdown = (event) => {
        if (dropdownAddressRef.current && !dropdownAddressRef.current.contains(event.target)) {
            setShowAddressDropdown(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutsideAddressDropdown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutsideAddressDropdown);
        };
    }, [showAddressDropdown]);

    const backgroundImages =[
        '../site-images/LzYeux_120719_0032_1800px.jpg',
        '../site-images/LzYeux_120719_0033_1800px.jpg',
        '../site-images/LzYeux_120719_0036_1800px.jpg'
    ]

    useEffect(() => {
        const interval = setInterval(() => {
            setBgIndex(prev => (prev + 1) % backgroundImages.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);


    return (
        <div>
            <title>gingham • User Sign-Up</title>
            <link rel="preload" as="image" href='../site-images/LzYeux_120719_0032_1800px.jpg' />
            <link rel="preload" as="image" href='../site-images/LzYeux_120719_0033_1800px.jpg' />
            <link rel="preload" as="image" href='../site-images/LzYeux_120719_0036_1800px.jpg' />
            <div className='box-blog'>
                <br className="d-br" />
                <br className="d-br" />
                <div className="box-signup text-center">
                    <h1 className="font-cera title-big-gingham">gingham</h1>
                    <br/>
                    <h3>Make A Positive Impact By Minimizing Food Waste</h3>
                </div>
                <div className="box-signup box-inside">
                    <p> Do you love fresh, local produce at a great price? Meet <span className="font-cera-gingham text-900">gingham</span>, the platform connecting 
                        you with vendors in farmers' markets. <span className="text-500">With <span className="font-cera-gingham text-900">gingham</span>, you can 
                        pre-order mystery baskets filled with surplus or seasonal goods and pick them up directly 
                        at the market.</span>
                    </p>
                    <br/>
                    <p> Our mission: reduce waste, support vendors, and provide fresh, affordable food. Every 
                        basket purchased helps reduce waste and strengthen your community. &emsp;
                    </p>
                </div>
            </div>
            <div className="box-big-blue margin-t-24">
                <h3>HOW DOES <span className="font-cera-gingham text-900">GINGHAM</span> WORK?</h3> <br/>
                <p>
                    Vendors build mystery baskets of bundled surplus products that you are able to pre-order and pick-up at a designated time.  
                    <strong> <span className="font-cera-gingham text-900">GINGHAM</span> makes it easy to shop sustainably while supporting your local farmers' market community!</strong>
                </p>
                <img src="/site-images/GINGHAM_HOWITWORKS_CERA_1800px.png" style={{ width: '100%' }} />
            </div>
            <br/>
            <div className="signup-background" style={{ backgroundImage: `url(${backgroundImages[bgIndex]})` }}>
                <div className='flex-center'>
                    <form className="form width-min box-blog">
                        <h2 className='margin-b-24'>Sign-Up</h2>
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
                        <div className='form-group form-login'>
                            <label>Phone: </label>
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
                        </div>
                        <div className="form-group form-login">
                            <label>Address 1:</label>
                            <input 
                                type="text"
                                value={signupAddress1}
                                placeholder='enter your address 1'
                                onChange={(event => { setSignupAddress1(event.target.value); handleAddress(event) })}
                                onBlur={handleBlur}
                                required
                            />
                            {showAddressDropdown && (
                                <ul className="dropdown-content-signup" ref={dropdownAddressRef}>
                                    {addressResults.map(item => (
                                        <li
                                            className="search-results-signup"
                                            key={item.formattedAddress}
                                            onClick={() => {
                                                setSignupAddress1(item.addressLabel);
                                                setSignupCity(item.city)
                                                setSignupState(item.stateCode)
                                                setSignupZipCode(item.postalCode)
                                                setResultCoordinates({ 'lat': item.latitude, 'lng': item.longitude })
                                                setShowAddressDropdown(false);
                                            }}
                                        >
                                            {item.formattedAddress}
                                        </li>
                                    ))}
                                </ul>
                            )}
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
                                className='margin-r-8'
                                type="text"
                                value={signupCity}
                                placeholder='enter your city'
                                onChange={(event => setSignupCity(event.target.value))}
                                required
                            />
                        </div>
                        <div className="form-group form-login">
                            <label>State:</label>
                            <select 
                                className='select-state margin-l-8'
                                style={{borderRadius: '8px', marginBottom: '4px'}}
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
                                    <div className='flex-start flex-center-align flex-gap-8'>
                                        <input
                                            type='checkbox'
                                            name="terms"
                                            value={termsConditions}
                                            onChange={(event) => setTermsConditions(!termsConditions)}
                                            className='scale-fix-125'
                                        />
                                        <p className="forgot-password" onClick={() => window.open('/terms-conditions', '_blank')}>
                                            Terms & Conditions
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;