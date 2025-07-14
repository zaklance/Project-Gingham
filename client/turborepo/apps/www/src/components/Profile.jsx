import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { avatars_default } from "@repo/ui/common.js";
import { formatPhoneNumber } from "@repo/ui/helpers.js";
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import BasketSales from './BasketSales';
import PasswordStrengthBar from 'react-password-strength-bar';
import PasswordChecklist from "react-password-checklist"
import ProfileFavorites from './ProfileFavorites';
import { toast } from 'react-toastify';
import PulseLoader from 'react-spinners/PulseLoader';
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

function Profile({ marketData }) {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [userSettings, setUserSettings] = useState(null);
    const [tempUserSettings, setTempUserSettings] = useState(null);
    const [tempProfileData, setTempProfileData] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [settingsMode, setSettingsMode] = useState(false);
    const [emailMode, setEmailMode] = useState(false);
    const [passwordMode, setPasswordMode] = useState(false);
    const [image, setImage] = useState(null)
    const [status, setStatus] = useState('initial')
    const [uploading, setUploading] = useState(false)
    const [salesHistory, setSalesHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('website');
    const [addressResults, setAddressResults] = useState();
    const [showAddressDropdown, setShowAddressDropdown] = useState(false);
    const [resultCoordinates, setResultCoordinates] = useState();
    const [changeEmail, setChangeEmail] = useState();
    const [changeConfirmEmail, setChangeConfirmEmail] = useState();
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [password, setPassword] = useState('');
    const [changePassword, setChangePassword] = useState('');
    const [changeConfirmPassword, setChangeConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState({ pw1: false, pw2:false, pw3: false });
    const [isValid, setIsValid] = useState(false);

    const dropdownAddressRef = useRef(null);
    const debounceTimeout = useRef(null);

    const userId = parseInt(globalThis.localStorage.getItem('user_id'))
    const token = localStorage.getItem('user_jwt-token');
    const siteURL = import.meta.env.VITE_SITE_URL;

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
                
                const response = await fetch(`/api/users/${id}`, {
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
                const response = await fetch(`/api/settings-users?user_id=${id}`, {
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
    
    const handlePhoneInputChange = event => {
        setTempProfileData({
            ...tempProfileData,
            ['phone']: event
        });
    };

    const handleSaveChanges = async () => {
        let uploadedFilename = null;
        try {
            const apiKey = import.meta.env.VITE_RADAR_KEY;
            const query = `${tempProfileData.zipcode}`;
            try {
                if (!resultCoordinates || (tempProfileData.zipcode !== profileData.zipcode)) {
                    const responseRadar = await fetch(`https://api.radar.io/v1/geocode/forward?query=${encodeURIComponent(query)}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': apiKey,
                        },
                    });
                    if (responseRadar.ok) {
                        const data = await responseRadar.json();
                        if (data.addresses && data.addresses.length > 0) {
                            const { city, stateCode, latitude, longitude } = data.addresses[0];

                            const response = await fetch(`/api/users/${id}`, {
                                method: 'PATCH',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    first_name: tempProfileData.first_name,
                                    last_name: tempProfileData.last_name,
                                    phone: tempProfileData.phone,
                                    city: city,
                                    state: stateCode,
                                    zipcode: tempProfileData.zipcode,
                                    avatar_default: tempProfileData.avatar_default,
                                    coordinates: { lat: latitude, lng: longitude }
                                })
                            });

                            if (response.ok) {
                                const updatedData = await response.json();
                                setProfileData(updatedData);
                                // setEditMode(false);
                                // console.log('Profile data updated successfully:', updatedData);
                                toast.success('Profile updated successfully.', {
                                    autoClose: 4000,
                                });
                            } else {
                                console.log('Failed to save changes');
                                console.log('Response status:', response.status);
                                console.log('Response text:', await response.text());
                                toast.error('Profile failed to update successfully.', {
                                    autoClose: 4000,
                                });
                            }
                        }
                    }
                } else {
                    const response = await fetch(`/api/users/${id}`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            first_name: tempProfileData.first_name,
                            last_name: tempProfileData.last_name,
                            phone: tempProfileData.phone,
                            avatar_default: tempProfileData.avatar_default,
                        })
                    });

                    if (response.ok) {
                        const updatedData = await response.json();
                        setProfileData(updatedData);
                        // setEditMode(false);
                        // console.log('Profile data updated successfully:', updatedData);
                        toast.success('Profile updated successfully.', {
                            autoClose: 4000,
                        });
                    } else {
                        console.log('Failed to save changes');
                        console.log('Response status:', response.status);
                        console.log('Response text:', await response.text());
                        toast.error('Profile failed to update successfully.', {
                            autoClose: 4000,
                        });
                    }
                }
            } catch (error) {
                console.error('Geocoding Error:', error);
            }
            if (image) {
                const maxFileSize = 20 * 1024 * 1024;
                if (image.size > maxFileSize) {
                    toast.warning('File size exceeds 20 MB. Please upload a smaller file.', {
                        autoClose: 6000,
                    });
                    return;
                }

                console.log('Uploading file...');
                setStatus('uploading');
                setUploading(true)
                const formData = new FormData();
                formData.append('file', image);
                formData.append('type', 'user');
                formData.append('user_id', id);

                try {
                    const result = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                    });

                    if (result.ok) {
                        const data = await result.json();
                        const taskId = data.task_id;
                        console.log('Image processing started. Task ID:', taskId);

                        // Poll for task completion
                        let taskStatus = 'PENDING';
                        while (taskStatus !== 'SUCCESS') {
                            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before checking again
                            const statusResponse = await fetch(`/api/task-status/${taskId}`);
                            const statusData = await statusResponse.json();
                            taskStatus = statusData.status;
                            console.log(`Checking task status: ${taskStatus}`);

                            if (taskStatus === 'FAILURE') {
                                toast.error('Image processing failed.', { autoClose: 4000 });
                                setStatus('fail');
                                setUploading(false)
                                return;
                            }
                        }

                        uploadedFilename = `/api/uploads/user-images/${id}/${data.filename}`;
                        console.log('Image processing complete:', uploadedFilename);
                        setStatus('success');
                        setProfileData((prevData) => ({
                            ...prevData,
                            avatar: uploadedFilename,
                        }));
                        setUploading(false)
                        setEditMode(false);
                    } else {
                        console.log('Image upload failed');
                        console.log('Response:', await result.text());
                        setStatus('fail');
                        setUploading(false)
                        toast.error('Image failed to upload successfully. Only jpeg, svg, and heic files are allowed.', { autoClose: 6000 });
                        return;
                    }
                } catch (error) {
                    console.error('Error uploading image:', error);
                    setStatus('fail');
                    setUploading(false)
                    toast.error('Image failed to upload successfully. Only jpeg, svg, and heic files are allowed.', { autoClose: 6000 });
                    return;
                }
                // window.location.reload()
            } else {
                setEditMode(false);
            }
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    };

    const handleSaveSettings = async () => {
        try {
            const response = await fetch(`/api/settings-users/${id}`, {
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

    const handleSaveEmail = async () => {
        if (changeEmail !== changeConfirmEmail) {
            toast.error('Emails do not match.', {
                autoClose: 4000,
            });
            return;
        }
        setIsSendingEmail(true);
    
        try {
            const response = await fetch(`/api/change-email`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: id,
                    email: changeEmail,
                }),
            });
    
            if (response.ok) {
                setChangeEmail('');
                setChangeConfirmEmail('');
                setEmailMode(false);
                toast.warning('Email will not update until you check your email and click the verify link.', {
                    autoClose: 8000,
                });
            } else {
                console.log('Failed to save changes');
                console.log('Response status:', response.status);
                console.log('Response text:', await response.text());
            }
        } catch (error) {
            // console.error('Error saving changes:', error);
            toast.error(`Error saving changes: ${error}`, {
                autoClose: 5000,
            });
        } finally {
            setIsSendingEmail(false);
        }
    };

    const handleSavePassword = async () => {
        if (changePassword !== changeConfirmPassword) {
            toast.error('Passwords do not match.', {
                autoClose: 4000,
            });
            return;
        }
        if (!isValid) {
            toast.error('Password does not meet requirements.', {
                autoClose: 4000,
            });
            return;
        }
        try {
            const response = await fetch(`/api/users/${id}/password`, {
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
                toast.success('Password changed.', {
                    autoClose: 4000,
                });
            } else {
                console.log('Failed to save changes');
                console.log('Response status:', response.status);
                console.log('Response text:', await response.text());
            }
        } catch (error) {
            console.error('Error saving changes:', error);
            toast.error(`Error saving changes: ${error}`, {
                autoClose: 5000,
            });
        }
    };

    const handleDeleteImage = async () => {
        if (!profileData || !profileData.avatar) {
            toast.warning('No image to delete.', {
                autoClose: 4000,
            });
            return;
        }
    
        if (!userId) {
            toast.warning('User ID is not defined.', {
                autoClose: 4000,
            });
            return;
        }
    
        const token = localStorage.getItem('user_jwt-token');
        if (!token) {
            toast.warning('User is not authenticated. Please log in again.', {
                autoClose: 4000,
            });
            return;
        }
    
        try {
            // console.log('Deleting image with filename:', profileData.avatar);
            // console.log('User ID:', userId);
    
            const response = await fetch(`/api/delete-image`, {
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
                setTempProfileData((prevData) => ({
                    ...prevData,
                    avatar: null,
                }));
                toast.success('Image deleted successfully.', {
                    autoClose: 4000,
                });
            } else {
                const errorText = await response.text();
                console.error('Failed to delete image:', errorText);
                toast.error(`Failed to delete the image: ${JSON.parse(errorText).error}`, {
                    autoClose: 4000,
                });
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            toast.warning('An unexpected error occurred while deleting the image.', {
                autoClose: 4000,
            });
        }
    };

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

        fetch('/api/baskets/user-sales-history', {
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
                // console.log(data)
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

    const handleClickOutsideAddressDropdown = (event) => {
        if (dropdownAddressRef.current && !dropdownAddressRef.current.contains(event.target)) {
            setShowAddressDropdown(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutsideAddressDropdown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutsideAddressDropdown);
        };
    }, [showAddressDropdown]);


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
    

    if (!profileData) {
        return <div>Loading...</div>;
    }


    return (
        <div>
            <title>gingham • User Profile</title>
            <h1>Welcome to Your Profile, {profileData.first_name}!</h1>
            <div className='box-bounding badge-container'>
                <i className='icon-settings' title="notification settings" onClick={handleSettingsToggle}>&emsp;</i>
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
                                    <label>Phone:</label>
                                    <PhoneInput
                                        className='input-phone-profile margin-l-8'
                                        countryCallingCodeEditable={false}
                                        withCountryCallingCode
                                        country='US'
                                        defaultCountry='US'
                                        placeholder="enter your phone number"
                                        value={tempProfileData.phone || ''}
                                        onChange={(event) => handlePhoneInputChange(event)}
                                    />
                                </div>
                                <div className='form-address'>
                                    <label>Zip Code</label>
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
                                                src={tempProfileData.avatar ? `${siteURL}${tempProfileData.avatar}` : `/user-images/_default-images/${tempProfileData.avatar_default}`}
                                                alt="Avatar"
                                                style={{ maxWidth: '100%', height: 'auto', padding: '4px' }}
                                            />
                                        </>
                                    ) : (
                                        <p>No image uploaded.</p>
                                    )}
                                    <div className='flex-start flex-center-align'>
                                        {tempProfileData.avatar && (
                                            <div className='margin-l-8'>
                                                <button className='btn btn-small btn-blue' onClick={handleDeleteImage}>Delete Image</button>
                                            </div>
                                        )}
                                        <label htmlFor='file-upload' className='btn btn-small btn-file btn-blue nowrap'>Choose File{image && <span id="file-name" className='text-white-background margin-l-8'>{image.name}</span>}</label>
                                        <input
                                            id="file-upload"
                                            type="file"
                                            name="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                </div>
                                <div className='flex-start'>
                                    {uploading ? (
                                        <PulseLoader
                                            className='margin-t-16 margin-l-16 margin-r-16'
                                            color={'#ff806b'}
                                            size={10}
                                            aria-label="Loading Spinner"
                                            data-testid="loader"
                                        />
                                    ) : (
                                        <button className='btn-edit' onClick={handleSaveChanges}>Save Changes</button>
                                    )}
                                    <button className='btn-edit' onClick={handleEditToggle}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className='flex-space-evenly flex-gap-16 flex-start-align m-flex-wrap'>
                                    <img className='img-avatar-profile' src={profileData.avatar ? `${siteURL}${profileData.avatar}` : `/user-images/_default-images/${profileData.avatar_default}`} alt="Avatar" />
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
                                                    <td className='cell-title'>City</td>
                                                    <td className='cell-text'>{profileData.city}, {profileData.state}</td>
                                                </tr>
                                                <tr>
                                                    <td className='cell-title'>Zip Code</td>
                                                    <td className='cell-text'>{profileData.zipcode}</td>
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
                                                            value={changePassword || ''}
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
                                                            value={changeConfirmPassword || ''}
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
                                                        value={changeEmail || ''}
                                                        placeholder="enter your email"
                                                        onChange={(event) => setChangeEmail(event.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label></label>
                                                    <input
                                                        type="email"
                                                        value={changeConfirmEmail || ''}
                                                        placeholder="re-enter your email"
                                                        onChange={(event) => setChangeConfirmEmail(event.target.value)}
                                                        required
                                                    />
                                                </div>
                                                {isSendingEmail ? (
                                                    <PulseLoader
                                                        className='margin-t-16'
                                                        color={'#ff806b'}
                                                        size={10}
                                                        aria-label="Loading Spinner"
                                                        data-testid="loader"
                                                    />
                                                ) : (
                                                    <button className='btn-edit' onClick={handleSaveEmail} disabled={isSendingEmail}>
                                                        Save Changes
                                                    </button>
                                                )}
                                                <button className='btn-edit' onClick={handleEmailToggle} disabled={isSendingEmail}>
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            null
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <>
                        <div className='flex-start flex-center-align flex-gap-24 m-flex-wrap margin-b-16'>
                            <h2>Settings</h2>
                            <div className='tabs'>                
                                <Link to="#" onClick={() => setActiveTab('website')} className={`btn btn-reset btn-tab ${activeTab === 'website' && 'active-tab'}`}>
                                    Website
                                </Link>
                                <Link to="#" onClick={() => setActiveTab('email')} className={`btn btn-reset btn-tab ${activeTab === 'email' && 'active-tab'}`}>
                                    Email
                                </Link>
                                <Link to="#" onClick={() => setActiveTab('text')} className={`btn btn-reset btn-tab ${activeTab === 'text' && 'active-tab'}`}>
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
                                <FormControlLabel control={<Switch checked={tempUserSettings.site_basket_pickup_time} onChange={() => handleSwitchChange('site_basket_pickup_time')} color={'secondary'} />} label="It is pickup time for a basket you purchased"/>
                                {/* <FormControlLabel control={<Switch checked={tempUserSettings.site_new_blog} onChange={() => handleSwitchChange('site_new_blog')} color={'secondary'} />} label="A new blog has been posted"/> */}
                                <FormControlLabel control={<Switch checked={tempUserSettings.site_user_notify_me} onChange={() => handleSwitchChange('site_user_notify_me')} color={'secondary'} />} label="When a vendor adds a basket that your requested"/>
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
                                <FormControlLabel control={<Switch checked={tempUserSettings.email_basket_pickup_time} onChange={() => handleSwitchChange('email_basket_pickup_time')} color={'secondary'} />} label="it is pickup time for a basket you purchased" />
                                <FormControlLabel control={<Switch checked={tempUserSettings.email_new_blog} onChange={() => handleSwitchChange('email_new_blog')} color={'secondary'} />} label="A new blog has been posted" />
                                <FormControlLabel control={<Switch checked={tempUserSettings.email_user_notify_me} onChange={() => handleSwitchChange('email_user_notify_me')} color={'secondary'} />} label="When a vendor adds a basket that your requested"/>
                            </FormGroup>
                        )}
                        {activeTab === 'text' && (
                            <FormGroup>
                                <FormControlLabel control={<Switch checked={tempUserSettings.text_fav_market_schedule_change} onChange={() => handleSwitchChange('text_fav_market_schedule_change')} color={'secondary'} />} label="Favorite market changes schedule" />
                                <FormControlLabel control={<Switch checked={tempUserSettings.text_fav_market_new_basket} onChange={() => handleSwitchChange('text_fav_market_new_basket')} color={'secondary'} />} label="New basket for sale by a favorited market" />
                                <FormControlLabel control={<Switch checked={tempUserSettings.text_fav_vendor_schedule_change} onChange={() => handleSwitchChange('text_fav_vendor_schedule_change')} color={'secondary'} />} label="Favorite vendor changes schedule" />
                                <FormControlLabel control={<Switch checked={tempUserSettings.text_basket_pickup_time} onChange={() => handleSwitchChange('text_basket_pickup_time')} color={'secondary'} />} label="It is pickup time for a basket you purchased" />
                                <FormControlLabel control={<Switch checked={tempUserSettings.text_user_notify_me} onChange={() => handleSwitchChange('text_user_notify_me')} color={'secondary'} />} label="When a vendor adds a basket that your requested"/>
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
                            salesHistory.reduce((totalBasket, sale) => totalBasket + sale.value, 0) -
                            salesHistory.reduce((totalPrice, sale) => totalPrice + sale.price, 0)
                        )}
                    </h3>
                </div>
            </div>
            <div className='box-bounding'>
                <BasketSales salesHistory={salesHistory} />
            </div>
            <div className='box-bounding'>
                <ProfileFavorites />
            </div>
        </div>
    );
}

export default Profile;