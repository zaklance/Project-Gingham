import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import VendorActiveVendor from './VendorActiveVendor';

function VendorSalesPayout({ vendorId }) {
    const [loadingStripe, setLoadingStripe] = useState(false);
    const [vendorData, setVendorData] = useState(null);

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

    const handleCreateStripeAccount = async () => {
        if (!vendorId) {
            console.error("Vendor ID not found!");
            return;
        }

        setLoadingStripe(true);
        const token = localStorage.getItem('vendor_jwt-token');

        try {
            const response = await fetch('/api/create-stripe-account', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ vendor_id: vendorId })
            });

            if (response.ok) {
                const data = await response.json();
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
                    const linkData = await linkResponse.json();
                    if (!linkData.url) {
                        throw new Error('No URL returned from server');
                    }
                    window.open(linkData.url, '_blank');
                } else {
                    throw new Error('Failed to create account link');
                }
            } else {
                throw new Error('Failed to create Stripe account');
            }
        } catch (error) {
            console.error("Error with Stripe connection:", error);
            toast.error(error.message || "An error occurred. Please try again.");
        } finally {
            setLoadingStripe(false);
        }
    };

    const handleStripeConnect = async () => {
        if (!vendorId || !vendorData?.stripe_account_id) {
            console.error("Vendor ID or Stripe account ID not found!");
            return;
        }

        setLoadingStripe(true);
        const token = localStorage.getItem('vendor_jwt-token');

        try {
            const response = await fetch('/api/account_link', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ stripe_account_id: vendorData.stripe_account_id })
            });

            if (response.ok) {
                const data = await response.json();
                if (!data.url) {
                    throw new Error('No URL returned from server');
                }
                window.open(data.url, '_blank');
            } else {
                throw new Error('Failed to create account link');
            }
        } catch (error) {
            console.error("Error with Stripe connection:", error);
            toast.error(error.message || "An error occurred. Please try again.");
        } finally {
            setLoadingStripe(false);
        }
    };

    if (!vendorData) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <title>Gingham • Vendor Payout</title>
            <VendorActiveVendor className={'box-bounding'} />
            <div className='box-bounding'>
                <div className='flex-space-between flex-bottom-align'>
                    <h2 className='margin-b-16'>Stripe Payouts</h2>
                    {vendorData.stripe_account_id ? (
                        <button 
                            href={`https://dashboard.stripe.com/${vendorData.stripe_account_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="stripe-btn"
                        >
                            Go To Stripe
                        </button>
                    ) : (
                        <button 
                            className="stripe-btn"
                            onClick={handleCreateStripeAccount} 
                            disabled={loadingStripe}
                        >
                            {loadingStripe ? "Connecting..." : "Connect to Stripe"}
                        </button>
                    )}
                </div>

                {!vendorData.stripe_account_id ? (
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
                                        <td>Charges Enabled</td>
                                        <td>
                                            {vendorData.stripe_charges_enabled ? (
                                                <span className="status-icon status-true">✓</span>
                                            ) : (
                                                <span className="status-icon status-false">✗</span>
                                            )}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Payouts Enabled</td>
                                        <td>
                                            {vendorData.stripe_payouts_enabled ? (
                                                <span className="status-icon status-true">✓</span>
                                            ) : (
                                                <span className="status-icon status-false">✗</span>
                                            )}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            {!vendorData.stripe_is_onboarded && <span className="warning-icon">⚠️</span>} Onboarded
                                        </td>
                                        <td>
                                            {vendorData.stripe_is_onboarded ? (
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
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default VendorSalesPayout;