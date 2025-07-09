import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import VendorBaskets from './VendorBaskets';
import VendorEvents from './VendorEvents';
import VendorTeam from './VendorTeam';
import VendorActiveVendor from './VendorActiveVendor';
import VendorReviews from './VendorReviews';
import VendorSalesPayout from './VendorSalesPayout';
import VendorCreate from './VendorCreate';

function VendorDashboard({ marketId }) {
    const [vendorId, setVendorId] = useState(null);
    const [activeTab, setActiveTab] = useState('baskets');
    const [vendorUserData, setVendorUserData] = useState(null);
    const [newVendor, setNewVendor] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [stripeAccountId, setStripeAccountId] = useState(false);
    const [isOnboarded, setIsOnboarded] = useState(false);

    const vendorUserId = localStorage.getItem('vendor_user_id');

    const tabsReady =
        vendorUserData &&
        vendorUserData.active_vendor !== null &&
        typeof isOnboarded === 'boolean' &&
        vendorUserData.vendor_role &&
        Object.keys(vendorUserData.vendor_role).length > 0 &&
        vendorUserData.vendor_role[vendorUserData.active_vendor] <= 1;
    
    const createReady = 
        vendorUserData &&
        vendorUserData.vendor_role &&
        Object.keys(vendorUserData?.vendor_role).length > 0 &&
        Object.keys(vendorUserData?.vendor_id).length > 0;

    useEffect(() => {            
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab) setActiveTab(tab);
    }, []);

    useEffect(() => {
    const fetchVendorUserData = async () => {
        if (!vendorUserId) {
            console.error("No vendor user ID found");
            return;
        }
        try {
            const token = localStorage.getItem('vendor_jwt-token');
            const response = await fetch(`/api/vendor-users/${vendorUserId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                // console.log("Fetched vendor user data:", data);
                setVendorUserData(data);

                if (data.vendor_id && data.vendor_role) {
                    // console.log("Active Vendor ID:", data.vendor_id[data.active_vendor]); // Debugging log
                    const activeVendorId = data.vendor_id[data.active_vendor];
                    setVendorId(activeVendorId);
                    
                    // Check if user is owner or admin for this vendor
                    const userRole = data.vendor_role[data.active_vendor];
                    setIsAdmin(userRole <= 1); // Allow both owner (0) and admin (1)
                    
                    // Only fetch Stripe info if user is owner or admin
                    if (userRole <= 1) {
                        const vendorResponse = await fetch(`/api/vendors/${activeVendorId}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        if (vendorResponse.ok) {
                            const vendorData = await vendorResponse.json();
                            setStripeAccountId(vendorData.stripe_account_id);
                            setIsOnboarded(vendorData.stripe_is_onboarded);
                        }
                    }
                } else {
                    console.error("Vendor ID or role missing in response");
                }

                if (data.isNew) {
                    setNewVendor(true);
                }
            } else {
                console.error('Error fetching vendor user data:', response.status);
            }
        } catch (error) {
            console.error('Error fetching vendor user data:', error);
        }
    };
    fetchVendorUserData();
}, [vendorUserId]);

    useEffect(() => {
        if (!vendorId) return;

        const fetchNotifications = async () => {
            const token = localStorage.getItem('vendor_jwt-token');
            if (!token) {
                console.error("Token missing");
                return;
            }

            try {
                const response = await fetch(`/api/vendor-notifications?vendor_user_id=${vendorUserId}&subject=team-request`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setNotifications(data.notifications || []);
                } else {
                    console.error('Failed to fetch notifications');
                    setNotifications([]);
                }
            } catch (error) {
                console.error('Error fetching notifications:', error);
                setNotifications([]);
            }
        };

        fetchNotifications();
    }, [vendorId]);
    
    useEffect(() => {
        if (vendorId && isOnboarded === false) {
            setActiveTab('payout');
        } else {
            setActiveTab('baskets');
            const urlParams = new URLSearchParams(window.location.search);
            const tab = urlParams.get('tab');
            if (tab) setActiveTab(tab);
        }
    }, [vendorId, isOnboarded]);
    

    return (
        <>
            <VendorActiveVendor className={'box-bounding'} />
            <div className='flex-start flex-center-align flex-gap-24 m-flex-wrap margin-t-16'>
                <h1 className=''>Vendor Dashboard</h1>
                {tabsReady && (
                    <div className='tabs margin-l-24 m-flex-wrap'>
                        {isOnboarded ? (
                            <>
                                <Link to="/dashboard?tab=baskets" onClick={() => setActiveTab('baskets')} className={activeTab === 'baskets' ? 'active-tab btn btn-reset btn-tab' : 'btn btn-reset btn-tab'}>
                                    Baskets
                                </Link>
                                <Link to="/dashboard?tab=events" onClick={() => setActiveTab('events')} className={activeTab === 'events' ? 'active-tab btn btn-reset btn-tab' : 'btn btn-reset btn-tab'}>
                                    Events
                                </Link>
                                <Link to="/dashboard?tab=team" onClick={() => setActiveTab('team')} className={activeTab === 'team' ? 'notification active-tab btn btn-reset btn-tab' : 'notification btn btn-reset btn-tab'}>
                                    Team
                                    {notifications.length > 0 && <p className='badge'>{notifications.length}</p>}
                                </Link>
                                <Link to="/dashboard?tab=reviews" onClick={() => setActiveTab('reviews')} className={activeTab === 'reviews' ? 'active-tab btn btn-reset btn-tab' : 'btn btn-reset btn-tab'}>
                                    Reviews
                                </Link>
                            </>
                        ) : (
                            <Link to="/dashboard?tab=payout" onClick={() => setActiveTab('payout')} className={activeTab === 'payout' ? 'active-tab btn btn-reset btn-tab' : 'btn btn-reset btn-tab'}>
                                Payout
                            </Link>
                        )}
                    </div>
                )}
            </div>
            {tabsReady && (
                <>
                    {activeTab === 'baskets' && <VendorBaskets marketId={marketId} vendorId={vendorId} vendorUserData={vendorUserData} newVendor={newVendor} setNewVendor={setNewVendor} />}
                    {activeTab === 'payout' && <VendorSalesPayout vendorId={vendorId} />}
                    {activeTab === 'events' && <VendorEvents vendorId={vendorId} vendorUserData={vendorUserData} />}
                    {activeTab === 'team' && <VendorTeam vendorId={vendorId} vendorUserData={vendorUserData} notifications={notifications} setNotifications={setNotifications} />}
                    {activeTab === 'reviews' && <VendorReviews vendorId={vendorId} vendorUserData={vendorUserData} notifications={notifications} setNotifications={setNotifications} />}
                </>
            )}
            {!createReady && (
                <div className="box-bounding">
                    <VendorCreate />
                </div>
            )}
        </>
    );
}

export default VendorDashboard;