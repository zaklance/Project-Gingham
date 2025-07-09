import React, { useEffect, useState } from 'react';

function AdminReport() {
    const [marketReported, setMarketReported] = useState([]);
    const [vendorReported, setVendorReported] = useState([]);
    
    const siteURL = import.meta.env.VITE_SITE_URL;

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
        fetch(`/api/market-reviews?is_reported=True`)
            .then(response => response.json())
            .then(data => {
                const sortedData = data.slice().sort((a, b) => new Date(a.post_date) - new Date(b.post_date));
                setMarketReported(sortedData)
            })
            .catch(error => console.error('Error fetching market reviews', error));
    }, []);

    const handleMarketReviewDelete = async (reviewId, userId) => {
        try {

            fetch(`/api/market-reviews/${reviewId}`, {
                method: "DELETE",
            }).then(() => {
                setMarketReported((prevReviews) => prevReviews.filter((review) => review.id !== reviewId))
            })
        } catch (error) {
            console.error("Error deleting review", error)
        }
        fetch(`/api/reported-reviews`, {
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
            const response = await fetch(`/api/market-reviews/${reviewId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_reported: false })
            });

            if (response.ok) {
                setMarketReported((prevReviews) => prevReviews.filter((review) => review.id !== reviewId));
            }
        } catch (error) {
            console.error('Error updating review:', error);
        }
    };

    useEffect(() => {
        fetch("/api/vendor-reviews?is_reported=True")
            .then(response => response.json())
            .then(data => {
                const sortedData = data.slice().sort((a, b) => new Date(a.post_date) - new Date(b.post_date));
                setVendorReported(sortedData)
            })
            .catch(error => console.error('Error fetching vendor reviews', error));
    }, []);

    const handleVendorReviewDelete = async (reviewId, userId) => {
        console.log(userId)
        try {

            fetch(`/api/vendor-reviews/${reviewId}`, {
                method: "DELETE",
            }).then(() => {
                setVendorReported((prevReviews) => prevReviews.filter((review) => review.id !== reviewId))
            })
        } catch (error) {
            console.error("Error deleting review", error)
        }
        fetch(`/api/reported-reviews`, {
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
            const response = await fetch(`/api/vendor-reviews/${reviewId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_reported: false })
            });

            if (response.ok) {
                setVendorReported((prevReviews) => prevReviews.filter((review) => review.id !== reviewId));
            }
        } catch (error) {
            console.error('Error updating review:', error);
        }
    };


    return (
        <div>
            <title>gingham • Admin Reported Reviews</title>
            <h1>Review Management</h1>
            <div className='box-bounding'>
                <h2 className='margin-b-24' id="markets">Reported Market Reviews</h2>
                <div className='box-scroll'>
                    {marketReported.length > 0 ? (
                        marketReported.map((review, index) => (
                            <div key={index} style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
                                <div className='flex-start flex-center-align'>
                                    {review.user.avatar !== null ? (
                                        <img className='img-avatar margin-r-8' src={`${siteURL}${review.user.avatar}`} alt="Avatar" />
                                    ) : (
                                        <img className='img-avatar margin-r-8' src={`/user-images/_default-images/${review.user.avatar_default}`} alt="Avatar" />
                                    )}
                                    <h4 className='margin-r-8'>{review.user ? `${review.user.first_name} ${review.user.last_name}` : 'Anonymous'}</h4>
                                    <p className='margin-r-8'>{review.post_date}</p>
                                    <button className='btn btn-small btn-green btn-emoji-big margin-r-8' title='Approve review' onClick={() => handleMarketReviewUnReport(review.id, review.user_id)}>&#9786;</button>
                                    <button className='btn btn-small btn-red btn-admin' onClick={() => handleMarketReviewDelete(review.id, review.user_id)}>Delete</button>
                                </div>
                                <div className='margin-l-40'>
                                    <p className='text-500'>{review.market.name}</p>
                                    <p>{review.review_text}</p>
                                </div>
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
                                <div className='flex-start flex-center-align'>
                                    {review.user.avatar !== null ? (
                                        <img className='img-avatar margin-r-8' src={`${siteURL}${review.user.avatar}`} alt="Avatar" />
                                    ) : (
                                        <img className='img-avatar margin-r-8' src={`/user-images/_default-images/${review.user.avatar_default}`} alt="Avatar" />
                                    )}
                                    <h4 className='margin-r-8'>{review.user ? `${review.user.first_name} ${review.user.last_name}` : 'Anonymous'}</h4>
                                    <p className='margin-r-8'>{review.post_date}</p>
                                    <button className='btn btn-small btn-green btn-emoji-big margin-r-8' title='Approve review' onClick={() => handleVendorReviewUnReport(review.id, review.user_id)}>&#9786;</button>
                                    <button className='btn btn-small btn-red btn-admin' onClick={() => handleVendorReviewDelete(review.id, review.user_id)}>Delete</button>
                                </div>
                                <div className='margin-l-40'>
                                    <p className='text-500'>{review.vendor.name}</p>
                                    <p>{review.review_text}</p>
                                </div>
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