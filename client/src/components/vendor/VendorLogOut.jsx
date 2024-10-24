import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function VendorLogout () {
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://127.0.0.1:5555/vendor/logout', {
            method: 'DELETE',
            credentials: 'include'
        })
        .then(() => {
            globalThis.sessionStorage.removeItem('vendor_user_id');
            navigate('/vendor/home')
        })
        .catch((error) => {
            console.error('Logout failed:', error);
        });
    }, [navigate]);    

    return(
        <div>
            Logging out...
        </div>
    )
}

export default VendorLogout;