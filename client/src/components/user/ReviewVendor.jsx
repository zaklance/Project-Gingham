import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';


function ReviewVendor({ vendor, alertMessage, setAlertMessage }) {
    const { id } = useParams();

    const [reviews, sertReviews] = useState([]);
    const [showDupeAlert, setShowDupeAlert] = useState(false);
    const [reviewMode, setReviewMode] = useState(false);
    const [reviewData, setReviewData] = useState("");
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [editedReviewData, setEditedReviewData] = useState("");

    const userId = parseInt(globalThis.sessionStorage.getItem('user_id'));


    useEffect(() => {
        fetch(`http://127.0.0.1:5555/api/vendor-reviews?vendor_id=${id}`)
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data)) {
                    sertReviews(data);
                } else {
                    console.error('Unexpected response format:', data);
                    sertReviews([]);
                }
            })
            .catch(error => console.error('Error fetching reviews:', error));
    }, [id]);

    const handleReviewToggle = () => {
        setReviewMode(!reviewMode);
    };

    const handleReviewEditToggle = (reviewId, currentText) => {
        setEditingReviewId(reviewId);
        setEditedReviewData(currentText);
    };

    const handleEditInputChange = (event) => {
        setEditedReviewData(event.target.value);
    };

    const handleReviewSubmit = async () => {
        const existingReview = reviews.some(review => review.user_id === userId);

        if (existingReview) {
            setAlertMessage('You have already submitted a review for this vendor.');
            setShowDupeAlert(true);
            setTimeout(() => setShowDupeAlert(null), 3000);
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:5555/api/vendor-reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    vendor_id: vendor.id,
                    review_text: reviewData
                })
            });

            if (response.ok) {
                const newReview = await response.json();
                sertReviews([...reviews, newReview]);
                setReviewData("");
                setReviewMode(false);
                console.log('Review submitted successfully:', newReview);
            } else {
                console.log('Failed to submit review:', await response.text());
            }
        } catch (error) {
            console.error('Error submitting review:', error);
        }
    };

    const handleReviewUpdate = async (reviewId) => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/vendor-reviews/${reviewId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ review_text: editedReviewData })
            });

            if (response.ok) {
                const updatedReview = await response.json();
                sertReviews((prevReviews) => prevReviews.map((review) =>
                    review.id === reviewId ? updatedReview : review
                ));
                setEditingReviewId(null);
            }
        } catch (error) {
            console.error('Error updating review:', error);
        }
    };

    const handleReviewDelete = async (reviewId) => {
        try {

            fetch(`http://127.0.0.1:5555/api/vendor-reviews/${reviewId}`, {
                method: "DELETE",
            }).then(() => {
                setAlertMessage('Review deleted');
                sertReviews((prevReviews) => prevReviews.filter((review) => review.id !== reviewId))
            })
        } catch (error) {
            console.error("Error deleting review", error)
        }
    }

    const handleReviewReport = async (reviewId) => {
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
    };


    return (
        <>
            <h2 className='margin-b-16 margin-t-24'>Reviews</h2>
            {reviews.length > 0 ? (
                reviews
                    .sort((a, b) => new Date(b.post_date) - new Date(a.post_date))
                    .map((review, index) => (
                        <div key={index} style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
                            {review.user_id !== userId && editingReviewId !== review.id ? (
                                <div className='flex-start flex-align-center'>
                                    <h4 className='margin-r-8'>{review.user ? review.user.first_name : 'Anonymous'}</h4>
                                    <p className='margin-t-8'>{review ? review.post_date : ''}</p>
                                    <button className='btn btn-report btn-gap' onClick={() => handleReviewReport(review.id)}>&#9873;</button>
                                </div>
                            ) : (
                                <h4>You</h4>
                            )}
                            {review.user_id === userId && editingReviewId === review.id ? (
                                <>
                                    <textarea className='textarea-edit'
                                        value={editedReviewData}
                                        onChange={handleEditInputChange}
                                    />
                                    <br></br>
                                    <button className='btn btn-small' onClick={() => handleReviewUpdate(review.id)}>Save</button>
                                    <button className='btn btn-small btn-gap' onClick={() => setEditingReviewId(null)}>Cancel</button>
                                </>
                            ) : (
                                <>

                                    <p>{review.review_text}</p>
                                </>
                            )}
                            {review.user_id === userId && editingReviewId !== review.id && (
                                <div className='margin-t-8'>
                                    <button className='btn btn-small' onClick={() => handleReviewEditToggle(review.id, review.review_text)}>
                                        Edit
                                    </button>
                                    <button className='btn btn-small btn-x btn-gap' onClick={() => handleReviewDelete(review.id)}>x</button>

                                </div>
                            )}
                        </div>
                    ))
            ) : (
                <p>No reviews available.</p>
            )}
            <div>
                {reviewMode ? (
                    <>
                        <div>
                            <textarea
                                className='textarea-review'
                                name="review_text"
                                value={reviewData}
                                placeholder="Enter your review"
                                onChange={(event) => setReviewData(event.target.value)}
                                rows="6"
                                // cols="80"
                                required
                            />
                        </div>
                        <button className='btn-login' onClick={handleReviewSubmit} reviewType="submit">Post Review</button>
                    </>
                ) : (
                    <>
                        <button className='btn btn-plus' onClick={handleReviewToggle} title='Leave a review'>+</button>
                    </>
                )}
                {showDupeAlert && (
                    <div className='alert-reviews float-right'>
                        {alertMessage}
                    </div>
                )}
            </div>
        </>
    )
}

export default ReviewVendor;