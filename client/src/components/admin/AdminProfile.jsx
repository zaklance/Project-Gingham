import React, { useState, useEffect } from 'react';
import { useParams, NavLink, Link } from 'react-router-dom';
import { formatPhoneNumber } from '../../utils/helpers';

function AdminProfile () {
    const { id } = useParams();
    const [editMode, setEditMode] = useState(false);
    const [adminUserData, setAdminUserData] = useState(null);
    const [tempProfileData, setTempProfileData] = useState(null);

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
    

    return(
        <div>
            <div className="tab-content">
                <div>
                    <h1>Profile Information</h1>
                    <div className='box-bounding'>
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
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminProfile;