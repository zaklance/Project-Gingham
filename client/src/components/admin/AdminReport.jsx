import React, { useEffect, useState } from 'react';

function AdminReport() {
    const [marketReported, setMarketReported] = useState([]);
    const [vendorReported, setVendorReported] = useState([]);

    useEffect(() => {
            const anchor = window.location.hash.slice(1);
            setTimeout(() => {
                if (anchor) {
                    const anchorEl = document.getElementById(anchor);
                    if (anchorEl) {
                        anchorEl.scrollIntoView();
                    }
                }
            }, 500);
        }, []);
        
    useEffect(() => {
        fetch(`http://127.0.0.1:5555/api/market-reviews?is_reported=True`)
            .then(response => response.json())
            .then(data => {
                setMarketReported(data)
            })
            .catch(error => console.error('Error fetching market reviews', error));
    }, []);

    const handleMarketReviewDelete = async (reviewId, userId) => {
        try {

            fetch(`http://127.0.0.1:5555/api/market-reviews/${reviewId}`, {
                method: "DELETE",
            }).then(() => {
                setMarketReported((prevReviews) => prevReviews.filter((review) => review.id !== reviewId))
            })
        } catch (error) {
            console.error("Error deleting review", error)
        }
        fetch(`http://127.0.0.1:5555/api/reported-reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId
            })
        });
    }

    const handleMarketReviewUnReport = async (reviewId) => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/market-reviews/${reviewId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_reported: false })
            });

            if (response.ok) {
                setMarketReported((prevReviews) => prevReviews.filter((review) => review.id !== reviewId));
                // alert("Review un-reported")
            }
        } catch (error) {
            console.error('Error updating review:', error);
        }
    };

    useEffect(() => {
        fetch("http://127.0.0.1:5555/api/vendor-reviews?is_reported=True")
            .then(response => response.json())
            .then(data => {
                setVendorReported(data)
            })
            .catch(error => console.error('Error fetching vendor reviews', error));
    }, []);

    const handleVendorReviewDelete = async (reviewId, userId) => {
        console.log(userId)
        try {

            fetch(`http://127.0.0.1:5555/api/vendor-reviews/${reviewId}`, {
                method: "DELETE",
            }).then(() => {
                setVendorReported((prevReviews) => prevReviews.filter((review) => review.id !== reviewId))
            })
        } catch (error) {
            console.error("Error deleting review", error)
        }
        fetch(`http://127.0.0.1:5555/api/reported-reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId
            })
        });
    }

    const handleVendorReviewUnReport = async (reviewId) => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/vendor-reviews/${reviewId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_reported: false })
            });

            if (response.ok) {
                setVendorReported((prevReviews) => prevReviews.filter((review) => review.id !== reviewId));
                // alert("Review un-reported")
            }
        } catch (error) {
            console.error('Error updating review:', error);
        }
    };


    return (
        <div>
            <h1>Review Management</h1>
            <div className='box-bounding'>
                <h2 className='margin-b-24' id="markets">Reported Market Reviews</h2>
                <div className='box-scroll'>
                    {marketReported.length > 0 ? (
                        marketReported.map((review, index) => (
                            <div key={index} style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
                                <div className='flex-start'>
                                    {review.user.avatar !== null ? (
                                        <img className='img-avatar margin-r-8' src={`/user-images/${review.user.avatar}`} alt="Avatar" />
                                    ) : (
                                        <img className='img-avatar margin-r-8' src={`/user-images/_default-images/${review.user.avatar_default}`} alt="Avatar" />
                                    )}
                                    <h4 className='margin-r-8'>{review.user ? `${review.user.first_name} ${review.user.last_name}` : 'Anonymous'}</h4>
                                    <button className='btn btn-small btn-green btn-emoji-big btn-gap margin-r-8' onClick={() => handleMarketReviewUnReport(review.id, review.user_id)}>&#9786;</button>
                                    <button className='btn btn-small btn-red btn-admin btn-gap' onClick={() => handleMarketReviewDelete(review.id, review.user_id)}>Delete</button>
                                </div>
                                <p className='margin-l-40'>{review.review_text}</p>
                            </div>
                            
                        ))
                    ) : (
                        <p>No reported reviews.</p>
                    )}
                </div>
            </div>
            <div className='box-bounding'>
                <h2 className='margin-b-24' id="vendors">Reported Vendor Reviews</h2>
                <div className='box-scroll'>
                    {vendorReported.length > 0 ? (
                        vendorReported.map((review, index) => (
                            <div key={index} style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
                                <div className='flex-start'>
                                    {review.user.avatar !== null ? (
                                        <img className='img-avatar margin-r-8' src={`/user-images/${review.user.avatar}`} alt="Avatar" />
                                    ) : (
                                        <img className='img-avatar margin-r-8' src={`/user-images/_default-images/${review.user.avatar_default}`} alt="Avatar" />
                                    )}
                                    <h4 className='margin-r-8'>{review.user ? `${review.user.first_name} ${review.user.last_name}` : 'Anonymous'}</h4>
                                    <button className='btn btn-small btn-green btn-emoji-big btn-gap margin-r-8' onClick={() => handleVendorReviewUnReport(review.id, review.user_id)}>&#9786;</button>
                                    <button className='btn btn-small btn-red btn-admin btn-gap' onClick={() => handleVendorReviewDelete(review.id, review.user_id)}>Delete</button>
                                </div>
                                <p className='margin-l-40'>{review.review_text}</p>
                            </div>

                        ))
                    ) : (
                        <p>No reported reviews.</p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AdminReport;