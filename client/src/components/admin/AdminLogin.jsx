import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminLogin () {
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (event) => {
        event.preventDefault();
        const lowercaseEmail = loginEmail.toLowerCase();

        try {
            const response = await fetch('http://127.0.0.1:5555/admin/login', {
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
                globalThis.sessionStorage.setItem('admin_user_id', data.admin_user_id);
                console.log('Login Successful:');

                navigate(`/admin/dashboard`);
            } else {
                alert('Login failed:', errorData.error);
            }
        } catch (error) {
            console.error('Error during login:', error);
            alert('An error occured. Please try again.');
        }
    };

    // console.log(globalThis.sessionStorage.getItem('admin_user_id'))

    return(
        <div className='login-bar'>
            <div className='vendor-wrapper'>
                <div className='flex-space-around-center flex-center'>
                    <div>
                        <form onSubmit={handleLogin} className='form'>
                            <h3>Admin Portal Login:</h3>
                            <br />
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
        </div>
    )
}

export default AdminLogin;