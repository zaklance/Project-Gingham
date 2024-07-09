import React from 'react';
import { useNavigate } from 'react-router-dom';

function Logout() {
    const navigate = useNavigate();

    const handleLogout = async (event) => {
        event.preventDefault();
        try {
            const response = await fetch('/api/http://127.0.0.1:5555/logout', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                navigate('/login');
            } else {
                console.error('Logout failed');
            }
        } catch (error) {
            console.error('An error occurred during logout:', error);
        }
    };

    return (
        <button onClick={handleLogout}>
            Logout
        </button>
    );
}

export default Logout;
