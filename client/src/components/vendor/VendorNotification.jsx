import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

function VendorNotification({ notifications, setNotifications, teamMembers, setTeamMembers, vendorUserData }) {
    const [teamNotifications, setTeamNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const vendorUserId = parseInt(globalThis.localStorage.getItem('vendor_user_id'))

    useEffect(() => {
        if (!vendorUserId) return;

        const fetchTeamNotifications = async () => {
            const token = localStorage.getItem('vendor_jwt-token');;
            if (!token) {
                console.error("Token missing");
                setIsLoading(false);
                return;
            }
            try {
                const response = await fetch(`/api/vendor-notifications?subject=team-request&data=${vendorUserId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log('Notifications fetched:', data);
                    setTeamNotifications(data.notifications || []);
                } else {
                    setTeamNotifications([]);
                }
            } catch (error) {
                console.error('Error fetching notifications:', error);
                setTeamNotifications([]);
            }
        };
        fetchTeamNotifications();
    }, [vendorUserId]);

    const handleApprove = async (notification, vendor_role) => {
        console.log(`Approval notification with ID: ${notification.id}`);
        const token = localStorage.getItem('vendor_jwt-token');
    
        try {
            const response = await fetch(`/api/vendor-notifications/${notification.id}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`, 
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ vendor_role: vendor_role }),
            });
            if (response.ok) {
                const vendorUserResponse = await fetch(`/api/vendor-users?vendor_id=${vendorUserData.vendor_id[vendorUserData.active_vendor]}`, {
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
                // console.log(vendorUser)
                setTeamMembers(vendorUser);
                setNotifications((prevNotifications) => 
                    prevNotifications.filter((notif) => notif.id !== notification.id)
                );
                toast.success('Notification approved and user updated successfully', {
                    autoClose: 3000,
                });
                try {
                    const response = await fetch(`/api/vendor-notifications?subject=team-request&data=${notification.data}&vendor_id=${notification.vendor_id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        }
                    });
                    if (!response.ok) {
                        const errorData = await response.json();
                        console.error(`Error deleting notification:`, errorData.message || 'Unknown error');
                    }
                    if (response.ok) {
                        setTeamNotifications([]);
                        setNotifications((prevNotifications) =>
                            prevNotifications.filter((notif) => notif.id !== notification.id)
                        );
                    }
                } catch (error) {
                    console.error('Error canceling request:', error);
                    toast.error('An error occurred while canceling the request. Please try again later.', {
                        autoClose: 4000,
                    });
                }
            } else {
                console.error('Failed to approve request');
                const responseData = await response.json();
                alert(responseData.message || 'Something went wrong');
            }
        } catch (error) {
            console.error('Error approving request', error);
        }
    };
    

    const handleReject = async (notificationData) => {
        const token = localStorage.getItem('vendor_jwt-token');
        try {
            const response = await fetch(`/api/vendor-notifications?subject=team-request&data=${notificationData.data}&vendor_id=${notificationData.vendor_id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`Error deleting notification:`, errorData.message || 'Unknown error');
                toast.error(`Error rejecting request: ${errorData.message || 'Unknown error'}`, {
                    autoClose: 4000,
                });
            }
            if (response.ok) {
                setTeamNotifications([]);
                setNotifications((prevNotifications) =>
                    prevNotifications.filter((notif) => notif.id !== notificationData.id)
                );
                toast.success('Your request has been canceled', {
                    autoClose: 3000,
                });
            }
        } catch (error) {
            console.error('Error canceling request:', error);
            toast.error('An error occurred while rejecting the request. Please try again later.', {
                autoClose: 4000,
            });
        }
    };

    return (
        <div>
            <div className='tab-content margin-b-24'>
                <ul>
                    {notifications.map((notification) => (
                        <li key={notification.id}>
                            <p><strong>{notification.message}</strong></p>
                            <button className='btn-edit' onClick={() => handleApprove(notification, 1)}>
                                Approve as Admin
                            </button>
                            <button className='btn-edit' onClick={() => handleApprove(notification, 2)}>
                                Approve as Employee
                            </button>
                            <button className='btn-edit' onClick={() => handleReject(notification)}>
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
