import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminLogin () {
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (event) => {
        event.preventDefault();
        const lowercaseEmail = loginEmail.toLowerCase();

        const dummyEmail = 'mufo@gingham.nyc';
        const dummyPassword = '1234';

        if (loginEmail === dummyEmail && loginPassword === dummyPassword) {
            console.log('Login Successful');
            navigate('/admin/profile');
        } else {
            alert('Login Failed:', errorData.error);
        }
    };

    return(
        <div className='login-bar'>
            <div className='vendor-wrapper'>
                <h1 className='title'>Admin Portal</h1>
                <div>
                    <form 
                    onSubmit={handleLogin} 
                    className='form'>
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

export default AdminLogin;