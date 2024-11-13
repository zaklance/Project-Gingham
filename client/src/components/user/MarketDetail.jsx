import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import { APIProvider, Map, Marker, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import VendorDetail from './VendorDetail';

function MarketDetail ({ match }) {
    const { id } = useParams();

    const [market, setMarket] = useState(null);
    const [vendors, setVendors] = useState([]);
    const [vendorDetails, setVendorDetails] = useState({});
    const [marketReviews, setMarketReviews] = useState([]);
    const [marketFavs, setMarketFavs] = useState([]);
    const [isClicked, setIsClicked] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);
    const [showAlert, setShowAlert] = useState(false);
    const [showDupeAlert, setShowDupeAlert] = useState(false);
    const [reviewMode, setReviewMode] = useState(false);
    const [reviewData, setReviewData] = useState("");
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [editedReviewData, setEditedReviewData] = useState("");
    const [selectedProduct, setSelectedProduct] = useState("");
    const [marketDays, setMarketDays] = useState([])
    const [selectedDay, setSelectedDay] = useState(null);
    
    // To be deleted after baskets state is moved to BasketCard
    const [marketBaskets, setMarketBaskets] = useState({});
    const [price, setPrice] = useState(5);
    
    const { handlePopup, amountInCart, setAmountInCart, cartItems, setCartItems } = useOutletContext();
    
    const userId = parseInt(globalThis.sessionStorage.getItem('user_id'));
    
    const navigate = useNavigate();

    const weekday = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    const products = [
        'Art', 'Baked Goods', 'Cheese', 'Cider', 'Ceramics', 'Coffee/Tea', 'Fish', 'Flowers', 'Fruit', 'Gifts', 'Honey',
        'International', 'Juice', 'Maple Syrup', 'Meats', 'Mushrooms', 'Nuts', 'Pasta', 'Pickles', 'Spirits', 'Vegetables'
    ];

    function timeConverter(time24) {
        const date = new Date('1970-01-01T' + time24);

        const time12 = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
        return time12
    }

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/markets/${id}`)
            .then(response => response.json())
            .then(data => {
                setMarket(data);
            })
            .catch(error => console.error('Error fetching market data:', error));
    }, [id]);

    useEffect(() => {
        fetch("http://127.0.0.1:5555/market-days")
            .then(response => response.json())
            .then(data => {
                const filteredData = data.filter(item => item.market_id === market.id);
                setMarketDays(filteredData)
                setSelectedDay(filteredData[0]);
            })
            .catch(error => console.error('Error fetching favorites', error));
    }, [market?.id]);

    const handleDayChange = (event) => {
        const dayId = parseInt(event.target.value);
        const day = marketDays.find(day => day.id === dayId);
        setSelectedDay(day);
    };

    const handleProductChange = (event) => {
        setSelectedProduct(event.target.value);
    };

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/vendor-markets?market_id=${id}`)
            .then(response => response.json())
            .then(vendors => {
                if (Array.isArray(vendors)) {
                    const vendorIds = vendors.map(vendor => vendor.vendor_id);
                    setVendors(vendorIds);

                    const initialBaskets = {};
                    vendorIds.forEach(vendorId => initialBaskets[vendorId] = 5);
                    setMarketBaskets(initialBaskets);
                }
            })
            .catch(error => console.error('Error fetching vendors:', error));
    }, [id]);

    useEffect(() => {
        const fetchVendorDetails = async () => {
            if (vendors.length === 0) return;

            const details = await Promise.all(vendors.map(async (vendorId) => {
                try {
                    const response = await fetch(`http://127.0.0.1:5555/vendors/${vendorId}`);
                    if (!response.ok) throw new Error(`Failed to fetch vendor ${vendorId}`);
                    return await response.json();
                } catch (error) {
                    console.error(error);
                    return { id: vendorId, name: 'Unknown Vendor'};
                }
            }));
            const marketDetailsMap = {};
            details.forEach(vendor => {
                marketDetailsMap[vendor.id] = vendor;
            });
            setVendorDetails(marketDetailsMap);
        };
        fetchVendorDetails();
    }, [vendors]);

    const filteredVendorsList = vendors.filter((vendorId) => {
        const vendorDetail = vendorDetails[vendorId];      
        return !selectedProduct || vendorDetail.product === selectedProduct;
    });

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/market-reviews?market_id=${id}`)
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setMarketReviews(data);
                } else {
                    console.error('Unexpected response format:', data);
                    setMarketReviews([]);
                }
            })
            .catch(error => console.error('Error fetching reviews:', error));
    }, [id]);

    const handleAddToCart = (vendorId, marketId) => {
        if (marketBaskets[vendorId] > 0) {
            setMarketBaskets((prev) => ({
                ...prev,
                [vendorId]: prev[vendorId] - 1
            }));            
            setAmountInCart(amountInCart + 1);

            const vendor = vendorDetails[vendorId];
            setCartItems([...cartItems, { vendorName: vendor.name, location: market.name, id: cartItems.length + 1, price: price }]);
        } else {
            alert("Sorry, all baskets are sold out!");
        }
    };

    useEffect(() => {
        console.log("Amount in cart:", amountInCart);
        console.log("Cart items:", cartItems);
    }, [amountInCart, cartItems]);

    const handleBackButtonClick = () => {
        navigate('/user/markets');
    };

    useEffect(() => {
        fetch("http://127.0.0.1:5555/market-favorites")
            .then(response => response.json())
            .then(data => {
                const filteredData = data.filter(item => item.user_id === parseInt(globalThis.sessionStorage.getItem('user_id')));
                setMarketFavs(filteredData)
            })
            .catch(error => console.error('Error fetching favorites', error));
    }, []);

    const handleClick = async (event) => {
        if (globalThis.sessionStorage.getItem('user_id') !== null) {
            setIsClicked((isClick) => !isClick);
            if (isClicked == false) {
                const response = await fetch('http://127.0.0.1:5555/market-favorites', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: globalThis.sessionStorage.getItem('user_id'),
                        market_id: market.id
                    })
                    // credentials: 'include'
                }).then((resp) => {
                    return resp.json()
                }).then(data => {
                    setMarketFavs([...marketFavs, data]);
                    setAlertMessage('added to favorites');
                });
            } else {
                const findMarketFavId = marketFavs.filter(item => item.market_id == market.id)
                for (const item of findMarketFavId) {
                    fetch(`http://127.0.0.1:5555/market-favorites/${item.id}`, {
                        method: "DELETE",
                    }).then(() => {
                        setMarketFavs((favs) => favs.filter((fav) => fav.market_id !== market.id));
                        setAlertMessage('removed from favorites');
                    })
                }
            }
        } else {
            handlePopup()
        }

        setShowAlert(true);
        setTimeout(() => {
            setShowAlert(false);
        }, 1000);
    };

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
        const existingReview = marketReviews.some(review => review.user_id === userId);

        if (existingReview) {
            setAlertMessage('You have already submitted a review for this vendor.');
            setShowDupeAlert(true);
            setTimeout(() => setShowDupeAlert(null), 3000);
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:5555/market-reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    market_id: market.id,
                    review_text: reviewData
                })
            });

            if (response.ok) {
                const newReview = await response.json();
                setMarketReviews([...marketReviews, newReview]);
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
            const response = await fetch(`http://127.0.0.1:5555/market-reviews/${reviewId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ review_text: editedReviewData })
            });

            if (response.ok) {
                const updatedReview = await response.json();
                setMarketReviews((prevReviews) => prevReviews.map((review) =>
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
        
            fetch(`http://127.0.0.1:5555/market-reviews/${reviewId}`, {
                method: "DELETE",
            }).then(() => {
                setAlertMessage('Review deleted');
                setMarketReviews((prevReviews) => prevReviews.filter((review) => review.id !== reviewId))
            })
        } catch (error) {
            console.error("Error deleting review", error)
        }
    }

    const handleReviewReport = async (reviewId) => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/market-reviews/${reviewId}`, {
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


    if (!market) {
        return <div>Loading...</div>;
    }

    const { coordinates } = market;
    
    const googleMapsLink = market?.coordinates
    ? `https://www.google.com/maps?q=${market.coordinates.lat},${market.coordinates.lng}`
    : '#';
    
    const marketLocation = { 'lat': parseFloat(market.coordinates.lat), 'lng': parseFloat(market.coordinates.lng) }

    return (
        <div>
            <div className='flex-space-between'>
                <h2>{market.name}</h2>
                <button onClick={handleBackButtonClick} className='btn btn-small'>Back to Markets</button>
            </div>
            <br/>
            <div className='flex-space-around flex-end'>
                <div>
                    <img className='img-market' src={`/market-images/${market.image}`} alt="Market Image" />
                </div>
                <div id='map' className='map-market-detail'>
                    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_KEY} onLoad={() => console.log('Maps API has loaded.')}>
                        <Map defaultCenter={marketLocation} defaultZoom={16} mapId={import.meta.env.VITE_GOOGLE_MAP_ID}>
                            <AdvancedMarker position={marketLocation} />
                        </Map>
                    </APIProvider>
                </div>
            </div>
            <p>{market.description}</p>
            <div className='flex-start market-details'>
                <h4>Location: <a className='link-yellow' href={googleMapsLink} target="_blank" rel="noopener noreferrer">
                    {market.location}
                </a></h4>
                <div className='flex-start'>
                    <button
                        className={`btn-like ${isClicked || marketFavs.some(fav => fav.market_id === market.id) ? 'btn-like-on' : ''}`}
                        onClick={handleClick}> ❤️ </button>
                    {showAlert && (
                        <div className={`alert-favorites ${!showAlert ? 'alert-favorites-hidden' : ''}`}>
                            {alertMessage}
                        </div>
                    )}
                </div>
            </div>
            <div className='flex-start'>
                <label><h4>Market Day:</h4></label>
                <select id="marketDaysSelect" name="marketDays">
                    {marketDays.map((day, index) => (
                        <option key={index} value={day.id}>
                            {weekday[day.day_of_week]}
                        </option>
                    ))}
                </select>
                {selectedDay && (
                    <h4 className='btn-gap'>Hours: {timeConverter(selectedDay.hour_start)} - {timeConverter(selectedDay.hour_end)}</h4>
                )}
            </div>
            <br/>
            <br/>
            <div className='flex-space-between'>
                <h2>Vendors in this Market:</h2>
                <select value={selectedProduct} onChange={handleProductChange}>
                    <option value="">All Products</option>
                    {products.map(product => (
                        <option key={product} value={product}>{product}</option>
                    ))}
                </select>
            </div>

            <div className='box-scroll'>
            {Array.isArray(filteredVendorsList) && filteredVendorsList.length > 0 ? (
                filteredVendorsList.map((vendorId, index) => {
                    const vendorDetail = vendorDetails[vendorId] || {};
                    
                    return (
                        <div key={index} className="market-item">
                            <Link to={`/user/vendors/${vendorId}`} className="market-name">
                                {vendorDetail.name || 'Loading...'}
                            </Link>
                            <span className="market-name">{vendorDetail.product || 'No product listed'}</span>

                            <span className="market-price">Price: ${price.toFixed(2)}</span>
                            <span className="market-baskets">
                                Available Baskets: {marketBaskets[vendorId] ?? 'Loading...'}
                            </span>
                            <button className="btn-edit" onClick={() => handleAddToCart(vendorId)}>
                                Add to Cart
                            </button>
                        </div>
                    );
                })
            ) : (
                <p>No vendors at this market</p>
            )}
            </div>
            <br/>
            <h2>Reviews</h2>
            <br/>
            {marketReviews.length > 0 ? (
                marketReviews.map((review, index) => (
                    <div key={index} style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
                        {review.user_id !== userId && editingReviewId !== review.id && (
                            <div className='flex-start'>
                                <h4>{review.user ? review.user.first_name : 'Anonymous'}</h4>
                                <button className='btn btn-small btn-x btn-report btn-gap' onClick={() => handleReviewReport(review.id)}>&#9873;</button>
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
                            <p>{review.review_text}</p>
                        )}
                        {review.user_id === userId && editingReviewId !== review.id && (
                            <>
                                <button className='btn btn-small' onClick={() => handleReviewEditToggle(review.id, review.review_text)}>
                                    Edit
                                </button>
                                <button className='btn btn-small btn-x btn-gap' onClick={() => handleReviewDelete(review.id)}>x</button>

                            </>
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
                        <button className='btn-login' onClick={handleReviewSubmit} type="submit">Post Review</button>
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
        </div>
    );
};

export default MarketDetail;