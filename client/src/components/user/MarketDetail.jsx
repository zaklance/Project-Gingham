import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import { APIProvider, Map, Marker, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import VendorDetail from './VendorDetail';

function MarketDetail ({ match }) {
    const { id } = useParams();

    const [market, setMarket] = useState(null);
    const [vendors, setVendors] = useState([]);
    const [vendorDetails, setVendorDetails] = useState({});
    const [randomImage, setRandomImage] = useState('');
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
    const [selectedProduct, setSelectedProduct] = useState('');

    
    // To be deleted after baskets state is moved to BasketCard
    const [availableBaskets, setAvailableBaskets] = useState(5);
    const [price, setPrice] = useState(4.99);
    
    const { handlePopup, amountInCart, setAmountInCart, cartItems, setCartItems } = useOutletContext();
    
    const userId = parseInt(globalThis.sessionStorage.getItem('user_id'));
    const filteredVendors = selectedProduct ? vendors.filter(vendor => vendor.product === selectedProduct) : vendors;
    
    const navigate = useNavigate();

    const weekday = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    const products = [
        'Art', 'Baked Goods', 'Cheese', 'Cider', 'Ceramics', 'Coffee/Tea', 'Fish', 'Flowers', 'Fruit', 'Gifts', 'Honey',
        'International', 'Juice', 'Maple Syrup', 'Meats', 'Mushrooms', 'Nuts', 'Pasta', 'Pickles', 'Spirits', 'Vegetables'
    ];

    const handleProductChange = (event) => {
        setSelectedProduct(event.target.value);
    };

    
    const images = [
        'https://neighbors.columbia.edu/sites/default/files/content/2023/farmers-market.jpg',
        'https://www.grownyc.org/files/gmkt/mkts/bronxborhall_shaylahunter_re_xy4a4543.jpg',
        'https://lh5.googleusercontent.com/proxy/Nd-2s7WjGA8FU3DU_URBrXwuo9dcyXtJwyJ7nmtY1HDszee2DnvtQ5IA1US5bkIP6A9RpD5FK0-H1GYin6b3tl7PORAbABPy-T-l_2Ak9ERf5VpENFF3uA',
        'https://cdn.vox-cdn.com/thumbor/K7pJk3lLSH60zEbktRL0AQ-jNfA=/0x0:4500x2994/1200x900/filters:focal(1890x1137:2610x1857)/cdn.vox-cdn.com/uploads/chorus_image/image/65219436/6329735393_3a905a118a_o.0.jpg',
        'https://assets3.thrillist.com/v1/image/1725017/828x610/flatten;crop;webp=auto;jpeg_quality=60.jpg',
        'https://offloadmedia.feverup.com/secretnyc.co/wp-content/uploads/2022/04/25075251/greenmarket-grownyc-768x512.jpeg',
        'https://offloadmedia.feverup.com/secretnyc.co/wp-content/uploads/2022/04/25075224/c.-Martin-Seck-GAP-1-768x531.jpg',
        'https://www.officialworldtradecenter.com/content/dam/wtc/site-resources/wtc-website-photography/events/WTC_Events_FarmersMarket.JPG.transform/wtc-960/image.jpeg',
        'https://cdn.vox-cdn.com/thumbor/yPQbB1QqymUa85rML9qCDtEpSFE=/0x319:4500x2675/fit-in/1200x630/cdn.vox-cdn.com/uploads/chorus_asset/file/19184719/6329735393_3a905a118a_o.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/2/28/Union_Square_Farmers_Market.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/d/da/10292023_Broadway_farmers%27_market_Columbia_NYC.jpg',
        'https://www.officialworldtradecenter.com/content/dam/wtc/site-resources/wtc-website-photography/events/WTC_Events_FarmersMarket.JPG.transform/wtc-960/image.jpeg'
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
                const randomIndex = Math.floor(Math.random() * images.length);
                setRandomImage(images[randomIndex]);
            })
            .catch(error => console.error('Error fetching market data:', error));
    }, [id]);

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/vendor-markets?market_id=${id}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch vendors');
                }
                return response.json();
            })
            .then(vendors => {
                console.log('Fetched vendors:', vendors);
                if (Array.isArray(vendors)) {
                    const vendorIds = vendors.map(vendor => vendor.vendor_id)
                    setVendors(vendorIds);
                } else {
                    console.error('Unexpected response format:', vendors);
                    setVendors([]);
                }
            })
            .catch(error => console.error('Error fetching vendors:', error))
    }, [id]);

    useEffect(() => {
        const fetchVendorDetails = async () => {
            if (vendors.length === 0) return;

            const details = await Promise.all(vendors.map(async(vendorId) => {
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
                marketDetailsMap[vendor.id] = vendor.name;
            });
            setVendorDetails(marketDetailsMap);
        };

        fetchVendorDetails();
    }, [vendors]); 

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

    const handleAddToCart = () => {
        if (availableBaskets > 0) {
            setAvailableBaskets(availableBaskets - 1);
            setAmountInCart(amountInCart + 1);
            // let marketLocation = marketDetails[selectedVendor]
            setCartItems([...cartItems, { vendorName: vendor.name, location: market.id, id: cartItems.length + 1, price: price }]);
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

    // const handleInputChange = event => {
    //     setReviewData({
    //         ...reviewData
    //     });
    // };

    const handleReviewEditToggle = (reviewId, currentText) => {
        setEditingReviewId(reviewId);
        setEditedReviewData(currentText);
    };

    const handleEditInputChange = (event) => {
        setEditedReviewData(event.target.value);
    };


    const hanldeReviewSubmit = async () => {
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
            <div className='flex-space-around-end'>
                <div>
                    <img className='img-market' src={randomImage} alt="Market Image" />
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
            <div className='float-left market-details'>
                <h4>Location: <a className='link-yellow' href={googleMapsLink} target="_blank" rel="noopener noreferrer">
                    {market.location}
                </a></h4>
                <h4>Hours: {weekday[market.day_of_week]}, {timeConverter(market.hour_start)} - {timeConverter(market.hour_end)}</h4>
            </div>
            <br />
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
            {Array.isArray(vendors) && vendors.length > 0 ? (
                vendors.map((vendorId, index) => (
                    <div key={index} className="market-item">
                        <Link to={`/user/vendors/${vendorId}`} className="market-name">
                            {vendorDetails[vendorId] || 'Loading'}
                        </Link>
                        <span className="market-price">Price: ${price.toFixed(2)}</span>
                        <span className="market-baskets">Available Baskets: {availableBaskets}</span>
                        <button className="btn-edit" onClick={() => handleAddToCart(marketId)}>
                            Add to Cart
                        </button>
                    </div>
                ))
            ) : (
                <p>No vendors at this market</p>
            )}         
            <br/>
            <h2>Reviews</h2>
            <br/>
            {marketReviews.length > 0 ? (
                marketReviews.map((review, index) => (
                    <div key={index} style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
                        <h4>{review.user ? review.user.first_name : 'Anonymous'}</h4>
                        {review.user_id === userId && editingReviewId === review.id ? (
                            <>
                                <textarea className='textarea-edit'
                                    value={editedReviewData}
                                    onChange={handleEditInputChange}
                                />
                                <br></br>
                                <button className='btn btn-small' onClick={() => handleReviewUpdate(review.id)}>Save</button>
                                <button className='btn btn-small' onClick={() => setEditingReviewId(null)}>Cancel</button>
                            </>
                        ) : (
                            <p>{review.review_text}</p>
                        )}
                        {review.user_id === userId && editingReviewId !== review.id && (
                            <button className='btn btn-small' onClick={() => handleReviewEditToggle(review.id, review.review_text)}>
                                Edit
                            </button>
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
                        <button className='btn-login' onClick={hanldeReviewSubmit} type="submit">Post Review</button>
                    </>
                ) : (
                    <button className='btn btn-plus' onClick={handleReviewToggle} title='Leave a review'>+</button>
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
