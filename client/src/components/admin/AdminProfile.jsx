import React, { useState, useEffect } from 'react';
import { useParams, NavLink, Link } from 'react-router-dom';

function AdminProfile () {
    const { id } = useParams();
    const [editMode, setEditMode] = useState(false);
    const [adminUserData, setAdminUserData] = useState(null);

    useEffect(() => {
        const fetchAdminUserData = async () => {
            try {
                const token = sessionStorage.getItem('jwt-token');
                // console.log('JWT Token:', token);
                const response = await fetch(`http://127.0.0.1:5555/admin_users/${id}`, {
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
                    console.log('Fetched admin user data:', data);
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
            const response = await fetch(`http://127.0.0.1:5555/admin_users/${id}`, {
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
                    <h2 className='title'>Profile Information</h2>
                    <div className='bounding-box'>
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
                                <p><strong>Name: </strong> {adminUserData ? `${adminUserData.first_name} ${adminUserData.last_name}` : 'Loading...'} </p>
                                <p><strong>Email: </strong> {adminUserData ? adminUserData.email : ' Loading...'} </p>
                                <p><strong>Phone: </strong> {adminUserData ? adminUserData.phone : ' Loading...'} </p>
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