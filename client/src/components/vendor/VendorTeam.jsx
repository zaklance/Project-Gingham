import React, { useState, useEffect } from 'react';
import VendorNotification from './VendorNotification';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';

function VendorTeam({ vendorId, vendorUserData, notifications, setNotifications }) {
    const [isLoading, setIsLoading] = useState(true);
    const [teamMembers, setTeamMembers] = useState([]);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [confirmMemberEmail, setConfirmMemberEmail] = useState('');
    const [newMemberRole, setNewMemberRole] = useState(2); // Default to employee role
    const [showPassword, setShowPassword] = useState({ pw1: false, pw2:false});
    const [isValid, setIsValid] = useState(false);
    const [showInvitationForm, setShowInvitationForm] = useState(false);
    const [invitationData, setInvitationData] = useState(null);
    const [invitationFormData, setInvitationFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        password: '',
        confirm_password: ''
    });
    const { token } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            // If we have a token, we're in invitation mode
            setShowInvitationForm(true);
            fetchInvitationData();
        } else {
            fetchTeamMembers();
        }
    }, [token]);

    const fetchInvitationData = async () => {
        try {
            const response = await fetch(`/api/vendor/join-team/${token}`);
            if (response.ok) {
                const data = await response.json();
                setInvitationData(data);
            } else {
                const error = await response.json();
                toast.error(error.error || 'Invalid invitation link');
                navigate('/vendor/login');
            }
        } catch (error) {
            toast.error('Error fetching invitation data');
            navigate('/vendor/login');
        } finally {
            setIsLoading(false);
        }
    };

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

    const handleInvitationFormChange = (e) => {
        setInvitationFormData({
            ...invitationFormData,
            [e.target.name]: e.target.value
        });
    };

    const handleInvitationSubmit = async (e) => {
        e.preventDefault();
        
        if (invitationFormData.password !== invitationFormData.confirm_password) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            const response = await fetch(`/api/vendor/join-team/${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    first_name: invitationFormData.first_name,
                    last_name: invitationFormData.last_name,
                    phone: invitationFormData.phone,
                    password: invitationFormData.password
                })
            });

            if (response.ok) {
                toast.success('Successfully joined the team!');
                navigate('/vendor/login');
            } else {
                const error = await response.json();
                toast.error(error.error || 'Error joining team');
            }
        } catch (error) {
            toast.error('Error joining team');
        }
    };

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
    
            // For new users, send invitation email
            const inviteResponse = await fetch('/api/vendor/team-invite', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: newMemberEmail,
                    vendor_id: vendorUserData.vendor_id[vendorUserData.active_vendor],
                    role: newMemberRole
                })
            });
    
            if (inviteResponse.ok) {
                toast.success('Invitation sent successfully!', {
                    autoClose: 4000,
                });
                setNewMemberEmail('');
                setConfirmMemberEmail('');
                setNewMemberRole(2);
            } else {
                const error = await inviteResponse.json();
                toast.error(error.error || 'Failed to send invitation.', {
                    autoClose: 4000,
                });
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('An error occurred while processing the request.', {
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
        if (vendorUserData.vendor_role[vendorUserData.active_vendor] === 0) {
            if (currentRole == 1) {
                newRole = 0;
            } else if (currentRole == 2) {
                newRole = 1;
            } else if (currentRole == 0) {
                newRole = 2;
            } else {
                console.error('Invalid role');
                return;
            }
        } else {
            if (currentRole == 1) {
                newRole = 2;
            } else if (currentRole == 2) {
                newRole = 1;
            } else {
                console.error('Invalid role');
                toast.error("Cannot change owner's role.", {
                    autoClose: 4000,
                });
                return;
            }
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
            <title>gingham • Vendor Team</title>
            {notifications && notifications.length > 0 && (
                <div className='box-bounding margin-b-24'>
                    <h2 className='margin-b-16'>Notifications</h2>
                    <VendorNotification notifications={notifications} setNotifications={setNotifications} vendorId={vendorId} teamMembers={teamMembers} setTeamMembers={setTeamMembers} vendorUserData={vendorUserData} />
                </div>
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
                                                    <>
                                                        {vendorUserData.vendor_role[vendorId] > 0 && member.vendor_role[vendorId] !== 0 ? (
                                                            <>
                                                                <button className="btn btn-small btn-white margin-r-8" 
                                                                    onClick={() => handleToggleRole(member, member.vendor_role[vendorId])}>
                                                                        Switch to {member.vendor_role[vendorId] === 1 ? 'Employee' : 'Admin'}
                                                                </button>
                                                                <button className="btn btn-small btn-unreport" onClick={() => handleDeleteTeamMember(member.id)} > Remove from Team</button>
                                                            </>
                                                        ) : vendorUserData.vendor_role[vendorId] === 0 ? (
                                                            <>
                                                                <button className="btn btn-small btn-white margin-r-8" 
                                                                    onClick={() => handleToggleRole(member, member.vendor_role[vendorId])}>
                                                                        Switch to {member.vendor_role[vendorId] === 1 ? 'Owner' : member.vendor_role[vendorId] === 0 ? 'Employee' : 'Admin'}
                                                                </button>
                                                                <button className="btn btn-small btn-unreport" onClick={() => handleDeleteTeamMember(member.id)} > Remove from Team</button>
                                                            </>
                                                        ) : (
                                                            null
                                                        )}
                                                    </>
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
    );
}

export default VendorTeam;