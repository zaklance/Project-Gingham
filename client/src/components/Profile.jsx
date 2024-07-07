import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

function Profile() {
    const { id } = useParams();
    const [profileData, setProfileData] = useState(null);
    const [favoriteVendors, setFavoriteVendors] = useState([]);
    const [favoriteMarkets, setFavoriteMarkets] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [vendorDetails, setVendorDetails] = useState({});
    const [marketDetails, setMarketDetails] = useState({});

    useEffect(() => {
        const fetchProfileData = async () => {
            const response = await fetch(`http://127.0.0.1:5555/profile/${id}`);
            if (response.ok) {
                const data = await response.json();
                setProfileData({
                    ...data,
                    favorite_vendors: JSON.parse(data.favorite_vendors),
                    favorite_markets: JSON.parse(data.favorite_markets)
                });
                setFavoriteVendors(JSON.parse(data.favorite_vendors));
                setFavoriteMarkets(JSON.parse(data.favorite_markets));
            } else {
                console.log('Failed to fetch profile data');
            }
        };
    
        fetchProfileData();
    }, [id]);

    useEffect(() => {
        const fetchVendorDetails = async () => {
            const promises = favoriteVendors.map(async vendorId => {
                const response = await fetch(`http://127.0.0.1:5555/vendors/${vendorId}`);
                if (response.ok) {
                    const vendorData = await response.json();
                    return { id: vendorId, name: vendorData.name };
                } else {
                    console.log(`Failed to fetch vendor ${vendorId}`);
                    return { id: vendorId, name: 'Unknown Vendor' };
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
            const promises = favoriteMarkets.map(async marketId => {
                const response = await fetch(`http://127.0.0.1:5555/markets/${marketId}`);
                if (response.ok) {
                    const marketData = await response.json();
                    return { id: marketId, name: marketData.name };
                } else {
                    console.log(`Failed to fetch market ${marketId}`);
                    return { id: marketId, name: 'Unknown Market' };
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
    }

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
            if (response.ok) {
                const updatedData = await response.json();
                setProfileData(updatedData);
                setEditMode(false);
            } else {
                console.log('Failed to save changes');
            }
        } catch (error) {
            console.error('Error saving changes:', error);
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
                        <button onClick={handleSaveChanges}>Save Changes</button>
                        <button onClick={handleEditToggle}>Cancel</button>
                    </>
                ) : (
                    <>
                        <p><strong>Name:</strong> {profileData.first_name} {profileData.last_name}</p>
                        <p><strong>Email:</strong> {profileData.email}</p>
                        <p><strong>Address:</strong> {profileData.address}</p>
                        <button onClick={handleEditToggle}>Edit</button>
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
