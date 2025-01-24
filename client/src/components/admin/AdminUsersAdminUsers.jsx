import React, { useEffect, useState } from 'react';
import { formatPhoneNumber } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [query, setQuery] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [userData, setUserData] = useState(null);
    const [tempUserData, setTempUserData] = useState(null);
    const [image, setImage] = useState(null);
    const [adminUserData, setAdminUserData] = useState(null);

    const token = localStorage.getItem('admin_jwt-token');
    const adminUserId = localStorage.getItem('admin_user_id')
    
    const onUpdateQuery = event => setQuery(event.target.value);
    const filteredUsers = users.filter(user => user.email.toLowerCase().includes(query.toLowerCase()) && user.email !== query)
    const matchingUser = users.find(user => user.email.toLowerCase() === query.toLowerCase());
    const matchingUserId = matchingUser ? matchingUser.id : null;

    const navigate = useNavigate()

    useEffect(() => {
        fetch("http://127.0.0.1:5555/api/admin-users", {
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
            if (!adminUserId) return
            const fetchUserData = async () => {
                try {
                    const response = await fetch(`http://127.0.0.1:5555/api/admin-users/${adminUserId}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setAdminUserData(data);
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
        }, [adminUserId]);

    useEffect(() => {
        if (!matchingUserId) return
        const fetchUserData = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:5555/api/admin-users/${matchingUserId}`, {
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

    const handleSaveChanges = async () => {
        if (confirm(`Are you sure you want to edit ${userData.first_name}'s account?`)) {
            try {
                const response = await fetch(`http://127.0.0.1:5555/api/admin-users/${userData.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(tempUserData)
                });
                // console.log('Request body:', JSON.stringify(tempUserData));
                if (response.ok) {
                    const updatedData = await response.json();
                    setUserData(updatedData);
                    setEditMode(false);
                    // console.log('Profile data updated successfully:', updatedData);
                } else {
                    console.log('Failed to save changes');
                    console.log('Response status:', response.status);
                    console.log('Response text:', await response.text());
                }
            } catch (error) {
                console.error('Error saving changes:', error);
            }
        }
    };

    const handleAdminDelete = async () => {
        if (!matchingUserId) return
        if (confirm(`Are you sure you want to delete this admin?`)) {
            try {

                fetch(`http://127.0.0.1:5555/api/admin-users/${matchingUserId}`, {
                    method: "DELETE",
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                }).then(() => {
                    setUsers((prev) => prev.filter((item) => item.id !== matchingUserId))
                    window.location.reload()
                    navigate('/admin/users?tab=admin-user')
                })
            } catch (error) {
                console.error("Error deleting admin", error)
            }
        }
    }

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setTempUserData((prev) => ({
            ...prev,
            [name]: value,
        }));
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
        <>
            <div>
                <div className='box-bounding'>
                    <h2>Edit Admin Users</h2>
                    <table className='margin-t-16'>
                        <tbody>
                            <tr>
                                <td className='cell-title'>Search:</td>
                                <td className='cell-text'>
                                    <input id='search' className="search-bar" type="text" placeholder="Search admins..." value={query} onChange={onUpdateQuery} />
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
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={tempUserData ? formatPhoneNumber(tempUserData.phone) : ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                {userData?.admin_role > 0 && adminUserData?.admin_role === 0 ? (
                                    <div className='form-group'>
                                        <label>Admin Role:</label>
                                        <select
                                            name="admin_role"
                                            value={tempUserData ? tempUserData.admin_role : ''}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Select</option>
                                            <option value={1}>1</option>
                                            <option value={2}>2</option>
                                            <option value={3}>3</option>
                                            <option value={4}>4</option>
                                            <option value={5}>5</option>
                                        </select>
                                    </div>
                                ) : (
                                    null
                                )}
                                {userData?.admin_role > 1 && 2 >= adminUserData?.admin_role >= 1  && adminUserData.admin_role !== 0 ? (
                                    <div className='form-group'>
                                        <label>Admin Role:</label>
                                        <select
                                            name="admin_role"
                                            value={tempUserData ? tempUserData.admin_role : ''}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Select</option>
                                            <option value={2}>2</option>
                                            <option value={3}>3</option>
                                            <option value={4}>4</option>
                                            <option value={5}>5</option>
                                        </select>
                                    </div>
                                ) : (
                                    null
                                )}
                                <button className='btn-edit' onClick={handleSaveChanges}>Save Changes</button>
                                <button className='btn-edit' onClick={handleEditToggle}>Cancel</button>
                            </div>
                        ) : (
                            <>
                                <table className='table-profile'>
                                    <tbody>
                                        <tr>
                                            <td className='cell-title'>Admin User ID:</td>
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
                                            <td className='cell-title'>Admin Role:</td>
                                            <td className='cell-text'>{userData ? `${userData.admin_role}` : ""}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <button className='btn-edit' onClick={handleEditToggle}>Edit</button>
                                <button className='btn-edit' onClick={handleAdminDelete}>Delete</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminUsers;