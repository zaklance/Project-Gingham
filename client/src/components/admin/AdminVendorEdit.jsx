import React, { useEffect, useState } from 'react';
import { states } from '../../utils/common';

function AdminVendorEdit({ vendors }) {
    const [query, setQuery] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [vendorData, setVendorData] = useState(null);
    const [tempVendorData, setTempVendorData] = useState(null);
    const [image, setImage] = useState(null);
    const [status, setStatus] = useState('initial');
    const [products, setProducts] = useState([])

    const onUpdateQuery = event => setQuery(event.target.value);
    const filteredVendors = vendors.filter(vendor => vendor.name.toLowerCase().includes(query.toLowerCase()) && vendor.name !== query)
    const matchingVendor = vendors.find(vendor => vendor.name.toLowerCase() === query.toLowerCase());
    const matchingVendorId = matchingVendor ? matchingVendor.id : null;


    useEffect(() => {
        fetch("http://127.0.0.1:5555/api/products")
            .then(response => response.json())
            .then(data => {
                const sortedProducts = data.sort((a, b) => {
                    if (a.product === "Other") return 1;
                    if (b.product === "Other") return -1;
                    return a.product.localeCompare(b.product);
                });
                setProducts(sortedProducts);
            });
    }, []);

    useEffect(() => {
        if (location.state?.selectedProduct) {
            setSelectedProduct(location.state.selectedProduct);
        }
    })

    useEffect(() => {
        if (!matchingVendorId) return
        const fetchVendorData = async () => {
            try {
                const token = localStorage.getItem('admin_jwt-token');
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
                    // console.log('Fetched admin market data:', data);
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

    const handleImageUpload = async (vendorId) => {
        if (!image) return;
    
        const formData = new FormData();
        formData.append('file', image);
        formData.append('type', 'vendor');
        formData.append('vendor_id', vendorId);
    
        try {
            const response = await fetch('http://127.0.0.1:5555/api/upload', {
                method: 'POST',
                body: formData,
            });
    
            if (response.ok) {
                const data = await response.json();
                setVendorData((prevData) => ({
                    ...prevData,
                    image: data.filename,
                }));
                setStatus('success');
            } else {
                setStatus('fail');
                console.error('Failed to upload image:', await response.text());
            }
        } catch (error) {
            setStatus('fail');
            console.error('Error uploading image:', error);
        }
    };

    const handleDeleteImage = async () => {
        if (!vendorData || !vendorData.image) {
            alert('No image to delete.');
            return;
        }
    
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/delete-image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_jwt-token')}`,
                },
                body: JSON.stringify({
                    filename: vendorData.image,
                    type: 'vendor',
                }),
            });
    
            if (response.ok) {
                const result = await response.json();
                console.log('Image deleted response:', result);
    
                setVendorData((prevData) => ({
                    ...prevData,
                    image: null, 
                }));
    
                alert('Image deleted successfully.');
            } else {
                const errorText = await response.text();
                console.error('Failed to delete image:', errorText);
                alert('Failed to delete the image. Please try again.');
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            alert('An unexpected error occurred while deleting the image.');
        }
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setTempVendorData({
            ...tempVendorData,
            [name]: value
        });
    };

    const handleEditToggle = () => {
        if (!editMode) {
            setTempVendorData({
                ...vendorData,
            });
        } else {
            setTempVendorData(null);
        }
        setEditMode(!editMode);
    };

    const handleSaveChanges = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/vendors/${matchingVendorId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tempVendorData),
            });
    
            if (response.ok) {
                const updatedData = await response.json();
                setVendorData(updatedData);
                setEditMode(false);
                alert('Vendor details updated successfully.');
    
                if (image) {
                    await handleImageUpload(matchingVendorId);
                }
            } else {
                console.error('Failed to save vendor details:', await response.text());
            }
        } catch (error) {
            console.error('Error saving vendor details:', error);
        }
    };

    const handleFileChange = (event) => {
        if (event.target.files) {
            setImage(event.target.files[0]);
            setStatus('initial');
        }
    };
;

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
                                    value={tempVendorData ? tempVendorData.name : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label>City:</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={tempVendorData ? tempVendorData.city : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label>State:</label>
                                <select
                                    name="state"
                                    value={tempVendorData ? tempVendorData.state : ''}
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
                                    value={tempVendorData ? tempVendorData.product : ''}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select</option>
                                    {Array.isArray(products) && products.map((product) => (
                                        <option key={product.id} value={product.id}>
                                            {product.product}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className='form-group'>
                                <label>Bio:</label>
                                <textarea
                                    className='textarea-edit'
                                    type="text"
                                    name="bio"
                                    value={tempVendorData ? tempVendorData.bio : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label>Vendor Image:</label>
                                {vendorData ? (
                                    <div>
                                        <img
                                            className='img-market'
                                            src={`/vendor-images/${vendorData.image}`}
                                            alt="Vendor Image"
                                        />
                                    </div>
                                ) : ''}
                                <div className='flex-start flex-center-align'>
                                    <div className='margin-l-8'>
                                        <button className='btn btn-small' onClick={handleDeleteImage} > Delete Image </button>
                                    </div>
                                    <label for='file-upload' className='btn btn-small btn-file nowrap'>Choose File <span className='text-white-background'>{image?.name}</span></label>
                                </div>
                                <input
                                    id="file-upload"
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
                                    <td className='cell-text'>
                                    </td>
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
                                        <td className='cell-text'>
                                            {vendorData?.product
                                                ? products.find(product => Number(product.id) === Number(vendorData.product))?.product || 'Unknown Product'
                                                : ''}
                                        </td>
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