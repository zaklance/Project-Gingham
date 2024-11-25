import React, { useEffect, useState } from 'react';
import { useParams, Link, useOutletContext, useNavigate } from 'react-router-dom';
import MarketCard from './MarketCard';
import ReviewCard from './ReviewCard';


function VendorDetail () {
    const { id } = useParams();
    
    const [vendor, setVendor] = useState(null);
    const [marketDetails, setMarketDetails] = useState({});
    const [markets, setMarkets] = useState([]);
    const [vendorReviews, setVendorReviews] = useState([]);
    const [vendorFavs, setVendorFavs] = useState([]);
    const [isClicked, setIsClicked] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);
    const [showAlert, setShowAlert] = useState(false);
    const [showDupeAlert, setShowDupeAlert] = useState(false);
    const [reviewMode, setReviewMode] = useState(false);
    const [reviewData, setReviewData] = useState("");
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [editedReviewData, setEditedReviewData] = useState("");
    const [hoveredMarket, setHoveredMarket] = useState(null);
    const [events, setEvents] = useState([]);

    const reviewType = "vendor"
    
    // To be deleted after baskets state is moved to BasketCard
    const [marketBaskets, setMarketBaskets] = useState({});
    const [price, setPrice] = useState(5.00);

    const { amountInCart, setAmountInCart, cartItems, setCartItems, handlePopup } = useOutletContext();
    const userId = parseInt(globalThis.sessionStorage.getItem('user_id'));
    const isUserLoggedIn = userId;

    const weekDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    const navigate = useNavigate();

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
        fetch(`http://127.0.0.1:5555/api/vendors/${id}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                setVendor(data);
            })
            .catch(error => console.error('Error fetching vendor data:', error));
    }, [id]);

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/api/vendor-markets?vendor_id=${id}`)
            .then(response => response.json())
            .then(markets => {
                if (Array.isArray(markets)) {
                    const marketIds = markets.map(market => market.market_day_id);
                    setMarkets(marketIds);

                    const initialBaskets = {};
                    marketIds.forEach(marketId => initialBaskets[marketId] = 5);
                    setMarketBaskets(initialBaskets);
                }
            })
            .catch(error => console.error('Error fetching market locations:', error));
    }, [id]);

    useEffect(() => {
        const fetchMarketDetails = async () => {
            if (markets.length === 0) return;
    
            const details = await Promise.all(markets.map(async (marketId) => {
                try {
                    const response = await fetch(`http://127.0.0.1:5555/api/market-days/${marketId}`);
                    if (!response.ok) throw new Error(`Failed to fetch market ${marketId}`);
                    return await response.json();
                } catch (error) {
                    console.error(error);
                    return { id: marketId, name: 'Unknown Market' };
                }
            }));
    
            const vendorDetailsMap = {};
            details.forEach(market => {
                vendorDetailsMap[market.id] = market;
            });
            setMarketDetails(vendorDetailsMap);
        };
    
        fetchMarketDetails();
    }, [markets]);

    const handleAddToCart = (marketId) => {
        if (marketBaskets[marketId] > 0) {
            setMarketBaskets((prev) => ({
                ...prev,
                [marketId]: prev[marketId] - 1
            }));
            setAmountInCart(amountInCart + 1);

            const market = marketDetails[marketId];
            setCartItems([...cartItems, { vendorName: vendor.name, location: market.name, id: cartItems.length + 1, price: price }]);
        } else {
            alert("Sorry, all baskets are sold out at this market!");
        }
    };

    useEffect(() => {
        console.log("Amount in cart:", amountInCart);
        console.log("Cart items:", cartItems);
    }, [amountInCart, cartItems]);

    const handleBackButtonClick = () => {
        navigate('/user/vendors');
    };

    // const handleMarketChange = (event) => {
    //     setSelectedVendor(parseInt(event.target.value));
    // };

    useEffect(() => {
        fetch("http://127.0.0.1:5555/api/vendor-favorites")
            .then(response => response.json())
            .then(data => {
                const filteredData = data.filter(item => item.user_id === parseInt(globalThis.sessionStorage.getItem('user_id')));
                setVendorFavs(filteredData);
            })
            .catch(error => console.error('Error fetching vendor favorites', error));
    }, []);

    useEffect(() => {
        if (vendor && vendorFavs.some(fav => fav.vendor_id === vendor.id)) {
            setIsClicked(true);
        }
    }, [vendor, vendorFavs]);
    
    // useEffect(() => {
    //     fetch("http://127.0.0.1:5555/api/vendor-favorites")
    //         .then(response => response.json())
    //         .then(data => {
    //             const filteredData = data.filter(item => item.user_id === parseInt(globalThis.sessionStorage.getItem('user_id')));
    //             setVendorFavs(filteredData)
    //         })
    //         .catch(error => console.error('Error fetching vendor favorites', error));
    // }, []);

    const handleClick = async (event) => {
        if (globalThis.sessionStorage.getItem('user_id') !== null) {
            setIsClicked((isClick) => !isClick);
            if (isClicked == false) {
                const response = await fetch('http://127.0.0.1:5555/api/vendor-favorites', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: globalThis.sessionStorage.getItem('user_id'),
                        vendor_id: vendor.id
                    })
                    // credentials: 'include'
                }).then((resp) => {
                    return resp.json()
                }).then(data => {
                    setVendorFavs([...vendorFavs, data])
                    setAlertMessage('added to favorites');
                });
            } else {
                const findVendorFavId = vendorFavs.filter(item => item.vendor_id == vendor.id)
                for (const item of findVendorFavId) {
                    fetch(`http://127.0.0.1:5555/api/vendor-favorites/${item.id}`, {
                        method: "DELETE",
                    }).then(() => {
                        setVendorFavs((favs) => favs.filter((fav) => fav.vendor_id !== vendor.id));
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
        }, 3000);
    };

    if (!vendor) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <div className='flex-space-between'>
                <h2>{vendor.name}</h2>
                <button onClick={handleBackButtonClick} className='btn btn-small'>Back to Vendors</button>
            </div>
            <div className={events.length < 1 ? 'flex-start flex-align-start flex-gap-16' : 'flex-start flex-align-center flex-gap-16'}>
                {events.length > 0 ? (
                    <h2 className='color-4 margin-t-16'>Events:</h2>
                ) : (
                    <>
                    </>
                )}
                <div className='flex-wrap'>
                    {events.length > 0 ? (
                        events.map((event, index) => (
                            <div key={index} style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
                                {event.user_id !== userId && editingReviewId !== event.id && (
                                    <div className='flex-start flex-center-align flex-gap-16 margin-t-16'>
                                        <p className='text-italic nowrap'>
                                            {event.start_date}
                                            {event.end_date !== event.start_date && ` - `}
                                            <br></br>
                                            {event.end_date !== event.start_date && `${event.end_date}`}
                                        </p>
                                        <h3 className='nowrap'>{event.title ? event.title : 'Loading...'}:</h3>
                                        <p>{event.message}</p>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <>
                        </>
                    )}
                </div>
            </div>
            <div className='flex-space-between margin-t-24 flex-wrap'>
                <div>
                    <img className='img-vendor' src={`/vendor-images/${vendor.image}`} alt="Vendor Image"/>
                </div>
                <div className='side-basket'>
                    <h2 className='margin-t-16'>Vendor Bio</h2>
                    <p className='margin-t-16'>{vendor.bio}</p>
                    <div className='flex-start margin-t-16'>
                        <h4 className='nowrap'>Based out of: {vendor.city}, {vendor.state}</h4>
                        <div className='button-container flex-start flex-center-align nowrap'>
                            <button 
                                className={`btn-like ${isClicked || vendorFavs.some(fav => fav.vendor_id === vendor.id) ? 'btn-like-on' : ''}`}
                                onClick={handleClick}> ❤️
                            </button>
                            {showAlert && (
                                <div className='alert-favorites nowrap'>
                                    {alertMessage}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <br />
                <br />
                <h2>Farmers Market Locations:</h2>
                <div className='box-scroll'>
                {Array.isArray(markets) && markets.length > 0 ? (
                    markets.map((marketId, index) => {
                        const marketDetail = marketDetails[marketId] || {};
                        return (
                            <div 
                                key={index} 
                                className="market-item"
                                // onMouseEnter={() => setHoveredMarket(marketId)}
                                // onMouseLeave={() => setHoveredMarket(null)}
                            >
                                <span>
                                    <Link to={`/user/markets/${marketId}`} className="market-name">
                                        {marketDetail?.markets?.name || 'Loading...'}
                                    </Link>
                                    <br/>
                                    Hours: {marketDetail.day_of_week ? `${weekDay[marketDetail.day_of_week]}, ` : 'Loading...'}
                                    {`${marketDetail.hour_start && timeConverter(marketDetail.hour_start)} - 
                                    ${marketDetail.hour_end && timeConverter(marketDetail.hour_end)}`}
                                </span>
                                <span></span>
                                {index === 0 && (
                                    <>
                                        <span className="market-price">Price: ${price.toFixed(2)}</span>
                                        <span className="market-baskets">
                                            Available Baskets: {marketBaskets[marketId] ?? 'Loading...'}
                                            <br/>
                                            Pick Up Time: 3:30 PM - 4:00 PM
                                        </span>
                                        <button className="btn-edit" onClick={() => handleAddToCart(marketId)}>
                                            Add to Cart
                                        </button>                                    
                                    </>
                                )}

                                {hoveredMarket === marketId && (
                                    <div className='market-card-popup'>
                                        <MarketCard marketData={marketId} />
                                        {/* Why isnt the other info populating?!? */}
                                    </div>
                                )}
                            </div>
                        );
                    })
                    ) : (
                        <p>No market locations at this time</p>
                    )}
                </div>
                <br />
                <ReviewCard reviewType={reviewType} />
            </div>
        </div>
    );
};

export default VendorDetail;