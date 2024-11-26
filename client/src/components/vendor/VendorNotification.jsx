import React, { useEffect, useState } from 'react';

function VendorNotification({ teamMembers, setTeamMembers, vendorUserData }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVendorNotification = async () => {
            try {
                const vendorUserId = sessionStorage.getItem('vendor_user_id');
                if (!vendorUserId) {
                    console.error("No vendor user ID found in session storage");
                    setError("Vendor user ID is missing");
                    setLoading(false);
                    return;
                }

                const token = sessionStorage.getItem('jwt-token');
                if (!token) {
                    console.error("No JWT token found in session storage");
                    setError("JWT token is missing");
                    setLoading(false);
                    return;
                }

                const vendorUserResponse = await fetch(`http://127.0.0.1:5555/api/vendor-users/${vendorUserId}`, {
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
                    throw new Error("Vendor ID not found in the response");
                }

                const notificationsResponse = await fetch(`http://127.0.0.1:5555/api/vendor-notifications/vendor/${vendorIdFromApi}`, {
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
                setNotifications(notificationsData.notifications || []);
            } catch (error) {
                console.error('Error fetching vendor notifications:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchVendorNotification();
    }, []);
    

    const handleApprove = async (notification, isAdmin) => {
        console.log(`Approval notification with ID: ${notification.id}`);
        const token = localStorage.getItem('jwt-token');
    
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/vendor-notifications/${notification.id}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`, 
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ is_admin: isAdmin }),
            });
            if (response.ok) {
                const vendorUserResponse = await fetch(`http://127.0.0.1:5555/api/vendor-users?vendor_id=${vendorUserData.vendor_id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (!vendorUserResponse.ok) {
                    throw new Error('Error fetching vendor user details');
                }
                const vendorUser = await vendorUserResponse.json();
                console.log(vendorUser)
                setTeamMembers(vendorUser);
                setNotifications((prevNotifications) => 
                    prevNotifications.filter((notif) => notif.id !== notification.id)
                );
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
        const token = localStorage.getItem('jwt-token');
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/vendor-notifications/${notificationId}/reject`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setNotifications((prevNotifications) => 
                    prevNotifications.filter((notif) => notif.id !== notificationId)
                );
            } else {
                console.error('Failed to reject request');
            }
        } catch (error) {
            console.error('Error rejecting request', error);
        }
    };

    return (
        <div>
            <div className='tab-content margin-b-24'>
                <ul>
                    {notifications.map((notification) => (
                        <li key={notification.id}>
                            <p><strong>{notification.message}</strong></p>
                            <button className='btn-edit' onClick={() => handleApprove(notification, true)}>
                                Approve as Admin
                            </button>
                            <button className='btn-edit' onClick={() => handleApprove(notification, false)}>
                                Approve as Employee
                            </button>
                            <button className='btn-edit' onClick={() => handleReject(notification.id)}>
                                Reject
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
};

export default VendorNotification;
