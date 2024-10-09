import React from 'react';

function AdminLogin () {
    return(
        <div className='login-bar'>
            <div className='vendor-wrapper'>
                <h1 className='title'>Admin Portal</h1>
                <div>
                    <form 
                    // onSubmit={handleLogin} 
                    className='form'>
                        <h2>Login:</h2>
                        <div className='form-group'>
                            <label>Email:</label>
                            <input
                                type="email"
                                // value={loginEmail}
                                placeholder="enter your email"
                                // onChange={(event) => setLoginEmail(event.target.value)}
                                required
                            />
                        </div>
                        <div className='form-group'>
                            <label>Password:</label>
                            <input
                                type="password"
                                // value={loginPassword}
                                placeholder="enter your password"
                                // onChange={(event) => setLoginPassword(event.target.value)}
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