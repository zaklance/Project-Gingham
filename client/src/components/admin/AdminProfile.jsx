import React, { useState, useEffect } from 'react';
import { useParams, NavLink, Link } from 'react-router-dom';
import { formatPhoneNumber } from '../../utils/helpers';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

function AdminProfile () {
    const { id } = useParams();
    const [editMode, setEditMode] = useState(false);
    const [settingsMode, setSettingsMode] = useState(false);
    const [adminUserData, setAdminUserData] = useState(null);
    const [tempProfileData, setTempProfileData] = useState(null);
    const [adminSettings, setAdminSettings] = useState(null);
    const [tempAdminSettings, setTempAdminSettings] = useState(null);
    const [activeTab, setActiveTab] = useState('website');

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
    
                const response = await fetch(`http://127.0.0.1:5555/api/admin-users/${id}`, {
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
                    const response = await fetch(`http://127.0.0.1:5555/api/settings-admins?admin_id=${id}`, {
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

    // const handleInputChange = (event) => {
    //     setAdminUserData({
    //         ...adminUserData,
    //         [event.target.name]: event.target.value,
    //     });
    // };

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

    const handleSaveChanges = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/admin-users/${id}`, {
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
            const response = await fetch(`http://127.0.0.1:5555/api/settings-admins/${id}`, {
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
    

    return(
        <div>
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
                                            <label>Email:</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={tempProfileData ? tempProfileData.email : ''}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className='form-group'>
                                            <label>Phone Number:</label>
                                            <input
                                                type="text"
                                                name="phone"
                                                value={tempProfileData ? tempProfileData.phone : ''}
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
                                {activeTab === 'website' && (
                                    <FormGroup>
                                        <FormControlLabel control={<Switch checked={tempAdminSettings.site_report_review} onChange={() => handleSwitchChange('site_report_review')} color={'secondary'} />} label="Review is reported"/>
                                        <FormControlLabel control={<Switch checked={tempAdminSettings.site_product_request} onChange={() => handleSwitchChange('site_product_request')} color={'secondary'} />} label="Vendor requests new product category"/>
                                    </FormGroup>
                                )}
                                {activeTab === 'email' && (
                                    <FormGroup>
                                        <FormControlLabel control={<Switch checked={tempAdminSettings.email_report_review} onChange={() => handleSwitchChange('email_report_review')} color={'secondary'} />} label="Review is reported"/>
                                        <FormControlLabel control={<Switch checked={tempAdminSettings.email_product_request} onChange={() => handleSwitchChange('email_product_request')} color={'secondary'} />} label="Vendor requests new product category" />
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