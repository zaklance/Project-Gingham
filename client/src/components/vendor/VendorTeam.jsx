import React, { useState, useEffect } from 'react';
import VendorNotification from './VendorNotification';

function VendorTeam({ vendorId, vendorUserData, notifications, setNotifications }) {
    const [isLoading, setIsLoading] = useState(true);
    const [teamMembers, setTeamMembers] = useState([]);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [confirmMemberEmail, setConfirmMemberEmail] = useState('');
    const [newMemberRole, setNewMemberRole] = useState(true); 


    useEffect(() => {
        const fetchTeamMembers = async () => {
            if (vendorUserData && vendorUserData.vendor_id) {
                try {
                    const token = localStorage.getItem('vendor_jwt-token');
                    const response = await fetch(`http://127.0.0.1:5555/api/vendor-users?vendor_id=${vendorUserData.vendor_id[vendorUserData.active_vendor]}`, {
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

        fetch(`http://127.0.0.1:5555/api/vendor-users?email=${encodeURIComponent(newMemberEmail)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json().then(data => {
                    console.log(data[0].id)
                    const token = localStorage.getItem('vendor_jwt-token');
                    const response = fetch(`http://127.0.0.1:5555/api/vendor-users/${data[0].id}`, {
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
                    if (response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                })
            } else {
                try {
                    const token = localStorage.getItem('vendor_jwt-token');
                    const response = fetch('http://127.0.0.1:5555/api/vendor-users', {
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
                        const addedMember = response.json();
                        setTeamMembers([...teamMembers, addedMember]);
                        setNewMemberEmail('');
                        setNewMemberRole('Employee');
                    } else {
                        console.error('Error adding team member');
                    }
                } catch (error) {
                    console.error('Error adding team member:', error);
                }
            }
            return response.json();
        })
        .then(data => console.log(data))
        .catch(error => console.error('Error fetching users:', error));

        if (newMemberEmail !== confirmMemberEmail) {
            alert("Emails do not match")
            return;
        }
    };

    const handleDeleteTeamMember = async (memberId) => {
        if (confirm(`Are you sure you want to delete this team member?`)) {
            try {
                const token = localStorage.getItem('vendor_jwt-token');
                const response = await fetch(`http://127.0.0.1:5555/api/vendor-users/${memberId}?delete_vendor_id=${vendorId}`, {
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
            alert("Member not found");
            return;
        }
        try {
            const token = localStorage.getItem('vendor_jwt-token');
            const response = await fetch(`http://127.0.0.1:5555/api/vendor-users/${member.id}`, {
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

                alert(`Successfully updated role to ${newRole  == 1 ? 'Admin' : 'Employee'}`);
            } else {
                const responseData = await response.json();
                console.error('Error updating role:', responseData.message || response.statusText);
                alert(responseData.message || 'Failed to update the role. Please try again.');
            }
        } catch (error) {
            console.error('Error updating role:', error);
            alert('An error occurred while updating the role. Please try again.');
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
                        <label>Email:</label>
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
                            <option value={true}>Admin</option>
                            <option value={false}>Employee</option>
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