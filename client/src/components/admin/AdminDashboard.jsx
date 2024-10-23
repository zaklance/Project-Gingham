import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import AdminVendors from './AdminVendors';
import AdminMarkets from './AdminMarkets';

function AdminDashboard () {
    const [activeTab, setActiveTab] = useState('');

    return(
        <div>
            <h2 className='title'>Admin Dashboard</h2>
            <div>                
                <button className='btn btn-large btn-margin'><Link to="#" onClick={() => setActiveTab('vendors')} className={activeTab === 'vendors' ? 'active' : ''}>
                    Vendors
                </Link></button>
                <button className='btn btn-large btn-margin'><Link to="#" onClick={() => setActiveTab('markets')} className={activeTab === 'markets' ? 'active' : ''}>
                    Markets
                </Link></button>
            </div>
            {activeTab === 'vendors' && <AdminVendors />}
            {activeTab === 'markets' && <AdminMarkets />}
        </div>
    )
}

export default AdminDashboard;