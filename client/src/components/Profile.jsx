import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

function Profile() {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [vendorFavs, setVendorFavs] = useState([]);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                // Retrieve the JWT token from sessionStorage
                const token = sessionStorage.getItem('jwt-token');
    
                // Make a request to the protected route with the Authorization header
                const response = await fetch(`http://127.0.0.1:5555/profile/${id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,  // Send token 
                        'Content-Type': 'application/json'
                    }
                });
    
                const text = await response.text();  // raw response as text
                console.log('Raw response:', text);
    
                if (response.ok) {
                    // If response is successful, parse and set the profile data
                    try {
                        const data = JSON.parse(text);  // Parse the JSON response
                        setProfileData({
                            ...data,
                            vendor_favorites: data.vendor_favorites,
                            market_favorites: data.market_favorites
                        });
                        setFavoriteVendors(data.vendor_favorites);
                        setFavoriteMarkets(data.market_favorites);
                    } catch (jsonError) {
                        console.error('Error parsing JSON:', jsonError);
                    }
                } else {
                    console.error('Error fetching profile:', response.status);
                    // Handle possible errors (e.g., unauthorized, invalid token)
                    if (response.status === 401) {
                        console.error('Unauthorized: Token may be missing or invalid');
                        // You might want to redirect to login or show an error message
                    }
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
            }
        };
    
        fetchProfileData();
    }, [id]);

    const handleEditToggle = () => {
        setEditMode(!editMode);
    };

    const handleInputChange = event => {
        const { name, value } = event.target;
        setProfileData({
            ...profileData,
            [name]: value
        });
    };

    const handleSaveChanges = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/profile/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });

            console.log('Request body:', JSON.stringify(profileData));

            if (response.ok) {
                const updatedData = await response.json();
                setProfileData(updatedData);
                setEditMode(false);
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

    useEffect(() => {
        fetch("http://127.0.0.1:5555/vendor_favorites")
            .then(response => response.json())
            .then(data => {
                const filteredData = data.filter(item => item.user_id === parseInt(globalThis.sessionStorage.getItem('user_id')));
                setVendorFavs(filteredData)
            })
            .catch(error => console.error('Error fetching favorites', error));
    }, []);


    if (!profileData) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Welcome to Your Profile</h1>
            <div className='bounding-box'>
                <h2>Profile Information</h2>
                {editMode ? (
                    <>
                        <div className="form-group">
                            <label>First Name:</label>
                            <input
                                type="text"
                                name="first_name"
                                value={profileData.first_name}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Last Name:</label>
                            <input
                                type="text"
                                name="last_name"
                                value={profileData.last_name}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Email:</label>
                            <input
                                type="email"
                                name="email"
                                value={profileData.email}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Address:</label>
                            <input
                                type="text"
                                name="address"
                                value={profileData.address}
                                onChange={handleInputChange}
                            />
                        </div>
                        <button className='btn-edit' onClick={handleSaveChanges}>Save Changes</button>
                        <button className='btn-edit' onClick={handleEditToggle}>Cancel</button>
                    </>
                ) : (
                    <>
                        <p><strong>Name:</strong> {profileData.first_name} {profileData.last_name}</p>
                        <p><strong>Email:</strong> {profileData.email}</p>
                        <p><strong>Address:</strong> {profileData.address}</p>
                        <button className='btn-edit' onClick={handleEditToggle}>Edit</button>
                    </>
                )}
            </div>
            <div className='bounding-box'>
                <h2>Favorites</h2>
                <h3>Vendors</h3>
                <ul className='favorites-list'>
                    {vendorFavs.length > 0 ? (
                    vendorFavs.map((data) => (
                        <li key={data.id}>
                            <Link to={`/vendors/${data.id}`}><b>{data.vendor.name}</b> <i>of {data.vendor.based_out_of}</i> </Link>
                        </li>
                    ))
                    ) : (
                        <p>No favorite vendors</p>
                    )}
                </ul>
            </div>

            {/* <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
                <h2>Favorites</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ flex: '1', marginRight: '10px' }}>
                        <h3>Vendors</h3>
                        {favoriteVendors.length > 0 ? (
                            favoriteVendors.map((vendorId, index) => (
                                <div key={index} style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
                                    <Link to={`/vendors/${vendorId}`}>{vendorDetails[vendorId]}</Link>
                                    <button className='btn-delete' onClick={() => handleDeleteFavorite('vendor', vendorId)}>Delete</button>
                                </div>
                            ))
                        ) : (
                            <p>No favorite vendors</p>
                        )}
                    </div>
                    <div style={{ flex: '1', marginLeft: '10px' }}>
                        <h3>Markets</h3>
                        {favoriteMarkets.length > 0 ? (
                            favoriteMarkets.map((marketId, index) => (
                                <div key={index} style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
                                    <Link to={`/markets/${marketId}`}>{marketDetails[marketId]}</Link>
                                    <button className='btn-delete' onClick={() => handleDeleteFavorite('market', marketId)}>Delete</button>
                                </div>
                            ))
                        ) : (
                            <p>No favorite markets</p>
                        )}
                    </div>
                </div>
            </div> */}
        </div>
    );
}

export default Profile;