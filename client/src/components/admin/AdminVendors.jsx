import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import AdminVendorEdit from './AdminVendorEdit';
import AdminVendorAdd from './AdminVendorAdd';

function AdminVendors () {
    const [vendors, setVendors] = useState([]);
    const [activeTab, setActiveTab] = useState('edit');


    useEffect(() => {
        fetch("http://127.0.0.1:5555/vendors")
            .then(response => response.json())
            .then(vendors => setVendors(vendors))
            .catch(error => console.error('Error fetching vendors', error));
    }, []);


    return(
        <>
            <h2 className='margin-t-16'>Vendor Management</h2>
            <div className='tabs margin-t-20'>
                <Link to="#" onClick={() => setActiveTab('edit')} className={activeTab === 'edit' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                    Edit
                </Link>
                <Link to="#" onClick={() => setActiveTab('add')} className={activeTab === 'add' ? 'active-tab btn btn-reset btn-tab' : 'btn btn-reset btn-tab'}>
                    Add
                </Link>
            </div>
            {activeTab === 'edit' && <AdminVendorEdit vendors={vendors} />}
            {activeTab === 'add' && <AdminVendorAdd vendors={vendors} />}
        </>
    )
}

export default AdminVendors;