import React, { useEffect, useState } from 'react';
import { formatPhoneNumber } from "@repo/ui/helpers.js";
import { avatars_default, status } from "@repo/ui/common.js";
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

const AdminUsersUsers = () => {
    const [users, setUsers] = useState([]);
    const [query, setQuery] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [userData, setUserData] = useState(null);
    const [tempUserData, setTempUserData] = useState(null);
    const [image, setImage] = useState(null);

    const token = localStorage.getItem('admin_jwt-token');

    const onUpdateQuery = event => setQuery(event.target.value);
    const filteredUsers = users.filter(user => user.email.toLowerCase().includes(query.toLowerCase()) && user.email !== query)
    const matchingUser = users.find(user => user.email.toLowerCase() === query.toLowerCase());
    const matchingUserId = matchingUser ? matchingUser.id : null;

    const navigate = useNavigate()

    const siteURL = import.meta.env.VITE_SITE_URL;

    useEffect(() => {
        fetch("/api/users", {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => setUsers(data))
            .catch(error => console.error('Error fetching users:', error));
    }, [token]);

    useEffect(() => {
            if (!matchingUserId) return
            const fetchUserData = async () => {
                try {
                    const response = await fetch(`/api/users/${matchingUserId}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setUserData(data);
                    } else {
                        console.error('Error fetching profile:', response.status);
                        if (response.status === 401) {
                            console.error('Unauthorized: Token may be missing or invalid');
                        }
                    }
                } catch (error) {
                    console.error('Error fetching vendor data:', error);
                }
            };
            fetchUserData();
        }, [matchingUserId]);

    const handleDeleteImage = async () => {
        if (!userData || !userData.avatar) {
            toast.warning('No image to delete.', {
                autoClose: 4000,
            });
            return;
        }

        if (!userData.id) {
            toast.warning('User ID is not defined', {
                autoClose: 4000,
            });
            return;
        }

        try {
            console.log('Deleting image with filename:', userData.avatar);
            console.log('User ID:', userData.id);

            const response = await fetch(`/api/delete-image`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    filename: userData.avatar,
                    user_id: userData.id,
                    type: 'user',
                }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Image deleted response:', result);

                setUserData((prev) => ({
                    ...prev,
                    avatar: null,
                }));

                toast.success('Image deleted successfully.', {
                    autoClose: 4000,
                });
            } else {
                const errorText = await response.text();
                console.error('Failed to delete image:', errorText);
                toast.success(`Failed to delete the image: ${JSON.parse(errorText).error}`, {
                    autoClose: 4000,
                });
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            toast.success('An unexpected error occurred while deleting the image.', {
                autoClose: 4000,
            });
        }
    };

    const handleSaveChanges = async () => {
        let uploadedFilename = null;
        
        if (confirm(`Are you sure you want to edit ${userData.first_name}'s account?`)) {
            try {
                const apiKey = import.meta.env.VITE_RADAR_KEY;
                const query = `${tempUserData.zipcode}`;
                if (tempUserData.zipcode !== userData.zipcode) {
                    const responseRadar = await fetch(`https://api.radar.io/v1/geocode/forward?query=${encodeURIComponent(query)}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': apiKey,
                        },
                    });
                    if (responseRadar.ok) {
                        const data = await responseRadar.json();
                        if (data.addresses && data.addresses.length > 0) {
                            const { city, stateCode, latitude, longitude } = data.addresses[0];

                            const response = await fetch(`/api/users/${userData.id}`, {
                                method: 'PATCH',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    first_name: tempUserData.first_name,
                                    last_name: tempUserData.last_name,
                                    phone: tempUserData.phone,
                                    city: city,
                                    state: stateCode,
                                    zipcode: tempUserData.zipcode,
                                    avatar_default: tempUserData.avatar_default,
                                    coordinates: { lat: latitude, lng: longitude }
                                })
                            });
                            if (response.ok) {
                                const updatedData = await response.json();
                                setUserData(updatedData);
                                setEditMode(false);
                                setUsers(prevUsers =>
                                    prevUsers.map(user =>
                                        user.id === updatedData.id ? updatedData : user
                                    )
                                );
                                setQuery(updatedData.email)
                                // console.log('Profile data updated successfully:', updatedData);
                            } else {
                                console.log('Failed to save changes');
                                console.log('Response status:', response.status);
                                console.log('Response text:', await response.text());
                            }
                        }
                    }
                } else {
                    const response = await fetch(`/api/users/${userData.id}`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            first_name: tempUserData.first_name,
                            last_name: tempUserData.last_name,
                            phone: tempUserData.phone,
                            avatar_default: tempUserData.avatar_default
                        })
                    });

                    if (response.ok) {
                        const updatedData = await response.json();
                        setUserData(updatedData);
                        setEditMode(false);
                        console.log('Profile data updated successfully:', updatedData);
                        toast.success('Profile updated successfully.', {
                            autoClose: 4000,
                        });
                    } else {
                        console.log('Failed to save changes');
                        console.log('Response status:', response.status);
                        console.log('Response text:', await response.text());
                        toast.error('Profile failed to update successfully.', {
                            autoClose: 4000,
                        });
                    }
                }
                if (image) {

                    const maxFileSize = 20 * 1024 * 1024
                    if (image.size > maxFileSize) {
                        toast.success('File size exceeds 20 MB. Please upload a smaller file.', {
                            autoClose: 4000,
                        });
                        return;
                    }

                    console.log('Uploading file...');
                    const formData = new FormData();
                    formData.append('file', image);
                    formData.append('type', 'user');
                    formData.append('user_id', userData.id);

                    for (const [key, value] of formData.entries()) {
                        console.log(`${key}:`, value);
                    }

                    try {
                        const result = await fetch('/api/upload', {
                            method: 'POST',
                            body: formData,
                        });

                        console.log('Request Body:', formData);

                        if (result.ok) {
                            const data = await result.json();
                            uploadedFilename = `${userData.id}/${data.filename}`;
                            console.log('Image uploaded:', uploadedFilename);
                            setUserData((prevData) => ({
                                ...prevData,
                                avatar: uploadedFilename, // Update avatar with the new filename
                            }));
                        } else {
                            console.log('Image upload failed');
                            console.log('Response:', await result.text());
                            return;
                        }
                    } catch (error) {
                        console.error('Error uploading image:', error);
                        return;
                    }
                    window.location.reload()
                    navigate('/users?tab=user')
                }
            } catch (error) {
                console.error('Error saving changes:', error);
            }
        }
    };

    const handleFileChange = (event) => {
        if (event.target.files) {
            setImage(event.target.files[0]);
        }
    }

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setTempUserData({
            ...tempUserData,
            [name]: value
        });
    };

    const handlePhoneInputChange = event => {
        setTempUserData({
            ...tempUserData,
            ['phone']: event
        });
    };

    const handleEditToggle = () => {
        if (!editMode) {
            setTempUserData({
                ...userData,
            });
        } else {
            setTempUserData(null);
        }
        setEditMode(!editMode);
    };


    return (
        <div>
            <title>gingham • Admin Users • Users</title>
            <div className='box-bounding'>
                <h2>Edit Users</h2>
                <table className='margin-t-16'>
                    <tbody>
                        <tr>
                            <td className='cell-title'>Search:</td>
                            <td className='cell-text'>
                                <input id='search' className="search-bar" type="text" placeholder="Search users..." value={query} onChange={onUpdateQuery} />
                                <div className="dropdown-content">
                                    {
                                        query &&
                                        filteredUsers.slice(0, 10).map(item => <div className="search-results" key={item.id} onClick={(e) => setQuery(item.email)}>
                                            {item.email}
                                        </div>)
                                    }
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div>
                    {editMode ? (
                        <div className='margin-t-16'>
                            <div className="form-group">
                                <label>Status:</label>
                                <select className='select'
                                    name="status"
                                    value={tempUserData ? tempUserData.status : ''}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select</option>
                                    {Object.entries(status).map(([key, value], index) => (
                                        <option key={index} value={value}>
                                            {key}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>First Name:</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={tempUserData ? tempUserData.first_name : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Last Name:</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={tempUserData ? tempUserData.last_name : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Email:</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={tempUserData ? tempUserData.email : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone:</label>
                                <PhoneInput
                                    className='input-phone margin-l-8'
                                    countryCallingCodeEditable={false}
                                    withCountryCallingCode
                                    country='US'
                                    defaultCountry='US'
                                    placeholder="enter your phone number"
                                    value={tempUserData.phone || ''}
                                    onChange={(event) => handlePhoneInputChange(event)}
                                />
                                {/* <input
                                    type="tel"
                                    name="phone"
                                    value={tempUserData ? formatPhoneNumber(tempUserData.phone) : ''}
                                    onChange={handleInputChange}
                                /> */}
                            </div>
                            <div className='form-address'>
                                <label>Zip Code</label>
                                <input
                                    type="text"
                                    name="zipcode"
                                    size="5"
                                    placeholder='Zipcode'
                                    value={tempUserData ? tempUserData.zipcode : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Default Avatar:</label>
                                <select className='select'
                                    name="avatar_default"
                                    value={tempUserData ? tempUserData.avatar_default : ''}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select</option>
                                    {Object.entries(avatars_default).map(([key, value], index) => (
                                        <option key={index} value={value}>
                                            {key}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className='form-group'>
                                <label>Avatar:</label>
                                    <img
                                        className='img-avatar-profile'
                                        src={tempUserData.avatar ? `${siteURL}${tempUserData.avatar}` : `/user-images/_default-images/${tempUserData.avatar_default}`}
                                        alt="Avatar"
                                        style={{ maxWidth: '100%', height: 'auto', padding: '4px' }}
                                    />
                                <div className='flex-start flex-center-align'>
                                    <div className='margin-l-8'>
                                        <button className='btn btn-small btn-blue' onClick={handleDeleteImage}>Delete Image</button>
                                    </div>
                                    <label htmlFor='file-upload' className='btn btn-small btn-file btn-blue nowrap'>Choose File{image && <span id="file-name" className='text-white-background margin-l-8'>{image.name}</span>}</label>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        name="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>
                            <button className='btn-edit' onClick={handleSaveChanges}>Save Changes</button>
                            <button className='btn-edit' onClick={handleEditToggle}>Cancel</button>
                        </div>
                    ) : (
                        <>
                            <div className='flex-start flex-gap-16 flex-start-align m-flex-wrap'>
                                <div className='width-80'>
                                    <table className='table-profile'>
                                        <tbody>
                                            <tr>
                                                <td className='cell-title'>Status:</td>
                                                <td className='cell-text'>{userData?.status || ""}</td>
                                            </tr>
                                            <tr>
                                                <td className='cell-title'>ID:</td>
                                                <td className='cell-text'>{userData?.id || ""}</td>
                                            </tr>
                                            <tr>
                                                <td className='cell-title'>Name:</td>
                                                <td className='cell-text'>{userData?.first_name || ""} {userData?.last_name || ""}</td>
                                            </tr>
                                            <tr>
                                                <td className='cell-title'>Email:</td>
                                                <td className='cell-text'>{userData?.email || ""}</td>
                                            </tr>
                                            <tr>
                                                <td className='cell-title'>Phone:</td>
                                                <td className='cell-text'>{formatPhoneNumber(userData?.phone) || ""}</td>
                                            </tr>
                                            <tr>
                                                <td className='cell-title'>City</td>
                                                <td className='cell-text'>{userData ? `${userData?.city}, ${userData?.state}` : ""}</td>
                                            </tr>
                                            <tr>
                                                <td className='cell-title'>Zip Code</td>
                                                <td className='cell-text'>{userData ? `${userData?.zipcode}` : ""}</td>
                                            </tr>
                                            <tr>
                                                <td className='cell-title'>Default Avatar:</td>
                                                <td className='cell-text'>{userData?.avatar_default || ""} </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <button className='btn-edit' onClick={handleEditToggle}>Edit</button>
                                </div>
                                {userData ? <img className='img-avatar-profile' src={userData.avatar ? `${siteURL}${userData.avatar}` : `/user-images/_default-images/${userData.avatar_default}`} alt="Avatar" /> : ""}
                            </div>
                        </>
                    )}
                </div>
            </div>            
        </div>
    );
};

export default AdminUsersUsers;