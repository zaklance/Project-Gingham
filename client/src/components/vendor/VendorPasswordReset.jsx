import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

function VendorPasswordReset() {
    const { token } = useParams(); // Get the token from the URL
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState('');

    const handlePasswordReset = async (event) => {
        event.preventDefault();

        if (newPassword !== confirmPassword) {
            setStatus('Passwords do not match');
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:5555/vendor/password-reset/${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ new_password: newPassword }),
            });

            if (response.ok) {
                setStatus('Password successfully reset');
            } else {
                const errorData = await response.json();
                setStatus(errorData.error || 'Failed to res et password. Please try again.');
            }
        } catch (error) {
            setStatus('An error occurred. Please try again.');
            console.error('Error during password reset:', error);
        }
    };

    return (
        <div className="password-reset">
            <h2>Reset Your Password</h2>
            <form onSubmit={handlePasswordReset} className="form">
                <div className="form-group form-reset">
                    <label>New Password:</label>
                    <input
                        type="password"
                        value={newPassword}
                        placeholder="Enter new password"
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group form-reset">
                    <label>Confirm Password:</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        placeholder="Confirm new password"
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                <button className="btn-reset" type="submit">Reset Password</button>
            </form>
            {status && <p className="status-message">{status}</p>}
        </div>
    );
}

export default VendorPasswordReset;