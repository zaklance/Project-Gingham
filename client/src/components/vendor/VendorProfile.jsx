import React, { useState, useEffect } from 'react';
import { useParams, NavLink, Link, Route, Routes, BrowserRouter as Router} from 'react-router-dom';
import { vendors_default, states, weekDay } from '../../utils/common';
import { formatPhoneNumber } from '../../utils/helpers';
import PasswordStrengthBar from 'react-password-strength-bar';
import PasswordChecklist from "react-password-checklist"
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import VendorCreate from './VendorCreate';
import VendorLocations from './VendorLocations';
import VendorTeamRequest from './VendorTeamRequest';
import VendorActiveVendor from './VendorActiveVendor';
import VendorTeamLeave from './VendorTeamLeave';

function VendorProfile () {
    const { id } = useParams();
    const [editMode, setEditMode] = useState(false);
    const [settingsMode, setSettingsMode] = useState(false);
    const [emailMode, setEmailMode] = useState(false);
    const [passwordMode, setPasswordMode] = useState(false);
    const [vendorEditMode, setVendorEditMode] = useState(false);
    const [vendorUserData, setVendorUserData] = useState(null);
    const [vendorId, setVendorId] = useState(null);
    const [tempVendorUserData, setTempVendorUserData] = useState(null);
    const [tempVendorData, setTempVendorData] = useState(null);
    const [vendorSettings, setVendorSettings] = useState(null);
    const [tempVendorUserSettings, setTempVendorUserSettings] = useState(null);
    const [locations, setLocations] = useState([]);
    const [marketDetails, setMarketDetails] = useState({});
    const [vendorData, setVendorData] = useState(null);
    const [image, setImage] = useState(null)
    const [status, setStatus] = useState('initial')
    const [vendorImageURL, setVendorImageURL] = useState(null);
    const [products, setProducts] = useState([])
    const [newProduct, setNewProduct] = useState(null);
    const [productRequest, setProductRequest] = useState('')
    const [activeTab, setActiveTab] = useState('website');
    const [changeEmail, setChangeEmail] = useState();
    const [changeConfirmEmail, setChangeConfirmEmail] = useState();
    const [password, setPassword] = useState('');
    const [changePassword, setChangePassword] = useState('');
    const [changeConfirmPassword, setChangeConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState({ pw1: false, pw2:false, pw3: false });
    const [isValid, setIsValid] = useState(false);

    const [allVendorMarkets, setAllVendorMarkets] = useState([]);
    const [allMarketDays, setAllMarketDays] = useState([]);
    const [allMarkets, setAllMarkets] = useState([]);
    const [filteredMarketDays, setFilteredMarketDays] = useState([]);
    const [filteredMarkets, setFilteredMarkets] = useState([]);
    const [newMarketDay, setNewMarketDay] = useState(null);
    
    const vendorUserId = parseInt(globalThis.localStorage.getItem('vendor_user_id'))
    const token = localStorage.getItem('vendor_jwt-token');


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
                        setVendorId(data.vendor_id[data.active_vendor])
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

    useEffect(() => {
        const fetchVendorUserSettings = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:5555/api/settings-vendor-users?vendor_user_id=${id}`, {
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
                        setVendorSettings({ ...data });
                    } catch (jsonError) {
                        console.error('Error parsing JSON:', jsonError);
                    }
                } else {
                    console.error('Error fetching user settings:', response.status);
                }
            } catch (error) {
                console.error('Error fetching user settings data:', error);
            }
        };
        fetchVendorUserSettings();
    }, [id]);

    useEffect(() => {
        if (vendorId=== null) {
            return
        }
        fetch(`http://127.0.0.1:5555/api/vendor-markets?vendor_id=${vendorId}`)
            .then(response => response.json())
            .then(data => {
                setAllVendorMarkets(data)
            })
            .catch(error => console.error('Error fetching market locations:', error));
    }, [vendorId]);

    const handleSaveEmail = async () => {
        if (changeEmail !== changeConfirmEmail) {
            alert("Emails do not match.");
            return;
        }
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/users/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: changeEmail
                })
            });
            if (response.ok) {
                const updatedData = await response.json();
                setChangeEmail('')
                setChangeConfirmEmail('')
                setEmailMode(false);
                alert('Email will not update until you check your email and click the verify link.')
            } else {
                console.log('Failed to save changes');
                console.log('Response status:', response.status);
                console.log('Response text:', await response.text());
            }
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    };

    const handleSavePassword = async () => {
        if (changePassword !== changeConfirmPassword) {
            alert("Passwords do not match.");
            return;
        }
        if (!isValid) {
            alert("Password does not meet requirements.");
            return;
        }
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/users/${id}/password`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    old_password: password,
                    new_password: changePassword
                }),
                credentials: 'include',
            });
            if (response.ok) {
                const updatedData = await response.json();
                setPassword('')
                setChangePassword('')
                setChangeConfirmPassword('')
                setPasswordMode(false);
                alert('Password changed')
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
            fetch("http://127.0.0.1:5555/api/market-days", {
                method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    const filteredData = data.filter(item =>
                        allVendorMarkets.some(vendorMarket => vendorMarket.market_day_id === item.id)
                    );
                    setAllMarketDays(data)
                    setFilteredMarketDays(filteredData)
                })
                .catch(error => console.error('Error fetching market days', error));
        }, [allVendorMarkets]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch("http://127.0.0.1:5555/api/markets?is_visible=true");
                const data = await response.json();
                setAllMarkets(data);
                if (filteredMarketDays.length > 0) {
                    const filteredData = data.filter(item =>
                        filteredMarketDays.some(vendorMarket => vendorMarket.market_id === item.id)
                    );
                    setFilteredMarkets(filteredData);
                }
            } catch (error) {
                console.error("Error fetching markets:", error);
            }
        };
        fetchData();
    }, [filteredMarketDays, allMarketDays]);

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
                const response = await fetch(`http://127.0.0.1:5555/api/vendors/${vendorUserData.vendor_id[vendorUserData.active_vendor]}`);
                if (response.ok) {
                    const data = await response.json();
                    setVendorData(data);
                    if (data.image) {
                        setVendorImageURL(`http://127.0.0.1:5555/api/vendors/${vendorUserData.vendor_id[vendorUserData.active_vendor]}/image`);
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
                products: vendorData.products, 
                bio: vendorData.bio,
                city: vendorData.city,
                state: vendorData.state,
                image: vendorData.image,
                image_default: vendorData.image_default
            });
        }
    };

    const handleSaveVendorChanges = async () => {
        let uploadedFilename = null;
    
        if (image) {
            const maxFileSize = 25 * 1024 * 1024;
            if (image.size > maxFileSize) {
                alert("File size exceeds 25 MB. Please upload a smaller file.");
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
                    setVendorImageURL(`${vendorData.id}/${uploadedFilename}`);
    
                    window.location.reload();
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
            updatedVendorData.image = `${vendorData.id}/${uploadedFilename}`;
            tempVendorData.image = `${vendorData.id}/${uploadedFilename}`;
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
                // window.location.reload()
            } else {
                console.log('Failed to save changes');
                console.log('Response status:', response.status);
                console.log('Response text:', await response.text());
            }
            if (tempVendorData.products.includes(1) && productRequest.trim() !== '') {
                try {
                    const response = await fetch('http://127.0.0.1:5555/api/create-admin-notification', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            vendor_id: vendorId,
                            vendor_user_id: id,
                            link: '/admin/vendors?tab=products',
                            subject: 'product-request',
                            message: `${vendorData.name} has requested to for a new Product category: ${productRequest}.`,
                        }),
                    });
                    if (response.ok) {
                        const responseData = await response.json();
                        setProductRequest('')
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

    const handleSaveSettings = async () => {
        const token = localStorage.getItem('vendor_jwt-token');
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/settings-vendor-users/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tempVendorUserSettings)
            });
            if (response.ok) {
                const updatedData = await response.json();
                setVendorSettings(updatedData);
                setSettingsMode(false);
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
    
    const handleDeleteProductImage = async () => {
        if (!vendorData || !vendorData.image) {
            console.log("Vendor Image URL:", vendorImageURL);
            alert('No image to delete.');
            return;
        }
    
        try {
            console.log('Attempting to delete image:', vendorData.image);
    
            const response = await fetch(`http://127.0.0.1:5555/api/delete-image`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('vendor_jwt-token')}`,
                },
                body: JSON.stringify({
                    filename: vendorData.image, 
                    type: 'vendor',
                    vendor_id: vendorData.id,
                }),
            });
    
            if (response.ok) {
                const result = await response.json();
                console.log('Image deleted response:', result);
    
                setVendorData((prevData) => ({
                    ...prevData,
                    image: null,
                }));
    
                setVendorImageURL(null);
                alert('Image deleted successfully.');
            } else {
                const errorText = await response.text();
                console.error('Failed to delete image:', errorText);
                alert(`Failed to delete the image`);
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

    const handleDeleteProduct = (productId) => {
        setTempVendorData((prev) => ({
            ...prev,
            products: prev.products.filter((id) => id !== productId),
        }));
    };

    const handleDeleteMarketDay = (marketDayId) => {
        setTempVendorUserSettings((prev) => ({
            ...prev,
            market_locations: prev.market_locations.filter((id) => id !== marketDayId),
        }));
    };

    const handleAddProduct = (newProductId) => {
        setTempVendorData((prev) => ({
            ...prev,
            products: (prev.products || []).includes(Number(newProductId))
                ? prev.products
                : [...(prev.products || []), Number(newProductId)],
        }));
    };

    const handleMarketDaySelect = (event) => {
        setNewMarketDay(event.target.value)
    }

    const handleAddMarket = (newProductId) => {
        setTempVendorUserSettings((prev) => ({
            ...prev,
            market_locations: (prev.market_locations || []).includes(Number(newProductId))
                ? prev.market_locations
                : [...(prev.market_locations || []), Number(newProductId)],
        }));
    };

    const handleSettingsToggle = () => {
        if (!settingsMode) {
            setTempVendorUserSettings({ ...vendorSettings });
        } else {
            setTempVendorUserSettings(null);
        }
        setSettingsMode(!settingsMode);
    };

    const handleEmailToggle = () => {
        if (emailMode === false) {
            setPasswordMode(false)
        }
        setEmailMode(!emailMode);
    };

    const handlePasswordToggle = () => {
        if (passwordMode === false) {
            setEmailMode(false)
        }
        setPasswordMode(!passwordMode);
    };

    const togglePasswordVisibility = (field) => {
        setShowPassword((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
        setTimeout(() => {
            setShowPassword(prev => ({ ...prev, [field]: false }));
        }, 8000);
    };

    const handleSwitchChange = (field) => {
        setTempVendorUserSettings({
            ...tempVendorUserSettings,
            [field]: !tempVendorUserSettings[field]
        });
    };


    return(
        <>
            <div className="tab-content">
                <div>
                    <div className='box-bounding badge-container'>
                        <i className='icon-settings' onClick={handleSettingsToggle}>&emsp;</i>
                        {!settingsMode ? (
                            <>
                                <h2 className='margin-b-16'>Profile Information </h2>
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
                                        <button className='btn-edit' onClick={handleEmailToggle}>Change Email</button>
                                        <button className='btn-edit' onClick={handlePasswordToggle}>Change Password</button>
                                        {passwordMode ? (
                                            <div className='width-min'>
                                                <h3 className='margin-b-8 margin-t-8'>Change Password</h3>
                                                <div className="form-group form-group-password">
                                                    <label>Old Password: </label>
                                                    <div className='badge-container-strict'>
                                                        <input
                                                            type={showPassword.pw1 ? 'text' : 'password'}
                                                            value={password}
                                                            placeholder="enter your current password"
                                                            onChange={(event) => setPassword(event.target.value)}
                                                            required
                                                        />
                                                        <i className={showPassword.pw1 ? 'icon-eye-alt' : 'icon-eye'} onClick={() => togglePasswordVisibility('pw1')}>&emsp;</i>
                                                    </div>
                                                </div>
                                                <div className="form-group form-group-password">
                                                    <label>New Password: </label>
                                                    <div className='badge-container-strict'>
                                                        <input
                                                            type={showPassword.pw2 ? 'text' : 'password'}
                                                            value={changePassword}
                                                            placeholder="enter your new password"
                                                            onChange={(event) => setChangePassword(event.target.value)}
                                                            required
                                                        />
                                                        <i className={showPassword.pw2 ? 'icon-eye-alt' : 'icon-eye'} onClick={() => togglePasswordVisibility('pw2')}>&emsp;</i>
                                                    </div>
                                                </div>
                                                <div className="form-group form-group-password">
                                                    <label></label>
                                                    <div className='badge-container-strict'>
                                                        <input
                                                            type={showPassword.pw3 ? 'text' : 'password'}
                                                            value={changeConfirmPassword}
                                                            placeholder="re-enter your new password"
                                                            onChange={(event) => setChangeConfirmPassword(event.target.value)}
                                                            required
                                                        />
                                                        <i className={showPassword.pw3 ? 'icon-eye-alt' : 'icon-eye'} onClick={() => togglePasswordVisibility('pw3')}>&emsp;</i>
                                                        <PasswordChecklist
                                                            className='password-checklist'
                                                            style={{ padding: '0 8px' }}
                                                            rules={["minLength", "specialChar", "number", "capital", "match"]}
                                                            minLength={5}
                                                            value={changePassword}
                                                            valueAgain={changeConfirmPassword}
                                                            onChange={(isValid) => { setIsValid(isValid) }}
                                                            iconSize={14}
                                                            validColor='#00bda4'
                                                            invalidColor='#ff4b5a'
                                                        />
                                                        <PasswordStrengthBar className='password-bar' minLength={5} password={changePassword} />
                                                    </div>
                                                </div>
                                                <button className='btn-edit' onClick={handleSavePassword}>Save Changes</button>
                                                <button className='btn-edit' onClick={handlePasswordToggle}>Cancel</button>
                                            </div>
                                        ) : (
                                            null
                                        )}
                                        {emailMode ? (
                                            <div>
                                                <h3 className='margin-b-8 margin-t-8'>Change Email</h3>
                                                <div className="form-group">
                                                    <label>Email: </label>
                                                    <input
                                                        type="email"
                                                        value={changeEmail}
                                                        placeholder="enter your email"
                                                        onChange={(event) => setChangeEmail(event.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label></label>
                                                    <input
                                                        type="email"
                                                        value={changeConfirmEmail}
                                                        placeholder="re-enter your email"
                                                        onChange={(event) => setChangeConfirmEmail(event.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <button className='btn-edit' onClick={handleSaveEmail}>Save Changes</button>
                                                <button className='btn-edit' onClick={handleEmailToggle}>Cancel</button>
                                            </div>
                                        ) : (
                                            null
                                        )}
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <div className='flex-start flex-center-align flex-gap-24 m-flex-wrap'>
                                    <h2 className='margin-b-16'>Settings</h2>
                                    <div className='tabs margin-t-20'>                
                                        <Link to="#" onClick={() => setActiveTab('website')} className={activeTab === 'website' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                                            Website
                                        </Link>
                                        <Link to="#" onClick={() => setActiveTab('email')} className={activeTab === 'email' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                                            Email
                                        </Link>
                                        <Link to="#" onClick={() => setActiveTab('text')} className={activeTab === 'text' ? 'active-tab btn btn-reset btn-tab' : 'btn btn-reset btn-tab'}>
                                            Text
                                        </Link>
                                    </div>
                                </div>
                                <h3>Notifications</h3>
                                {activeTab === 'website' && (
                                    <FormGroup>
                                        <FormControlLabel control={<Switch checked={tempVendorUserSettings.site_market_new_event} onChange={() => handleSwitchChange('site_market_new_event')} color={'secondary'} />} label="Market creates an event"/>
                                        <FormControlLabel control={<Switch checked={tempVendorUserSettings.site_market_schedule_change} onChange={() => handleSwitchChange('site_market_schedule_change')} color={'secondary'} />} label="Market changes schedule"/>
                                        <FormControlLabel control={<Switch checked={tempVendorUserSettings.site_basket_sold} onChange={() => handleSwitchChange('site_basket_sold')} color={'secondary'} />} label="When a basket is sold"/>
                                    </FormGroup>
                                )}
                                {activeTab === 'email' && (
                                    <FormGroup>
                                        <FormControlLabel control={<Switch checked={tempVendorUserSettings.email_market_new_event} onChange={() => handleSwitchChange('email_market_new_event')} color={'secondary'} />} label="Market creates an event" />
                                        <FormControlLabel control={<Switch checked={tempVendorUserSettings.email_market_schedule_change} onChange={() => handleSwitchChange('email_market_schedule_change')} color={'secondary'} />} label="Market changes schedule" />
                                        <FormControlLabel control={<Switch checked={tempVendorUserSettings.email_basket_sold} onChange={() => handleSwitchChange('email_basket_sold')} color={'secondary'} />} label="When a basket is sold" />
                                    </FormGroup>
                                )}
                                {activeTab === 'text' && (
                                    <FormGroup>
                                        <FormControlLabel control={<Switch checked={tempVendorUserSettings.text_market_schedule_change} onChange={() => handleSwitchChange('text_market_schedule_change')} color={'secondary'} />} label="Market changes schedule" />
                                        <FormControlLabel control={<Switch checked={tempVendorUserSettings.text_basket_sold} onChange={() => handleSwitchChange('text_basket_sold')} color={'secondary'} />} label="When a basket is sold" />
                                    </FormGroup>
                                )}
                                <div>
                                    <h3 className='margin-b-12'>Locations for Notifications</h3>
                                    <div className='form-group'>
                                        <label>Market Locations:</label>
                                        {filteredMarketDays.length > 0 ? (
                                            <select id="marketSelect" name="market" onChange={(e) => handleMarketDaySelect(e)}>
                                                <option value="">Select Market</option>
                                                {filteredMarketDays.map((marketDay, index) => (
                                                    <option key={index} value={marketDay.id}>
                                                        {marketDay.markets.name} on {weekDay[marketDay.day_of_week]}s
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <p className='margin-t-4 margin-l-8'>No market locations...</p> // Optional: Placeholder or spinner while loading
                                        )}
                                        <button className='btn btn-small margin-l-8 margin-b-4' onClick={() => handleAddMarket(newMarketDay)}>Add</button>
                                        <Stack className='padding-4' direction="column" spacing={1}>
                                            {tempVendorUserSettings.market_locations?.map((marketDayId) => {
                                                const marketDay = allMarketDays.find((p) => p.id === marketDayId);
                                                return (
                                                    <Chip
                                                        key={marketDayId}
                                                        style={{
                                                            backgroundColor: "#eee", fontSize: ".9em"
                                                        }}
                                                        sx={{
                                                            height: 'auto',
                                                            '& .MuiChip-label': {
                                                                display: 'block',
                                                                whiteSpace: 'normal',
                                                            },
                                                        }}
                                                        label={`${marketDay?.markets.name}, ${weekDay[marketDay?.day_of_week]}` || 'Unknown Product'}
                                                        size="small"
                                                        onDelete={() => handleDeleteMarketDay(marketDayId)}
                                                    />
                                                );
                                            })}
                                        </Stack>
                                    </div>
                                </div>
                                <button className='btn-edit' onClick={handleSaveSettings}>Save</button>
                            </>
                        )}
                    </div>
                    <h2 className='margin-t-24'>Vendor Team Management</h2>
                    <div className='box-bounding'>
                        <VendorTeamRequest className="margin-b-32" vendorUserId={vendorUserId} vendorUserData={vendorUserData} />
                        <VendorActiveVendor className="margin-b-32" vendorUserData={vendorUserData} setVendorUserData={setVendorUserData} />
                        <VendorTeamLeave vendorUserData={vendorUserData} setVendorUserData={setVendorUserData} />
                    </div>
                    <h2 className='margin-t-24'>Vendor Information</h2>
                    <div className='box-bounding'>
                        {vendorData?.id ? (
                            vendorEditMode && vendorUserData?.vendor_role[vendorUserData.active_vendor] <= 1 ? (
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
                                            value={newProduct ? newProduct : ''}
                                            onChange={(e) => setNewProduct(e.target.value)}
                                        >
                                            <option value="">Select</option>
                                            {Array.isArray(products) && products.map((product) => (
                                                <option key={product.id} value={product.id}>
                                                    {product.product}
                                                </option>
                                            ))}
                                        </select>
                                        <button className='btn btn-small margin-l-8 margin-b-4' onClick={() => handleAddProduct(newProduct)}>Add</button>
                                        <Stack className='padding-4' direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                                            {tempVendorData.products?.map((productId) => {
                                                const product = products.find((p) => p.id === productId);
                                                return (
                                                    <Chip
                                                        key={productId}
                                                        style={{
                                                            backgroundColor: "#eee", fontSize: ".9em"
                                                        }}
                                                        label={product?.product || 'Unknown Product'}
                                                        size="small"
                                                        onDelete={() => handleDeleteProduct(productId)}
                                                    />
                                                );
                                            })}
                                        </Stack>
                                    </div>
                                    {Number(newProduct) === 1 && (
                                        <div className="form-group">
                                            <label>Other Product:</label>
                                            <input
                                                type="text"
                                                name="new_product"
                                                placeholder='Your Product Here'
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
                                        <br className='m-br'/>
                                        <select 
                                            className='select-state'
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
                                    <div className="form-group">
                                        <label>Default Image:</label>
                                        <select className='select'
                                            name="image_default"
                                            value={tempVendorData ? tempVendorData.image_default : ''}
                                            onChange={handleVendorInputChange}
                                        >
                                            <option value="">Select</option>
                                            {Object.entries(vendors_default).map(([key, value], index) => (
                                                <option key={index} value={value}>
                                                    {key}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className='form-group width-100'>
                                        <label>Vendor Image:</label>
                                        {tempVendorData ? (
                                            <>
                                                <img
                                                    className='img-vendor-edit'
                                                    src={tempVendorData.image ? `/vendor-images/${tempVendorData.image}` : `/vendor-images/_default-images/${tempVendorData.image_default}`}
                                                    alt="Vendor"
                                                    style={{ maxWidth: '100%', height: 'auto' }}
                                                />
                                            </>
                                        ) : (
                                            <p>No image uploaded.</p>
                                        )}
                                        <div className='flex-start flex-center-align'>
                                            <div className='margin-l-8'>
                                                <button className='btn btn-small btn-blue' onClick={handleDeleteProductImage}>Delete Image</button>
                                            </div>
                                            <label htmlFor='file-upload' className='btn btn-small btn-file nowrap'>Choose File <span className='text-white-background'>{image?.name}</span></label>
                                            <input
                                                id="file-upload"
                                                type="file"
                                                name="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                    </div>
                                    <div className='flex-start flex-gap-8'>
                                        <button className='btn-edit nowrap' onClick={handleSaveVendorChanges}>Save Changes</button>
                                        <button className='btn-edit' onClick={handleVendorEditToggle}>Cancel</button>
                                        <div className='alert-container'>
                                            <div className={status === 'fail' ? 'alert alert-favorites alert-fail' : 'alert-favorites-hidden'}>
                                                Uploading Image Failed
                                            </div>
                                            <div className={status === 'Uploading' ? 'alert alert-favorites alert-uploading' : 'alert-favorites-hidden'}>
                                                Uploading Image
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                    <>
                                        <div className='flex-start flex-gap-48'>
                                            <table>
                                                <tbody>
                                                    <tr>
                                                        <td className='cell-title'>Role:</td>
                                                        <td className='cell-text'>
                                                            {(() => {
                                                                const role = vendorUserData?.vendor_role[vendorUserData.active_vendor];
                                                                if (role === 0) return 'Owner';
                                                                if (role === 1) return 'Admin';
                                                                if (role === 2) return 'Employee';
                                                                return 'Unknown Role';
                                                            })()}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className='cell-title'>Name:</td>
                                                        <td className='cell-text'>{vendorData ? vendorData.name : ' Loading...'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className='cell-title'>Product:</td>
                                                        <td className='cell-text'>
                                                            {products
                                                                .filter(p => vendorData?.products?.includes(p.id))
                                                                .map(p => p.product)
                                                                .join(', ') || ''}
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
                                                        <td className='cell-text'>{vendorData ? <img src={vendorData.image ? `/vendor-images/${vendorData.image}` : `/vendor-images/_default-images/${vendorData.image_default}`} alt="Vendor" style={{ maxWidth: '100%', height: 'auto' }} /> : ''}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        {vendorUserData?.vendor_role[vendorUserData.active_vendor] <= 1 && (    
                                           <>
                                                <div className='flex-start'>
                                                    <button className='btn-edit' onClick={handleVendorEditToggle}>Edit</button>
                                                    <div className='alert-container'>
                                                        <div className={status === 'success' ? 'alert alert-favorites' : 'alert-favorites-hidden'}>
                                                            Success Uploading Image
                                                        </div>
                                                    </div>
                                                </div>
                                                <VendorLocations 
                                                    vendorId={vendorId} 
                                                    vendorUserData={vendorUserData}
                                                    allVendorMarkets={allVendorMarkets} 
                                                    allMarketDays={allMarketDays} 
                                                    allMarkets={allMarkets} 
                                                    filteredMarketDays={filteredMarketDays} 
                                                    setFilteredMarketDays={setFilteredMarketDays} 
                                                    filteredMarkets={filteredMarkets}
                                                />
                                            </>
                                        )}
                                    </>
                                )
                            ) : (
                            <VendorCreate />
                            )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default VendorProfile;