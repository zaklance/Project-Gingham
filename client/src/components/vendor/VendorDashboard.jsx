import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import VendorBaskets from './VendorBaskets';
import VendorEvents from './VendorEvents';
import VendorTeam from './VendorTeam';

function VendorDashboard({ marketId }) {
    const [vendors, setVendors] = useState([]);
    const [vendorId, setVendorId] = useState(null);
    const [activeTab, setActiveTab] = useState('baskets');
    const [vendorUserData, setVendorUserData] = useState(null);
    const [newVendor, setNewVendor] = useState(false);
    const [notifications, setNotifications] = useState([]);


    useEffect(() => {
        fetch("http://127.0.0.1:5555/api/vendors")
            .then(response => response.json())
            .then(vendors => setVendors(vendors))
            .catch(error => console.error('Error fetching vendors', error));
            
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab) setActiveTab(tab);
    }, []);

    useEffect(() => {
        const fetchVendorUserData = async () => {
            const vendorUserId = localStorage.getItem('vendor_user_id');
            if (!vendorUserId) {
                console.error("No vendor user ID found");
                return;
            }

            try {
                const token = localStorage.getItem('vendor_jwt-token');
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
                // setLoading(false);
            }
        };
        fetchVendorUserData();
    }, []);

    useEffect(() => {
        const fetchVendorId = async () => {
            const vendorUserId = localStorage.getItem('vendor_user_id');
            if (!vendorUserId) {
                console.error("No vendor user ID found in local storage");
                return;
            }
            try {
                const token = localStorage.getItem('vendor_jwt-token');
                const response = await fetch(`http://127.0.0.1:5555/api/vendor-users/${vendorUserId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    // console.log('Fetched vendor data:', data);
                    setVendorUserData(data);
                    if (data.vendor_id) {
                        setVendorId(data.vendor_id);
                    }
                } else {
                    console.error('Failed to fetch vendor user data');
                }
            } catch (error) {
                console.error('Error fetching vendor user data:', error);
            }
        };
        fetchVendorId();
    }, []);

    useEffect(() => {
        if (!vendorId) return;

        const fetchNotifications = async () => {
            const token = localStorage.getItem('vendor_jwt-token');
            // setIsLoading(true);
            if (!token) {
                console.error("Token missing");
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`http://127.0.0.1:5555/api/vendor-notifications?vendor_id=${vendorId}&subject=team-request`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    // console.log('Notifications fetched:', data);
                    setNotifications(data.notifications || []);
                } else {
                    console.error('Failed to fetch notifications');
                    setNotifications([]);
                }
            } catch (error) {
                console.error('Error fetching notifications:', error);
                setNotifications([]);
            } finally {
                // setIsLoading(false);
            }
        };

        fetchNotifications();
    }, [vendorId]);


    return (
        <div>
            <div className='flex-start flex-center-align flex-gap-24 m-flex-wrap'>
                <h2 className=''>Vendor Dashboard</h2>
                <br/>
                {vendorUserData?.is_admin === true ? (
                    <div className='tabs margin-t-20'>
                        <Link to="#" onClick={() => setActiveTab('baskets')} className={activeTab === 'baskets' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                            Baskets
                        </Link>
                        <Link to="#" onClick={() => setActiveTab('events')} className={activeTab === 'events' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                            Events
                        </Link>
                        {vendorUserData?.is_admin && (
                            <Link to="#" onClick={() => setActiveTab('team')} className={activeTab === 'team' ? 'notification active-tab btn btn-reset btn-tab' : 'notification btn btn-reset btn-tab'}>
                                Team
                                {notifications.length > 0 && <p className='badge'>{notifications.length}</p>}
                            </Link>
                        )}
                    </div>
                ) : (
                    <></>
                )}
            </div>
            <br />            
            {activeTab === 'baskets' && <VendorBaskets marketId={marketId} vendorId={vendorId} vendorUserData={vendorUserData} newVendor={newVendor} setNewVendor={setNewVendor} />}
            {activeTab === 'events' && <VendorEvents vendors={vendors} vendorId={vendorId} vendorUserData={vendorUserData} />}
            {activeTab === 'team' && <VendorTeam vendors={vendors} vendorId={vendorId} vendorUserData={vendorUserData} notifications={notifications} />}
        </div>
    );
}

export default VendorDashboard;
