import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import ReviewMarket from './ReviewMarket';

function MarketDetail ({ match }) {
    const { id } = useParams();

    const [market, setMarket] = useState();
    const [vendors, setVendors] = useState([]);
    const [vendorDetails, setVendorDetails] = useState({});
    const [allVendorDetails, setAllVendorDetails] = useState([]);
    const [vendorDetailsMap, setVendorDetailsMap] = useState({});
    const [marketFavs, setMarketFavs] = useState([]);
    const [isClicked, setIsClicked] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);
    const [showAlert, setShowAlert] = useState(false);
    const [productList, setProductList] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState("");
    const [marketDays, setMarketDays] = useState([]);
    const [allMarketDays, setAllMarketDays] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);
    const [vendorMarkets, setVendorMarkets] = useState();
    const [events, setEvents] = useState([]);
    const [marketBaskets, setMarketBaskets] = useState([]);
    
    // To be deleted after baskets state is moved to BasketCard
    // const [price, setPrice] = useState(5);
    
    const { handlePopup, amountInCart, setAmountInCart, cartItems, setCartItems } = useOutletContext();
    
    const userId = parseInt(globalThis.sessionStorage.getItem('user_id'));
    
    const navigate = useNavigate();

    const weekDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

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
        fetch(`http://127.0.0.1:5555/api/markets/${id}`)
            .then(response => response.json())
            .then(data => {
                setMarket(data);
            })
            .catch(error => console.error('Error fetching market data:', error));
    }, [id]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch multiple endpoints in parallel
                const [marketDaysRes, vendorMarketsRes, vendorsRes, eventsRes, marketFavsRes] = await Promise.all([
                    fetch(`http://127.0.0.1:5555/api/market-days?market_id=${market?.id}`).then(res => res.json()),
                    fetch("http://127.0.0.1:5555/api/vendor-markets").then(res => res.json()),
                    fetch("http://127.0.0.1:5555/api/vendors").then(res => res.json()),
                    fetch("http://127.0.0.1:5555/api/events").then(res => res.json()),
                    fetch(`http://127.0.0.1:5555/api/market-favorites?user_id=${userId}`).then(res => res.json())
                ]);

                // Set state with fetched data
                setMarketDays(marketDaysRes);
                if (Array.isArray(vendorMarketsRes)) {
                    const vendorIds = vendorMarketsRes.map(vendor => vendor.vendor_id);
                    setVendors(vendorIds);
                    setVendorMarkets(vendorMarketsRes)
                }
                if (marketDaysRes.length > 0) {
                    setSelectedDay(marketDaysRes[0]);
                }
                setVendorMarkets(vendorMarketsRes);
                setAllVendorDetails(vendorsRes);
                setEvents(eventsRes.filter(event => {
                    const today = new Date();
                    const sevenDaysFromNow = new Date();
                    sevenDaysFromNow.setDate(today.getDate() + 7);

                    const startDate = new Date(event.start_date);
                    const endDate = new Date(event.end_date);

                    return event.market_id === Number(id) && (
                        (today >= startDate && today <= endDate) ||
                        (startDate <= sevenDaysFromNow)
                    );
                }));
                setMarketFavs(marketFavsRes);
            } catch (error) {
                console.error("Error fetching data in parallel:", error);
            }
        };

        fetchData();
    }, [id, userId, market?.id]);

    const handleDayChange = (event) => {
        const dayId = parseInt(event.target.value);
        const day = marketDays.find(day => day.id === dayId);
        setSelectedDay(day);
        setSelectedProduct()
    };

    const handleProductChange = (event) => {
        setSelectedProduct(event.target.value);
    };

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/api/vendor-markets`)
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const vendorIds = data.map(item => item.vendor_id);
                    setVendors(vendorIds);
                    setVendorMarkets(data)

                    // const initialBaskets = {};
                    // vendorIds.forEach(vendorId => initialBaskets[vendorId] = 5);
                    // setMarketBaskets(initialBaskets);
                }
            })
            .catch(error => console.error('Error fetching vendors:', error));
    }, [id]);

    // filter all fetched vendors
    useEffect(() => {
        if (allVendorDetails.length > 0 && vendors.length > 0) {
            const filteredDetails = allVendorDetails.filter(vendor =>
                vendors.includes(vendor.id)
            );

            const marketDetailsMap = filteredDetails.reduce((acc, vendor) => {
                acc[vendor.id] = vendor;
                return acc;
            }, {});
            setVendorDetailsMap(marketDetailsMap);
        }
    }, [allVendorDetails, vendors]);

    const filteredVendorsList = vendors.filter((vendorId) => {
        const vendorDetail = vendorDetailsMap[vendorId];
        // Filter vendorMarkets to find the market_days that match the selected market_id and selected day
        const availableOnSelectedDay = vendorMarkets.filter(vendorMarket => {
            return vendorMarket.vendor_id === vendorId &&
                vendorMarket.market_day.market_id === market.id &&
                vendorMarket.market_day.day_of_week === selectedDay?.day_of_week;
        });
        // Only include vendors that are available on the selected day and match the selected product
        return availableOnSelectedDay.length > 0 && (!selectedProduct || vendorDetail.product === selectedProduct);
    });

    // Gets rid of duplicate vendors (from different market_days)
    const uniqueFilteredVendorsList = [...new Set(filteredVendorsList)];

    const handleAddToCart = (vendorId, vendorDetail, marketId) => {
        const basketInCart = marketBaskets.find(
            item => item.vendor_id === vendorId && item.is_sold === false
        );
        if (basketInCart) {
            setAmountInCart(amountInCart + 1);
            const vendor = vendorDetailsMap[vendorId];
            const basketId = 
            setCartItems([
                ...cartItems,
                {
                    vendorName: vendor.name,
                    location: market.name,
                    id: basketInCart.id,
                    price: basketInCart.price,
                },
            ]);
            setMarketBaskets(prevBaskets =>
                prevBaskets.filter(item => item.id !== basketInCart.id)
            );
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
        if (market && marketFavs.some(fav => fav.market_id === market.id)) {
            setIsClicked(true);
        }
    }, [market, marketFavs]);

    const handleClick = async (event) => {
        if (globalThis.sessionStorage.getItem('user_id') !== null) {
            setIsClicked((isClick) => !isClick);
            if (isClicked == false) {
                const response = await fetch('http://127.0.0.1:5555/api/market-favorites', {
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
                    fetch(`http://127.0.0.1:5555/api/market-favorites/${item.id}`, {
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

    useEffect(() => {
        if (vendorMarkets && selectedDay) {
            // Filter `vendorMarkets` based on selected day
            const availableOnSelectedDay = vendorMarkets.filter(
                vendorMarket => vendorMarket.market_day.market_id === market.id &&
                    vendorMarket.market_day.day_of_week === selectedDay.day_of_week
            );

            // Create a unique list of products available on the selected day
            const uniqueProducts = [...new Set(availableOnSelectedDay.map(vm => vm.vendor.product))];
            setProductList(uniqueProducts);
        }
    }, [vendorMarkets, selectedDay]);

    useEffect(() => {
        if (!selectedDay?.id) return;
        fetch(`http://127.0.0.1:5555/api/baskets?market_day_id=${selectedDay.id}`)
            .then(response => response.json())
            .then(data => {
                const filteredData = data.filter(item =>
                    !cartItems.some(cartItem => cartItem.id === item.id)
                );
                setMarketBaskets(filteredData);
            })
            .catch(error => console.error('Error fetching market baskets', error));
    }, [selectedDay, cartItems]);
    

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
                                    <div className='flex-start flex-center-align flex-gap-16'>
                                        <p className='text-italic nowrap'>
                                            {event.start_date}
                                            {event.end_date !== event.start_date && ` - `}
                                            <br></br>
                                            {event.end_date !== event.start_date && `${event.end_date}`}
                                        </p>
                                        <h3 className='nowrap'>{event.title ? event.title : 'Loading...'}:</h3>
                                        <p>{event.message}</p>
                                    </div>
                            </div>
                        ))
                    ) : (
                        <>
                        </>
                    )}
                </div>
            </div>
            <div className='flex-space-around flex-end margin-t-24'>
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
                <select id="marketDaysSelect" name="marketDays" onChange={handleDayChange}>
                    {marketDays.map((day, index) => (
                        <option key={index} value={day.id}>
                            {weekDay[day.day_of_week]}
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
                    {productList.map(product => (
                        <option key={product} value={product}>{product}</option>
                    ))}
                </select>
            </div>

            <div className='box-scroll'>
                {Array.isArray(uniqueFilteredVendorsList) && uniqueFilteredVendorsList.length > 0 ? (
                    uniqueFilteredVendorsList.map((vendorId, index) => {
                        const vendorDetail = vendorDetailsMap[vendorId] || {};

                        return (
                            <div key={index} className="market-item">
                                <Link to={`/user/vendors/${vendorId}`} className="market-name">
                                    {vendorDetail.name || 'Loading...'}
                                </Link>
                                <span className="market-name">{vendorDetail.product || 'No product listed'}</span>
                                {marketBaskets.filter(
                                        item => item.vendor_id === vendorDetail.id && item.is_sold === false
                                    ).filter(
                                        item => !cartItems.some(cartItem => cartItem.id === item.id)
                                    ).length > 0 ? (
                                    <span className="market-price">
                                        Price: ${marketBaskets.find(item => item.vendor_id === vendorDetail.id)?.price || ''}
                                    </span>
                                ) : (
                                    <span className="market-price">Out of Stock</span>
                                )}
                                <span className="market-baskets">
                                    Available Baskets: {marketBaskets.filter(
                                        item => item.vendor_id === vendorDetail.id && item.is_sold === false
                                    ).filter(
                                        item => !cartItems.some(cartItem => cartItem.id === item.id)
                                    ).length ?? 'Loading...'}
                                </span>
                                <button className="btn-edit" onClick={() => handleAddToCart(vendorId, vendorDetail)}>
                                    Add to Cart
                                </button>
                            </div>
                        );
                    })
                ) : (
                    <p>No vendors at this market</p>
                )}
            </div>
            <ReviewMarket market={market} alertMessage={alertMessage} setAlertMessage={setAlertMessage} />
        </div>
    );
};

export default MarketDetail;