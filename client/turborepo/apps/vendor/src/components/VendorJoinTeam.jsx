import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PasswordStrengthBar from 'react-password-strength-bar';
import PasswordChecklist from "react-password-checklist"
import PhoneInput, { isPossiblePhoneNumber } from 'react-phone-number-input'

function VendorJoinTeam() {
    const [isLoading, setIsLoading] = useState(true);
    const [invitationData, setInvitationData] = useState(null);
    const [showPassword, setShowPassword] = useState({ pw1: false, pw2:false});
    const [isValid, setIsValid] = useState(false);
    const [termsConditions, setTermsConditions] = useState(false);
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
                navigate('/login');
            }
        } catch (error) {
            toast.error('Error fetching invitation data');
            navigate('/login');
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

        if (!termsConditions) {
            alert("You must agree to Terms & Conditions to signup.");
            return;
        }
        if (!isValid) {
            alert("Password does not meet requirements.");
            return;
        }
        if (!isPossiblePhoneNumber(formData.phone)) {
            alert("Not a possible phone number");
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
                navigate('/');
            } else {
                const error = await response.json();
                toast.error(error.error || 'Error joining team');
            }
        } catch (error) {
            toast.error('Error joining team');
        }
    };

    console.log(formData.password)

    if (isLoading) {
        return <div className="box-bounding">Loading...</div>;
    }

    if (!invitationData) {
        return null;
    }

    return (
        <div className="box-bounding">
            <title>gingham • Vendor Join Team</title>
            <h1>Join {invitationData.vendor_name}</h1>
            <h4 className='margin-b-24'>Complete your account setup to join the team</h4>
            <form className="form-group">
                <div className='form-group form-login'>
                    <label>Email:</label>
                    <input 
                        type="email" 
                        value={invitationData.email} 
                        disabled 
                        className="form-control"
                    />
                </div>
                <div className='form-group form-login'>
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
                <div className='form-group form-login'>
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
                <div className='form-group form-login'>
                    <label>Phone:</label>
                    <PhoneInput
                        name="phone"
                        className='input-phone margin-l-8'
                        countryCallingCodeEditable={false}
                        withCountryCallingCode
                        country='US'
                        defaultCountry='US'
                        placeholder="enter your phone number"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, ['phone']: e
                        })}
                    />
                </div>
                <div className='form-group form-login'>
                    <label>Password:</label>
                    <div className='badge-container-strict'>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="form-control"
                        />
                        <i className={showPassword.pw1 ? 'icon-eye-alt' : 'icon-eye'} onClick={() => togglePasswordVisibility('pw1')}>&emsp;</i>
                    </div>
                </div>
                <div className='form-group form-login'>
                    <label>Confirm Password:</label>
                    <div className='badge-container-strict'>
                        <input
                            type={showPassword.pw2 ? 'text' : 'password'}
                            name="confirm_password"
                            value={formData.confirm_password}
                            onChange={handleChange}
                            required
                        />
                        <i className={showPassword.pw2 ? 'icon-eye-alt' : 'icon-eye'} onClick={() => togglePasswordVisibility('pw2')}>&emsp;</i>
                    </div>
                    <PasswordChecklist
                        className='password-checklist'
                        style={{ padding: '0 12px' }}
                        rules={["minLength", "specialChar", "number", "capital", "match",]}
                        minLength={5}
                        value={formData.password}
                        valueAgain={formData.confirm_password}
                        onChange={(isValid) => { setIsValid(isValid) }}
                        iconSize={14}
                        validColor='#00bda4'
                        invalidColor='#ff4b5a'
                    />
                    <PasswordStrengthBar className='password-bar' minLength={5} password={formData.password} />
                </div>
            </form>
            <div className='flex-center-align flex-start margin-t-16 flex-gap-16'>
                <button type="submit" className="btn-edit" onClick={handleSubmit}>Join Team</button>
                <div className='flex-start flex-center-align flex-gap-16'>
                    <input
                        type='checkbox'
                        name="terms"
                        value={termsConditions}
                        onChange={(event) => setTermsConditions(!termsConditions)}
                        className='scale-fix-125'
                    />
                    <p className="forgot-password" onClick={() => window.open('/terms-conditions', '_blank')}>
                        Terms & Conditions
                    </p>
                </div>
            </div>
        </div>
    );
}

export default VendorJoinTeam; 