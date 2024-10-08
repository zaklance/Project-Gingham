import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Logout() {
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://127.0.0.1:5555/logout', {
            method: 'DELETE',
            credentials: 'include'
        })
        .then(() => {
            globalThis.sessionStorage.removeItem('amountInCart');
            globalThis.sessionStorage.removeItem('cartItems');
            globalThis.sessionStorage.removeItem('user_id');

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