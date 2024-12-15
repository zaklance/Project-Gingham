import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import AdminVendorEdit from './AdminVendorEdit';
import AdminVendorAdd from './AdminVendorAdd';
import AdminVendorDelete from './AdminVendorDelete';
import AdminVendorEvents from './AdminVendorEvents';
import AdminVendorProducts from './AdminVendorProducts';

function AdminVendors () {
    const [vendors, setVendors] = useState([]);
    const [activeTab, setActiveTab] = useState('edit');

    useEffect(() => {
        fetch("http://127.0.0.1:5555/api/vendors")
            .then(response => response.json())
            .then(vendors => setVendors(vendors))
            .catch(error => console.error('Error fetching vendors', error));

        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab) setActiveTab(tab);
    }, []);

    return(
        <>
            <div className='flex-start flex-center-align flex-gap-24 m-flex-wrap'>
                <h2>Vendor Management</h2>
                <div className='tabs margin-t-20 m-scroll'>
                    <Link to="#" onClick={() => setActiveTab('edit')} className={activeTab === 'edit' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                        Edit
                    </Link>
                    <Link to="#" onClick={() => setActiveTab('add')} className={activeTab === 'add' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                        Add
                    </Link>
                    <Link to="#" onClick={() => setActiveTab('delete')} className={activeTab === 'delete' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                        Delete
                    </Link>
                    <Link to="#" onClick={() => setActiveTab('events')} className={activeTab === 'events' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                        Events
                    </Link>
                    <Link to="#" onClick={() => setActiveTab('products')} className={activeTab === 'products' ? 'active-tab btn btn-reset btn-tab' : 'btn btn-reset btn-tab'}>
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