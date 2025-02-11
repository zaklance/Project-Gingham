import React, { useState, useEffect } from 'react';
import VendorNotification from './VendorNotification';
import { toast } from 'react-toastify';

function VendorTeam({ vendorId, vendorUserData, notifications, setNotifications }) {
    const [isLoading, setIsLoading] = useState(true);
    const [teamMembers, setTeamMembers] = useState([]);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [confirmMemberEmail, setConfirmMemberEmail] = useState('');
    const [newMemberRole, setNewMemberRole] = useState(true); 

    const fetchTeamMembers = async () => {
        if (vendorUserData && vendorUserData.vendor_id) {
            try {
                const token = localStorage.getItem('vendor_jwt-token');
                const response = await fetch(`/api/vendor-users?vendor_id=${vendorUserData.vendor_id[vendorUserData.active_vendor]}`, {
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

    useEffect(() => {
        fetchTeamMembers();
    }, [vendorUserData]);

    const handleAddTeamMember = async () => {
        if (newMemberEmail !== confirmMemberEmail) {
            toast.warning('Emails do not match.', {
                autoClose: 4000,
            });
            return;
        }
    
        const token = localStorage.getItem('vendor_jwt-token');
    
        try {
            const checkResponse = await fetch(`/api/vendor-users?email=${encodeURIComponent(newMemberEmail)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
    
            if (checkResponse.ok) {
                const existingUser = await checkResponse.json();
                if (existingUser.length > 0) {
                    const userId = existingUser[0].id;
                    const patchResponse = await fetch(`/api/vendor-users/${userId}`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            active_vendor: vendorUserData.vendor_id[vendorUserData.active_vendor],
                            vendor_id: vendorUserData.vendor_id[vendorUserData.active_vendor],
                            vendor_role: newMemberRole
                        }),
                    });
    
                    if (patchResponse.ok) {
                        toast.success('User added to vendor successfully!', {
                            autoClose: 4000,
                        });
                        setNewMemberEmail('');
                        setConfirmMemberEmail('');
                        setNewMemberRole(2);

                        fetchTeamMembers();
                        return;
                    } else {
                        console.error('Error updating existing user:', await patchResponse.json());
                        toast.error('Failed to update existing user.', {
                            autoClose: 4000,
                        });
                        return;
                    }
                }
            }
    
            const createResponse = await fetch('/api/vendor-users', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: newMemberEmail,
                    role: newMemberRole,
                    vendor_id: { [vendorUserData.vendor_id[vendorUserData.active_vendor]]: vendorUserData.vendor_id[vendorUserData.active_vendor] },
                    active_vendor: vendorUserData.vendor_id[vendorUserData.active_vendor]
                })
            });
    
            if (createResponse.ok) {
                const addedMember = await createResponse.json();
                setTeamMembers([...teamMembers, addedMember]);
                setNewMemberEmail('');
                setConfirmMemberEmail('');
                setNewMemberRole(2);
                toast.success('New user invited successfully!', {
                    autoClose: 4000,
                });

                fetchTeamMembers();
            } else {
                console.error('Error adding new team member:', await createResponse.json());
                toast.error('Failed to add new user.', {
                    autoClose: 4000,
                });
            }
            window.location.reload();
        } catch (error) {
            console.error('Error:', error);
            toast.error('An error occurred while adding the team member.', {
                autoClose: 4000,
            });
        }
    };
    
    const handleDeleteTeamMember = async (memberId) => {
        if (confirm(`Are you sure you want to delete this team member?`)) {
            try {
                const token = localStorage.getItem('vendor_jwt-token');
                const response = await fetch(`/api/vendor-users/${memberId}?delete_vendor_id=${vendorId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        active_vendor: null
                    })
                });
    
                if (response.ok) {
                    setTeamMembers(teamMembers.filter(member => member.id !== memberId));
                    toast.success('Successfully deleted team member', {
                        autoClose: 4000,
                    });
                } else {
                    const errorData = await response.json();
                    console.error('Error updating team member:', errorData);
                }
            } catch (error) {
                console.error('Error updating team member:', error);
            }
        }
    };

    const handleToggleRole = async (member, currentRole) => {
        let newRole;
        if (currentRole == 1) {
            newRole = 2;
        } else if (currentRole == 2) {
            newRole = 1;
        } else {
            console.error('Invalid role');
            return;
        }
    
        if (!member) {
            toast.warning('Member not found.', {
                autoClose: 4000,
            });
            return;
        }
        try {
            const token = localStorage.getItem('vendor_jwt-token');
            const response = await fetch(`/api/vendor-users/${member.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    vendor_role: newRole,
                    vendor_id: member.vendor_id[vendorId],
                    first_name: member.first_name,
                    last_name: member.last_name,
                    email: member.email, 
                }),
            });
    
            if (response.ok) {
                setTeamMembers((prev) =>
                    prev.map((item) =>
                        item.id === member.id
                            ? {
                                ...item,
                                vendor_role: {
                                    ...item.vendor_role,
                                    [vendorId]: newRole,
                                },
                            }
                            : item
                    )
                );

                toast.success(`Successfully updated role to ${newRole == 1 ? 'Admin' : 'Employee'}`, {
                    autoClose: 5000,
                });
            } else {
                const responseData = await response.json();
                console.error('Error updating role:', responseData.message || response.statusText);
                toast.error(responseData.message || 'Failed to update the role. Please try again.', {
                    autoClose: 5000,
                });
            }
        } catch (error) {
            console.error('Error updating role:', error);
            toast.error('An error occurred while updating the role. Please try again.', {
                autoClose: 6000,
            });
        }
    };
    
    
    return (
        <>
            {notifications && notifications.length > 0 ? (
                <div className='box-bounding margin-b-24'>
                    <h2 className='margin-b-16'>Notifications</h2>
                        <VendorNotification notifications={notifications} setNotifications={setNotifications} vendorId={vendorId} teamMembers={teamMembers} setTeamMembers={setTeamMembers} vendorUserData={vendorUserData} />
                </div>
                ) : (
                <></>
            )}
            <div className='box-bounding'>
                <h2 className="title margin-b-16">Team Members</h2>
                <div>
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
                        <label>Confirm Email:</label>
                        <input
                            type="email"
                            value={confirmMemberEmail}
                            onChange={e => setConfirmMemberEmail(e.target.value)}
                            placeholder="re-enter team member's email"
                        />
                    </div>
                    <div className='form-group'>
                        <label>Role:</label>
                        <select
                            value={newMemberRole}
                            onChange={e => setNewMemberRole(e.target.value)}
                        >
                            <option value={1}>Admin</option>
                            <option value={2}>Employee</option>
                        </select>
                    </div>
                    <button className="btn-edit" onClick={handleAddTeamMember}>Add Team Member</button>
                    <h3 className='margin-b-16'>Current Team Members:</h3>
                    <ul className='ul-team box-scroll-small'>
                        {teamMembers
                            .sort((a, b) => {
                                const nameA = teamMembers[a[0]]?.name?.toLowerCase() || 'unknown name';
                                const nameB = teamMembers[b[0]]?.name?.toLowerCase() || 'unknown name';
                                return nameA.localeCompare(nameB);
                            })
                            .map(member => (
                                <li key={member.id} className='li-team'>

                                    <div className='flex-space-between'>
                                        <p><strong>{member.first_name} {member.last_name}</strong> –
                                        {(() => {
                                            const role = member?.vendor_role[vendorId];
                                            if (role == 0) return ' Owner';
                                            if (role == 1) return ' Admin';
                                            if (role == 2) return ' Employee';
                                            return 'Unknown Role';
                                        })()}
                                        </p>
                                        {member.id !== vendorUserData.id && (
                                            <>
                                                <div className='flex-end flex-center-align'>
                                                    <button className="btn btn-small btn-white margin-r-8" 
                                                        onClick={() => handleToggleRole(member, member.vendor_role[vendorId])}>
                                                            Switch to {member.vendor_role[vendorId] === 1 ? 'Employee' : 'Admin'}
                                                    </button>
                                                    <button className="btn btn-small btn-unreport" onClick={() => handleDeleteTeamMember(member.id)} > Remove from Team</button>
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