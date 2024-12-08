import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import AdminVendorEdit from './AdminVendorEdit';
import AdminVendorAdd from './AdminVendorAdd';
import AdminVendorDelete from './AdminVendorDelete';
import AdminVendorEvents from './AdminVendorEvents';

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
            <div className='flex-start flex-center-align flex-gap-48'>
                <h2>Vendor Management</h2>
                <div className='tabs margin-t-20'>
                    <Link to="#" onClick={() => setActiveTab('edit')} className={activeTab === 'edit' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                        Edit
                    </Link>
                    <Link to="#" onClick={() => setActiveTab('add')} className={activeTab === 'add' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                        Add
                    </Link>
                    <Link to="#" onClick={() => setActiveTab('delete')} className={activeTab === 'delete' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                        Delete
                    </Link>
                    <Link to="#" onClick={() => setActiveTab('event')} className={activeTab === 'event' ? 'active-tab btn btn-reset btn-tab' : 'btn btn-reset btn-tab'}>
                        Events
                    </Link>
                </div>
            </div>
            {activeTab === 'edit' && <AdminVendorEdit vendors={vendors} />}
            {activeTab === 'add' && <AdminVendorAdd vendors={vendors} />}
            {activeTab === 'delete' && <AdminVendorDelete vendors={vendors} />}
            {activeTab === 'event' && <AdminVendorEvents vendors={vendors} />}
        </>
    )
}

export default AdminVendors;