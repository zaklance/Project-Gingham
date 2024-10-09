import React, { useState } from 'react';

function VendorLogin () {
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

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
                globalThis.sessionStorage.setItem(vendorUser_id, data.vendorUser_id);
                console.log('Login Successful:', data);

                window.location.reload();
            } else {
                alert('Login failed');
            }
        } catch (error) {
            console.error('Error during login:', error);
            alert('An error occured. Please try again.');
        }
    };

    return(
        <div className='login-bar'>
            <div className='vendor-wrapper'>
                <h1 className='title'>Vendor Portal</h1>
                <div>
                    <form onSubmit={handleLogin} className='form'>
                        <h2>Login:</h2>
                        <div className='form-group'>
                            <label>Email:</label>
                            <input
                                type="email"
                                value={loginEmail}
                                placeholder="enter your email"
                                onChange={(event) => setLoginEmail(event.target.value)}
                                required
                            />
                        </div>
                        <div className='form-group'>
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
            </div>
        </div>
    )
}

export default VendorLogin;
