import React, { useState, useEffect } from 'react';
import { useParams, NavLink, Link, Route, Routes, BrowserRouter as Router} from 'react-router-dom';

function VendorProfile () {
    const { id } = useParams();
    const [editMode, setEditMode] = useState(false);
    const [vendorEditMode, setVendorEditMode] = useState(false);
    const [vendorUserData, setVendorUserData] = useState(null);
    const [locations, setLocations] = useState([]);
    const [marketDetails, setMarketDetails] = useState({});
    const [vendorData, setVendorData] = useState(null);
    const [image, setImage] = useState(null)
    const [status, setStatus] = useState('initial')

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
                const response = await fetch(`http://127.0.0.1:5555/vendor_users/${id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json' 
                    }
                });

                const text = await response.text();
                // console.log('Raw response:', text);

                if (response.ok) {
                    try {
                        const data = JSON.parse(text);
                        setVendorUserData({
                            ...data,
                        });
                    } catch (jsonError) {
                        console.error('Error parsing JSON:', jsonError);
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
            const response = await fetch(`http://127.0.0.1:5555/vendor_users/${id}`, {
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
        fetch(`http://127.0.0.1:5555/vendors/${id}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                setVendorData(data);
                const parsedLocations = JSON.parse(data.locations);
                setLocations(parsedLocations);
            })
            .catch(error => console.error('Error fetching vendor data:', error));
    }, [id]);

    const handleVendorInputChange = (event) => {
        setVendorData({
            ...vendorData,
            [event.target.name]: event.target.value,
        });
    };

    const handleVendorEditToggle = () => {
        setVendorEditMode(!vendorEditMode);
    };

    const handleSaveVendorChanges = async () => {
        if (image) {
            console.log('Uploading file...');
            setStatus('uploading');
            const formData = new FormData();
            formData.append('file', image);
            
            try {
                const result = await fetch('https://127.0.0.1:5555/images', {
                    method: 'POST',
                    body: formData,
                });
                const data = await result.json();
                console.log(data);
                setStatus('success');
            } catch (error) {
                console.error(error);
                setStatus('fail');
            }
        }
        try {
            const response = await fetch(`http://127.0.0.1:5555/vendors/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(vendorData)
            });
            console.log('Request body:', JSON.stringify(vendorData));

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

    return(
        <div>
            <div className="tab-content">
                <div>
                    <h2 className='title'>Profile Information</h2>
                    <div className='bounding-box'>
                        {editMode ? (
                            <>
                                <div className='form-group flex-form'>
                                    <label>First Name:</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={vendorUserData ? vendorUserData.first_name : ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className='form-group flex-form'>
                                    <label>Last Name:</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={vendorUserData ? vendorUserData.last_name : ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className='form-group flex-form'>
                                    <label>Email:</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={vendorUserData ? vendorUserData.email : ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className='form-group flex-form'>
                                    <label>Phone Number:</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={vendorUserData ? vendorUserData.phone : ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <button className='btn-edit' onClick={handleSaveChanges}>Save Changes</button>
                                <button className='btn-edit' onClick={handleEditToggle}>Cancel</button>
                            </>
                        ) : (
                            <>
                                <p><strong>Name:&emsp;</strong> {vendorUserData ? `${vendorUserData.first_name} ${vendorUserData.last_name}` : ' Loading...'}</p>
                                <p><strong>Email:&emsp;</strong> {vendorUserData ? vendorUserData.email : ' Loading...'}</p>
                                <p><strong>Phone:&emsp;</strong> {vendorUserData ? vendorUserData.phone : ' Loading...'}</p>
                                <button className='btn-edit' onClick={handleEditToggle}>Edit</button>
                            </>
                        )}
                    </div>
                    <br />
                    <h2 className='title'>Vendor Information</h2>
                    <div className='bounding-box'>
                        {vendorData?.id ? (
                            vendorEditMode ? (
                                <>
                                    <div className='form-group'>
                                        <label>Vendor Name:</label>
                                        <input 
                                            type="text"
                                            name="name"
                                            value={vendorData ? vendorData.name : ''}
                                            onChange={handleVendorInputChange}
                                        />
                                    </div>
                                    <div className='form-group'>
                                        <label>Product:</label>
                                        <select
                                            name="product"
                                            value={vendorData ? vendorData.product : ''}
                                            onChange={handleVendorInputChange}
                                        >
                                            <option value="">Select</option>
                                            {products.map((product, index) => (
                                                <option key={index} value={product}>
                                                    {product}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className='form-group'>
                                        <label>Based out of:</label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={vendorData ? vendorData.city : ''}
                                            onChange={handleVendorInputChange}
                                        />
                                        <select className='select-state'
                                            name="state"
                                            value={vendorData ? vendorData.state : ''} 
                                            onChange={handleVendorInputChange}
                                        >
                                            <option value="">Select</option>
                                            {states.map((state, index) => (
                                                <option key={index} value={state}>
                                                    {state}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className='form-group'>
                                        <label>Vendor Image:</label>
                                        <input
                                            type="file"
                                            name="file"
                                            accept="image/*"
                                        // value={vendorData ? vendorData.image : ''}
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                    <button className='btn-edit' onClick={handleSaveVendorChanges}>Save Changes</button>
                                    <button className='btn-edit' onClick={handleVendorEditToggle}>Cancel</button>
                                </>
                            ) : (
                                <>
                                    <p><strong>Role:&emsp;</strong>Admin</p>
                                    <br/>
                                    <p><strong>Name:&emsp;</strong> {vendorData ? vendorData.name : ' Loading...'}</p>
                                    <p><strong>Product:&emsp;</strong> {vendorData ? vendorData.product : ' Loading...'}</p>
                                    <p><strong>Based in:&emsp;</strong> {vendorData ? `${vendorData.city}, ${vendorData.state}` : ' Loading...'}</p>
                                    <div className='flex-start'>
                                        <button className='btn-edit' onClick={handleVendorEditToggle}>Edit</button>
                                        <div>
                                            <div className={status === 'success' ? 'favorites-alert' : 'favorites-alert-hidden'}>
                                                Success Uploading Image
                                            </div>
                                            <div className={status === 'fail' ? 'favorites-alert alert-fail' : 'favorites-alert-hidden'}>
                                                Uploading Image Failed
                                            </div>
                                            <div className={status === 'Uploading' ? 'favorites-alert' : 'favorites-alert-hidden'}>
                                                Uploading Image
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <p><strong>Locations:&emsp;</strong></p>
                                    {Array.isArray(locations) && locations.length > 0 ? (
                                        locations.map((marketId, index) => (
                                            <div key={index} style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
                                                <Link to={`/user/markets/${marketId}`}> {marketDetails[marketId] || 'Loading...'} </Link>
                                            </div>
                                        ))
                                    ) : (
                                        <p>No market locations at this time</p>
                                    )}
                                </>
                            )
                        ) : (
                            <p>Loading vendor details...</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default VendorProfile;
