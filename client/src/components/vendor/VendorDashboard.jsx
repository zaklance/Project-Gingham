import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import VendorNotification from './VendorNotification';
import VendorBaskets from './VendorBaskets';
import VendorEvents from './VendorEvents';

function VendorDashboard({ vendorId, marketId }) {
    const [vendors, setVendors] = useState([]);
    const [activeTab, setActiveTab] = useState('baskets');
    const [notifications, setNotifications] = useState([]);
    const [vendorUserData, setVendorUserData] = useState(null);
    const [newVendor, setNewVendor] = useState(false);

    useEffect(() => {
        fetch("http://127.0.0.1:5555/api/vendors")
            .then(response => response.json())
            .then(vendors => setVendors(vendors))
            .catch(error => console.error('Error fetching vendors', error));
    }, []);

    useEffect(() => {
        const fetchVendorUserData = async () => {
            const vendorUserId = sessionStorage.getItem('vendor_user_id');
            if (!vendorUserId) {
                console.error("No vendor user ID found");
                return;
            }

            try {
                const token = sessionStorage.getItem('jwt-token');
                const response = await fetch(`http://127.0.0.1:5555/api/vendor-users/${vendorUserId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setVendorUserData(data);

                    if (data && data.isNew) {
                        setNewVendor(true);
                    }
                } else {
                    console.error('Error profile:', response.status);
                    if (response.status === 401) {
                        console.error('Unauthorized: Token may be missing or invalid');
                    }
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchVendorUserData();
    }, []);


    useEffect(() => {
        if (!vendorId) return;

        const fetchNotifications = async () => {
            const token = sessionStorage.getItem('jwt-token');
            if (!token) {
                console.error("Token missing");
                return;
            }

            try {
                const response = await fetch(`http://127.0.0.1:5555/api/vendor-notifications/${vendorId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Notifications fetched:', data);
                    setNotifications(data.notifications || []); 
                } else {
                    console.error('Failed to fetch notifications');
                    setNotifications([]);
                }
            } catch (error) {
                console.error('Error fetching notifications:', error);
                setNotifications([]);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [vendorId]); 

    return (
        <div>
            <h2 className='margin-t-16'>Vendor Dashboard</h2>
            {notifications.length > 0 &&
                <div className='box-bounding'>
                    <VendorNotification notifications={notifications} />
                </div>
            }
            <div className='tabs margin-t-20'>
                <Link to="#" onClick={() => setActiveTab('baskets')} className={activeTab === 'baskets' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                    Baskets
                </Link>
                <Link to="#" onClick={() => setActiveTab('events')} className={activeTab === 'events' ? 'active-tab btn btn-reset btn-tab' : 'btn btn-reset btn-tab'}>
                    Events
                </Link>
            </div>
            {activeTab === 'baskets' && <VendorBaskets marketId={marketId} vendorId={vendorId} vendorUserData={vendorUserData} newVendor={newVendor} setNewVendor={setNewVendor} />}
            {activeTab === 'events' && <VendorEvents vendors={vendors} vendorId={vendorId} vendorUserData={vendorUserData} />}
        </div>
    );
}

export default VendorDashboard;
