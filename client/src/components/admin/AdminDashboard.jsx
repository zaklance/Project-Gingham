import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import AdminVendors from './AdminVendors';
import AdminMarkets from './AdminMarkets';

function AdminDashboard () {
    const [activeTab, setActiveTab] = useState('');

    return(
        <div>
            <h2 className='title'>Admin Dashboard</h2>
            <div className='tabs'>                
                <Link to="#" onClick={() => setActiveTab('vendors')} className={activeTab === 'vendors' ? 'active' : ''}>
                    Vendors
                </Link>
                <Link to="#" onClick={() => setActiveTab('markets')} className={activeTab === 'markets' ? 'active' : ''}>
                    Markets
                </Link>
            </div>
            {activeTab === 'vendors' && <AdminVendors />}
            {activeTab === 'markets' && <AdminMarkets />}
        </div>
    )
}

export default AdminDashboard;