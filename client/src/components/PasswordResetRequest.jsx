import React, { useState } from 'react';
import PulseLoader from 'react-spinners/PulseLoader';

function PasswordResetRequest({ user }) {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handlePasswordResetRequest = async (event) => {
        event.preventDefault();

        if(isLoading) {
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch(`/api/${user}/password-reset-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email })
            });

            setIsLoading(false)
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
            <title>gingham • Password Reset Request</title>
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
                <div className='flex-center'>
                    {isLoading ? (
                        <PulseLoader
                            className='margin-t-12'
                            color={'#ff806b'}
                            size={10}
                            aria-label="Loading Spinner"
                            data-testid="loader"
                        />
                    ) : (
                        <button className="btn btn-reset margin-t-12" type="submit" onClick={handlePasswordResetRequest}>Send Reset Link</button>
                    )}
                </div>
            </div>
            {status && <p className="status-message">{status}</p>}
        </div>
    );
}

export default PasswordResetRequest;