import React, { useState, useEffect } from 'react';
import { useParams, NavLink, Link, Route, Routes, BrowserRouter as Router} from 'react-router-dom';
import BasketCard from './BasketCard';

function VendorProfile () {
    const { id } = useParams();
    const [editMode, setEditMode] = useState(false);
    const [vendorEditMode, setVendorEditMode] = useState(false);
    const [vendorUserData, setVendorUserData] = useState(null);
    const [locations, setLocations] = useState([]);
    const [marketDetails, setMarketDetails] = useState({});
    const [newVendor, setNewVendor] = useState(false);
    const [vendorData, setVendorData] = useState(null);
    const [image, setImage] = useState(null)
    const [status, setStatus] = useState('initial')
    const [vendorImageURL, setVendorImageURL] = useState(null);

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
            try {
                const token = sessionStorage.getItem('jwt-token');
                const response = await fetch(`http://127.0.0.1:5555/vendor-users/${id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json' 
                    }
                });
    
                const text = await response.text();
    
                if (response.ok) {
                    const data = JSON.parse(text);
                    setVendorUserData(data);
    
                    if (data && data.isNew) {
                        setNewVendor(true);
                    }
                } else {
                    console.error('Error fetching profile:', response.status);
                    if (response.status === 401) {
                        console.error('Unauthorized: Token may be missing or invalid');
                    }
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
            }
        };
        fetchVendorUserData();
    }, [id]);
    
    useEffect(() => {
        if (newVendor && !vendorData) {
            setVendorData({
                name: '',
                city: '', 
                state: '', 
                product: ''
            });
            setVendorEditMode(true); 
        }
    }, [newVendor, vendorData]);

    const handleInputChange = (event) => {
        setVendorUserData({
            ...vendorUserData,
            [event.target.name]: event.target.value,
        });
    };

    const handleEditToggle = () => {
        setEditMode(!editMode);
    };

    const handleFileChange = (event) => {
        if (event.target.files) {
            setStatus('initial');
            setImage(event.target.files[0]);
        }
    }

    const handleSubmit = (event) => {
        event.preventDefault()
        console.log('File to Upload: ', image)
    }

    const handleSaveChanges = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/vendor-users/${id}`, {
                method: 'PATCH', 
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(vendorUserData)
            });
            console.log('Request body:', JSON.stringify(vendorUserData));

            if (response.ok) {
                const updatedData = await response.json();
                setVendorUserData(updatedData);
                setEditMode(false);
                console.log('Profile data updated successfully:', updatedData);
            } else {
                console.log('Failed to save changes');
                console.log('Response status:', response.status);
                console.log('Response text:', await response.text());
            }            
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    };

    useEffect(() => {
        const fetchVendorData = async () => {
            if (!vendorUserData || !vendorUserData.vendor_id) return;
    
            try {
                const response = await fetch(`http://127.0.0.1:5555/vendors/${vendorUserData.vendor_id}`);
                if (response.ok) {
                    const data = await response.json();
                    setVendorData(data);
                    if (data.image) {
                        setVendorImageURL(`http://127.0.0.1:5555/vendors/${vendorUserData.vendor_id}/image`);
                    }
                } else {
                    console.error('Failed to fetch vendor data:', response.status);
                }
            } catch (error) {
                console.error('Error fetching vendor data:', error);
            }
        };
    
        fetchVendorData();
    }, [vendorUserData]);

    const handleVendorInputChange = (event) => {
        setVendorData({
            ...vendorData,
            [event.target.name]: event.target.value,
        });
    };

    const handleVendorEditToggle = () => {
        setVendorEditMode(!vendorEditMode);
    };

    const handleSaveNewVendor = async () => {
        const newVendorData = {
            name: vendorData.name,
            city: vendorData.city,
            state: vendorData.state,
            product: vendorData.product,
            image: vendorData.image,
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
            
            const userData = vendorUserData || {};
            
            
            if (!userData.id) {
                console.log('No user data available');
                return;
            }
            
            const userDataWithVendor = {
                ...userData,
                vendor_id: vendorId,
            };
            
            const token = sessionStorage.getItem('jwt-token');
            if (!token) {
                alert('Authorization token is missing. Please log in.');
                return;
            }

            const userResponse = await fetch(`http://127.0.0.1:5555/vendor-users/${userData.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userDataWithVendor),
            });
            
            const responseText = await userResponse.text();
            console.log('Response Status:', userResponse.status);
            console.log('Response Text:', responseText);
            
            if (userResponse.ok) {
                const updatedUser = await userResponse.json();
                alert('Vendor created and user updated with vendor_id');
                setVendorEditMode(false);
                setNewVendor(false);
            } else {
                console.log('Error updating user with vendor_id');
            }
        } catch (error) {
            console.error('Error creating vendor and updating user:', error);
        }
    };
    

    const handleSaveVendorChanges = async () => {
        let uploadedFilename = null;
    
        if (image) {

            const maxFileSize = 25 * 1024 * 1024
            if (image.size > maxFileSize) {
                alert ("File size exceeds 25 MB. Please upload a smaller file.");
                return;
            }

            console.log('Uploading file...');
            setStatus('uploading');
            const formData = new FormData();
            formData.append('file', image);
            formData.append('vendor_id', id);
    
            try {
                const result = await fetch('http://127.0.0.1:5555/upload', {
                    method: 'POST',
                    body: formData,
                });
    
                if (result.ok) {
                    const data = await result.json();
                    uploadedFilename = data.filename;
                    console.log('Image uploaded:', uploadedFilename);
                    setStatus('success');
                    setVendorImageURL(`http://127.0.0.1:5555/vendors/${id}/image`);
                } else {
                    console.log('Image upload failed');
                    console.log('Response:', await result.text());
                    setStatus('fail');
                    return;
                }
            } catch (error) {
                console.error('Error uploading image:', error);
                setStatus('fail');
                return;
            }
        }
    
        // Include uploaded filename in vendorData if a new image was uploaded
        const updatedVendorData = { ...vendorData };
        if (uploadedFilename) {
            updatedVendorData.image = uploadedFilename;
        }
    
        try {
            const response = await fetch(`http://127.0.0.1:5555/vendors/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedVendorData),
            });
    
            console.log('Request body:', JSON.stringify(updatedVendorData));
    
            if (response.ok) {
                const updatedData = await response.json();
                setVendorData(updatedData);
                setVendorEditMode(false);
                console.log('Vendor data updated successfully:', updatedData);
            } else {
                console.log('Failed to save changes');
                console.log('Response status:', response.status);
                console.log('Response text:', await response.text());
            }
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    };

    useEffect(() => {
        if (Array.isArray(locations) && locations.length > 0) {
            const fetchMarketDetails = async () => {
                const promises = locations.map(async marketId => {
                    try {
                        const response = await fetch(`http://127.0.0.1:5555/markets/${marketId}`);
                        if (response.ok) {
                            const marketData = await response.json();
                            return { id: marketId, name: marketData.name };
                        } else {
                            console.log(`Failed to fetch market ${marketId}`);
                            return { id: marketId, name: 'Unknown Market' };
                        }
                    } catch (error) {
                        console.error(`Error fetching market ${marketId}:`, error);
                        return { id: marketId, name: 'Unknown Market' };
                    }
                });

                Promise.all(promises)
                    .then(details => {
                        const vendorDetailsMap = {};
                        details.forEach(detail => {
                            vendorDetailsMap[detail.id] = detail.name;
                        });
                        setMarketDetails(vendorDetailsMap);
                    })
                    .catch(error => {
                        console.error('Error fetching market details:', error);
                    });
            };
            fetchMarketDetails();
        }
    }, [locations]);

    return (
        <div>
            <div className="tab-content">

                {/* Profile Updates */}
                <div>
                <h2 className="title">Profile Information</h2>        
                <div className="bounding-box">
                    {editMode ? (
                        <>
                            <div className="form-group flex-form">

                                <label>First Name:</label>
                                <input type="text" name="first_name" value={vendorUserData ? vendorUserData.first_name : ''} onChange={handleInputChange} />

                            </div>
                            <div className="form-group flex-form">

                                <label>Last Name:</label>
                                <input type="text" name="last_name" value={vendorUserData ? vendorUserData.last_name : ''} onChange={handleInputChange} />

                            </div>
                            <div className="form-group flex-form">

                                <label>Email:</label>
                                <input type="email" name="email" value={vendorUserData ? vendorUserData.email : ''} onChange={handleInputChange} />

                            </div>
                            <div className="form-group flex-form">

                                <label>Phone Number:</label>
                                <input type="tel" name="phone" value={vendorUserData ? vendorUserData.phone : ''} onChange={handleInputChange} />

                            </div>
                            <button className="btn-edit" onClick={handleSaveChanges}> Save Changes </button>
                            <button className="btn-edit" onClick={handleEditToggle}> Cancel </button>
                        </>
                    ) : (
                        <>
                            <p> <strong>Name:&emsp;</strong> {vendorUserData ? `${vendorUserData.first_name} ${vendorUserData.last_name}` : ' Loading...'} </p>
                            <p> <strong>Email:&emsp;</strong> {vendorUserData ? vendorUserData.email : ' Loading...'} </p>
                            <p> <strong>Phone:&emsp;</strong> {vendorUserData ? vendorUserData.phone : ' Loading...'} </p>
                            <button className="btn-edit" onClick={handleEditToggle}> Edit </button>
                        </>
                    )}
                </div>

                <br />

                {/* Vendor Updates */}
                <div>
                <h2 className="title">Vendor Information</h2>
                <div className="bounding-box">

                    {/* New Vendor User*/}
                    {!vendorData?.id ? (
                        <>
                            <h3>Create New Vendor</h3>
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

                            {vendorUserData?.is_admin && (
                                <>
                                    <button className="btn-edit" onClick={handleSaveNewVendor}>Create Vendor</button>
                                    <button className="btn-edit" onClick={() => setNewVendor(false)}>Cancel</button>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            {vendorEditMode ? (
                                <>
                                    <div className="form-group">
                                        <label>Vendor Name:</label>
                                        <input type="text" name="name" value={vendorData.name} onChange={handleVendorInputChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Product:</label>
                                        <select name="product" value={vendorData.product} onChange={handleVendorInputChange}>
                                            <option value="">Select</option>
                                            {products.map((product, index) => (
                                                <option key={index} value={product}>
                                                    {product}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Based out of:</label>
                                        <input type="text" name="city" value={vendorData.city} onChange={handleVendorInputChange} />
                                        <select className="select-state" name="state" value={vendorData.state} onChange={handleVendorInputChange}>
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
                                    <button className="btn-edit" onClick={handleSaveVendorChanges}>Save Vendor Changes</button>
                                    <button className="btn-edit" onClick={handleVendorEditToggle}>Cancel</button>
                                </>
                            ) : (
                                <>
                                    <div className="flex-start flex-gap">
                                        <div>
                                            <p><strong>Role:&emsp;</strong>{vendorUserData?.is_admin ? 'Admin' : 'Vendor'}</p>
                                            <p><strong>Name:&emsp;</strong>{vendorData.name || 'Loading...'}</p>
                                            <p><strong>Product:&emsp;</strong>{vendorData.product || 'Loading...'}</p>
                                            <p><strong>Based in:&emsp;</strong>{vendorData.city ? `${vendorData.city}, ${vendorData.state}` : 'Loading...'}</p>
                                        </div>
                                        {vendorImageURL && (
                                            <div className="vendor-image">
                                                <img src={vendorImageURL} alt="Vendor" style={{ maxWidth: '100%', height: 'auto' }} />
                                            </div>
                                        )}
                                    </div>
                                    {vendorUserData?.is_admin && (
                                        <button className="btn-edit" onClick={handleVendorEditToggle}>Edit</button>
                                    )}
                                </>
                            )}
                        </>
                    )}
                    </div>
                </div>
            </div>
        </div>
    </div>
);    
}

export default VendorProfile;
