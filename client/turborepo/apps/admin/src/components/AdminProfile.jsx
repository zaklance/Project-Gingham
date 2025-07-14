import React, { useState, useEffect } from 'react';
import { useParams, NavLink, Link } from 'react-router-dom';
import { formatPhoneNumber } from "@repo/ui/helpers.js";
import PasswordStrengthBar from 'react-password-strength-bar';
import PasswordChecklist from "react-password-checklist"
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { toast } from 'react-toastify';
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

function AdminProfile () {
    const { id } = useParams();
    const [editMode, setEditMode] = useState(false);
    const [emailMode, setEmailMode] = useState(false);
    const [passwordMode, setPasswordMode] = useState(false);
    const [settingsMode, setSettingsMode] = useState(false);
    const [adminUserData, setAdminUserData] = useState(null);
    const [tempProfileData, setTempProfileData] = useState(null);
    const [adminSettings, setAdminSettings] = useState(null);
    const [tempAdminSettings, setTempAdminSettings] = useState(null);
    const [activeTab, setActiveTab] = useState('website');
    const [changeEmail, setChangeEmail] = useState();
    const [changeConfirmEmail, setChangeConfirmEmail] = useState();
    const [password, setPassword] = useState('');
    const [changePassword, setChangePassword] = useState('');
    const [changeConfirmPassword, setChangeConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState({ pw1: false, pw2:false, pw3: false });
    const [isValid, setIsValid] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    const token = localStorage.getItem('admin_jwt-token');

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
        const fetchAdminUserData = async () => {
            try {
                if (!token) {
                    console.error('Token missing, redirecting to login.');
                    // Redirect to login page or unauthorized page
                    return;
                }
                const response = await fetch(`/api/admin-users/${id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setAdminUserData(data);
                } else if (response.status === 403) {
                    console.error('Access forbidden: Admin role required');
                    // Redirect to unauthorized page or show an error
                } else {
                    console.error(`Error fetching profile: ${response.status}`);
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
            }
        };
        fetchAdminUserData();
    }, [id]);

    useEffect(() => {
            const fetchUserSettings = async () => {
                const token = localStorage.getItem('admin_jwt-token');
                try {
                    const response = await fetch(`/api/settings-admins?admin_id=${id}`, {
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
                            setAdminSettings({ ...data });
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
            setTempProfileData({ ...adminUserData });
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
        try {
            const response = await fetch(`/api/admin-users/${id}`, {
                method: 'PATCH', 
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tempProfileData)
            });
            console.log('Request body:', JSON.stringify(tempProfileData));

            if (response.ok) {
                const updatedData = await response.json();
                setAdminUserData(updatedData);
                setEditMode(false);
                console.log('Profile data updated successfull:', updatedData);
            } else {
                console.log('Failed to save changes');
                console.log('Response status;', response.status);
                console.log('Response text:', await response.text());
            }            
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    };

    const handleSaveSettings = async () => {
        const token = localStorage.getItem('admin_jwt-token');
        try {
            const response = await fetch(`/api/settings-admins/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tempAdminSettings)
            });
            if (response.ok) {
                const updatedData = await response.json();
                setAdminSettings(updatedData);
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
            const response = await fetch(`/api/change-admin-email`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    admin_id: id,
                    email: changeEmail,
                }),
            });
    
            const responseData = await response.json();
    
            console.log("Response Data:", responseData);
    
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
                console.log('Response text:', responseData);
            }
        } catch (error) {
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
            const response = await fetch(`/api/admin-users/${id}/password`, {
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
            // console.error('Error saving changes:', error);
            toast.error(`Error saving changes: ${error}`, {
                autoClose: 5000,
            });
        }
    };

    const handleSettingsToggle = () => {
        if (!settingsMode) {
            setTempAdminSettings({ ...adminSettings });
        } else {
            setTempAdminSettings(null);
        }
        setSettingsMode(!settingsMode);
    };

    const handleSwitchChange = (field) => {
        setTempAdminSettings({
            ...tempAdminSettings,
            [field]: !tempAdminSettings[field]
        });
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

    useEffect(() => {
        const anchor = window.location.hash.slice(1);
        setTimeout(() => {
            if (anchor) {
                const anchorEl = document.getElementById(anchor);
                if (anchorEl) {
                    anchorEl.scrollIntoView();
                }
            }
        }, 500);
    }, []);
    

    return(
        <div>
            <title>gingham • Admin Profile</title>
            <div className="tab-content">
                <div>
                    <div className='box-bounding badge-container'>
                    <h1 className='margin-b-16'>Profile Information</h1>
                        <i className='icon-settings' onClick={handleSettingsToggle}>&emsp;</i>
                        {!settingsMode ? (
                            <>
                                {editMode ? (
                                    <>
                                        <div className='form-group'>
                                            <label>First Name:</label>
                                            <input
                                                type="text"
                                                name="first_name"
                                                value={tempProfileData ? tempProfileData.first_name : ''}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className='form-group'>
                                            <label>Last Name:</label>
                                            <input
                                                type="text"
                                                name="last_name"
                                                value={tempProfileData ? tempProfileData.last_name : ''}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className='form-group'>
                                            <label>Phone Number:</label>
                                            <PhoneInput
                                                className='input-phone margin-l-8'
                                                countryCallingCodeEditable={false}
                                                withCountryCallingCode
                                                country='US'
                                                defaultCountry='US'
                                                placeholder="enter your phone number"
                                                value={tempProfileData?.phone || ''}
                                                onChange={(event) => handlePhoneInputChange(event)}
                                            />
                                            {/* <input
                                                type="text"
                                                name="phone"
                                                value={tempProfileData ? formatPhoneNumber(tempProfileData.phone) : ''}
                                                onChange={handleInputChange}
                                            /> */}
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
                                                    <td className='cell-text'>{adminUserData ? `${adminUserData.first_name} ${adminUserData.last_name}` : 'Loading...'}</td>
                                                </tr>
                                                <tr>
                                                    <td className='cell-title'>Email:</td>
                                                    <td className='cell-text'>{adminUserData ? adminUserData.email : ' Loading...'}</td>
                                                </tr>
                                                <tr>
                                                    <td className='cell-title'>Phone:</td>
                                                    <td className='cell-text'>{adminUserData ? formatPhoneNumber(adminUserData.phone) : ' Loading...'}</td>
                                                </tr>
                                                <tr>
                                                    <td className='cell-title'>Admin Role:</td>
                                                    <td className='cell-text'>{adminUserData ? adminUserData.admin_role : ' Loading...'}</td>
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
                                        <FormControlLabel control={<Switch checked={tempAdminSettings.site_report_review} onChange={() => handleSwitchChange('site_report_review')} color={'secondary'} />} label="Review is reported"/>
                                        <FormControlLabel control={<Switch checked={tempAdminSettings.site_product_request} onChange={() => handleSwitchChange('site_product_request')} color={'secondary'} />} label="Vendor requests new product category"/>
                                        {/* <FormControlLabel control={<Switch checked={tempAdminSettings.site_new_blog} onChange={() => handleSwitchChange('site_new_blog')} color={'secondary'} />} label="A new blog has been posted"/> */}
                                        <FormControlLabel control={<Switch checked={tempAdminSettings.site_new_vendor} onChange={() => handleSwitchChange('site_new_vendor')} color={'secondary'} />} label="A new vendor has joined"/>
                                    </FormGroup>
                                )}
                                {activeTab === 'email' && (
                                    <FormGroup>
                                        <FormControlLabel control={<Switch checked={tempAdminSettings.email_report_review} onChange={() => handleSwitchChange('email_report_review')} color={'secondary'} />} label="Review is reported"/>
                                        <FormControlLabel control={<Switch checked={tempAdminSettings.email_product_request} onChange={() => handleSwitchChange('email_product_request')} color={'secondary'} />} label="Vendor requests new product category" />
                                        <FormControlLabel control={<Switch checked={tempAdminSettings.email_new_blog} onChange={() => handleSwitchChange('email_new_blog')} color={'secondary'} />} label="A new blog has been posted" />
                                        <FormControlLabel control={<Switch checked={tempAdminSettings.email_new_vendor} onChange={() => handleSwitchChange('email_new_vendor')} color={'secondary'} />} label="A new vendor has joined"/>
                                    </FormGroup>
                                )}
                                {activeTab === 'text' && (
                                    <FormGroup>
                                        <FormControlLabel control={<Switch checked={tempAdminSettings.text_report_review} onChange={() => handleSwitchChange('text_report_review')} color={'secondary'} />} label="Review is reported"/>
                                        <FormControlLabel control={<Switch checked={tempAdminSettings.text_product_request} onChange={() => handleSwitchChange('text_product_request')} color={'secondary'} />} label="Vendor requests new product category" />
                                    </FormGroup>
                                )}
                                <button className='btn-edit' onClick={handleSaveSettings}>Save</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminProfile;