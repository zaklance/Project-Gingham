import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function VendorCreate () {
    const [vendorEditMode, setVendorEditMode] = useState(false);
    const [vendorUserData, setVendorUserData] = useState(null);
    const [vendors, setVendors] = useState([]);
    const [newVendor, setNewVendor] = useState(false);
    const [vendorData, setVendorData] = useState(null);
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
    
      const onUpdateQuery = (event) => setQuery(event.target.value);
    
      const filteredVendors = vendors.filter(
        (vendor) =>
          vendor.name.toLowerCase().includes(query.toLowerCase()) &&
          vendor.name !== query
      );
    
      const handleSelectVendor = (vendor) => {
        setQuery(vendor.name);
        setSelectedVendor(vendor);
      };
    
    useEffect(() => {
        const fetchVendorUserData = async () => {
            const id = sessionStorage.getItem('vendor_user_id');
            if (!id) {
                console.error("No vendor user ID found");
                return;
            }
    
            try {
                const token = sessionStorage.getItem('jwt-token');
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
    

    useEffect(() => {
        if (newVendor && !vendorData) {
            setVendorData({
                name: '',
                city: '', 
                state: '', 
                product: '', 
                image: ''
            });
            setVendorEditMode(true); 
        } else if (vendorUserData) {
            setVendorData({
                name: vendorUserData.name || '',
                city: vendorUserData.city || '',
                state: vendorUserData.state || '',
                product: vendorUserData.product || '',
                image: vendorUserData.image || ''
            });
            setVendorEditMode(true);
        }
    }, [newVendor, vendorUserData]);

    const handleVendorInputChange = (event) => {
        setVendorData({
            ...vendorData,
            [event.target.name]: event.target.value,
        });
    };

    const handleVendorEditToggle = () => {
        setVendorEditMode(!vendorEditMode);
    };

    const handleFileChange = (event) => {
        if (event.target.files) {
            setStatus('initial');
            setImage(event.target.files[0]);
        }
    };

    const handleSaveNewVendor = async () => {
        if (!vendorUserData || !vendorUserData.id) {
            console.log('No user data available or user ID is missing');
            return;
        }

        const newVendorData = {
            name: vendorData.name,
            city: vendorData.city,
            state: vendorData.state,
            product: vendorData.product,
            image: vendorImageURL,
        };

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

            const token = sessionStorage.getItem('jwt-token');
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
                window.location.reload();
            } else {
                console.log('Error updating user with vendor_id');
            }
        } catch (error) {
            console.error('Error creating vendor and updating user:', error);
        }
    };

    const handleRequestJoin = async () => {
        if (!selectedVendor) {
            alert('No vendor selected.');
            return;
        }
    
        if (!vendorUserData || !vendorUserData.id) {
            alert('User data is missing.');
            return;
        }
    
        const token = sessionStorage.getItem('jwt-token');
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
                    vendor_user_id: vendorUserData.id,
                    message: `${vendorUserData.first_name} ${vendorUserData.last_name} has requested to join your vendor team.`,
                }),
            });
    
            if (response.ok) {
                alert('Your request has been sent to the vendor admins!');
            } else {
                const errorData = await response.json();
                console.error('Error sending request:', errorData);
                alert(`Error sending request: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while sending the request. Please try again later.');
        }
    };
    

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
                    <h3>Request to be added here:</h3>
                    <table className='margin-t-16'>
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
                        </div>
                    )}
                    <button className="btn-edit" onClick={handleRequestJoin} disabled={!selectedVendor}>
                        Request
                    </button>
                </div>
            </div>
        </div>
    )
}

export default VendorCreate;
