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
        if (id === 'admin') {
            const dummyAdminData = {
                first_name: "Titus",
                last_name: "Andronicus",
                email: "mufo@gingham.nyc",
                phone: "123-456-7890"
            };
            setAdminUserData(dummyAdminData);
        } else {
            console.log('Fetching data for non-admin user.');
        }
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
            <h1>ADMIN PORTAL</h1>
            <br />
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