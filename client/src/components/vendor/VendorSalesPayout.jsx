import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import VendorActiveVendor from './VendorActiveVendor';

function VendorSalesPayout({ vendorId }) {
    const [loadingStripe, setLoadingStripe] = useState(false);
    const [isOnboarded, setIsOnboarded] = useState(false);
    const [vendorData, setVendorData] = useState(null);
    const [stripeAccountId, setStripeAccountId] = useState(null);


    useEffect(() => {
        const fetchVendorData = async () => {
            if (!vendorId) return;

            try {
                const token = localStorage.getItem('vendor_jwt-token');
                const response = await fetch(`/api/vendors/${vendorId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setVendorData(data);
                } else {
                    console.error('Failed to fetch vendor data');
                }
            } catch (error) {
                console.error('Error fetching vendor data:', error);
            }
        };

        fetchVendorData();
    }, [vendorId]);

    const handleStripeConnect = async () => {
        if (!vendorId) {
            console.error("Vendor ID not found!");
            return;
        }

        const newTab = window.open('', '_blank');

        setLoadingStripe(true);
        const token = localStorage.getItem('vendor_jwt-token');

        try {
            if (stripeAccountId) {
                const response = await fetch('/api/account_link', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ stripe_account_id: stripeAccountId })
                });

                if (response.ok) {
                    const text = await response.text();
                    console.log('Account link response:', text);
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

                    // If already onboarded, use refresh_url instead of url
                    const redirectUrl = isOnboarded ? data.refresh_url : data.url;
                    if (!redirectUrl) {
                        throw new Error('No redirect URL available');
                    }

                    console.log('data:', data);
                    console.log('redirectUrl:', redirectUrl);

                    newTab.location.href = redirectUrl.url;
                } else {
                    const text = await response.text();
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
                    const text = await response.text();
                    console.log('Create account response:', text);
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

                        newTab.location.href = linkData.url;
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
                    console.error('Error response from server:', text);
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
            toast.error(error.message || "An error occurred. Please try again.");
            if (newTab) newTab.close();
        } finally {
            setLoadingStripe(false);
        }
    };

    useEffect(() => {
        if (vendorId) {
            fetch(`/api/vendors/${vendorId}`)
                .then(response => response.json())
                .then(data => {
                    setIsOnboarded(data.is_onboarded)
                })
                .catch(error => console.error('Error fetching baskets', error));
        }
    }, [vendorId]);


    return (
        <>
            <VendorActiveVendor className={'box-bounding'} />
            <div className='box-bounding'>
                <div className='flex-space-between flex-bottom-align'>
                    <h2 className='margin-b-16'>Stripe Payouts</h2>
                    {stripeAccountId ? (
                        <button 
                            href={`https://dashboard.stripe.com/${stripeAccountId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="stripe-btn"
                        >
                            Go To Stripe
                        </button>
                    ) : (
                        <button 
                            className="stripe-btn"
                            onClick={handleStripeConnect} 
                            disabled={loadingStripe}
                        >
                            {loadingStripe ? "Connecting..." : "Connect to Stripe"}
                        </button>
                    )}
                </div>
                {!stripeAccountId ? (
                    <div className="stripe-connect-prompt">
                        <div className="stripe-message">
                            <p className='text-500'>Gingham requires all vendors to create or connect their Stripe account to process payments securely. You cannot sell baskets until this process is completed.</p>
                            <p className='text-500 margin-t-12'>By connecting your Stripe account, you'll be able to:</p>
                            <ul className='ul-bullet margin-t-8'>
                                <li>Accept payments from customers</li>
                                <li>Receive payouts directly to your bank account</li>
                                <li>Track your sales and revenue</li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <>
                        <div>
                            <div className="stripe-requirements">
                                <h3>Account Requirements</h3>
                                <p>
                                    Stripe enables you to accept payments and manage your business finances.
                                </p>
                                <table className="stripe-status-table">
                                    <thead>
                                        <tr>
                                            <th>Requirement</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>
                                                
                                                {!isOnboarded && <span className="warning-icon">⚠️</span>} Onboarded
                                            </td>
                                            <td>
                                                {isOnboarded ? (
                                                    <span className="status-icon status-true">✓</span>
                                                ) : (
                                                    <button 
                                                        className="btn-edit"
                                                        onClick={handleStripeConnect}
                                                        disabled={loadingStripe}
                                                    >
                                                        {loadingStripe ? "Connecting..." : "Finish Onboarding"}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                {!vendorData?.stripe_charges_enabled && <span className="warning-icon">⚠️</span>} Charges Enabled
                                            </td>
                                            <td>
                                                {vendorData?.stripe_charges_enabled ? (
                                                    <span className="status-icon status-true">✓</span>
                                                ) : (
                                                    <span className="status-icon status-false">✕</span>
                                                )}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                {!vendorData?.stripe_payouts_enabled && <span className="warning-icon">⚠️</span>} Payouts Enabled
                                            </td>
                                            <td>
                                                {vendorData?.stripe_payouts_enabled ? (
                                                    <span className="status-icon status-true">✓</span>
                                                ) : (
                                                    <span className="status-icon status-false">✕</span>
                                                )}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

export default VendorSalesPayout;