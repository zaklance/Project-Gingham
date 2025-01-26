import React, { useState } from 'react';

function PasswordResetRequest({ user }) {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('');

    const handlePasswordResetRequest = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch(`http://127.0.0.1:5555/api/${user}/password-reset-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email, })
            });

            if (response.ok) {
                setStatus('Password reset link has been sent to your email.');
                setTimeout(() => {
                    setStatus();
                }, 4000);
            } else {
                const errorData = await response.json();
                setStatus(errorData.error || 'Failed to send reset link. Please try again.');
            }
        } catch (error) {
            setStatus('An error occurred. Please try again.');
            console.error('Error during password reset request:', error);
        }
    };
    

    return (
        <div className="reset-request center-container">
            <h2>Password Reset</h2>
            <div onSubmit={handlePasswordResetRequest} className="form">
                <div className="form-group">
                    <label className='form-reset'>Email:</label>
                    <input
                        className='form-reset'
                        type="email"
                        value={email}
                        placeholder="Enter your email"
                        onChange={(e) => setEmail(e.target.value.toLowerCase())}
                        required
                    />
                </div>
                <div className='flex-center'>
                    <button className="btn btn-reset margin-t-12" type="submit" onClick={handlePasswordResetRequest}>Send Reset Link</button>
                </div>
            </div>
            {status && <p className="status-message">{status}</p>}
        </div>
    );
}

export default PasswordResetRequest;