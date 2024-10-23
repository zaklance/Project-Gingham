import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminLogout () {
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://127.0.0.1:5555/admin/logout', {
            method: 'DELETE',
            credentials: 'include'
        })
        .then(() => {
            globalThis.sessionStorage.removeItem('admin_user_id');
            navigate('/admin/home')
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