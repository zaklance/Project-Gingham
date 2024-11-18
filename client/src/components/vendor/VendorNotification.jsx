import React, { useEffect, useState } from 'react';

function VendorNotification({ vendorId }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVendorNotifications = async () => {
            try {
                const vendorUserId = sessionStorage.getItem('vendor_user_id');
                if (!vendorUserId) {
                    console.error("No vendor user ID found in session storage");
                    return;
                }

                const token = sessionStorage.getItem('jwt-token');
                if (!token) {
                    console.error("No JWT token found in session storage");
                    return;
                }

                console.log('Fetching vendor user data with vendor_user_id:', vendorUserId);
                
                const vendorUserResponse = await fetch(`http://127.0.0.1:5555/vendor-users/${vendorUserId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!vendorUserResponse.ok) {
                    throw new Error(`Error fetching vendor_user: ${vendorUserResponse.status}`);
                }

                const vendorUserData = await vendorUserResponse.json();
                const vendorIdFromApi = vendorUserData.vendor_id;

                if (!vendorIdFromApi) {
                    throw new Error("Vendor ID not found for the current vendor user");
                }

                console.log('vendorId:', vendorIdFromApi);

                const notificationsResponse = await fetch(`http://127.0.0.1:5555/vendor-notifications/${vendorIdFromApi}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!notificationsResponse.ok) {
                    throw new Error(`Error fetching notifications: ${notificationsResponse.status}`);
                }

                const notificationsData = await notificationsResponse.json();

                console.log('Notifications data:', notificationsData);

                // Correct the structure to access notifications
                if (notificationsData.notifications && Array.isArray(notificationsData.notifications)) {
                    setNotifications(notificationsData.notifications);
                } else {
                    console.error('Notifications data is not in the expected array format');
                }
            } catch (error) {
                console.error("Error:", error.message);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchVendorNotifications();
    }, []);

    if (loading) return <div>Loading notifications...</div>;
    if (error) return <div>Error: {error}</div>;

    const handleApprove = async (notificationId, isAdmin) => {
        console.log(`Approval notification with ID: ${notificationId}`);
        const token = localStorage.getItem('authToken');
    
        try {
            const response = await fetch(`http://127.0.0.1:5555/vendor-notifications/${notificationId}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, 
                },
                body: JSON.stringify({ is_admin: isAdmin }),
            });
    
            if (response.ok) {
                setNotifications(notifications.filter((notif) => notif.id !== notificationId));
                alert('Notification approved and user updated successfully');
            } else {
                console.error('Failed to approve request');
                const responseData = await response.json();
                alert(responseData.message || 'Something went wrong');
            }
        } catch (error) {
            console.error('Error approving request', error);
        }
    };
    

    const handleReject = async (notificationId) => {
        const token = localStorage.getItem('authToken');
        try {
            const response = await fetch(`http://127.0.0.1:5555/vendor-notifications/${notificationId}/reject`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setNotifications(notifications.filter((notif) => notif.id !== notificationId));
            } else {
                console.error('Failed to reject request');
            }
        } catch (error) {
            console.error('Error rejecting request', error);
        }
    };

    return (
        <>
            {notifications.length === 0 ? (
                <>
                </>
            ) : (
                <div className='bounding-box tab-content margin-b-24'>
                    <h3>Notifications</h3>
                    <br />
                        <ul>
                            {notifications.map((notification) => {
                                console.log(notification);
                                return (
                                    <li key={notification.id}>
                                        <p><strong>{notification.message}</strong></p>
                                        <button className='btn-edit' onClick={() => {
                                            console.log(notification.id);
                                            handleApprove(notification.id, true);
                                        }}>
                                            Approve as Admin
                                        </button>
                                        <button className='btn-edit' onClick={() => handleApprove(notification.id, false)}>
                                            Approve as Employee
                                        </button>
                                        <button className='btn-edit' onClick={() => handleReject(notification.id)}>Reject</button>
                                        <br />
                                    </li>
                                );
                            })}
                        </ul>
                </div>
            )}
        </>
    );
};

export default VendorNotification;
