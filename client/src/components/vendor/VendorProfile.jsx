import React, { useState, useEffect } from 'react';
import { useParams, NavLink, Link, Route, Routes, BrowserRouter as Router} from 'react-router-dom';
import { states } from '../../utils/common';
import { formatPhoneNumber } from '../../utils/helpers';
import VendorCreate from './VendorCreate';
import VendorLocations from './VendorLocations';

function VendorProfile () {
    const { id } = useParams();
    const [editMode, setEditMode] = useState(false);
    const [vendorEditMode, setVendorEditMode] = useState(false);
    const [vendorUserData, setVendorUserData] = useState(null);
    const [vendorId, setVendorId] = useState(null);
    const [tempVendorUserData, setTempVendorUserData] = useState(null);
    const [tempVendorData, setTempVendorData] = useState(null);
    const [locations, setLocations] = useState([]);
    const [marketDetails, setMarketDetails] = useState({});
    const [vendorData, setVendorData] = useState(null);
    const [image, setImage] = useState(null)
    const [status, setStatus] = useState('initial')
    const [vendorImageURL, setVendorImageURL] = useState(null);
    const [products, setProducts] = useState([])
    const [productRequest, setProductRequest] = useState('')


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
        const fetchVendorUserData = async () => {
            try {
                const token = localStorage.getItem('vendor_jwt-token');
                const response = await fetch(`http://127.0.0.1:5555/api/vendor-users/${id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json' 
                    }
                });

                const text = await response.text();

                if (response.ok) {
                    try {
                        const data = JSON.parse(text);
                        setVendorUserData({
                            ...data,
                        });
                        setVendorId(data.vendor_id)

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

    const handleInputChange = event => {
        const { name, value } = event.target;
        setTempVendorUserData({
            ...tempVendorUserData,
            [name]: value,
        });
    };

    const handleEditToggle = () => {
        setEditMode(!editMode);
        if (!editMode) {
            setTempVendorUserData({
                first_name: vendorUserData.first_name,
                last_name: vendorUserData.last_name,
                email: vendorUserData.email,
                phone: vendorUserData.phone,
            });
        }
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
            const token = localStorage.getItem('vendor_jwt-token');
            const response = await fetch(`http://127.0.0.1:5555/api/vendor-users/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tempVendorUserData),
            });
            console.log('Request body:', JSON.stringify(tempVendorUserData));
    
            if (response.ok) {
                const updatedData = await response.json();
                setVendorUserData(updatedData);
                setEditMode(false);
            } else {
                console.log('Failed to save changes');
            }
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    };

    useEffect(() => {
        const fetchVendorData = async () => {
            if (!vendorUserData || !vendorUserData.vendor_id) return;
    
            try {
                const response = await fetch(`http://127.0.0.1:5555/api/vendors/${vendorUserData.vendor_id}`);
                if (response.ok) {
                    const data = await response.json();
                    setVendorData(data);
                    if (data.image) {
                        setVendorImageURL(`http://127.0.0.1:5555/api/vendors/${vendorUserData.vendor_id}/image`);
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
        setTempVendorData({
            ...tempVendorData,
            [event.target.name]: event.target.value,
        });
    };

    const handleVendorEditToggle = () => {
        setVendorEditMode(!vendorEditMode);
        if (!vendorEditMode) {
            setTempVendorData({
                name: vendorData.name,
                product: vendorData.product, 
                bio: vendorData.bio,
                city: vendorData.city,
                state: vendorData.state,
                image: vendorData.image
            });
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
            formData.append('type', 'vendor');
            formData.append('vendor_id', id);

            for (const [key, value] of formData.entries()) {
                console.log(`${key}:`, value);
            }
    
            try {
                const result = await fetch('http://127.0.0.1:5555/api/upload', {
                    method: 'POST',
                    body: formData,
                });
    
                console.log('Request Body:', formData);
    
                if (result.ok) {
                    const data = await result.json();
                    uploadedFilename = data.filename;
                    console.log('Image uploaded:', uploadedFilename);
                    setStatus('success');
                    setVendorImageURL(`http://127.0.0.1:5555/api/vendors/${vendorId}/image`);
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
    
        const updatedVendorData = { ...tempVendorData };
        if (uploadedFilename) {
            updatedVendorData.image = uploadedFilename;
        }
    
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/vendors/${vendorId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'type': "vendor"
                },
                body: JSON.stringify(updatedVendorData),
            });
    
            console.log('Request body:', JSON.stringify(updatedVendorData));
    
            if (response.ok) {
                const updatedData = await response.json();
                setVendorData(updatedData);
                setVendorEditMode(false);
                console.log('Vendor data updated successfully:', updatedData);
                window.location.reload()
            } else {
                console.log('Failed to save changes');
                console.log('Response status:', response.status);
                console.log('Response text:', await response.text());
            }
            if (Number(vendorData.product) === 1 && productRequest.trim() !== '') {
                try {
                    const response = await fetch('http://127.0.0.1:5555/api/create-admin-notification', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            vendor_id: vendorId,
                            vendor_user_id: id,
                            message: `${vendorData.name} has requested to for a new Product category: ${productRequest}.`,
                        }),
                    });
                    if (response.ok) {
                        const responseData = await response.json();
                        alert(`Your product request has been sent to the admins for approval, if approved your product will be automatically changed!`);
                    } else {
                        const errorData = await response.json();
                        alert(`Error sending request: ${errorData.message || 'Unknown error'}`);
                    }
                } catch (error) {
                    console.error('Error sending request:', error);
                    alert('An error occurred while sending the request. Please try again later.');
                }
            }
        } catch (error) {
            console.error('Error saving changes:', error);
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
                    'Authorization': `Bearer ${localStorage.getItem('vendor_jwt-token')}`,
                },
                body: JSON.stringify({
                    filename: vendorData.image,
                    type: 'vendor',
                }),
            });
    
            if (response.ok) {
                const result = await response.json();
                console.log('Image deleted response:', result);
    
                // Clear the image from local state
                setVendorData((prevData) => ({
                    ...prevData,
                    image: null,
                }));
    
                setVendorImageURL(null); // Clear the image URL
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

    useEffect(() => {
        if (Array.isArray(locations) && locations.length > 0) {
            const fetchMarketDetails = async () => {
                const promises = locations.map(async marketId => {
                    try {
                        const response = await fetch(`http://127.0.0.1:5555/api/markets/${marketId}`);
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

    const handleProductInputChange = (event) => {
        setProductRequest(event.target.value);
    };


    return(
        <div>
            <div className="tab-content">
                <div>
                    <h2 className='title'>Profile Information </h2>
                    
                    <div className='box-bounding'>
                        {editMode ? (
                            <>
                                <div className='form-group flex-form'>
                                    <label>First Name:</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={tempVendorUserData ? tempVendorUserData.first_name : ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className='form-group flex-form'>
                                    <label>Last Name:</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={tempVendorUserData ? tempVendorUserData.last_name : ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className='form-group flex-form'>
                                    <label>Email:</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={tempVendorUserData ? tempVendorUserData.email : ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className='form-group flex-form'>
                                    <label>Phone Number:</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={tempVendorUserData ? tempVendorUserData.phone : ''}
                                        onChange={handleInputChange}
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
                                            <td className='cell-title'>Name:</td>
                                            <td className='cell-text'>{vendorUserData ? `${vendorUserData.first_name} ${vendorUserData.last_name}` : ' Loading...'}</td>
                                        </tr>
                                        <tr>
                                            <td className='cell-title'>Email:</td>
                                            <td className='cell-text'>{vendorUserData ? vendorUserData.email : ' Loading...'}</td>
                                        </tr>
                                        <tr>
                                            <td className='cell-title'>Phone:</td>
                                            <td className='cell-text'>{vendorUserData ? formatPhoneNumber(vendorUserData.phone) : 'Loading...'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <button className='btn-edit' onClick={handleEditToggle}>Edit</button>
                            </>
                        )}
                    </div>
                    <br />
                    <h2 className='title'>Vendor Information</h2>
                    <div className='box-bounding'>
                        {vendorData?.id ? (
                            vendorEditMode && vendorUserData?.is_admin ? (
                                <>
                                    <div className='form-group'>
                                        <label>Vendor Name:</label>
                                        <input 
                                            type="text"
                                            name="name"
                                            value={tempVendorData ? tempVendorData.name : ''}
                                            onChange={handleVendorInputChange}
                                        />
                                    </div>
                                    <div className='form-group'>
                                        <label>Product:</label>
                                        <select
                                            name="product"
                                            value={tempVendorData ? tempVendorData.product : ''}
                                            onChange={handleVendorInputChange}
                                        >
                                            <option value="">Select</option>
                                            {Array.isArray(products) && products.map((product) => (
                                                <option key={product.id} value={product.id}>
                                                    {product.product}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {Number(tempVendorData?.product) === 1 && (
                                        <div className="form-group">
                                            <label>Other Product:</label>
                                            <input
                                                type="text"
                                                name="new_product"
                                                value={productRequest || ''}
                                                onChange={handleProductInputChange}
                                            />
                                        </div>
                                    )}
                                    <div className='form-group'>
                                        <label>Bio:</label>
                                        <textarea
                                            className='textarea-edit'
                                            type="text"
                                            name="bio"
                                            value={tempVendorData ? tempVendorData.bio : ''}
                                            onChange={handleVendorInputChange}
                                        />
                                    </div>
                                    <div className='form-group'>
                                        <label>Based out of:</label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={tempVendorData ? tempVendorData.city : ''}
                                            onChange={handleVendorInputChange}
                                        />
                                        <select className='select-state'
                                            name="state"
                                            value={tempVendorData ? tempVendorData.state : ''} 
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
                                    <div className='form-group width-100'>
                                        <label>Vendor Image:</label>
                                        {vendorData?.image ? (
                                            <>
                                                <img
                                                    src={`/vendor-images/${vendorData.image}`}
                                                    alt="Vendor"
                                                    // style={{ maxWidth: '100%', height: 'auto' }}
                                                    className='img-vendor-edit'
                                                />
                                                <button className='btn-edit' onClick={handleDeleteImage}>Delete Image</button>
                                            </>
                                        ) : (
                                            <p>No image uploaded.</p>
                                        )}
                                        <input
                                            type="file"
                                            name="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                    <button className='btn-edit' onClick={handleSaveVendorChanges}>Save Changes</button>
                                    <button className='btn-edit' onClick={handleVendorEditToggle}>Cancel</button>
                                </>
                            ) : (
                                    <>
                                        <div className='flex-start flex-gap-48'>
                                            <table>
                                                <tbody>
                                                    <tr>
                                                        <td className='cell-title'>Role:</td>
                                                        <td className='cell-text'>{vendorUserData?.is_admin ? 'Admin' : 'Vendor'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className='cell-title'>Name:</td>
                                                        <td className='cell-text'>{vendorData ? vendorData.name : ' Loading...'}</td>
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
                                                        <td className='cell-text'>{vendorData ? vendorData.bio : ' Loading...'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className='cell-title'>Based in:</td>
                                                        <td className='cell-text'>{vendorData ? `${vendorData.city}, ${vendorData.state}` : ' Loading...'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className='cell-title'>Image:</td>
                                                        <td className='cell-text'>{vendorData ? <img src={`/vendor-images/${vendorData.image}`} alt="Vendor" style={{ maxWidth: '100%', height: 'auto' }} /> : ''}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        {vendorUserData?.is_admin && (    
                                            <div className='flex-start'>
                                                <button className='btn-edit' onClick={handleVendorEditToggle}>Edit</button>
                                            <div>
                                                <div className={status === 'success' ? 'alert-favorites' : 'alert-favorites-hidden'}>
                                                    Success Uploading Image
                                                </div>
                                                <div className={status === 'fail' ? 'alert-favorites alert-fail' : 'alert-favorites-hidden'}>
                                                    Uploading Image Failed
                                                </div>
                                                <div className={status === 'Uploading' ? 'alert-favorites' : 'alert-favorites-hidden'}>
                                                    Uploading Image
                                                </div>
                                            </div>
                                        </div>
                                        )}
                                        <VendorLocations vendorId={vendorId} vendorUserData={vendorUserData} />

                                        {/* <p><strong>Locations:&emsp;</strong></p>
                                        {Array.isArray(locations) && locations.length > 0 ? (
                                            locations.map((marketId, index) => (
                                                <div key={index} style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
                                                    <Link to={`/user/markets/${marketId}`}> {marketDetails[marketId] || 'Loading...'} </Link>
                                                </div>
                                            ))
                                        ) : (
                                            <p>No market locations at this time</p>
                                        )} */}
                                    </>
                                )
                            ) : (
                            <VendorCreate />
                            )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default VendorProfile;