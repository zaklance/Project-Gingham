import React, { useState, useEffect } from 'react';
import VendorNotification from './VendorNotification';


function VendorTeam({ vendors, vendorId, vendorUserData }) {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [teamMembers, setTeamMembers] = useState([]);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberRole, setNewMemberRole] = useState('Employee'); 


    useEffect(() => {
        if (!vendorId) return;

        const fetchNotifications = async () => {
            const token = sessionStorage.getItem('jwt-token');
            setIsLoading(true);
            if (!token) {
                console.error("Token missing");
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`http://127.0.0.1:5555/api/vendor-notifications/${vendorId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Notifications fetched:', data);
                    setNotifications(data.notifications || []);
                } else {
                    console.error('Failed to fetch notifications');
                    setNotifications([]);
                }
            } catch (error) {
                console.error('Error fetching notifications:', error);
                setNotifications([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotifications();
    }, [vendorId]); 

    useEffect(() => {
        const fetchTeamMembers = async () => {
            if (vendorUserData && vendorUserData.vendor_id) {
                try {
                    const token = sessionStorage.getItem('jwt-token');
                    const response = await fetch(`http://127.0.0.1:5555/api/vendor-users?vendor_id=${vendorUserData.vendor_id}`, {
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
            const response = await fetch('http://127.0.0.1:5555/api/vendor-users', {
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
        if (confirm(`Are you sure you want to delete this team member?`)) {
            try {
                const token = sessionStorage.getItem('jwt-token');
                const response = await fetch(`http://127.0.0.1:5555/api/vendor-users/${memberId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        vendor_id: null
                    })
                });
    
                if (response.ok) {
                    setTeamMembers(teamMembers.filter(member => member.id !== memberId));
                } else {
                    const errorData = await response.json();
                    console.error('Error updating team member:', errorData);
                }
            } catch (error) {
                console.error('Error updating team member:', error);
            }
        }
    };

    const handleToggleRole = async (memberId, currentRole) => {
        const isAdmin = currentRole === 'Admin' ? false : true;
        try {
            const token = sessionStorage.getItem('jwt-token');
            const response = await fetch(`http://127.0.0.1:5555/api/vendor-users/${memberId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_admin: isAdmin })
            });

            if (response.ok) {
                setTeamMembers(teamMembers.map(member =>
                    member.id === memberId ? { ...member, role: isAdmin ? 'Admin' : 'Employee' } : member
                ));
            } else {
                console.error('Error updating role');
            }
        } catch (error) {
            console.error('Error updating role:', error);
        }
    };

    return (
        <>
            <div className='box-bounding'>
                <h2 className='margin-b-16'>Notifications</h2>
                {notifications && notifications.length > 0 ? (
                    <VendorNotification notifications={notifications} vendorId={vendorId} />
                ) : (
                    <p>No notifications.</p>
                )}
            </div>
            <div className='box-bounding'>
                <h2 className="title">Team Members</h2>
                <div className="box-bounding">
                    <h3 className='margin-b-16'>Invite Team Members:</h3>
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
                    <h3 className='margin-b-16 margin-t-24'>Current Team Members:</h3>
                    <ul className='ul-team box-scroll-small'>
                        {teamMembers.map(member => (
                            <li key={member.id} className='li-team'>

                                <div className='flex-space-between'>
                                    <p><strong>{member.first_name} {member.last_name}</strong> - {member.role}</p>
                                    {member.id !== vendorUserData.id && (
                                        <>
                                            <div className='flex-end flex-align-center'>
                                                <button className="btn btn-small btn-white margin-r-8" onClick={() => handleToggleRole(member.id, member.role)} > Switch to {member.role === 'Admin' ? 'Employee' : 'Admin'} </button>
                                                <button className="btn btn-small btn-unreport" onClick={() => handleDeleteTeamMember(member.id)} > Remove from Vendor Team</button>
                                            </div> 
                                        </>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    )
}
export default VendorTeam;