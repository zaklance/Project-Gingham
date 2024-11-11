import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

function Profile( {marketData }) {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [vendorFavs, setVendorFavs] = useState([]);
    const [marketFavs, setMarketFavs] = useState([]);

    const weekday = ["Mon", "Tues", "Wed", "Thur", "Fri", "Sat", "Sun"]

    function timeConverter(time24) {
        const date = new Date('1970-01-01T' + time24);

        const time12 = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
        return time12
    }

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                // Retrieve the JWT token from sessionStorage
                const token = sessionStorage.getItem('jwt-token');
    
                // Make a request to the protected route with the Authorization header
                const response = await fetch(`http://127.0.0.1:5555/users/${id}`, {
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
                        });
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
            const response = await fetch(`http://127.0.0.1:5555/users/${id}`, {
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
        fetch("http://127.0.0.1:5555/vendor-favorites")
            .then(response => response.json())
            .then(data => {
                const filteredData = data.filter(item => item.user_id === parseInt(globalThis.sessionStorage.getItem('user_id')));
                setVendorFavs(filteredData)
            })
            .catch(error => console.error('Error fetching favorites', error));
    }, []);

    useEffect(() => {
        fetch("http://127.0.0.1:5555/market-favorites")
            .then(response => response.json())
            .then(data => {
                const filteredData = data.filter(item => item.user_id === parseInt(globalThis.sessionStorage.getItem('user_id')));
                setMarketFavs(filteredData)
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
                                value={profileData ? profileData.first_name : ''}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Last Name:</label>
                            <input
                                type="text"
                                name="last_name"
                                value={profileData ? profileData.last_name : ''}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Email:</label>
                            <input
                                type="email"
                                name="email"
                                value={profileData ? profileData.email : ''}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Address:</label>
                            <input
                                type="text"
                                name="address"
                                value={profileData ? profileData.address : ''}
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
                <br/>
                <h3>Vendors</h3>
                <ul className='favorites-list'>
                    {vendorFavs.length > 0 ? (
                    vendorFavs.map((data) => (
                        <li key={data.id}>
                            <Link to={`/user/vendors/${data.vendor_id}`}><b>{data.vendor.name}</b> <i>of {data.vendor.city}, {data.vendor.state}</i> </Link>
                        </li>
                    ))
                    ) : (
                        <p>No favorite vendors</p>
                    )}
                </ul>
                <br/>
                <h3>Markets</h3>
                <ul className='favorites-list'>
                    {marketFavs.length > 0 ? (
                    marketFavs.map((data) => (
                        <li key={data.id}>
                            <Link to={`/user/markets/${data.market_id}`}><b>{data.market.name}</b> <i>open {data.market.schedule} </i> </Link>
                        </li>
                    ))
                    ) : (
                        <p>No favorite markets</p>
                    )}
                </ul>
            </div>
        </div>
    );
}

export default Profile;