import React, { useState, useEffect } from 'react';
import { useParams, NavLink, Link, Route, Routes, BrowserRouter as Router} from 'react-router-dom';
import BasketCard from './BasketCard';
import VendorCreate from './VendorCreate';

function VendorProfile () {
    const { id } = useParams();
    const [editMode, setEditMode] = useState(false);
    const [vendorEditMode, setVendorEditMode] = useState(false);
    const [vendorUserData, setVendorUserData] = useState(null);
    const [tempVendorUserData, setTempVendorUserData] = useState(null);
    const [locations, setLocations] = useState([]);
    const [marketDetails, setMarketDetails] = useState({});
    const [vendorData, setVendorData] = useState(null);
    const [image, setImage] = useState(null)
    const [status, setStatus] = useState('initial')
    const [vendorImageURL, setVendorImageURL] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberRole, setNewMemberRole] = useState('Employee'); 

    const products = [
        'Art', 'Baked Goods', 'Cheese', 'Cider', 'Ceramics', 'Coffee/Tea', 'Fish', 'Flowers', 'Fruit', 'Gifts', 'Honey', 
        'International', 'Juice', 'Maple Syrup', 'Meats', 'Mushrooms', 'Nuts', 'Pasta', 'Pickles', 'Spirits', 'Vegetables'
    ];

    const states = [
        "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", 
        "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", 
        "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
        "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", 
        "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
      ];
    
    const formatPhoneNumber = (phone) => {
        const cleaned = ('' + phone).replace(/\D/g, '');
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            return `(${match[1]}) ${match[2]}-${match[3]}`;
        }
        return phone;
    };
    
    useEffect(() => {
        const fetchVendorUserData = async () => {
            try {
                const token = sessionStorage.getItem('jwt-token');
                const response = await fetch(`http://127.0.0.1:5555/vendor-users/${id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json' 
                    }
                });

                const text = await response.text();

                if (response.ok) {
                    try {
                        const data = JSON.parse(text);
                        setVendorUserData({
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

    useEffect(() => {
        const fetchTeamMembers = async () => {
            if (vendorUserData && vendorUserData.vendor_id) {
                try {
                    const token = sessionStorage.getItem('jwt-token');
                    const response = await fetch(`http://127.0.0.1:5555/vendor-users?vendor_id=${vendorUserData.vendor_id}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        setTeamMembers(data);
                    }
                } catch (error) {
                    console.error('Error fetching team members:', error);
                }
            }
        };
        fetchTeamMembers();
    }, [vendorUserData]);

    const handleAddTeamMember = async () => {
        try {
            const token = sessionStorage.getItem('jwt-token');
            const response = await fetch('http://127.0.0.1:5555/vendor-users', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: newMemberEmail,
                    role: newMemberRole,
                    vendor_id: vendorUserData.vendor_id
                })
            });
    
            if (response.ok) {
                const addedMember = await response.json();
                setTeamMembers([...teamMembers, addedMember]);
                setNewMemberEmail('');
                setNewMemberRole('Employee');
            } else {
                console.error('Error adding team member');
            }
        } catch (error) {
            console.error('Error adding team member:', error);
        }
    };

    const handleDeleteTeamMember = async (memberId) => {
        try {
            const token = sessionStorage.getItem('jwt-token');
            const response = await fetch(`http://127.0.0.1:5555/vendor-users/${memberId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
    
            if (response.ok) {
                setTeamMembers(teamMembers.filter(member => member.id !== memberId));
            } else {
                console.error('Error deleting team member');
            }
        } catch (error) {
            console.error('Error deleting team member:', error);
        }
    };
    
    const handleToggleRole = async (memberId, currentRole) => {
        const newRole = currentRole === 'Admin' ? 'Employee' : 'Admin';
        try {
            const token = sessionStorage.getItem('jwt-token');
            const response = await fetch(`http://127.0.0.1:5555/vendor-users/${memberId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ role: newRole })
            });
    
            if (response.ok) {
                setTeamMembers(teamMembers.map(member => 
                    member.id === memberId ? { ...member, role: newRole } : member
                ));
            } else {
                console.error('Error updating role');
            }
        } catch (error) {
            console.error('Error updating role:', error);
        }
    };

    const handleInputChange = event => {
        const { name, value } = event.target;
        setTempVendorUserData({
            ...tempVendorUserData,
            [name]: value,
        });
    };

    const handleEditToggle = () => {
        setEditMode(!editMode);
        if (!editMode) {
            setTempVendorUserData({
                first_name: vendorUserData.first_name,
                last_name: vendorUserData.last_name,
                email: vendorUserData.email,
                phone: vendorUserData.phone,
            });
        }
    };

    const handleFileChange = (event) => {
        if (event.target.files) {
            setStatus('initial');
            setImage(event.target.files[0]);
        }
    }

    const handleSubmit = (event) => {
        event.preventDefault()
        console.log('File to Upload: ', image)
    }

    const handleSaveChanges = async () => {
        try {
            const token = sessionStorage.getItem('jwt-token');
            const response = await fetch(`http://127.0.0.1:5555/vendor-users/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tempVendorUserData),
            });
    
            if (response.ok) {
                const updatedData = await response.json();
                setVendorUserData(updatedData);
                setEditMode(false);
            } else {
                console.log('Failed to save changes');
            }
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    };

    useEffect(() => {
        const fetchVendorData = async () => {
            if (!vendorUserData || !vendorUserData.vendor_id) return;
    
            try {
                const response = await fetch(`http://127.0.0.1:5555/vendors/${vendorUserData.vendor_id}`);
                if (response.ok) {
                    const data = await response.json();
                    setVendorData(data);
                    if (data.image) {
                        setVendorImageURL(`http://127.0.0.1:5555/vendors/${vendorUserData.vendor_id}/image`);
                    }
                } else {
                    console.error('Failed to fetch vendor data:', response.status);
                }
            } catch (error) {
                console.error('Error fetching vendor data:', error);
            }
        };
    
        fetchVendorData();
    }, [vendorUserData]);

    const handleVendorInputChange = (event) => {
        setVendorData({
            ...vendorData,
            [event.target.name]: event.target.value,
        });
    };

    const handleVendorEditToggle = () => {
        setVendorEditMode(!vendorEditMode);
    };

    const handleSaveVendorChanges = async () => {
        let uploadedFilename = null;
    
        if (image) {

            const maxFileSize = 25 * 1024 * 1024
            if (image.size > maxFileSize) {
                alert ("File size exceeds 25 MB. Please upload a smaller file.");
                return;
            }

            console.log('Uploading file...');
            setStatus('uploading');
            const formData = new FormData();
            formData.append('file', image);
            formData.append('vendor_id', id);
    
            try {
                const result = await fetch('http://127.0.0.1:5555/upload', {
                    method: 'POST',
                    body: formData,
                });
    
                if (result.ok) {
                    const data = await result.json();
                    uploadedFilename = data.filename;
                    console.log('Image uploaded:', uploadedFilename);
                    setStatus('success');
                    setVendorImageURL(`http://127.0.0.1:5555/vendors/${id}/image`);
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
    
        const updatedVendorData = { ...vendorData };
        if (uploadedFilename) {
            updatedVendorData.image = uploadedFilename;
        }
    
        try {
            const response = await fetch(`http://127.0.0.1:5555/vendors/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'type': "vendor"
                },
                body: JSON.stringify(updatedVendorData),
            });
    
            console.log('Request body:', JSON.stringify(updatedVendorData));
    
            if (response.ok) {
                const updatedData = await response.json();
                setVendorData(updatedData);
                setVendorEditMode(false);
                console.log('Vendor data updated successfully:', updatedData);
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
        if (Array.isArray(locations) && locations.length > 0) {
            const fetchMarketDetails = async () => {
                const promises = locations.map(async marketId => {
                    try {
                        const response = await fetch(`http://127.0.0.1:5555/markets/${marketId}`);
                        if (response.ok) {
                            const marketData = await response.json();
                            return { id: marketId, name: marketData.name };
                        } else {
                            console.log(`Failed to fetch market ${marketId}`);
                            return { id: marketId, name: 'Unknown Market' };
                        }
                    } catch (error) {
                        console.error(`Error fetching market ${marketId}:`, error);
                        return { id: marketId, name: 'Unknown Market' };
                    }
                });

                Promise.all(promises)
                    .then(details => {
                        const vendorDetailsMap = {};
                        details.forEach(detail => {
                            vendorDetailsMap[detail.id] = detail.name;
                        });
                        setMarketDetails(vendorDetailsMap);
                    })
                    .catch(error => {
                        console.error('Error fetching market details:', error);
                    });
            };
            fetchMarketDetails();
        }
    }, [locations]);

    return(
        <div>
            <div className="tab-content">
                <div>
                    <h2 className='title'>Profile Information </h2>
                    
                    <div className='bounding-box'>
                    {editMode && vendorUserData?.is_admin ? (
                        <>
                            <div className='form-group flex-form'>
                                <label>First Name:</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={tempVendorUserData ? tempVendorUserData.first_name : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group flex-form'>
                                <label>Last Name:</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={tempVendorUserData ? tempVendorUserData.last_name : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group flex-form'>
                                <label>Email:</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={tempVendorUserData ? tempVendorUserData.email : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group flex-form'>
                                <label>Phone Number:</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={tempVendorUserData ? tempVendorUserData.phone : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <button className='btn-edit' onClick={handleSaveChanges}>Save Changes</button>
                            <button className='btn-edit' onClick={handleEditToggle}>Cancel</button>
                        </>
                    ) : (
                        <>
                            <table>
                                <tbody>
                                    <tr>
                                        <td className='cell-title'>Name:</td>
                                        <td className='cell-text'>{vendorUserData ? `${vendorUserData.first_name} ${vendorUserData.last_name}` : ' Loading...'}</td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title'>Email:</td>
                                        <td className='cell-text'>{vendorUserData ? vendorUserData.email : ' Loading...'}</td>
                                    </tr>
                                        <td className='cell-title'>Phone:</td>
                                        <td className='cell-text'>{vendorUserData ? formatPhoneNumber(vendorUserData.phone) : 'Loading...'}</td>
                                </tbody>
                            </table>
                            <button className='btn-edit' onClick={handleEditToggle}>Edit</button>
                        </>
                    )}
                    </div>
                    <br />
                    <h2 className='title'>Vendor Information</h2>
                    <div className='bounding-box'>
                    {vendorData?.id ? (
                        vendorEditMode && vendorUserData?.is_admin ? (
                            <>
                                <div className='form-group'>
                                    <label>Vendor Name:</label>
                                    <input 
                                        type="text"
                                        name="name"
                                        value={vendorData ? vendorData.name : ''}
                                        onChange={handleVendorInputChange}
                                    />
                                </div>
                                <div className='form-group'>
                                    <label>Product:</label>
                                    <select
                                        name="product"
                                        value={vendorData ? vendorData.product : ''}
                                        onChange={handleVendorInputChange}
                                    >
                                        <option value="">Select</option>
                                        {products.map((product, index) => (
                                            <option key={index} value={product}>
                                                {product}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className='form-group'>
                                    <label>Based out of:</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={vendorData ? vendorData.city : ''}
                                        onChange={handleVendorInputChange}
                                    />
                                    <select className='select-state'
                                        name="state"
                                        value={vendorData ? vendorData.state : ''} 
                                        onChange={handleVendorInputChange}
                                    >
                                        <option value="">Select</option>
                                        {states.map((state, index) => (
                                            <option key={index} value={state}>
                                                {state}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className='form-group'>
                                    <label>Vendor Image:</label>
                                    <input
                                        type="file"
                                        name="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>
                                <button className='btn-edit' onClick={handleSaveVendorChanges}>Save Changes</button>
                                <button className='btn-edit' onClick={handleVendorEditToggle}>Cancel</button>
                            </>
                        ) : (
                                <>
                                    <div className='flex-start flex-gap-48'>
                                        <table>
                                            <tbody>
                                                <tr>
                                                    <td className='cell-title'>Role:</td>
                                                    <td className='cell-text'>{vendorUserData?.is_admin ? 'Admin' : 'Vendor'}</td>
                                                </tr>
                                                <tr>
                                                    <td className='cell-title'>Name:</td>
                                                    <td className='cell-text'>{vendorData ? vendorData.name : ' Loading...'}</td>
                                                </tr>
                                                <tr>
                                                    <td className='cell-title'>Product:</td>
                                                    <td className='cell-text'>{vendorData ? vendorData.product : ' Loading...'}</td>
                                                </tr>
                                                <tr>
                                                    <td className='cell-title'>Based in:</td>
                                                        <td className='cell-text'>{vendorData ? `${vendorData.city}, ${vendorData.state}` : ' Loading...'}</td>
                                                </tr>
                                                <tr>
                                                    <td className='cell-title'>Image:</td>
                                                        <td className='cell-text'>{vendorData ? <img src={vendorImageURL} alt="Vendor" style={{ maxWidth: '100%', height: 'auto' }} /> : ''}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    {vendorUserData?.is_admin && (    
                                        <div className='flex-start'>
                                            <button className='btn-edit' onClick={handleVendorEditToggle}>Edit</button>
                                        <div>
                                            <div className={status === 'success' ? 'alert-favorites' : 'alert-favorites-hidden'}>
                                                Success Uploading Image
                                            </div>
                                            <div className={status === 'fail' ? 'alert-favorites alert-fail' : 'alert-favorites-hidden'}>
                                                Uploading Image Failed
                                            </div>
                                            <div className={status === 'Uploading' ? 'alert-favorites' : 'alert-favorites-hidden'}>
                                                Uploading Image
                                            </div>
                                        </div>
                                    </div>
                                    )}
                                    
                                    <p><strong>Locations:&emsp;</strong></p>
                                    {Array.isArray(locations) && locations.length > 0 ? (
                                        locations.map((marketId, index) => (
                                            <div key={index} style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
                                                <Link to={`/user/markets/${marketId}`}> {marketDetails[marketId] || 'Loading...'} </Link>
                                            </div>
                                        ))
                                    ) : (
                                        <p>No market locations at this time</p>
                                    )}
                                    <br />
                                    {vendorUserData?.is_admin && (
                                        <>
                                            <h2 className="title">Team Members</h2>
                                            <div className="bounding-box">
                                                <div className='form-group'>
                                                    <label>Email:</label>
                                                    <input
                                                        type="email"
                                                        value={newMemberEmail}
                                                        onChange={e => setNewMemberEmail(e.target.value)}
                                                        placeholder="Enter team member's email"
                                                    />
                                                </div>
                                                <div className='form-group'>
                                                    <label>Role:</label>
                                                    <select
                                                        value={newMemberRole}
                                                        onChange={e => setNewMemberRole(e.target.value)}
                                                    >
                                                        <option value="Admin">Admin</option>
                                                        <option value="Employee">Employee</option>
                                                    </select>
                                                </div>
                                                <button className="btn-edit" onClick={handleAddTeamMember}>Add Team Member</button>
                                                <br />
                                                <h3>Current Team Members:</h3>
                                                <ul>
                                                    {teamMembers.map(member => (
                                                        <li key={member.id} style={{ marginBottom: '1rem'}}>
                                                            {member.first_name} {member.last_name} - {member.role}

                                                            {member.id !== vendorUserData.id && (
                                                                <>
                                                                    <button className="btn-delete" onClick={() => handleToggleRole(member.id, member.role)} > Switch to {member.role === 'Admin' ? 'Employee' : 'Admin'} </button>
                                                                    <button className="btn-delete" onClick={() => handleDeleteTeamMember(member.id)} > Remove from Vendor Team</button>
                                                                </>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </>
                                    )}
                                </>
                            )
                        ) : (
                            <VendorCreate />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default VendorProfile;