import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function VendorLogout () {
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://127.0.0.1:5555/api/vendor/logout', {
            method: 'DELETE',
            credentials: 'include'
        })
        .then(() => {
            globalThis.localStorage.removeItem('vendor_user_id');
            globalThis.localStorage.removeItem('vendor_jwt-token');
            navigate('/vendor')
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
