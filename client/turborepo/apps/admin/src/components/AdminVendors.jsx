import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminVendorEdit from './AdminVendorEdit';
import AdminVendorAdd from './AdminVendorAdd';
import AdminVendorDelete from './AdminVendorDelete';
import AdminVendorEvents from './AdminVendorEvents';
import AdminVendorProducts from './AdminVendorProducts';

function AdminVendors () {
    const [vendors, setVendors] = useState([]);
    const [activeTab, setActiveTab] = useState('edit');
    const [adminUserData, setAdminUserData] = useState(null);

    const adminUserId = globalThis.localStorage.getItem('admin_user_id');

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab) setActiveTab(tab);
    }, []);

    useEffect(() => {
        fetch("/api/vendors")
            .then(response => response.json())
            .then(vendors => setVendors(vendors))
            .catch(error => console.error('Error fetching vendors', error));
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('admin_jwt-token');
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

    if (adminUserData?.admin_role >= 4) return


    return(
        <>
            <div className='flex-start flex-center-align flex-gap-24 m-flex-wrap'>
                <h1>Vendor Management</h1>
                <div className='tabs m-scroll'>
                    <Link to="/vendors?tab=edit" onClick={() => setActiveTab('edit')} className={`btn btn-reset btn-tab ${activeTab === 'edit' && 'active-tab'}`}>
                        Edit
                    </Link>
                    <Link to="/vendors?tab=add" onClick={() => setActiveTab('add')} className={`btn btn-reset btn-tab ${activeTab === 'add' && 'active-tab'}`}>
                        Add
                    </Link>
                    <Link to="/vendors?tab=delete" onClick={() => setActiveTab('delete')} className={`btn btn-reset btn-tab ${activeTab === 'delete' && 'active-tab'}`}>
                        Delete
                    </Link>
                    <Link to="/vendors?tab=events" onClick={() => setActiveTab('events')} className={`btn btn-reset btn-tab ${activeTab === 'events' && 'active-tab'}`}>
                        Events
                    </Link>
                    <Link to="/vendors?tab=products" onClick={() => setActiveTab('products')} className={`btn btn-reset btn-tab ${activeTab === 'products' && 'active-tab'}`}>
                        Products
                    </Link>
                </div>
            </div>
            {activeTab === 'edit' && <AdminVendorEdit vendors={vendors} />}
            {activeTab === 'add' && <AdminVendorAdd vendors={vendors} />}
            {activeTab === 'delete' && <AdminVendorDelete vendors={vendors} />}
            {activeTab === 'events' && <AdminVendorEvents vendors={vendors} />}
            {activeTab === 'products' && <AdminVendorProducts vendors={vendors} />}
        </>
    )
}

export default AdminVendors;