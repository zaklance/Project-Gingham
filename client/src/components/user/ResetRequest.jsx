import React, { useState } from 'react';

function ResetRequest() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('');

    const handlePasswordResetRequest = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch('http://127.0.0.1:5555/user/password-reset-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                setStatus('Password reset link has been sent to your email.');
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
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <button className="btn btn-reset" type="submit">Send Reset Link</button>
            </div>
            {status && <p className="status-message">{status}</p>}
        </div>
    );
}

export default ResetRequest;