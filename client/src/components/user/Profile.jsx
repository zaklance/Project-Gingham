import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { states } from '../../utils/common';
import { timeConverter, formatPhoneNumber } from '../../utils/helpers';
import BasketSales from './BasketSales';

function Profile({ marketData }) {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [tempProfileData, setTempProfileData] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [vendorFavs, setVendorFavs] = useState([]);
    const [marketFavs, setMarketFavs] = useState([]);
    const [image, setImage] = useState(null)
    const [status, setStatus] = useState('initial')

    const userId = parseInt(globalThis.localStorage.getItem('user_id'))

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
        const fetchProfileData = async () => {
            try {
                const token = localStorage.getItem('user_jwt-token');

                if (token) {
                    // Decode the token to extract the role
                    const decodedToken = decodeJwt(token);
                    if (decodedToken && decodedToken.role) {
                        console.log('Role from JWT:', decodedToken.role);
                    }
                }
                
                const response = await fetch(`http://127.0.0.1:5555/api/users/${id}`, {
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
            const token = localStorage.getItem('user_jwt-token');
            const response = await fetch(`http://127.0.0.1:5555/api/users/${id}`, {
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
            if (image) {

                const maxFileSize = 25 * 1024 * 1024
                if (image.size > maxFileSize) {
                    alert("File size exceeds 25 MB. Please upload a smaller file.");
                    return;
                }

                console.log('Uploading file...');
                setStatus('uploading');
                const formData = new FormData();
                formData.append('file', image);
                formData.append('type', 'vendor');
                formData.append('user_id', id);

                for (const [key, value] of formData.entries()) {
                    console.log(`${key}:`, value);
                }

                try {
                    const result = await fetch('http://127.0.0.1:5555/api/upload', {
                        method: 'POST',
                        body: formData,
                    });

                    console.log('Request Body:', formData);

                    if (result.ok) {
                        const data = await result.json();
                        uploadedFilename = data.filename;
                        console.log('Image uploaded:', uploadedFilename);
                        setStatus('success');
                        setVendorImageURL(`http://127.0.0.1:5555/api/users/${id}/image`);
                    } else {
                        console.log('Image upload failed');
                        console.log('Response:', await result.text());
                        setStatus('fail');
                        return;
                    }
                } catch (error) {
                    console.error('Error uploading image:', error);
                    setStatus('fail');
                    return;
                }
            }
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    };

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/api/vendor-favorites?user_id=${userId}`)
            .then(response => response.json())
            .then(data => {
                setVendorFavs(data);
            })
            .catch(error => console.error('Error fetching vendor favorites', error));
    }, []);

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/api/market-favorites?user_id=${userId}`)
            .then(response => response.json())
            .then(data => {
                setMarketFavs(data);
            })
            .catch(error => console.error('Error fetching market favorites', error));
    }, []);

    const handleFileChange = (event) => {
        if (event.target.files) {
            setStatus('initial');
            setImage(event.target.files[0]);
        }
    }

    console.log(profileData)

    if (!profileData) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Welcome to Your Profile, {profileData.first_name}!</h1>
            <div className='box-bounding'>
                <h2 className='margin-b-16'>Profile Information</h2>
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
                                name="zipcode"
                                size="5"
                                placeholder='Zipcode'
                                value={tempProfileData ? tempProfileData.zipcode : ''}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className='form-group'>
                            <label>Avatar:</label>
                            <input
                                type="file"
                                name="file"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                        <button className='btn-edit' onClick={handleSaveChanges}>Save Changes</button>
                        <button className='btn-edit' onClick={handleEditToggle}>Cancel</button>
                    </div>
                ) : (
                    <>
                        <div className='flex-space-evenly flex-gap-16 flex-start-align'>
                            {profileData.avatar !== null ? (
                                <img className='img-avatar-profile' src={`/user-images/${review.user.avatar}`} alt="Avatar" />
                            ) : (
                                <img className='img-avatar-profile' src={`/site-images/avatar-orange.jpg`} alt="Avatar" />
                            )}
                            <div className='width-80'>
                                <table className='table-profile'>
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
                                            <td className='cell-text'>{profileData.city}, {profileData.state} {profileData.zipcode}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <button className='btn-edit' onClick={handleEditToggle}>Edit</button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className='box-bounding'>
                <BasketSales />
            </div>
            <div className='box-bounding'>
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