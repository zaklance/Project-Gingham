import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VendorTeamRequest = ({ className, vendorUserId, vendorUserData }) => {
    const [notifications, setNotifications] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [query, setQuery] = useState("");
    const [selectedVendor, setSelectedVendor] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        fetch("/api/vendors")
            .then((response) => {
                if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => setVendors(data))
            .catch((error) => console.error("Error fetching vendors:", error));
    }, []);
    
    useEffect(() => {
        if (!vendorUserId) return;

        const fetchNotifications = async () => {
            const token = localStorage.getItem('vendor_jwt-token');;
            if (!token) {
                console.error("Token missing");
                setIsLoading(false);
                return;
            }
            try {
                const response = await fetch(`/api/vendor-notifications/vendor-user/${vendorUserId}`, {
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
                    // console.error('Failed to fetch notifications');
                    setNotifications([]);
                }
            } catch (error) {
                console.error('Error fetching notifications:', error);
                setNotifications([]);
            }
        };
        fetchNotifications();
    }, [vendorUserId]);
    
        const onUpdateQuery = (event) => setQuery(event.target.value);
    
        const filteredVendors = vendors.filter(
            (vendor) => vendor.name.toLowerCase().includes(query.toLowerCase()) && vendor.name !== query 
        );
    
        const handleSelectVendor = (vendor) => {
            setSelectedVendor(vendor);
            setQuery(vendor.name);
        };

    const fetchVendorDetails = async (vendorId) => {
            try {
                const response = await fetch(`/api/vendors/${vendorId}`);
                if (response.ok) {
                    const vendorData = await response.json();
                    setSelectedVendor({ id: vendorData.id, name: vendorData.name });
                } else {
                    console.error('Error fetching vendor details');
                }
            } catch (error) {
                console.error('Error fetching vendor details:', error);
            }
        };

    const handleRequestJoin = async (event) => {
        event.preventDefault();

        if (!selectedVendor || !vendorUserId) {
            alert('Please select a vendor and ensure you are logged in.');
            return;
        }
        const token = localStorage.getItem('vendor_jwt-token');
        if (!token) {
            alert('Authorization token is missing. Please log in.');
            return;
        }

        try {
            const response = await fetch('/api/vendor-notifications', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subject: 'team-request',
                    link: "/vendor/dashboard?tab=team",
                    vendor_id: selectedVendor.id,
                    vendor_user_id: vendorUserId,
                    message: `${vendorUserData.first_name} ${vendorUserData.last_name} has requested to join your vendor team.`,
                }),
            });

            if (response.ok) {
                const responseData = await response.json();
                setNotifications(...notifications, responseData);
                setSelectedVendor(null);
                setQuery('');
                alert(`Your request has been sent to the admins of ${selectedVendor.name}!`);
            } else {
                const errorData = await response.json();
                alert(`Error sending request: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error sending request:', error);
            alert('An error occurred while sending the request. Please try again later.');
        }
    };

    const handleCancelRequest = async () => {
        const token = localStorage.getItem('vendor_jwt-token');
        if (!notifications) {
            console.error("No notifications found to cancel.");
            alert("No pending requests to cancel.");
            return;
        }
        const notificationArray = Array.isArray(notifications) ? notifications : [notifications];
        try {
            for (const notification of notificationArray) {
                const response = await fetch(`/api/vendor-notifications/${notification.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error(`Error deleting notification ${notification.id}:`, errorData.message || 'Unknown error');
                }
                if (response.ok) {
                    setSelectedVendor(null);
                    setNotifications([]);
                    alert('Your request has been canceled.');
                    navigate('/vendor/dashboard');
                } else {
                    const errorData = await response.json();
                    alert(`Error canceling request: ${errorData.message || 'Unknown error'}`);
                }
            }
        } catch (error) {
            console.error('Error canceling request:', error);
            alert('An error occurred while canceling the request. Please try again later.');
        }
    };


    return (
        <div className={className || ''}>
            <div>
                {notifications?.some(notification => notification.subject === 'team-request') ? (
                    <div className="notification">
                        <p>Your request has been sent to the admins of <strong>{notifications.vendor_name}</strong> for approval.</p>
                        <button className="btn-edit" onClick={handleCancelRequest}>
                            Cancel Request
                        </button>
                    </div>
                ) : (
                    <div>
                        <h3>Request to be added to Team:</h3>
                        <table className="margin-t-16">
                            <tbody>
                                <tr>
                                    <td className="cell-title">Search:</td>
                                    <td className="cell-text">
                                        <input id="vendor-search" className="search-bar" type="text" placeholder="Search vendors..." value={query} onChange={onUpdateQuery} />
                                        <div className="dropdown-content">
                                            {query &&
                                                filteredVendors.slice(0, 10).map((item) => (
                                                    <div className="search-results" key={item.id} onClick={() => handleSelectVendor(item)} >
                                                        {item.name}
                                                    </div>
                                                ))}
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        {selectedVendor && (
                            <div className="selected-vendor">
                                <p>You have selected: {selectedVendor.name}</p>
                                {!notifications?.id && (
                                    <button className="btn-edit" onClick={handleRequestJoin}>
                                        Request
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VendorTeamRequest;