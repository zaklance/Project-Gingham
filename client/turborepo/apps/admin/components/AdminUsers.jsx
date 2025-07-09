import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import AdminUsersUsers from './AdminUsersUsers';
import AdminUsersVendorUsers from './AdminUsersVendorUsers';
import AdminUsersAdminUsers from './AdminUsersAdminUsers';


function AdminUsers() {
    const [activeTab, setActiveTab] = useState('user');
    const [adminUserData, setAdminUserData] = useState(null);

    const token = localStorage.getItem('admin_jwt-token');
    const adminUserId = localStorage.getItem('admin_user_id')

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab) setActiveTab(tab);
    }, []);

    useEffect(() => {
        if (!adminUserId) return
        const fetchUserData = async () => {
            try {
                const response = await fetch(`/api/admin-users/${adminUserId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setAdminUserData(data);
                } else {
                    console.error('Error fetching profile:', response.status);
                    if (response.status === 401) {
                        console.error('Unauthorized: Token may be missing or invalid');
                    }
                }
            } catch (error) {
                console.error('Error fetching vendor data:', error);
            }
        };
        fetchUserData();
    }, [adminUserId]);


    return (
        <>
            {adminUserData && adminUserData.admin_role <= 3 ? (
                <>
                    <div className='flex-start flex-center-align flex-gap-24 m-flex-wrap'>
                        <h1>User Management</h1>
                        <div className='tabs'>
                            <Link to="/users?tab=user" onClick={() => setActiveTab('user')} className={activeTab === 'user' ? 'active-tab btn btn-reset btn-tab' : 'btn btn-reset btn-tab'}>
                                User
                            </Link>
                            <Link to="/users?tab=vendor-user" onClick={() => setActiveTab('vendor-user')} className={activeTab === 'vendor-user' ? 'active-tab btn btn-reset btn-tab' : 'btn btn-reset btn-tab'}>
                                Vendor User
                            </Link>
                            {adminUserData.admin_role <= 2 ? (
                                <Link to="/users?tab=admin-user" onClick={() => setActiveTab('admin-user')} className={activeTab === 'admin-user' ? 'active-tab btn btn-reset btn-tab' : 'btn btn-reset btn-tab'}>
                                    Admin User
                                </Link>
                            ) : null}
                        </div>
                    </div>
                    {activeTab === 'user' && <AdminUsersUsers />}
                    {activeTab === 'vendor-user' && <AdminUsersVendorUsers />}
                    {activeTab === 'admin-user' && adminUserData.admin_role <= 2 && <AdminUsersAdminUsers />}
                </>
            ) : (
                null
            )}
        </>
    )
}

export default AdminUsers;