import React, { useState, useEffect } from 'react';
import { useParams, NavLink, Link, Route, Routes, BrowserRouter as Router} from 'react-router-dom';
import VendorDashboard from './VendorDashboard.jsx';
import VendorSales from './VendorSales.jsx';
import VendorDetail from '../user/VendorDetail.jsx';

function VendorProfile () {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('profile');
    const [editMode, setEditMode] = useState(false);
    const [vendorUserData, setVendorUserData] = useState(null);

    useEffect(() => {
        const fetchVendorUserData = async () => {
            try {
                const token = sessionStorage.getItem('jwt-token');
                const response = await fetch(`http://127.0.0.1:5555/vendor/profile/${id}`, {
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
                        setVendorUserData({
                            ...data,
                        });
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

    const handleInputChange = (event) => {
        setVendorUserData({
            ...vendorUserData,
            [event.target.name]: event.target.value,
        });
    };

    const handleEditToggle = () => {
        setEditMode(!editMode);
    };

    const handleSaveChanges = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/vendor/profile/${id}`, {
                method: 'PATCH', 
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(vendorUserData)
            });
            console.log('Request body:', JSON.stringify(vendorUserData));

            if (response.ok) {
                const updatedData = await response.json();
                setVendorUserData(updatedData);
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
                {activeTab === 'profile' && (
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
                                            value={vendorUserData ? vendorUserData.first_name : ''}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className='form-group'>
                                        <label>Last Name:</label>
                                        <input
                                            type="text"
                                            name="last_name"
                                            value={vendorUserData ? vendorUserData.last_name : ''}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className='form-group'>
                                        <label>Email:</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={vendorUserData ? vendorUserData.email : ''}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className='form-group'>
                                        <label>Phone Number:</label>
                                        <input
                                            type="text"
                                            name="phone"
                                            value={vendorUserData ? vendorUserData.phone : ''}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <button className='btn-edit' onClick={handleSaveChanges}>Save Changes</button>
                                    <button className='btn-edit' onClick={handleEditToggle}>Cancel</button>
                                </>
                            ) : (
                                <>
                                    <p><strong>Name: </strong> {vendorUserData ? `${vendorUserData.first_name} ${vendorUserData.last_name}` : ' Loading...'}</p>
                                    <p><strong>Email: </strong> {vendorUserData ? vendorUserData.email : ' Loading...'}</p>
                                    <p><strong>Phone: </strong> {vendorUserData ? vendorUserData.phone : ' Loading...'}</p>
                                    <button className='btn-edit' onClick={handleEditToggle}>Edit</button>
                                </>
                            )}
                        </div>
                        <br />
                        <h2 className='title'>Vendor Information</h2>
                        <div className='bounding-box'>
                            {vendorUserData?.vendor?.vendor_id ? (
                                <VendorDetail vendorId={vendorUserData.vendor.vendor_id} />
                            ) : (
                                <p>Loading vendor details...</p>
                            )}
                        </div>
                    </div>
                )}
                {activeTab === 'dashboard' && <VendorDashboard />}
                {activeTab === 'sales' && <VendorSales />}
            </div>
        </div>
    )
}

export default VendorProfile;
