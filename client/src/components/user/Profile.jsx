import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { avatars_default, states } from '../../utils/common';
import { timeConverter, formatPhoneNumber } from '../../utils/helpers';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import BasketSales from './BasketSales';
import { blogTimeConverter } from "../../utils/helpers";


function Profile({ marketData }) {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [userSettings, setUserSettings] = useState(null);
    const [tempUserSettings, setTempUserSettings] = useState(null);
    const [tempProfileData, setTempProfileData] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [settingsMode, setSettingsMode] = useState(false);
    const [vendorFavs, setVendorFavs] = useState([]);
    const [marketFavs, setMarketFavs] = useState([]);
    const [blogFavs, setBlogFavs] = useState([]);
    const [image, setImage] = useState(null)
    const [status, setStatus] = useState('initial')
    const [salesHistory, setSalesHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('website');
    const [openBlog, setOpenBlog] = useState(null);

    const userId = parseInt(globalThis.localStorage.getItem('user_id'))
    const token = localStorage.getItem('user_jwt-token');

    const decodeJwt = (token) => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload;
        } catch (error) {
            console.error('Failed to decode JWT:', error);
            return null;
        }
    };    

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                if (token) {
                    // Decode the token to extract the role
                    const decodedToken = decodeJwt(token);
                    if (decodedToken && decodedToken.role) {
                        // console.log('Role from JWT:', decodedToken.role);
                    }
                }
                
                const response = await fetch(`http://127.0.0.1:5555/api/users/${id}`, {
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
                        console.log(data)
                        setProfileData({ ...data });
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

        fetchProfileData();
    }, [id]);

    useEffect(() => {
        const fetchUserSettings = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:5555/api/settings-users?user_id=${id}`, {
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
                        setUserSettings({ ...data });
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
        fetchUserSettings();
    }, [id]);

    const handleEditToggle = () => {
        if (!editMode) {
            setTempProfileData({ ...profileData });
        } else {
            setTempProfileData(null);
        }
        setEditMode(!editMode);
    };

    const handleInputChange = event => {
        const { name, value } = event.target;
        setTempProfileData({
            ...tempProfileData,
            [name]: value
        });
    };

    const handleSaveChanges = async () => {
        let uploadedFilename = null;
        try {
            const apiKey = import.meta.env.VITE_RADAR_KEY;
            const query = `${tempProfileData.address_1} ${tempProfileData.city} ${tempProfileData.state} ${tempProfileData.zipcode}`;
            try {
                const responseRadar = await fetch(`https://api.radar.io/v1/geocode/forward?query=${encodeURIComponent(query)}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': apiKey,
                    },
                });
                if (responseRadar.ok) {
                    const data = await responseRadar.json();
                    if (data.addresses && data.addresses.length > 0) {
                        const { latitude, longitude } = data.addresses[0];
    
                        // Check if the email has changed
                        if (tempProfileData.email !== profileData.email) {
                            // Call the different endpoint for email change
                            const emailChangeResponse = await fetch(`http://127.0.0.1:5555/api/change-email`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    user_id: id,
                                    email: tempProfileData.email,
                                }),
                            });
    
                            if (emailChangeResponse.ok) {
                                alert('Email change request has been sent! Please confirm.');
                                const emailChangeResult = await emailChangeResponse.json();
                                setProfileData((prevData) => ({
                                    ...prevData,
                                    email: tempProfileData.email, // Update email locally
                                }));
                            } else {
                                console.error('Email change request failed.');
                                console.log('Response status:', emailChangeResponse.status);
                                console.log('Response text:', await emailChangeResponse.text());
                                return; // Stop further execution if email change fails
                            }
                        } else {
                            // Proceed with the regular PATCH request for other updates
                            const response = await fetch(`http://127.0.0.1:5555/api/users/${id}`, {
                                method: 'PATCH',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    first_name: tempProfileData.first_name,
                                    last_name: tempProfileData.last_name,
                                    email: tempProfileData.email,
                                    phone: tempProfileData.phone,
                                    address_1: tempProfileData.address_1,
                                    address_2: tempProfileData.address_2,
                                    city: tempProfileData.city,
                                    state: tempProfileData.state,
                                    zipcode: tempProfileData.zipcode,
                                    coordinates: { lat: latitude, lng: longitude },
                                }),
                            });
    
                            if (response.ok) {
                                const updatedData = await response.json();
                                setProfileData(updatedData);
                                setEditMode(false);
                                console.log('Profile data updated successfully:', updatedData);
                            } else {
                                console.error('Failed to save changes.');
                                console.log('Response status:', response.status);
                                console.log('Response text:', await response.text());
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Geocoding Error:', error);
            }
            if (image) {

                const maxFileSize = 25 * 1024 * 1024
                if (image.size > maxFileSize) {
                    alert("File size exceeds 25 MB. Please upload a smaller file.");
                    return;
                }

                console.log('Uploading file...');
                setStatus('uploading');
                const formData = new FormData();
                formData.append('file', image);
                formData.append('type', 'user');
                formData.append('user_id', id);

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
                        uploadedFilename = `${userId}/${data.filename}`;
                        console.log('Image uploaded:', uploadedFilename);
                        setStatus('success');
                        setProfileData((prevData) => ({
                            ...prevData,
                            avatar: uploadedFilename, // Update avatar with the new filename
                        }));
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
                window.location.reload()
            }
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    };

    const handleSaveSettings = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/settings-users/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tempUserSettings)
            });
            if (response.ok) {
                const updatedData = await response.json();
                setUserSettings(updatedData);
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

    const handleDeleteImage = async () => {
        if (!profileData || !profileData.avatar) {
            alert('No image to delete.');
            return;
        }
    
        if (!userId) {
            alert('User ID is not defined.');
            return;
        }
    
        const token = localStorage.getItem('user_jwt-token');
        if (!token) {
            alert('User is not authenticated. Please log in again.');
            return;
        }
    
        try {
            console.log('Deleting image with filename:', profileData.avatar);
            console.log('User ID:', userId);
    
            const response = await fetch(`http://127.0.0.1:5555/api/delete-image`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    filename: profileData.avatar,
                    user_id: userId,
                    type: 'user',
                }),
            });
    
            if (response.ok) {
                const result = await response.json();
                console.log('Image deleted response:', result);
    
                setProfileData((prevData) => ({
                    ...prevData,
                    avatar: null,
                }));
    
                alert('Image deleted successfully.');
            } else {
                const errorText = await response.text();
                console.error('Failed to delete image:', errorText);
                alert(`Failed to delete the image: ${JSON.parse(errorText).error}`);
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            alert('An unexpected error occurred while deleting the image.');
        }
    };

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/api/vendor-favorites?user_id=${userId}`, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then(data => {
                setVendorFavs(data);
            })
            .catch(error => console.error('Error fetching vendor favorites', error));
    }, []);

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/api/market-favorites?user_id=${userId}`, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then(data => {
                setMarketFavs(data);
            })
            .catch(error => console.error('Error fetching market favorites', error));
    }, []);

    const handleFileChange = (event) => {
        if (event.target.files) {
            setStatus('initial');
            setImage(event.target.files[0]);
        }
    }

    useEffect(() => {
        const token = localStorage.getItem('user_jwt-token');

        if (!token) {
            console.error('JWT token not found in localStorage');
            return;
        }

        fetch('http://127.0.0.1:5555/api/baskets/user-sales-history', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // console.log("Fetched sales history:", data);
                setSalesHistory(data);
            })
            .catch(error => console.error('Error fetching sales history:', error.message));
    }, []);

    const handleSettingsToggle = () => {
        if (!settingsMode) {
            setTempUserSettings({ ...userSettings });
        } else {
            setTempUserSettings(null);
        }
        setSettingsMode(!settingsMode);
    };
    
    const handleSwitchChange = (field) => {
        setTempUserSettings({
            ...tempUserSettings,
            [field]: !tempUserSettings[field]
        });
    };

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/api/blog-favorites?user_id=${userId}`, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then(data => { setBlogFavs(data) })
            .catch(error => console.error('Error fetching blog favorites', error));
    }, []);

    const handleToggle = (name) => {
        setOpenBlog((prev) => (prev === name ? null : name));
    };
    

    if (!profileData) {
        return <div>Loading...</div>;
    }


    return (
        <div>
            <h1>Welcome to Your Profile, {profileData.first_name}!</h1>
            <div className='box-bounding badge-container'>
                <i className='icon-settings' onClick={handleSettingsToggle}>&emsp;</i>
                {!settingsMode ? (
                    <>
                        <h2 className='margin-b-16'>Profile Information</h2>
                        {editMode ? (
                            <div className='margin-t-16'>
                                <div className="form-group">
                                    <label>First Name:</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={tempProfileData ? tempProfileData.first_name : ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Last Name:</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={tempProfileData ? tempProfileData.last_name : ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email:</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={tempProfileData ? tempProfileData.email : ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone:</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={tempProfileData ? formatPhoneNumber(tempProfileData.phone) : ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-address">
                                    <label>Address:</label>
                                    <input
                                        type="text"
                                        name="address_1"
                                        size="36"
                                        placeholder='Address 1'
                                        value={tempProfileData ? tempProfileData.address_1 : ''}
                                        onChange={handleInputChange}
                                    />
                                    <input
                                        type="text"
                                        name="address_2"
                                        size="8"
                                        placeholder='Apt, Floor, Suite # etc'
                                        value={tempProfileData ? tempProfileData.address_2 : ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className='form-address'>
                                    <label></label>
                                    <input
                                        type="text"
                                        name="city"
                                        size="36"
                                        placeholder='City'
                                        value={tempProfileData ? tempProfileData.city : ''}
                                        onChange={handleInputChange}
                                    />
                                    <select className='select-state'
                                        name="state"
                                        value={tempProfileData ? tempProfileData.state : ''}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select</option>
                                        {states.map((state, index) => (
                                            <option key={index} value={state}>
                                                {state}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        name="zipcode"
                                        size="5"
                                        placeholder='Zipcode'
                                        value={tempProfileData ? tempProfileData.zipcode : ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Default Avatar:</label>
                                    <select className='select'
                                        name="avatar_default"
                                        value={tempProfileData ? tempProfileData.avatar_default : ''}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select</option>
                                        {Object.entries(avatars_default).map(([key, value], index) => (
                                            <option key={index} value={value}>
                                                {key}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className='form-group'>
                                    <label>Avatar:</label>
                                    {profileData ? (
                                        <>
                                            <img
                                                className='img-avatar-profile'
                                                src={tempProfileData.avatar ? `/user-images/${tempProfileData.avatar}` : `/user-images/_default-images/${tempProfileData.avatar_default}`}
                                                alt="Avatar"
                                                style={{ maxWidth: '100%', height: 'auto', padding: '4px' }}
                                            />
                                        </>
                                    ) : (
                                        <p>No image uploaded.</p>
                                    )}
                                    <div className='flex-start flex-center-align'>
                                        <div className='margin-l-8'>
                                            <button className='btn btn-small btn-blue' onClick={handleDeleteImage}>Delete Image</button>
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
                                <button className='btn-edit' onClick={handleSaveChanges}>Save Changes</button>
                                <button className='btn-edit' onClick={handleEditToggle}>Cancel</button>
                            </div>
                        ) : (
                            <>
                                <div className='flex-space-evenly flex-gap-16 flex-start-align m-flex-wrap'>
                                    <img className='img-avatar-profile' src={profileData.avatar ? `/user-images/${profileData.avatar}` : `/user-images/_default-images/${profileData.avatar_default}`} alt="Avatar" />
                                    <div className='width-80'>
                                        <table className='table-profile'>
                                            <tbody>
                                                <tr>
                                                    <td className='cell-title'>Name:</td>
                                                    <td className='cell-text'>{profileData.first_name} {profileData.last_name}</td>
                                                </tr>
                                                <tr>
                                                    <td className='cell-title'>Email:</td>
                                                    <td className='cell-text'>{profileData.email}</td>
                                                </tr>
                                                <tr>
                                                    <td className='cell-title'>Phone:</td>
                                                    <td className='cell-text'>{formatPhoneNumber(profileData.phone)}</td>
                                                </tr>
                                                <tr>
                                                    <td className='cell-title'>Address:</td>
                                                    <td className='cell-text'>{profileData.address_1}, {profileData.address_2}</td>
                                                </tr>
                                                <tr>
                                                    <td className='cell-title'></td>
                                                    <td className='cell-text'>{profileData.city}, {profileData.state} {profileData.zipcode}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <button className='btn-edit' onClick={handleEditToggle}>Edit</button>
                                    </div>
                                </div>
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
                                <FormControlLabel control={<Switch checked={tempUserSettings.site_fav_market_new_event} onChange={() => handleSwitchChange('site_fav_market_new_event')} color={'secondary'} />} label="Favorite market creates an event"/>
                                <FormControlLabel control={<Switch checked={tempUserSettings.site_fav_market_schedule_change} onChange={() => handleSwitchChange('site_fav_market_schedule_change')} color={'secondary'} />} label="Favorite market changes schedule"/>
                                <FormControlLabel control={<Switch checked={tempUserSettings.site_fav_market_new_vendor} onChange={() => handleSwitchChange('site_fav_market_new_vendor')} color={'secondary'} />} label="New vendor in a favorited market"/>
                                <FormControlLabel control={<Switch checked={tempUserSettings.site_fav_market_new_basket} onChange={() => handleSwitchChange('site_fav_market_new_basket')} color={'secondary'} />} label="New basket for sale by a favorited market"/>
                                <FormControlLabel control={<Switch checked={tempUserSettings.site_fav_vendor_new_event} onChange={() => handleSwitchChange('site_fav_vendor_new_event')} color={'secondary'} />} label="Favorite vendor creates an event or special"/>
                                <FormControlLabel control={<Switch checked={tempUserSettings.site_fav_vendor_schedule_change} onChange={() => handleSwitchChange('site_fav_vendor_schedule_change')} color={'secondary'} />} label="Favorite vendor changes schedule"/>
                                <FormControlLabel control={<Switch checked={tempUserSettings.site_fav_vendor_new_basket} onChange={() => handleSwitchChange('site_fav_vendor_new_basket')} color={'secondary'} />} label="New basket for sale by a favorited vendor"/>
                                <FormControlLabel control={<Switch checked={tempUserSettings.site_basket_pickup_time} onChange={() => handleSwitchChange('site_basket_pickup_time')} color={'secondary'} />} label="Pickup time for a basket you purchased"/>
                            </FormGroup>
                        )}
                        {activeTab === 'email' && (
                            <FormGroup>
                                <FormControlLabel control={<Switch checked={tempUserSettings.email_fav_market_new_event} onChange={() => handleSwitchChange('email_fav_market_new_event')} color={'secondary'} />} label="Favorite market creates an event" />
                                <FormControlLabel control={<Switch checked={tempUserSettings.email_fav_market_schedule_change} onChange={() => handleSwitchChange('email_fav_market_schedule_change')} color={'secondary'} />} label="Favorite market changes schedule" />
                                <FormControlLabel control={<Switch checked={tempUserSettings.email_fav_market_new_vendor} onChange={() => handleSwitchChange('email_fav_market_new_vendor')} color={'secondary'} />} label="New vendor in a favorited market" />
                                <FormControlLabel control={<Switch checked={tempUserSettings.email_fav_vendor_new_event} onChange={() => handleSwitchChange('email_fav_vendor_new_event')} color={'secondary'} />} label="Favorite vendor creates an event or special" />
                                <FormControlLabel control={<Switch checked={tempUserSettings.email_fav_vendor_schedule_change} onChange={() => handleSwitchChange('email_fav_vendor_schedule_change')} color={'secondary'} />} label="Favorite vendor changes schedule" />
                                <FormControlLabel control={<Switch checked={tempUserSettings.email_fav_vendor_new_basket} onChange={() => handleSwitchChange('email_fav_vendor_new_basket')} color={'secondary'} />} label="New basket for sale by a favorited vendor" />
                                <FormControlLabel control={<Switch checked={tempUserSettings.email_basket_pickup_time} onChange={() => handleSwitchChange('email_basket_pickup_time')} color={'secondary'} />} label="Pickup time for a basket you purchased" />
                            </FormGroup>
                        )}
                        {activeTab === 'text' && (
                            <FormGroup>
                                <FormControlLabel control={<Switch checked={tempUserSettings.text_fav_market_schedule_change} onChange={() => handleSwitchChange('text_fav_market_schedule_change')} color={'secondary'} />} label="Favorite market changes schedule" />
                                <FormControlLabel control={<Switch checked={tempUserSettings.text_fav_market_new_basket} onChange={() => handleSwitchChange('text_fav_market_new_basket')} color={'secondary'} />} label="New basket for sale by a favorited market" />
                                <FormControlLabel control={<Switch checked={tempUserSettings.text_fav_vendor_schedule_change} onChange={() => handleSwitchChange('text_fav_vendor_schedule_change')} color={'secondary'} />} label="Favorite vendor changes schedule" />
                                <FormControlLabel control={<Switch checked={tempUserSettings.text_basket_pickup_time} onChange={() => handleSwitchChange('text_basket_pickup_time')} color={'secondary'} />} label="Pickup time for a basket you purchased" />
                            </FormGroup>
                        )}
                        <button className='btn-edit' onClick={handleSaveSettings}>Save</button>
                    </>
                )}
            </div>
            <div className='box-bounding text-center'>
                <h1>Baskets Purchased: {salesHistory.length}</h1>
                <div className='flex-space-evenly'>
                    <h3>
                        Total Paid: ${salesHistory.reduce((total, sale) => total + sale.price, 0)}
                    </h3>
                    <h3>
                        Amount Saved: ${(
                            salesHistory.reduce((totalBasket, sale) => totalBasket + sale.basket_value, 0) -
                            salesHistory.reduce((totalPrice, sale) => totalPrice + sale.price, 0)
                        )}
                    </h3>
                </div>
            </div>
            <div className='box-bounding'>
                <BasketSales salesHistory={salesHistory} />
            </div>
            <div className='box-bounding'>
                <h2 className='margin-b-24'>Favorites</h2>
                <h3>Vendors</h3>
                <ul className='favorites-list box-scroll'>
                    {vendorFavs.length > 0 ? (
                        vendorFavs.map((data) => (
                            <li key={data.id}>
                                <Link to={`/user/vendors/${data.vendor_id}`}><b>{data.vendor.name}</b> <i>of {data.vendor.city}, {data.vendor.state}</i></Link>
                            </li>
                        ))
                    ) : (
                        <p>No favorite vendors</p>
                    )}
                </ul>
                <h3 className='margin-t-16'>Markets</h3>
                <ul className='favorites-list box-scroll'>
                    {marketFavs.length > 0 ? (
                        marketFavs.map((data) => (
                            <li key={data.id}>
                                <Link to={`/user/markets/${data.market_id}`}><b>{data.market.name}</b> <i>open {data.market.schedule}</i></Link>
                            </li>
                        ))
                    ) : (
                        <p>No favorite markets</p>
                    )}
                </ul>
                <h3 className='margin-t-16 margin-b-8'>Blogs</h3>
                <div className='box-scroll'>
                    {blogFavs.length > 0 ? (
                        blogFavs.map((blog) => (
                        <details 
                            key={blog.id}
                            className='blog-favs'
                            open={openBlog === blog.id}
                            onClick={(e) => {
                                e.preventDefault();
                                handleToggle(blog.id);
                            }}
                        >
                            <summary>{blogTimeConverter(blog.blog.post_date)}, {blog.blog.title}</summary>
                            <p dangerouslySetInnerHTML={{ __html: blog.blog.body }} style={{ width: '100%', height: '100%' }}></p>
                        </details>
                        ))
                    ) : (
                        <p>No favorite blogs</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;