import React, { useEffect, useState } from 'react';
import { convertToLocalDate } from '../../utils/helpers';

function VendorReviews() {
    const [reviews, setReviews] = useState([]);
    const [vendorId, setVendorId] = useState(null);
    const [replyingReviewId, setReplyingReviewId] = useState(null);
    const [replyReviewData, setReplyReviewData] = useState("");
    const [replyingReviewEditId, setReplyingReviewEditId] = useState(null);
    const [replyReviewEditData, setReplyReviewEditData] = useState("");


    const vendorUserId = localStorage.getItem('vendor_user_id');

    useEffect(() => {
        const fetchVendorUserData = async () => {
            if (!vendorUserId) {
                console.error("No vendor user ID found");
                return;
            }
            try {
                const token = localStorage.getItem('vendor_jwt-token');
                const response = await fetch(`http://127.0.0.1:5555/api/vendor-users/${vendorUserId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.vendor_id) {
                        setVendorId(data.vendor_id[data.active_vendor]);
                    }
                } else {
                    console.error('Error profile:', response.status);
                    if (response.status === 401) {
                        console.error('Unauthorized: Token may be missing or invalid');
                    }
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
            }
        };
        fetchVendorUserData();
    }, [vendorUserId]);

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/api/vendor-reviews?vendor_id=${vendorId}`)
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setReviews(data);
                } else {
                    console.error('Unexpected response format:', data);
                    setReviews([]);
                }
            })
            .catch(error => console.error('Error fetching reviews:', error));
    }, [vendorId]);

    const handleReviewReport = async (reviewId) => {
        if (confirm(`Are you sure you want to report the review?`)) {
            try {
                const response = await fetch(`http://127.0.0.1:5555/api/vendor-reviews/${reviewId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_reported: true })
                });

                if (response.ok) {
                    alert("Review reported")
                }
            } catch (error) {
                console.error('Error updating review:', error);
            }
        }
    };

    const handleReviewReply = async (reviewId) => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/vendor-reviews/${reviewId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    vendor_response: replyReviewData,
                    response_date: new Date().toISOString().slice(0, 16)
                })
            });
            if (response.ok) {
                const updatedReview = await response.json();
                setReviews((prevReviews) => prevReviews.map((review) =>
                    review.id === reviewId ? updatedReview : review
                ));
                setReplyingReviewId(null);
            }
        } catch (error) {
            console.error('Error posting review response:', error);
        }
    };

    const handleReviewReplyUpdate = async (reviewId) => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/vendor-reviews/${reviewId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    vendor_response: replyReviewEditData,
                })
            });
            if (response.ok) {
                const updatedReview = await response.json();
                setReviews((prevReviews) => prevReviews.map((review) =>
                    review.id === reviewId ? updatedReview : review
                ));
                setReplyingReviewEditId(null);
            }
        } catch (error) {
            console.error('Error posting review response:', error);
        }
    };

    const handleReviewDelete = async (reviewId) => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/vendor-reviews/${reviewId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    vendor_response: null,
                    response_date: null,
                })
            });
            if (response.ok) {
                const updatedReview = await response.json();
                setReviews((prevReviews) => prevReviews.map((review) =>
                    review.id === reviewId ? updatedReview : review
                ));
                setReplyingReviewId(null);
            }
        } catch (error) {
            console.error('Error updating review:', error);
        }
    };

    const handleReviewReplyToggle = (reviewId) => {
        setReplyingReviewId(reviewId);
    };
    
    const handleEditInputChange = (event) => {
        setReplyReviewData(event.target.value);
    };
    
    const handleReviewReplyEditToggle = (reviewId, currentText) => {
        setReplyingReviewEditId(reviewId);
        setReplyReviewEditData(currentText)
    };
    
    const handleReplyEditInputChange = (event) => {
        setReplyReviewEditData(event.target.value);
    };


    return (
        <>
            <div>
                <h2>Reviews</h2>
                <div className='box-scroll'>
                    {reviews.length > 0 ? (
                        reviews
                            .sort((a, b) => {
                                // Default to sorting by newest to oldest
                                new Date(b.post_date) - new Date(a.post_date);
                            })
                            .map((review, index) => (
                                <div key={index} style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
                                    <div>
                                        <div className='flex-start flex-center-align'>
                                            {review.user.avatar !== null ? (
                                                <img className='img-avatar margin-r-8' src={`/user-images/${review.user.avatar}`} alt="Avatar" />
                                            ) : (
                                                    <img className='img-avatar margin-r-8' src={`/user-images/_default-images/${review.user.avatar_default}`} alt="Avatar" />
                                            )}
                                            <h4 className='margin-r-8'>{review.user ? review.user.first_name : 'Anonymous'}</h4>
                                            <p className='margin-r-8'>{review ? convertToLocalDate(review.post_date) : ''}</p>
                                            <button 
                                                className='btn btn-report btn-gap' 
                                                onClick={() => handleReviewReport(review.id)}
                                                title="Report Review"
                                                >&#9873;
                                            </button>
                                        </div>
                                        <p className='margin-l-40'>{review.review_text}</p>
                                        {replyingReviewId === review.id ? (
                                            <>
                                                <div className='margin-l-56 margin-t-16'>
                                                    <p className='margin-b-4 text-500'>Response from the owner:</p>
                                                    <textarea className='textarea-edit'
                                                        value={replyReviewData}
                                                        onChange={handleEditInputChange}
                                                    />
                                                    <button className='btn btn-small margin-t-8 margin-r-8' onClick={() => handleReviewReply(review.id)}>Save</button>
                                                    <button className='btn btn-small' onClick={() => setReplyingReviewId(null)}>Cancel</button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                {review.vendor_response ? (
                                                    <div className='margin-l-56 margin-t-12'>
                                                        {replyingReviewEditId === review.id ? (
                                                            <>
                                                                <p className='margin-b-4 text-500'>Response from the owner:</p>
                                                                <textarea className='textarea-edit'
                                                                    value={replyReviewEditData}
                                                                    onChange={handleReplyEditInputChange}
                                                                />
                                                                <button className='btn btn-small margin-t-8 margin-r-8' onClick={() => handleReviewReplyUpdate(review.id)}>Save</button>
                                                                <button className='btn btn-small' onClick={() => setReplyingReviewEditId(null)}>Cancel</button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <p className='margin-b-4 text-500'>Response from the owner:</p>
                                                                <p className='margin-b-8'>{review.vendor_response}</p>
                                                                <button className='btn btn-small margin-r-8' onClick={() => handleReviewReplyEditToggle(review.id, review.vendor_response)}>Edit</button>
                                                                <button className='btn btn-small btn-gap' onClick={() => handleReviewDelete(review.id)}>Delete</button>
                                                            </>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <button className='btn btn-small margin-l-40 margin-t-8' onClick={() => handleReviewReplyToggle(review.id)}>
                                                        Reply
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                    ) : (
                        <p>No reviews available.</p>
                    )}
                </div>
            </div>
        </>
    );
}

export default VendorReviews;