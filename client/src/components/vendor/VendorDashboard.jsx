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

    useEffect(() => {
        fetch("http://127.0.0.1:5555/api/vendors")
            .then(response => response.json())
            .then(vendors => setVendors(vendors))
            .catch(error => console.error('Error fetching vendors', error));
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

    return (
        <div>
            <div className='flex-start flex-center-align flex-gap-48'>
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
                            <Link to="#" onClick={() => setActiveTab('team')} className={activeTab === 'team' ? 'active-tab btn btn-reset btn-tab' : 'btn btn-reset btn-tab'}>
                                Team
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
            {activeTab === 'team' && <VendorTeam vendors={vendors} vendorId={vendorId} vendorUserData={vendorUserData} />}
        </div>
    );
}

export default VendorDashboard;
