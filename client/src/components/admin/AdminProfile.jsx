import React, { useState, useEffect } from 'react';
import { useParams, NavLink, Link } from 'react-router-dom';

function AdminProfile () {
    const { id } = useParams();
    const [editMode, setEditMode] = useState(false);
    const [adminUserData, setAdminUserData] = useState(null);

    // Function to format phone numbers
    const formatPhoneNumber = (phone) => {
        const cleaned = ('' + phone).replace(/\D/g, '');
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            return `(${match[1]}) ${match[2]}-${match[3]}`;
        }
        return phone;
    };

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
                const token = sessionStorage.getItem('jwt-token');
                // console.log('JWT Token:', token);

                if (token) {
                    // Decode the token to extract the role
                    const decodedToken = decodeJwt(token);
                    if (decodedToken && decodedToken.role) {
                        // console.log('Role from JWT:', decodedToken.role);
                    }
                }
                
                const response = await fetch(`http://127.0.0.1:5555/api/admin-users/${id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                // const text = await response.text();
                // console.log('Raw response:', text);
                
                if (response.ok) {
                    const data = await response.json();
                    // console.log('Fetched admin user data:', data);
                    setAdminUserData(data);
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
        fetchAdminUserData();
    }, [id]);

    const handleInputChange = (event) => {
        setAdminUserData({
            ...adminUserData,
            [event.target.name]: event.target.value,
        });
    };

    const handleEditToggle = () => {
        setEditMode(!editMode);
    };

    const handleSaveChanges = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/admin-users/${id}`, {
                method: 'PATCH', 
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(adminUserData)
            });
            console.log('Request body:', JSON.stringify(adminUserData));

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
                    <h2>Profile Information</h2>
                    <div className='box-bounding'>
                        {editMode ? (
                            <>
                                <div className='form-group'>
                                    <label>First Name:</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={adminUserData ? adminUserData.first_name : ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className='form-group'>
                                    <label>Last Name:</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={adminUserData ? adminUserData.last_name : ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className='form-group'>
                                    <label>Email:</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={adminUserData ? adminUserData.email : ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className='form-group'>
                                    <label>Phone Number:</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={adminUserData ? adminUserData.phone : ''}
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