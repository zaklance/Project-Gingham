import React, { useEffect, useState } from 'react';

function AdminVendorEdit({ vendors }) {
    const [query, setQuery] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [vendorData, setVendorData] = useState(null);

    const products = [
        'Art', 'Baked Goods', 'Cheese', 'Cider', 'Ceramics', 
        'Coffee/Tea','Fish', 'Flowers', 'Fruit', 'Gifts', 'Honey',
        'International', 'Juice', 'Maple Syrup', 'Meats', 'Mushrooms', 
        'Nuts', 'Pasta', 'Pickles', 'Spirits', 'Vegetables'
    ];

    const states = [
        "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
        "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
        "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
        "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
        "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
    ];


    const onUpdateQuery = event => setQuery(event.target.value);
    const filteredVendors = vendors.filter(vendor => vendor.name.toLowerCase().includes(query.toLowerCase()) && vendor.name !== query)
    const matchingVendor = vendors.find(vendor => vendor.name.toLowerCase() === query.toLowerCase());
    const matchingVendorId = matchingVendor ? matchingVendor.id : null;

    useEffect(() => {
        if (!matchingVendorId) return
        const fetchVendorData = async () => {
            try {
                const token = sessionStorage.getItem('jwt-token');
                // console.log('JWT Token:', token);
                const response = await fetch(`http://127.0.0.1:5555/api/vendors/${matchingVendorId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Fetched admin market data:', data);
                    setVendorData(data);
                } else {
                    console.error('Error fetching profile:', response.status);
                    if (response.status === 401) {
                        console.error('Unauthorized: Token may be missing or invalid');
                    }
                }
            } catch (error) {
                console.error('Error fetching vendor data:', error);
            }
        };
        fetchVendorData();
    }, [matchingVendorId]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setVendorData({
            ...vendorData,
            [name]: value
        });
    };

    const handleEditToggle = () => {
        setEditMode(!editMode);
    };

    const handleSaveChanges = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/vendors/${matchingVendorId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(vendorData),

            });
            console.log('Request body:', JSON.stringify(vendorData));

            if (response.ok) {
                const updatedData = await response.json();
                setVendorData(updatedData);
                setEditMode(false);
                console.log('Market data updated successful:', updatedData);
                window.location.reload();
            } else {
                console.log('Failed to save changes');
                console.log('Response status;', response.status);
                console.log('Response text:', await response.text());
            }
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    };

    const handleFileChange = (event) => {
        if (event.target.files) {
            setStatus('initial');
            setImage(event.target.files[0]);
        }
    }


    return (
        <>
            <div className='box-bounding'>
                <h2>Edit Vendors</h2>
                <table className='margin-t-16'>
                    <tbody>
                        <tr>
                            <td className='cell-title'>Search:</td>
                            <td className='cell-text'>
                                <input id='search' className="search-bar" type="text" placeholder="Search vendors..." value={query} onChange={onUpdateQuery} />
                                <div className="dropdown-content">
                                    {
                                        query &&
                                        filteredVendors.slice(0, 10).map(item => <div className="search-results" key={item.id} onClick={(e) => setQuery(item.name)}>
                                            {item.name}
                                        </div>)
                                    }
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div>
                    {editMode ? (
                        <>
                            <div className='form-group'>
                                <label>Vendor Name:</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={vendorData ? vendorData.name : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label>City:</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={vendorData ? vendorData.city : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label>State:</label>
                                <select
                                    name="product"
                                    value={vendorData ? vendorData.state : ''}
                                    onChange={handleInputChange}
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
                                <label>Product:</label>
                                <select
                                    name="product"
                                    value={vendorData ? vendorData.product : ''}
                                    onChange={handleInputChange}
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
                                <label>Bio:</label>
                                <textarea
                                    className='textarea-edit'
                                    type="text"
                                    name="coordinates_lng"
                                    value={vendorData ? vendorData.bio : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label>Vendor Image:</label>
                                <input
                                    type="file"
                                    name="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                            <button className='btn-edit' onClick={handleSaveChanges}>Save Changes</button>
                            <button className='btn-edit' onClick={handleEditToggle}>Cancel</button>
                        </>
                    ) : (
                        <>
                            <table>
                                <tbody>
                                    <tr>
                                        <td className='cell-title'>Image:</td>
                                        <td className='cell-text'>{vendorData ? <img className='img-market' src={`/vendor-images/${vendorData.image}`} alt="Market Image" /> : ''}</td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title'>Name:</td>
                                        <td className='cell-text'>{vendorData ? `${vendorData.name}` : ''}</td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title'>City:</td>
                                        <td className='cell-text'>{vendorData ? vendorData.city : ''}</td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title'>State:</td>
                                        <td className='cell-text'>{vendorData ? vendorData.state : ''}</td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title'>Product:</td>
                                        <td className='cell-text'>{vendorData ? vendorData.product : ''}</td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title'>Bio:</td>
                                        <td className='cell-text'>{vendorData ? vendorData.bio : ''}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <button className='btn-edit' onClick={handleEditToggle}>Edit</button>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}

export default AdminVendorEdit;