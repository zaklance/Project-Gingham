import React, { useState, useEffect } from 'react';
import { useParams, NavLink, Link } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import AdminVendors from './AdminVendors';
import AdminMarkets from './AdminMarkets';

function AdminProfile () {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('profile');
    const [editMode, setEditMode] = useState(false);
    const [adminUserData, setAdminUserData] = useState(null);

    useEffect(() => {
        const fetchVendorUserData = async () => {
            try {
                const token = sessionStorage.getItem('jwt-token');
                const response = await fetch(`http://127.0.0.1:5555/admin_users/${id}`, {
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
                        setAdminUserData({
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
        setAdminUserData({
            ...adminUserData,
            [event.target.name]: event.target.value,
        });
    };

    const handleEditToggle = () => {
        setEditMode(!editMode);
    };

    const handleSaveChanges = async () => {
        console.log('Save Changes Clicked and Successful', adminUserData);
        setEditMode(false);
    };

    return(
        <div>
            <h1 className='title' style={{textAlign:'center'}}>ADMIN PORTAL</h1>
            <hr className='separator' />
            <div className='tabs'>
                <Link to="#" onClick={() => setActiveTab('profile')} className={activeTab === 'profile' ? 'active' : ''}>
                    Profile
                </Link>
                <Link to="#" onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'active' : ''}>
                    Dashboard
                </Link>
                <Link to="#" onClick={() => setActiveTab('vendors')} className={activeTab === 'vendors' ? 'active' : ''}>
                    Vendors
                </Link>
                <Link to="#" onClick={() => setActiveTab('markets')} className={activeTab === 'markets' ? 'active' : ''}>
                    Markets
                </Link>
                <NavLink reloadDocument to="/admin/logout" style={{marginLeft: 'auto'}}>
                    Logout
                </NavLink>
            </div>
            <hr className='separator' />
            <div className="tab-content">
                {activeTab === 'profile' && (
                    <div>
                        <h2 className='title'>Profile Information</h2>
                        <div className='bounding-box'>
                            {editMode ? (
                                <>
                                
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
                )}
                {activeTab === 'dashboard' && <AdminDashboard />}
                {activeTab === 'vendors' && <AdminVendors />}
                {activeTab === 'markets' && <AdminMarkets />}
            </div>
        </div>
    )
}

export default AdminProfile;