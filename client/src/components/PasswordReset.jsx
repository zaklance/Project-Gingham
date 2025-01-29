import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PulseLoader from 'react-spinners/PulseLoader';
import PasswordStrengthBar from 'react-password-strength-bar';
import PasswordChecklist from "react-password-checklist"

function PasswordReset({ user, path }) {
    const { token } = useParams(); // Get the token from the URL
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isValid, setIsValid] = useState(false);

    const navigate = useNavigate();

    const handlePasswordReset = async (event) => {
        event.preventDefault();

        if (newPassword !== confirmPassword) {
            setStatus('Passwords do not match');
            return;
        }
        if (!isValid) {
            alert("Password does not meet requirements.");
            return
        }

        if (isLoading) {
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/${user}/password-reset/${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ new_password: newPassword }),
            });

            setIsLoading(false)
            if (response.ok) {
                setStatus('Password successfully reset');
                setTimeout(() => {
                    setStatus();
                }, 4000);
                navigate(path);
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
                    <PasswordChecklist
                        className='password-checklist'
                        style={{ padding: '0 12px' }}
                        rules={["minLength", "specialChar", "number", "capital", "match",]}
                        minLength={5}
                        value={newPassword}
                        valueAgain={confirmPassword}
                        onChange={(isValid) => { setIsValid(isValid) }}
                        iconSize={14}
                        validColor='#00bda4'
                        invalidColor='#ff4b5a'
                    /><PasswordStrengthBar className='password-bar' minLength={5} password={newPassword} />
                </div>
                {isLoading ? (
                    <PulseLoader
                        className='margin-t-12'
                        color={'#ff806b'}
                        size={10}
                        aria-label="Loading Spinner"
                        data-testid="loader"
                    />
                ) : (
                    <button className="btn btn-login nowrap margin-t-8" type="submit">Reset Password</button>
                )}
            </form>
            {status && <p className="status-message">{status}</p>}
        </div>
    );
}

export default PasswordReset;