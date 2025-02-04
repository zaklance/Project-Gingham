import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Logout() {
    const navigate = useNavigate();

    useEffect(() => {
        fetch('/api/logout', {
            method: 'DELETE',
            credentials: 'include'
        })
        .then(() => {
            globalThis.localStorage.removeItem('amountInCart');
            globalThis.localStorage.removeItem('cartItems');
            globalThis.localStorage.removeItem('user_id');
            globalThis.localStorage.removeItem('user_jwt-token');

            navigate('/');
        })
        .catch((error) => {
            console.error('Logout failed:', error);
        });
    }, [navigate]);

    return (
        <div>
            Logging out...
        </div>
    );
}

export default Logout;