import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import BasketSales from './BasketSales';

function Profile({ marketData }) {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [tempProfileData, setTempProfileData] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [vendorFavs, setVendorFavs] = useState([]);
    const [marketFavs, setMarketFavs] = useState([]);

    const weekday = ["Mon", "Tues", "Wed", "Thur", "Fri", "Sat", "Sun"];

    const states = [
        "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
        "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
        "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
        "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
        "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
    ];

    function timeConverter(time24) {
        const date = new Date('1970-01-01T' + time24);
        const time12 = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
        return time12;
    }

    const formatPhoneNumber = (phone) => {
        const cleaned = ('' + phone).replace(/\D/g, '');
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            return `(${match[1]}) ${match[2]}-${match[3]}`;
        }
        return phone;
    };

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const token = sessionStorage.getItem('jwt-token');
                const response = await fetch(`http://127.0.0.1:5555/users/${id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const text = await response.text();
                console.log('Raw response:', text);

                if (response.ok) {
                    try {
                        const data = JSON.parse(text);
                        setProfileData({ ...data });
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

        fetchProfileData();
    }, [id]);

    const handleEditToggle = () => {
        if (!editMode) {
            setTempProfileData({ ...profileData });
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
            const token = sessionStorage.getItem('jwt-token');
            const response = await fetch(`http://127.0.0.1:5555/users/${id}`, {
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
                setVendorFavs(filteredData);
            })
            .catch(error => console.error('Error fetching favorites', error));
    }, []);

    useEffect(() => {
        fetch("http://127.0.0.1:5555/market-favorites")
            .then(response => response.json())
            .then(data => {
                const filteredData = data.filter(item => item.user_id === parseInt(globalThis.sessionStorage.getItem('user_id')));
                setMarketFavs(filteredData);
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
                    <div className='margin-t-16'>
                        <div className="form-group">
                            <label>First Name:</label>
                            <input
                                type="text"
                                name="first_name"
                                value={tempProfileData ? tempProfileData.first_name : ''}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Last Name:</label>
                            <input
                                type="text"
                                name="last_name"
                                value={tempProfileData ? tempProfileData.last_name : ''}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Email:</label>
                            <input
                                type="email"
                                name="email"
                                value={tempProfileData ? tempProfileData.email : ''}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone:</label>
                            <input
                                type="tel"
                                name="phone"
                                value={tempProfileData ? formatPhoneNumber(tempProfileData.phone) : ''}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="form-address">
                            <label>Address:</label>
                            <input
                                type="text"
                                name="address_1"
                                size="36"
                                placeholder='Address 1'
                                value={tempProfileData ? tempProfileData.address_1 : ''}
                                onChange={handleInputChange}
                            />
                            <input
                                type="text"
                                name="address_2"
                                size="8"
                                placeholder='Apt, Floor, Suite # etc'
                                value={tempProfileData ? tempProfileData.address_2 : ''}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className='form-address'>
                            <label></label>
                            <input
                                type="text"
                                name="city"
                                size="36"
                                placeholder='City'
                                value={tempProfileData ? tempProfileData.city : ''}
                                onChange={handleInputChange}
                            />
                            <select className='select-state'
                                name="state"
                                value={tempProfileData ? tempProfileData.state : ''}
                                onChange={handleInputChange}
                            >
                                <option value="">Select</option>
                                {states.map((state, index) => (
                                    <option key={index} value={state}>
                                        {state}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                name="zip"
                                size="5"
                                placeholder='Zipcode'
                                value={tempProfileData ? tempProfileData.zip : ''}
                                onChange={handleInputChange}
                            />
                        </div>
                        <button className='btn-edit' onClick={handleSaveChanges}>Save Changes</button>
                        <button className='btn-edit' onClick={handleEditToggle}>Cancel</button>
                    </div>
                ) : (
                    <>
                        <table className='margin-t-16'>
                            <tbody>
                                <tr>
                                    <td className='cell-title'>Name:</td>
                                    <td className='cell-text'>{profileData.first_name} {profileData.last_name}</td>
                                </tr>
                                <tr>
                                    <td className='cell-title'>Email:</td>
                                    <td className='cell-text'>{profileData.email}</td>
                                </tr>
                                <tr>
                                    <td className='cell-title'>Phone:</td>
                                    <td className='cell-text'>{formatPhoneNumber(profileData.phone)}</td>
                                </tr>
                                <tr>
                                    <td className='cell-title'>Address:</td>
                                    <td className='cell-text'>{profileData.address_1}, {profileData.address_2}</td>
                                </tr>
                                <tr>
                                    <td className='cell-title'></td>
                                    <td className='cell-text'>{profileData.city}, {profileData.state} {profileData.zip}</td>
                                </tr>
                            </tbody>
                        </table>
                        <button className='btn-edit' onClick={handleEditToggle}>Edit</button>
                    </>
                )}
            </div>

            <div className='bounding-box'>
                <BasketSales />
            </div>
            <div className='bounding-box'>
                <h2>Favorites</h2>
                <br/>
                <h3>Vendors</h3>
                <ul className='favorites-list'>
                    {vendorFavs.length > 0 ? (
                        vendorFavs.map((data) => (
                            <li key={data.id}>
                                <Link to={`/user/vendors/${data.vendor_id}`}><b>{data.vendor.name}</b> <i>of {data.vendor.city}, {data.vendor.state}</i></Link>
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
                                <Link to={`/user/markets/${data.market_id}`}><b>{data.market.name}</b> <i>open {data.market.schedule}</i></Link>
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