import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function VendorJoinTeam() {
    const [isLoading, setIsLoading] = useState(true);
    const [invitationData, setInvitationData] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        password: '',
        confirm_password: ''
    });
    const { token } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetchInvitationData();
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

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirm_password) {
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
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone: formData.phone,
                    password: formData.password
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

    if (isLoading) {
        return <div className="box-bounding">Loading...</div>;
    }

    if (!invitationData) {
        return null;
    }

    return (
        <div className="box-bounding">
            <h2>Join {invitationData.vendor_name}</h2>
            <p>Complete your account setup to join the team</p>
            
            <form onSubmit={handleSubmit} className="form-group">
                <div className="form-group">
                    <label>Email:</label>
                    <input 
                        type="email" 
                        value={invitationData.email} 
                        disabled 
                        className="form-control"
                    />
                </div>
                
                <div className="form-group">
                    <label>First Name:</label>
                    <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                        className="form-control"
                    />
                </div>
                
                <div className="form-group">
                    <label>Last Name:</label>
                    <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                        className="form-control"
                    />
                </div>
                
                <div className="form-group">
                    <label>Phone:</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="form-control"
                    />
                </div>
                
                <div className="form-group">
                    <label>Password:</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="form-control"
                    />
                </div>
                
                <div className="form-group">
                    <label>Confirm Password:</label>
                    <input
                        type="password"
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        required
                        className="form-control"
                    />
                </div>
                
                <button type="submit" className="btn-edit">Join Team</button>
            </form>
        </div>
    );
}

export default VendorJoinTeam; 