import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

function VendorStripe({ vendorId, vendorUserData, stripeAccountId }) {
    const [loadingStripe, setLoadingStripe] = useState(false);
    const [isOnboarded, setIsOnboarded] = useState(false);
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

    const handleStripeConnect = async () => {
        if (!vendorId) {
            console.error("Vendor ID not found!");
            return;
        }
        
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

                    window.location.href = redirectUrl;
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

                        window.location.href = linkData.url;
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
        } finally {
            setLoadingStripe(false);
        }
    };

    return (
        <div className="box-bounding">
            {!stripeAccountId ? (
                <div className="stripe-connect-prompt" style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="stripe-message" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <p style={{ marginBottom: '1rem' }}>Gingham requires all vendors to connect their Stripe account to process payments securely.</p>
                        <p style={{ marginBottom: '1rem' }}>By connecting your Stripe account, you'll be able to:</p>
                        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
                            <li style={{ marginBottom: '0.5rem' }}>Accept payments from customers</li>
                            <li style={{ marginBottom: '0.5rem' }}>Receive payouts directly to your bank account</li>
                            <li style={{ marginBottom: '0.5rem' }}>Track your sales and revenue</li>
                        </ul>
                        <button 
                            className="btn-edit"
                            onClick={handleStripeConnect} 
                            disabled={loadingStripe}
                            style={{
                                backgroundColor: '#635BFF',
                                color: 'white',
                                padding: '1rem 2rem',
                                fontSize: '1.2rem',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: loadingStripe ? 'not-allowed' : 'pointer',
                                width: '100%',
                                maxWidth: '300px',
                                margin: '0 auto',
                                display: 'block',
                                transition: 'background-color 0.2s',
                                opacity: loadingStripe ? 0.7 : 1
                            }}
                            onMouseOver={e => !loadingStripe && (e.target.style.backgroundColor = '#4B45C6')}
                            onMouseOut={e => !loadingStripe && (e.target.style.backgroundColor = '#635BFF')}
                        >
                            {loadingStripe ? "Connecting..." : "Connect to Stripe"}
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="stripe-header">
                        <h2 className="title">Stripe Connect</h2>
                        <a 
                            href={`https://dashboard.stripe.com/${stripeAccountId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="stripe-link"
                        >
                            Go To Stripe
                        </a>
                    </div>
                    <div className="stripe-container">
                        <div className="stripe-requirements">
                            <h3>Account Requirements</h3>
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
                                            {!vendorData?.charges_enabled && <span className="warning-icon">⚠️</span>} Charges Enabled
                                        </td>
                                        <td>
                                            {vendorData?.charges_enabled ? (
                                                <span className="status-icon status-true">✓</span>
                                            ) : (
                                                <span className="status-icon status-false">✕</span>
                                            )}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            {!vendorData?.payouts_enabled && <span className="warning-icon">⚠️</span>} Payouts Enabled
                                        </td>
                                        <td>
                                            {vendorData?.payouts_enabled ? (
                                                <span className="status-icon status-true">✓</span>
                                            ) : (
                                                <span className="status-icon status-false">✕</span>
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="stripe-info">
                            <p>
                                Stripe Connect enables you to accept payments and manage your business finances.
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default VendorStripe;
