import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';


function ReviewVendor({ vendor, alertMessage, setAlertMessage }) {
    const { id } = useParams();

    const [reviews, setReviews] = useState([]);
    const [showDupeAlert, setShowDupeAlert] = useState(false);
    const [reviewMode, setReviewMode] = useState(false);
    const [reviewData, setReviewData] = useState("");
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [editedReviewData, setEditedReviewData] = useState("");
    const [votes, setVotes] = useState([]);
    const [isClickedUp, setIsClickedUp] = useState({});
    const [upVoteRatings, setUpVoteRatings] = useState([]);
    const [isClickedDown, setIsClickedDown] = useState({});
    const [downVoteRatings, setDownVoteRatings] = useState([]);
    const [reports, setReports] = useState([]);
    const [hotReviews, setHotReviews] = useState([]);

    const { handlePopup } = useOutletContext();
    
    const userId = parseInt(globalThis.localStorage.getItem('user_id'));

    function convertToLocalDate(gmtDateString) {
        const gmtDate = new Date(gmtDateString);
        const localDate = gmtDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
        return localDate;
    }

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/api/vendor-reviews?vendor_id=${id}`)
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
                setReviews([...reviews, newReview]);
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
                setReviews((prevReviews) => prevReviews.map((review) =>
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
                setReviews((prevReviews) => prevReviews.filter((review) => review.id !== reviewId))
            })
        } catch (error) {
            console.error("Error deleting review", error)
        }
    }

    const handleReviewReport = async (reviewId) => {
        if (globalThis.localStorage.getItem('user_id') !== null) {
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
        } else {
            handlePopup()
        }
    };


    // Ratings
    useEffect(() => {
        fetch(`http://127.0.0.1:5555/api/vendor-review-ratings`)
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setVotes(data);

                    const userVotes = data.filter(item => item.user_id === userId);
                    setUpVoteRatings(userVotes);
                    setDownVoteRatings(userVotes);

                    const initialIsClickedUp = {};
                    userVotes.forEach((vote) => {
                        if (vote.vote_up) {
                            initialIsClickedUp[vote.review_id] = true;
                        }
                    });
                    const initialIsClickedDown = {};
                    setIsClickedUp(initialIsClickedUp);
                    userVotes.forEach((vote) => {
                        if (vote.vote_down) {
                            initialIsClickedDown[vote.review_id] = true;
                        }
                    });
                    setIsClickedDown(initialIsClickedDown);
                } else {
                    console.error('Unexpected response format:', data);
                    setVotes([]);
                }
            })
            .catch(error => console.error('Error fetching reviews:', error));
    }, [id, userId]);

    function filterRatingsUpVote(id) {
        const matchingReviews = votes.filter(item => item.review_id === id);
        const matchingVotes = matchingReviews.filter(item => item.vote_up === true);
        return matchingVotes
    }

    function filterRatingsDownVote(id) {
        const matchingReviews = votes.filter(item => item.review_id === id);
        const matchingVotes = matchingReviews.filter(item => item.vote_down === true);
        return matchingVotes
    }

    const handleClickUpVote = async (review) => {
        const reviewId = review.id;
        if (globalThis.localStorage.getItem('user_id') !== null) {
            const currentClickedState = isClickedUp[reviewId] || false;
            setIsClickedUp((prevState) => ({
                ...prevState,
                [reviewId]: !currentClickedState,
            }));
            try {
                const existingVote = votes.find(
                    (vote) => vote.user_id === userId && vote.review_id === reviewId
                );
                if (!currentClickedState) {
                    if (!existingVote) {
                        const response = await fetch('http://127.0.0.1:5555/api/vendor-review-ratings', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                user_id: globalThis.localStorage.getItem('user_id'),
                                review_id: review.id,
                                vote_up: true,
                                vote_down: false
                            })
                        }).then((resp) => {
                            return resp.json()
                        }).then(data => {
                            setUpVoteRatings((prev) => [...prev, data])
                            setVotes((prev) => [...prev, data]);
                            setAlertMessage('up voted successfully');
                        });
                    } else {
                        const response = await fetch(
                            `http://127.0.0.1:5555/api/vendor-review-ratings/${existingVote.id}`,
                            {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    vote_up: true,
                                    vote_down: false
                                }),
                            }
                        );
                        const updatedVote = await response.json();
                        setVotes((prev) =>
                            prev.map((vote) => (vote.id === updatedVote.id ? updatedVote : vote))
                        );
                        setIsClickedDown((prevState) => ({
                            ...prevState,
                            [reviewId]: false,
                        }));
                        setAlertMessage('upvote updated.');
                    }
                } else {
                    const matchingVotes = upVoteRatings.filter((vote) => vote.review_id === reviewId);
                    for (const vote of matchingVotes) {
                        fetch(`http://127.0.0.1:5555/api/vendor-review-ratings/${existingVote.id}`, {
                            method: "DELETE",
                        }).then(() => {
                            setUpVoteRatings((prev) => prev.filter((vote) => vote.review_id !== reviewId));
                            setVotes((prev) => prev.filter((v) => v.id !== existingVote.id));
                            setAlertMessage('un-voted up');
                        })
                    }
                }
            } catch (error) {
                console.error('Error handling upvote:', error);
            }
        } else {
            handlePopup();
        }
    }

    const handleClickDownVote = async (review) => {
        const reviewId = review.id;
        if (globalThis.localStorage.getItem('user_id') !== null) {
            const currentClickedState = isClickedDown[reviewId] || false;
            setIsClickedDown((prevState) => ({
                ...prevState,
                [reviewId]: !currentClickedState,
            }));
            try {
                const existingVote = votes.find(
                    (vote) => vote.user_id === userId && vote.review_id === reviewId
                );
                if (!currentClickedState) {
                    if (!existingVote) {
                        const response = await fetch('http://127.0.0.1:5555/api/vendor-review-ratings', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                user_id: globalThis.localStorage.getItem('user_id'),
                                review_id: review.id,
                                vote_up: false,
                                vote_down: true
                            })
                        }).then((resp) => {
                            return resp.json()
                        }).then(data => {
                            setDownVoteRatings((prev) => [...prev, data]);
                            setVotes((prev) => [...prev, data]);
                            setAlertMessage('down voted successfully');
                        });
                    } else {
                        const response = await fetch(
                            `http://127.0.0.1:5555/api/vendor-review-ratings/${existingVote.id}`,
                            {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ vote_up: false, vote_down: true }),
                            }
                        );
                        const updatedVote = await response.json();
                        setVotes((prev) =>
                            prev.map((vote) => (vote.id === updatedVote.id ? updatedVote : vote))
                        );
                        setIsClickedUp((prevState) => ({
                            ...prevState,
                            [reviewId]: false,
                        }));
                        setAlertMessage('down-vote updated.');
                    }
                } else {
                    const matchingVotes = downVoteRatings.filter((vote) => vote.review_id === reviewId);
                    for (const vote of matchingVotes) {
                        fetch(`http://127.0.0.1:5555/api/vendor-review-ratings/${existingVote.id}`, {
                            method: "DELETE",
                        }).then(() => {
                            setDownVoteRatings((prev) => prev.filter((vote) => vote.review_id !== reviewId));
                            setVotes((prev) => prev.filter((v) => v.id !== existingVote.id));
                            setAlertMessage('un-voted down');
                        })
                    }
                }
            } catch (error) {
                console.error('Error handling downvote:', error);
            }
        } else {
            handlePopup()
        }
    }

    useEffect(() => {
        if (!userId) return;
        fetch(`http://127.0.0.1:5555/api/reported-reviews?user_id=${userId}`)
            .then(response => response.json())
            .then(data => {
                setReports(data);
            })
            .catch(error => console.error('Error fetching market baskets', error));
    }, [userId]);


    useEffect(() => {
        const fetchTopReviews = async () => {
            try {
                const response = await fetch('http://127.0.0.1:5555/api/top-vendor-reviews');
                if (!response.ok) {
                    throw new Error('Failed to fetch reviews');
                }
                const data = await response.json();
                setHotReviews(data);
            } catch (error) {
                console.log(error.message);
            }
        };

        fetchTopReviews();
    }, []);


    return (
        <>
            <h2 className='margin-b-16 margin-t-24'>Reviews</h2>
            {reviews.length > 0 ? (
                reviews
                    .sort((a, b) => new Date(b.post_date) - new Date(a.post_date))
                    .map((review, index) => (
                        <div key={index} style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
                            {review.user_id !== userId && editingReviewId !== review.id ? (
                                <>
                                    <div className='flex-start flex-center-align'>
                                        <h4 className='margin-r-8'>{review.user ? review.user.first_name : 'Anonymous'}</h4>
                                        <p className='margin-r-8'>{review ? convertToLocalDate(review.post_date) : ''}</p>
                                        <div className='notification margin-r-4'>
                                            {filterRatingsUpVote(review.id).length > 0 ? (
                                                <p className='badge-votes'>{filterRatingsUpVote(review.id).length}</p>
                                            ) : (
                                                <></>
                                            )}

                                            <button
                                                className={`btn btn-emoji btn-gap ${isClickedUp[review.id] ? "btn btn-emoji-on btn-gap" : ""}`}
                                                onClick={() => handleClickUpVote(review)}
                                            >&#9786;
                                            </button>
                                        </div>
                                        <div className='notification margin-r-4'>
                                            {filterRatingsDownVote(review.id).length > 0 ? (
                                                <p className='badge-votes'>{filterRatingsDownVote(review.id).length}</p>
                                            ) : (
                                                <></>
                                            )}

                                            <button
                                                className={`btn btn-emoji btn-gap ${isClickedDown[review.id] ? "btn btn-emoji-on btn-gap" : ""}`}
                                                onClick={() => handleClickDownVote(review)}
                                            >&#9785;
                                            </button>
                                        </div>
                                        <button className='btn btn-report btn-gap' onClick={() => handleReviewReport(review.id)}>&#9873;</button>
                                        {hotReviews.some(item => item.id === review.id) && (
                                            <img className='img-hot margin-l-12' src="/site-images/chili-pepper-4.svg" alt="Notification" title='Hot review!!!'/>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className='flex-start flex-center-align'>
                                    <h4 className='margin-r-8'>You</h4>
                                    <p className='margin-r-8'>{review ? convertToLocalDate(review.post_date) : ''}</p>
                                </div>
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
                {reviewMode && reports.length < 6 ? (
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
                        <button className='btn-login nowrap margin-r-8' onClick={handleReviewSubmit} reviewType="submit">Post Review</button>
                        <button className='btn-login' onClick={handleReviewToggle} title='Cancel review'>Cancel</button>
                    </>
                ) : (
                    <>
                        {reports.length < 5 ? (
                            <>
                                <button className='btn btn-plus margin-r-8' onClick={handleReviewToggle} title='Leave a review'>+</button>
                            </>
                        ) : (
                            <>
                            </>
                        )}
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