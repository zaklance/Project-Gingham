import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { weekDay, weekDayReverse } from '../../utils/common';
import { timeConverter } from '../../utils/helpers';
import AdminMarketEdit from './AdminMarketEdit'
import AdminMarketAdd from './AdminMarketAdd'
import AdminMarketDelete from './AdminMarketDelete'
import AdminMarketEvents from './AdminMarketEvents'

function AdminMarkets () {
    const [markets, setMarkets] = useState([]);
    const [activeTab, setActiveTab] = useState('edit');
    const [adminUserData, setAdminUserData] = useState(null);
    
    const adminUserId = globalThis.localStorage.getItem('admin_user_id');

    useEffect(() => {
        fetch("/api/markets")
            .then(response => response.json())
            .then(markets => setMarkets(markets))
            .catch(error => console.error('Error fetching markets', error));

        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab) setActiveTab(tab);
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

    if (adminUserData?.admin_role === 5) return


    return(
        <div>
            <div className='flex-start flex-center-align flex-gap-24 m-flex-wrap'>
                <h1>Markets Management:</h1>
                <div className='tabs'>                
                    <Link to="#" onClick={() => setActiveTab('edit')} className={activeTab === 'edit' ? 'active-tab btn btn-reset btn-tab' : 'btn btn-reset btn-tab'}>
                        Edit
                    </Link>
                    <Link to="/admin/markets?tab=add" onClick={() => setActiveTab('add')} className={activeTab === 'add' ? 'active-tab btn btn-reset btn-tab' : 'btn btn-reset btn-tab'}>
                        Add
                    </Link>
                    <Link to="/admin/markets?tab=delete" onClick={() => setActiveTab('delete')} className={activeTab === 'delete' ? 'active-tab btn btn-reset btn-tab' : 'btn btn-reset btn-tab'}>
                        Delete
                    </Link>
                    <Link to="/admin/markets?tab=event" onClick={() => setActiveTab('event')} className={activeTab === 'event' ? 'active-tab btn btn-reset btn-tab' : 'btn btn-reset btn-tab'}>
                        Events
                    </Link>
                </div>
            </div>
            {activeTab === 'edit' && <AdminMarketEdit markets={markets} setMarkets={setMarkets} timeConverter={timeConverter} weekDay={weekDay} weekDayReverse={weekDayReverse} /> }
            {activeTab === 'add' && <AdminMarketAdd markets={markets} setMarkets={setMarkets} weekDayReverse={weekDayReverse} />}
            {activeTab === 'delete' && <AdminMarketDelete markets={markets} setMarkets={setMarkets} weekDayReverse={weekDayReverse} />}
            {activeTab === 'event' && <AdminMarketEvents markets={markets} />}
        </div>
    )
}

export default AdminMarkets;