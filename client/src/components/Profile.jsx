import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

function Profile() {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [favoriteVendors, setFavoriteVendors] = useState([]);
    const [favoriteMarkets, setFavoriteMarkets] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [vendorDetails, setVendorDetails] = useState({});
    const [marketDetails, setMarketDetails] = useState({});

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:5555/profile/${id}`);
                const text = await response.text();
                console.log('Raw response:', text);

                try {
                    const data = JSON.parse(text);
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
            } catch (error) {
                console.error('Error fetching profile data:', error);
            }
        };
        fetchProfileData();
    }, [id]);

    useEffect(() => {
        const fetchVendorDetails = async () => {
            const promises = favoriteVendors.map(async (favorite) => {
                const response = await fetch(`http://127.0.0.1:5555/vendors/${favorite.vendor_id}`);
                if (response.ok) {
                    const vendorData = await response.json();
                    return { id: favorite.vendor_id, name: vendorData.name };
                } else {
                    console.log(`Failed to fetch vendor ${favorite.vendor_id}`);
                    return { id: favorite.vendor_id, name: 'Unknown Vendor' };
                }
            });
            
            Promise.all(promises)
                .then(details => {
                    const vendorDetailsMap = {};
                    details.forEach(detail => {
                        vendorDetailsMap[detail.id] = detail.name;
                    });
                    setVendorDetails(vendorDetailsMap);
                })
                .catch(error => {
                    console.error('Error fetching vendor details:', error);
                });
        };

        if (favoriteVendors.length > 0) {
            fetchVendorDetails();
        }
    }, [favoriteVendors]);

    useEffect(() => {
        const fetchMarketDetails = async () => {
            const promises = favoriteMarkets.map(async (favorite) => {
                const response = await fetch(`http://127.0.0.1:5555/markets/${favorite.market_id}`);
                if (response.ok) {
                    const marketData = await response.json();
                    return { id: favorite.market_id, name: marketData.name };
                } else {
                    console.log(`Failed to fetch market ${favorite.market_id}`);
                    return { id: favorite.market_id, name: 'Unknown Market' };
                }
            });

            Promise.all(promises)
                .then(details => {
                    const marketDetailsMap = {};
                    details.forEach(detail => {
                        marketDetailsMap[detail.id] = detail.name;
                    });
                    setMarketDetails(marketDetailsMap);
                })
                .catch(error => {
                    console.error('Error fetching market details:', error);
                });
        };

        if (favoriteMarkets.length > 0) {
            fetchMarketDetails();
        }
    }, [favoriteMarkets]);

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

    const handleDeleteFavorite = async (type, id) => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/profile/${id}/favorites/${type}/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                if (type === 'vendor') {
                    setFavoriteVendors(favoriteVendors.filter(vendorId => vendorId !== id));
                } else if (type === 'market') {
                    setFavoriteMarkets(favoriteMarkets.filter(marketId => marketId !== id));
                }
            } else {
                console.error('Failed to delete favorite');
            }
        } catch (error) {
            console.error('Error deleting favorite:', error);
        }
    };

    if (!profileData) {
        return <div>Loading...</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h1>Welcome to Your Profile</h1>
            <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
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
            <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
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
            </div>
        </div>
    );
}

export default Profile;