import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function VendorCreate () {
    const [vendorEditMode, setVendorEditMode] = useState(false);
    const [vendorUserData, setVendorUserData] = useState(null);
    const [newVendor, setNewVendor] = useState(false);
    const [vendorData, setVendorData] = useState(null);
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
        const fetchVendorUserData = async () => {
            const id = sessionStorage.getItem('vendor_user_id');
            if (!id) {
                console.error("No vendor user ID found");
                return;
            }
    
            try {
                const token = sessionStorage.getItem('jwt-token');
                const response = await fetch(`http://127.0.0.1:5555/vendor-users/${id}`, {
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
                name: vendorUserData.name,
                city: vendorUserData.city,
                state: vendorUserData.state,
                product: vendorUserData.product,
                image: vendorUserData.image
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
            const vendorResponse = await fetch('http://127.0.0.1:5555/vendors', {
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
    
            const userResponse = await fetch(`http://127.0.0.1:5555/vendor-users/${vendorUserData.id}`, {
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

    return (
        <div>
            <div className='tab-content'>
                <h3>Create a Vendor Profile</h3>
            </div>
            
                <div className="form-group">

                    <label>Vendor Name:</label>
                    <input type="text" name="name" value={vendorData ? vendorData.name : ''} onChange={handleVendorInputChange} />
                
                </div>

                <div className="form-group">

                    <label>Product:</label>
                    <select name="product" value={vendorData ? vendorData.product : ''} onChange={handleVendorInputChange}>
                        <option value="">Select</option>
                        {products.map((product, index) => (
                            <option key={index} value={product}> {product} </option>
                        ))}
                    </select>

                </div>
                <div className="form-group">

                    <label>Based out of:</label>
                    <input type="text" name="city" value={vendorData ? vendorData.city : ''} onChange={handleVendorInputChange} />
                    <select className="select-state" name="state" value={vendorData ? vendorData.state : ''} onChange={handleVendorInputChange}>
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
        </div>
        )
}

export default VendorCreate;