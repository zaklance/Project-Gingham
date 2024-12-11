import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminLogout () {
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://127.0.0.1:5555/api/admin/logout', {
            method: 'DELETE',
            credentials: 'include'
        })
        .then(() => {
            globalThis.localStorage.removeItem('admin_user_id');
            globalThis.localStorage.removeItem('admin_jwt-token');
            navigate('/admin')
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

export default AdminLogout;