import React, { useState } from 'react';
import { toast } from 'react-toastify';

function UserIssues({ basketId, handleClose }) {
    const [formData, setFormData] = useState({
        issueType: '',
        comments: ''
    });

    const handleChange = (event) => {
        setFormData({ ...formData, [event.target.name]: event.target.value });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        fetch('/api/user-issues', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('user_jwt-token')}`
            },
            body: JSON.stringify({
                user_id: localStorage.getItem('user_id'),
                basket_id: basketId,
                issue_type: 'pickup-issue',
                issue_subtype: formData.issueType,
                body: formData.comments,
                status: 'pending'
            })
        })
        .then(response => response.json())
        .then(() => {
            toast.success("Your request has been received and will be reviewed shortly.", {
                autoClose: 6000
            });
            handleClose();
        })
        .catch(error => {
            console.error('Error submitting issue:', error);
            toast.error("Something went wrong. Please try again.", {
                autoClose: 4000
            });
        });
    };

    return (
        <div className="popup-overlay">
            <div className="popup-on">
                <button className="btn btn-large x-btn" onClick={handleClose}>X</button>
                <h1 className="margin-t-16 margin-b-16 flex-center m-margin-0-24">Report a Pickup Issue</h1>
                <div className="wrapper-issue">
                    <div className="margin-t-16 flex-center">
                        <form onSubmit={handleSubmit} className="form">
                            <div className="form-group form-contact">
                                <label>Issue Type:</label>
                                <select 
                                    className='m-select-wrap'
                                    name="issueType"
                                    value={formData.issueType}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select an issue</option>
                                    <option value="Unable to Pick Up">Unable to Pick Up</option>
                                    <option value="Vendor Not in Market">Vendor Not in Market</option>
                                    <option value="Market Closed Early">Market Closed Early</option>
                                </select>
                            </div>
                            <div className="form-group form-contact">
                                <label>Comments:</label>
                                <textarea
                                    className='textarea-issue'
                                    name="comments"
                                    value={formData.comments}
                                    placeholder="Please go into detail about the problem with the pickup"
                                    onChange={handleChange}
                                    // rows="10"
                                    // cols="40"
                                    required
                                />
                            </div>
                            <div className="flex-center">
                                <button className="btn-edit" type="submit">Submit</button>
                                {/* <button className="btn-edit" type="button" onClick={handleClose}>Cancel</button> */}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserIssues;