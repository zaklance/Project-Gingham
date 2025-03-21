import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import VendorBaskets from './VendorBaskets';
import VendorEvents from './VendorEvents';
import VendorTeam from './VendorTeam';
import VendorActiveVendor from './VendorActiveVendor';
import VendorReviews from './VendorReviews';
import VendorStripe from './VendorStripe';

function VendorDashboard({ marketId }) {
    const [vendorId, setVendorId] = useState(null);
    const [activeTab, setActiveTab] = useState('baskets');
    const [vendorUserData, setVendorUserData] = useState(null);
    const [newVendor, setNewVendor] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [stripeAccountId, setStripeAccountId] = useState(null);
    const [isOnboarded, setIsOnboarded] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    const vendorUserId = localStorage.getItem('vendor_user_id');

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
                console.log("Fetched vendor user data:", data);
                setVendorUserData(data);

                if (data.vendor_id && data.vendor_role) {
                    console.log("Active Vendor ID:", data.vendor_id[data.active_vendor]); // Debugging log
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
                            setIsOnboarded(vendorData.is_onboarded);
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

    const handleStripeConnect = async () => {
        if (!vendorId || !isAdmin) {
            console.error("Vendor ID not found or user is not admin!");
            return;
        }
        
        setLoadingStripe(true);  // Set loading state
        const token = localStorage.getItem('vendor_jwt-token');

        try {
            if (stripeAccountId) {
                // If stripe account exists, create an account link for the dashboard
                const response = await fetch('/api/account_link', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ stripe_account_id: stripeAccountId })
                });

                if (response.ok) {
                    const text = await response.text(); // Get response as text first
                    console.log('Account link response:', text); // Debug log
                    let data;
                    try {
                        data = text ? JSON.parse(text) : {};
                    } catch (e) {
                        console.error('Failed to parse response:', text);
                        throw new Error('Invalid response from server');
                    }
                    
                    if (!data.url) {
                        throw new Error('No URL returned from server');
                    }

                    if (!updateResponse.ok) {
                        console.error('Failed to update vendor onboarding status:', await updateResponse.text());
                    } else {
                        console.log('Successfully updated vendor onboarding status');
                        setIsOnboarded(true);
                    }

                    window.location.href = data.url; // Redirect to Stripe dashboard
                } else {
                    const text = await response.text();
                    console.error('Error response from server:', text); // Debug log
                    let errorMessage = 'Failed to create account link';
                    try {
                        const errorData = text ? JSON.parse(text) : {};
                        errorMessage = errorData.error || errorMessage;
                    } catch (e) {
                        console.error('Failed to parse error response:', text);
                    }
                    throw new Error(errorMessage);
                }
            } else {
                // If no stripe account, create a new one
                const response = await fetch('/api/create-stripe-account', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ vendor_id: vendorId })
                });

                if (response.ok) {
                    const text = await response.text(); // Get response as text first
                    console.log('Create account response:', text); // Debug log
                    let data;
                    try {
                        data = text ? JSON.parse(text) : {};
                    } catch (e) {
                        console.error('Failed to parse response:', text);
                        throw new Error('Invalid response from server');
                    }

                    if (!data.stripe_account_id) {
                        throw new Error('No Stripe account ID returned from server');
                    }

                    setStripeAccountId(data.stripe_account_id);
                    
                    // Create account link for onboarding
                    const linkResponse = await fetch('/api/account_link', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ stripe_account_id: data.stripe_account_id })
                    });

                    if (linkResponse.ok) {
                        const linkText = await linkResponse.text();
                        console.log('Account link response:', linkText);
                        let linkData;
                        try {
                            linkData = linkText ? JSON.parse(linkText) : {};
                        } catch (e) {
                            console.error('Failed to parse link response:', linkText);
                            throw new Error('Invalid response from server');
                        }

                        if (!linkData.url) {
                            throw new Error('No URL returned from server');
                        }

                        if (!updateResponse.ok) {
                            console.error('Failed to update vendor onboarding status:', await updateResponse.text());
                        } else {
                            console.log('Successfully updated vendor onboarding status');
                            setIsOnboarded(true);
                        }

                        window.location.href = linkData.url; // Redirect to Stripe onboarding
                    } else {
                        const text = await linkResponse.text();
                        console.error('Error response from server:', text);
                        let errorMessage = 'Failed to create account link';
                        try {
                            const errorData = text ? JSON.parse(text) : {};
                            errorMessage = errorData.error || errorMessage;
                        } catch (e) {
                            console.error('Failed to parse error response:', text);
                        }
                        throw new Error(errorMessage);
                    }
                } else {
                    const text = await response.text();
                    console.error('Error response from server:', text); // Debug log
                    let errorMessage = 'Failed to create Stripe account';
                    try {
                        const errorData = text ? JSON.parse(text) : {};
                        errorMessage = errorData.error || errorMessage;
                    } catch (e) {
                        console.error('Failed to parse error response:', text);
                    }
                    throw new Error(errorMessage);
                }
            }
        } catch (error) {
            console.error("Error with Stripe connection:", error);
            alert(error.message || "An error occurred. Please try again.");
        } finally {
            setLoadingStripe(false);
        }
    };

    const getStripeButtonStyle = () => {
        if (loadingStripe) return "btn-edit";
        if (stripeAccountId) return "btn-edit stripe-connected"; // Add this class to CSS
        return "btn-edit";
    };

    const getStripeButtonText = () => {
        if (loadingStripe) return "Connecting...";
        if (stripeAccountId) return "Go to Stripe";
        return "Connect Stripe Account";
    };

    return (
        <>
            <VendorActiveVendor className={'box-bounding'} />
            <div className='flex-start flex-center-align flex-gap-24 m-flex-wrap margin-t-16'>
                <h1 className=''>Vendor Dashboard</h1>
                {vendorUserData && vendorUserData.active_vendor !== null && vendorUserData.vendor_role[vendorUserData.active_vendor] <= 1 ? (
                    <div className='tabs margin-l-24 m-flex-wrap'>
                        <Link to="/vendor/dashboard?tab=stripe" onClick={() => setActiveTab('stripe')} className={activeTab === 'stripe' ? 'active-tab btn btn-reset btn-tab' : 'btn btn-reset btn-tab'}>
                            Stripe
                        </Link>
                        <Link to="/vendor/dashboard?tab=baskets" onClick={() => setActiveTab('baskets')} className={activeTab === 'baskets' ? 'active-tab btn btn-reset btn-tab' : 'btn btn-reset btn-tab'}>
                            Baskets
                        </Link>
                        {vendorUserData?.vendor_role[vendorUserData.active_vendor] <= 1 && (
                            <>
                                <Link to="/vendor/dashboard?tab=events" onClick={() => setActiveTab('events')} className={activeTab === 'events' ? 'active-tab btn btn-reset btn-tab' : 'btn btn-reset btn-tab'}>
                                    Events
                                </Link>
                                <Link to="/vendor/dashboard?tab=team" onClick={() => setActiveTab('team')} className={activeTab === 'team' ? 'notification active-tab btn btn-reset btn-tab' : 'notification btn btn-reset btn-tab'}>
                                    Team
                                    {notifications.length > 0 && <p className='badge'>{notifications.length}</p>}
                                </Link>
                                <Link to="/vendor/dashboard?tab=reviews" onClick={() => setActiveTab('reviews')} className={activeTab === 'reviews' ? 'active-tab btn btn-reset btn-tab' : 'btn btn-reset btn-tab'}>
                                    Reviews
                                </Link>
                            </>
                        )}
                    </div>
                ) : null}
            </div>

            {activeTab === 'baskets' && <VendorBaskets marketId={marketId} vendorId={vendorId} vendorUserData={vendorUserData} newVendor={newVendor} setNewVendor={setNewVendor} />}
            {activeTab === 'events' && <VendorEvents vendorId={vendorId} vendorUserData={vendorUserData} />}
            {activeTab === 'team' && <VendorTeam vendorId={vendorId} vendorUserData={vendorUserData} notifications={notifications} setNotifications={setNotifications} />}
            {activeTab === 'reviews' && <VendorReviews vendorId={vendorId} vendorUserData={vendorUserData} notifications={notifications} setNotifications={setNotifications} />}
            {activeTab === 'stripe' && <VendorStripe vendorId={vendorId} vendorUserData={vendorUserData} stripeAccountId={stripeAccountId} />}
        </>
    );
}

export default VendorDashboard;