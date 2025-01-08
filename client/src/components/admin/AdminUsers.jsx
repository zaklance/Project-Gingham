import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import AdminUsersUsers from './AdminUsersUsers';
import AdminUsersVendorUsers from './AdminUsersVendorUsers';


function AdminUsers() {
    const [activeTab, setActiveTab] = useState('user');

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab) setActiveTab(tab);
    }, []);

    return (
        <>
            <div className='flex-start flex-center-align flex-gap-24 m-flex-wrap'>
                <h1>User Management</h1>
                <div className='tabs margin-t-20 m-scroll'>
                    <Link to="#" onClick={() => setActiveTab('user')} className={activeTab === 'users' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                        User
                    </Link>
                    <Link to="#" onClick={() => setActiveTab('vendor-user')} className={activeTab === 'vendor-users' ? 'active-tab btn btn-reset btn-tab' : 'btn btn-reset btn-tab'}>
                        Vendor User
                    </Link>
                </div>
            </div>
            {activeTab === 'user' && <AdminUsersUsers />}
            {activeTab === 'vendor-user' && <AdminUsersVendorUsers />}
        </>
    )
}

export default AdminUsers;