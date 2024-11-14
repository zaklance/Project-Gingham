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
            </div>
        </div>
    )
}

export default AdminDashboard;