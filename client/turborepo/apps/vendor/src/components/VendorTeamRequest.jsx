import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { toast } from 'react-toastify';

const VendorTeamRequest = ({ className, vendorUserId, vendorUserData }) => {
    const [notifications, setNotifications] = useState([]);
    const [teamNotifications, setTeamNotifications] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [query, setQuery] = useState("");
    const [selectedVendor, setSelectedVendor] = useState(null);

    const navigate = useNavigate();
    const { handlePopup } = useOutletContext();

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
                    // console.log('Notifications fetched:', data);
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
            handlePopup();
            return;
        }
        const token = localStorage.getItem('vendor_jwt-token');
        if (!token) {
            handlePopup();
            return;
        }

        try {
            const response = await fetch('/api/vendor-notifications?vendor_role=1', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subject: 'team-request',
                    link: "/dashboard?tab=team",
                    vendor_id: selectedVendor.id,
                    data: vendorUserId,
                    message: `${vendorUserData.first_name} ${vendorUserData.last_name} has requested to join your vendor team.`,
                }),
            });

            if (response.ok) {
                const responseData = await response.json();
                setTeamNotifications(...teamNotifications, responseData);
                setSelectedVendor(null);
                setQuery('');
                toast.success(`Your request has been sent to the admins of ${selectedVendor.name}!`, {
                    autoClose: 5000,
                });
            } else {
                const errorData = await response.json();
                toast.error(`Error sending request: ${errorData.message || 'Unknown error'}`, {
                    autoClose: 6000,
                });
            }
        } catch (error) {
            console.error('Error sending request:', error);
            toast.error('An error occurred while sending the request. Please try again later.', {
                autoClose: 6000,
            });
        }
    };

    const handleCancelRequest = async (vendorId) => {
        const token = localStorage.getItem('vendor_jwt-token');
        if (!notifications) {
            console.error("No notifications found to cancel.");
            toast.warning('No pending requests to cancel.', {
                autoClose: 4000,
            });
            return;
        }
        // const notificationArray = Array.isArray(teamNotifications) ? teamNotifications : [teamNotifications];
        try {
            // for (const notification of notificationArray) {
            const response = await fetch(`/api/vendor-notifications?subject=team-request&data=${vendorUserId}&vendor_id=${vendorId}`, {
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
                    setTeamNotifications([]);
                    toast.success('Your request has been canceled', {
                        autoClose: 3000,
                    });
                } else {
                    const errorData = await response.json();
                    toast.error(`Error canceling request: ${errorData.message || 'Unknown error'}`, {
                        autoClose: 4000,
                    });
                }
            // }
        } catch (error) {
            console.error('Error canceling request:', error);
            toast.error('An error occurred while canceling the request. Please try again later.', {
                autoClose: 4000,
            });
        }
    };


    return (
        <div className={className || ''}>
            <div>
                {Array.isArray(teamNotifications) && teamNotifications.length > 0 ? (
                    [...new Map(teamNotifications
                        .filter(notification => notification.subject === 'team-request' && Number(notification.data) === vendorUserId)
                        .map(notification => [notification.vendor_id, notification])) // Use Map to ensure unique vendor_id
                        .values()]
                        .map(notification => (
                            <div className="notification" key={notification.vendor_id}>
                                <p>Your request has been sent to the admins of <strong>{notification.vendor_name}</strong> for approval.</p>
                                <button className="btn-edit" onClick={(e) => handleCancelRequest(notification.vendor_id)}>
                                    Cancel Request
                                </button>
                            </div>
                        ))
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