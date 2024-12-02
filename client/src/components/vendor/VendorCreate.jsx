import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function VendorCreate () {
    const [vendorEditMode, setVendorEditMode] = useState(false);
    const [vendorUserData, setVendorUserData] = useState(null);
    const [vendorUserId, setVendorUserId] = useState(null);
    const [vendors, setVendors] = useState([]);
    const [newVendor, setNewVendor] = useState(false);
    const [vendorData, setVendorData] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [query, setQuery] = useState("");
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [image, setImage] = useState(null)
    const [status, setStatus] = useState('initial')
    const [vendorImageURL, setVendorImageURL] = useState(null);

    const navigate = useNavigate();
  
    const products = [
        'Art', 'Baked Goods', 'Cheese', 'Cider', 'Ceramics', 'Coffee/Tea', 'Fish', 'Flowers', 'Fruit', 'Gifts', 'Honey', 
        'International', 'Juice', 'Maple Syrup', 'Meats', 'Mushrooms', 'Nuts', 'Pasta', 'Pickles', 'Spirits', 'Vegetables'
    ];

    const states = [
        "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", 
        "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", 
        "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
        "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", 
        "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
    ];

    useEffect(() => {
        if (vendorUserData?.id) {
            setVendorUserId(vendorUserData.id);
        }
    }, [vendorUserData]); 

    useEffect(() => {
        fetch("http://127.0.0.1:5555/api/vendors")
            .then((response) => {
                if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => setVendors(data))
            .catch((error) => console.error("Error fetching vendors:", error));
    }, []);

    const fetchVendorDetails = async (vendorId) => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/vendors/${vendorId}`);
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

    useEffect(() => {
        const fetchVendorUserData = async () => {
            const id = localStorage.getItem('vendor_user_id');
            if (!id) {
                console.error("No vendor user ID found");
                return;
            }
    
            try {
                const token = localStorage.getItem('jwt-token');
                const response = await fetch(`http://127.0.0.1:5555/api/vendor-users/${id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
    
                const text = await response.text();
    
                if (response.ok) {
                    const data = text ? JSON.parse(text) : null;
                    setVendorUserData(data);
    
                    if (data && data.isNew) {
                        setNewVendor(true);
                    }
                } else {
                    console.error('Error fetching profile:', response.status);
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
            }
        };
    
        fetchVendorUserData();
    }, []);

    const onUpdateQuery = (event) => setQuery(event.target.value);

    const filteredVendors = vendors.filter(
        (vendor) => vendor.name.toLowerCase().includes(query.toLowerCase()) && vendor.name !== query 
    );

    const handleSelectVendor = (vendor) => {
        setSelectedVendor(vendor);
        setQuery(vendor.name);
    };
    
    useEffect(() => {
        if (newVendor && !vendorData) {
            setVendorData({ name: '', city: '', state: '', product: '', image: '' });
            setVendorEditMode(true); 
        } else if (vendorUserData) {
            setVendorData({ name: vendorUserData.name || '', city: vendorUserData.city || '', state: vendorUserData.state || '', product: vendorUserData.product || '', image: vendorUserData.image || '' });
            setVendorEditMode(true);
        }
    }, [newVendor, vendorUserData]);

    const handleVendorInputChange = (event) => {
        setVendorData({ ...vendorData, [event.target.name]: event.target.value, });
    };

    const handleVendorEditToggle = () => {
        setVendorEditMode(!vendorEditMode);
    };

    const handleFileChange = (event) => {
        if (event.target.files) { setStatus('initial'); setImage(event.target.files[0]); }
    };

    const handleSaveNewVendor = async () => {
        if (!vendorUserData || !vendorUserData.id) {
            console.log('No user data available or user ID is missing');
            return;
        }

        const newVendorData = { name: vendorData.name, city: vendorData.city, state: vendorData.state, product: vendorData.product, image: vendorImageURL, };

        try {
            const vendorResponse = await fetch('http://127.0.0.1:5555/api/vendors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newVendorData),
            });
            
            if (!vendorResponse.ok) {
                console.log('Error creating vendor');
                return;
            }
            
            const createdVendor = await vendorResponse.json();
            const vendorId = createdVendor.id;
            if (!vendorId) {
                console.error("Created vendor does not have an ID.");
                return;
            }
    
            if (!vendorUserData || !vendorUserData.id) {
                console.log('No user data available or user ID is missing');
                return;
            }
            
            const userDataWithVendor = {
                ...vendorUserData,
                vendor_id: vendorId,
            };

            const token = localStorage.getItem('jwt-token');
            if (!token) {
                alert('Authorization token is missing. Please log in.');
                return;
            }
    
            const userResponse = await fetch(`http://127.0.0.1:5555/api/vendor-users/${vendorUserData.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userDataWithVendor),
            });

            if (userResponse.ok) {
                const updatedUser = await userResponse.json();
                alert('Vendor created and user updated with vendor_id');

                setVendorEditMode(false);
                setNewVendor(false);
                navigate('/vendor/dashboard');
            } else {
                console.log('Error updating user with vendor_id');
            }
        } catch (error) {
            console.error('Error creating vendor and updating user:', error);
        }
    };

    const handleRequestJoin = async (event) => {
        event.preventDefault();
    
        if (!selectedVendor || !vendorUserId) {
            alert('Please select a vendor and ensure you are logged in.');
            return;
        }
    
        const token = localStorage.getItem('jwt-token');
        if (!token) {
            alert('Authorization token is missing. Please log in.');
            return;
        }
    
        try {
            const response = await fetch('http://127.0.0.1:5555/api/create-vendor-notification', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
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
        const token = localStorage.getItem('jwt-token');
        if (!notifications) {
            console.error("No notifications found to cancel.");
            alert("No pending requests to cancel.");
            return;
        }
        const notificationArray = Array.isArray(notifications) ? notifications : [notifications];
        try {
            for (const notification of notificationArray) {
                const response = await fetch(`http://127.0.0.1:5555/api/vendor-notification/${notification.id}`, {
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

    const getVendorName = (vendorId) => {
        const vendor = vendors.find((vendor) => vendor.id === vendorId);
        return vendor ? vendor.name : 'Unknown Vendor';
    };

    useEffect(() => {
        if (!vendorUserId) return;

        const fetchNotifications = async () => {
            const token = localStorage.getItem('jwt-token');;
            if (!token) {
                console.error("Token missing");
                setIsLoading(false);
                return;
            }
            try {
                const response = await fetch(`http://127.0.0.1:5555/api/vendor-notifications/vendor-user/${vendorUserId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log('Notifications fetched:', data);
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
    }, [vendorUserId]);
    

    return (
        <div>
            <div className='tab-content margin-b-24'>
                <h2>Create a Vendor Profile</h2>
            </div>
            <div className="form-group">

                <label>Vendor Name:</label>
                <input type="text" name="name" value={vendorData?.name || ''} onChange={handleVendorInputChange} />
            
            </div>
            <div className="form-group">
                <label>Product:</label>
                <select name="product" value={vendorData?.product || ''} onChange={handleVendorInputChange}>
                    <option value="">Select</option>
                    {products.map((product, index) => (
                        <option key={index} value={product}> {product} </option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label>Based out of:</label>
                <input type="text" name="city" value={vendorData?.city || ''} onChange={handleVendorInputChange} />
                <select className="select-state" name="state" value={vendorData?.state || ''} onChange={handleVendorInputChange}>
                    <option value="">Select</option>
                    {states.map((state, index) => (
                        <option key={index} value={state}>
                            {state}
                        </option>
                    ))}
                </select>
            </div>
            <div className="form-group">

                <label>Vendor Image:</label>
                <input type="file" name="file" accept="image/*" onChange={handleFileChange} />

            </div>

            {/* {vendorUserData?.is_admin && ( */}
                <>
                    <button className="btn-edit" onClick={handleSaveNewVendor}>Create Vendor</button>
                    <button className="btn-edit" onClick={() => setNewVendor(false)}>Cancel</button>
                </>
            {/* )} */}

            <br />
            <br />

            <div>
            <div className="tab-content margin-b-24">
                <h2>Already a Vendor?</h2>
            </div>

            <div>
                {notifications.length !== 0 ? (
                    <div className="notification">
                    <p>Your request has been sent to the admins of <strong>{notifications.vendor_name}</strong> for approval.</p>
                        <button className="btn-edit" onClick={handleCancelRequest}>
                            Cancel Request
                        </button>
                    </div>
                ) : (
                    <div>
                        <h3>Request to be added here:</h3>
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
    </div>
    )
}

export default VendorCreate;
