import React, { useEffect, useState } from 'react';


function AdminUsers() {
    const [marketReported, setMarketReported] = useState([]);
    const [vendorReported, setVendorReported] = useState([]);



    useEffect(() => {
        fetch("http://127.0.0.1:5555/api/market-reviews")
            .then(response => response.json())
            .then(data => {
                const filteredData = data.filter(item => item.is_reported === true);
                setMarketReported(filteredData)
            })
            .catch(error => console.error('Error fetching market reviews', error));
    }, []);

    const handleMarketReviewDelete = async (reviewId) => {
        try {

            fetch(`http://127.0.0.1:5555/api/market-reviews/${reviewId}`, {
                method: "DELETE",
            }).then(() => {
                setMarketReported((prevReviews) => prevReviews.filter((review) => review.id !== reviewId))
            })
        } catch (error) {
            console.error("Error deleting review", error)
        }
    }

    const handleMarketReviewReport = async (reviewId) => {
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
        fetch("http://127.0.0.1:5555/api/vendor-reviews")
            .then(response => response.json())
            .then(data => {
                const filteredData = data.filter(item => item.is_reported === true);
                setVendorReported(filteredData)
            })
            .catch(error => console.error('Error fetching vendor reviews', error));
    }, []);

    const handleVendorReviewDelete = async (reviewId) => {
        try {

            fetch(`http://127.0.0.1:5555/api/vendor-reviews/${reviewId}`, {
                method: "DELETE",
            }).then(() => {
                setVendorReported((prevReviews) => prevReviews.filter((review) => review.id !== reviewId))
            })
        } catch (error) {
            console.error("Error deleting review", error)
        }
    }

    const handleVendorReviewReport = async (reviewId) => {
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
            <h2 className='margin-t-16'>User Management</h2>
            <div className='box-bounding'>
                <h2 className='margin-b-24'>Reported Market Reviews</h2>
                <div className='box-scroll'>
                    {marketReported.length > 0 ? (
                        marketReported.map((review, index) => (
                            <div key={index} style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
                                <div className='flex-start'>
                                    <h4>{review.user ? review.user.first_name : 'Anonymous'}</h4>
                                    <button className='btn btn-small btn-x btn-unreport btn-gap' onClick={() => handleMarketReviewReport(review.id)}>&#9873;</button>
                                    <button className='btn btn-small btn-x btn-gap' onClick={() => handleMarketReviewDelete(review.id)}>x</button>
                                </div>
                                <p>{review.review_text}</p>
                            </div>
                            
                        ))
                    ) : (
                        <p>No reported reviews.</p>
                    )}
                </div>
            </div>
            <div className='box-bounding'>
                <h2 className='margin-b-24'>Reported Vendor Reviews</h2>
                <div className='box-scroll'>
                    {vendorReported.length > 0 ? (
                        vendorReported.map((review, index) => (
                            <div key={index} style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
                                <div className='flex-start'>
                                    <h4>{review.user ? review.user.first_name : 'Anonymous'}</h4>
                                    <button className='btn btn-small btn-x btn-unreport btn-gap' onClick={() => handleMarketReviewReport(review.id)}>&#9873;</button>
                                    <button className='btn btn-small btn-x btn-gap' onClick={() => handleMarketReviewDelete(review.id)}>x</button>
                                </div>
                                <p>{review.review_text}</p>
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

export default AdminUsers;