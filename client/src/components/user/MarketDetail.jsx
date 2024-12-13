import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { weekDay } from '../../utils/common';
import { timeConverter, formatEventDate, formatDate } from '../../utils/helpers';
import ReviewMarket from './ReviewMarket';

function MarketDetail ({ match }) {
    const { id } = useParams();
    const [market, setMarket] = useState();
    const [vendors, setVendors] = useState([]);
    const [allVendorDetails, setAllVendorDetails] = useState([]);
    const [vendorDetailsMap, setVendorDetailsMap] = useState({});
    const [marketFavs, setMarketFavs] = useState([]);
    const [isClicked, setIsClicked] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);
    const [showAlert, setShowAlert] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState("");
    const [marketDays, setMarketDays] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);
    const [vendorMarkets, setVendorMarkets] = useState();
    const [events, setEvents] = useState([]);
    const [marketBaskets, setMarketBaskets] = useState([]);
    const [products, setProducts] = useState([]);
    const [productList, setProductList] = useState({});
    
    const { handlePopup, amountInCart, setAmountInCart, cartItems, setCartItems } = useOutletContext();
    
    const userId = parseInt(globalThis.localStorage.getItem('user_id'));
    
    const navigate = useNavigate();

    useEffect(() => {
        fetch("http://127.0.0.1:5555/api/products")
            .then(response => response.json())
            .then(data => {
                const sortedProducts = data.sort((a, b) => {
                    if (a.product === "Other") return 1;
                    if (b.product === "Other") return -1;
                    return a.product.localeCompare(b.product);
                });
                setProducts(sortedProducts);
            })
            .catch(error => console.error('Error fetching products', error));
    }, []);

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
                const [marketDaysRes, vendorMarketsRes, vendorsRes, eventsRes, marketFavsRes] = await Promise.all([
                    fetch(`http://127.0.0.1:5555/api/market-days?market_id=${market?.id}`).then(res => res.json()),
                    fetch("http://127.0.0.1:5555/api/vendor-markets").then(res => res.json()),
                    fetch("http://127.0.0.1:5555/api/vendors").then(res => res.json()),
                    fetch("http://127.0.0.1:5555/api/events").then(res => res.json()),
                    fetch(`http://127.0.0.1:5555/api/market-favorites?user_id=${userId}`).then(res => res.json())
                ]);
                
                setMarketDays(marketDaysRes);
                if (Array.isArray(vendorMarketsRes)) {
                    const vendorIds = vendorMarketsRes.map(vendor => vendor.vendor_id);
                    setVendors(vendorIds);
                    setVendorMarkets(vendorMarketsRes);
                }
                if (marketDaysRes.length > 0) {
                    setSelectedDay(marketDaysRes[0]);
                }
                setVendorMarkets(vendorMarketsRes);
                setAllVendorDetails(vendorsRes);
                
                const today = new Date();
                const sevenDaysFromNow = new Date();
                sevenDaysFromNow.setDate(today.getDate() + 7);
                
                today.setHours(0, 0, 0, 0);
                sevenDaysFromNow.setHours(0, 0, 0, 0);

                const filteredEvents = eventsRes.filter(event => {
                    const startDate = new Date(event.start_date + 'T00:00:00');
                    const endDate = new Date(event.end_date + 'T00:00:00');

                    startDate.setHours(0, 0, 0, 0);
                    endDate.setHours(0, 0, 0, 0);

                    return event.market_id === Number(id) && (
                        (startDate >= today && startDate <= sevenDaysFromNow) ||
                        (endDate >= today && endDate <= sevenDaysFromNow) ||
                        (startDate <= today && endDate >= today)
                    );
                });
    
                setEvents(filteredEvents);
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

    // Filter vendors
    const filteredVendorsList = useMemo(() => {
        return vendors.filter((vendorId) => {
            const vendorDetail = vendorDetailsMap[vendorId];
            if (!vendorDetail) {
                return false;
            }
            const availableOnSelectedDay = vendorMarkets.filter(vendorMarket => {
                return vendorMarket.vendor_id === vendorId &&
                    vendorMarket.market_day.market_id === market.id &&
                    vendorMarket.market_day.day_of_week === selectedDay?.day_of_week;
            });
            return availableOnSelectedDay.length > 0 && (!selectedProduct || Number(vendorDetail.product) === Number(selectedProduct));
        });
    }, [vendors, vendorMarkets, selectedDay, selectedProduct, market, vendorDetailsMap]);

    // Filter productList so that it only shows products that are in filteredVendorsList
    useEffect(() => {
        if (!vendorMarkets || !products?.length || !selectedDay) return;

        const filteredMarketsOnDay = vendorMarkets.filter(
            vendorMarket =>
                vendorMarket.market_day.day_of_week === selectedDay.day_of_week &&
                vendorMarket.market_day.market_id === market.id
        );
        const filteredProducts = products.filter(product =>
            filteredMarketsOnDay.some(vendorMarket => vendorMarket.vendor.product === product.id)
        );
        setProductList(filteredProducts);
    }, [vendorMarkets, selectedDay, products, market]);

    // Gets rid of duplicate vendors (from different market_days)
    const uniqueFilteredVendorsList = [...new Set(filteredVendorsList)];

    const handleAddToCart = (vendorId, vendorDetail, basket) => {
        const vendorName = vendorDetailsMap[vendorId]?.name || "Unknown Vendor";
        const basketInCart = marketBaskets.find(
            item => item.vendor_id === vendorId && item.is_sold === false
        );
        if (basketInCart) {
            const updatedCartItems = [...cartItems, {
                vendor_name: vendorName,
                vendor_id: vendorId,
                location: market.name,
                id: basketInCart.id,
                price: basketInCart.price,
                pickup_start: basketInCart.pickup_start,
                pickup_end: basketInCart.pickup_end,
                day_of_week: new Date(basketInCart.sale_date).getDay(),
                sale_date: new Date(basketInCart.sale_date)
            }];
            setCartItems(updatedCartItems);
            setAmountInCart(updatedCartItems.length);
            setMarketBaskets(prev => prev.filter(item => item.id !== basketInCart.id)
            );
        } else {
            alert("Sorry, all baskets are sold out!");
        }
    };

    useEffect(() => {
        // console.log("Amount in cart:", amountInCart);
        // console.log("Cart items:", cartItems);
    }, [amountInCart, cartItems]);

    const handleBackButtonClick = () => {
        if (isClicked) {
            navigate('/user/markets', { state: { isClicked } });
        } else {
            console.log("No filters applied");
            navigate('/user/markets');
        }
    };

    useEffect(() => {
        if (market && marketFavs.some(fav => fav.market_id === market.id)) {
            setIsClicked(true);
        }
    }, [market, marketFavs]);

    const handleClick = async (event) => {
        if (globalThis.localStorage.getItem('user_id') !== null) {
            setIsClicked((isClick) => !isClick);
            if (isClicked == false) {
                const response = await fetch('http://127.0.0.1:5555/api/market-favorites', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: globalThis.localStorage.getItem('user_id'),
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
        if (!selectedDay?.id) return;
        fetch(`http://127.0.0.1:5555/api/baskets?market_day_id=${selectedDay.id}`)
            .then(response => response.json())
            .then(data => {
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Start of today
                const sixDaysFromNow = new Date();
                sixDaysFromNow.setDate(today.getDate() + 6);
                sixDaysFromNow.setHours(23, 59, 59, 999); // End of the sixth day

                const filteredBaskets = data.filter((basket) => {
                    const saleDate = new Date(basket.sale_date);
                    return saleDate >= today && saleDate <= sixDaysFromNow;
                });

                const filteredData = filteredBaskets.filter(item =>
                    !cartItems.some(cartItem => cartItem.id === item.id)
                );
                setMarketBaskets(filteredData);
            })
            .catch(error => console.error('Error fetching market baskets', error));
    }, [selectedDay, cartItems]);

    const getAvailableBaskets = (vendorId) => {
        return marketBaskets.filter(
            item => item.vendor_id === vendorId && item.is_sold === false
        ).filter(item => !cartItems.some(cartItem => cartItem.id === item.id));
    };
    
    console.log(marketBaskets)

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
            <div className={events.length < 1 ? 'flex-start flex-start-align flex-gap-16' : 'flex-start flex-gap-16'}>
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
                                        <p className='text-italic nowrap margin-t-8'>
                                        {formatEventDate(event.start_date)}
                                            {event.end_date !== event.start_date && ` - `}
                                            <br></br>
                                        {event.end_date !== event.start_date && `${formatEventDate(event.end_date)}`}
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
            <div className='flex-start market-details margin-t-8'>
                <h4>Location: <a className='link-yellow' href={googleMapsLink} target="_blank" rel="noopener noreferrer">
                    {market.location}
                </a></h4>
                <div className='flex-start'>
                    <button
                        className={`btn-like ${isClicked || marketFavs.some(fav => fav.market_id === market.id) ? 'btn-like-on' : ''}`}
                        onClick={handleClick}>&#9829;</button>
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
            <div className='flex-start'>
                <h4>Season: {formatDate(market.season_start)} - {formatDate(market.season_end)}</h4>

            </div>
            <br/>
            <br/>
            <div className='flex-space-between'>
                <h2>Vendors in this Market:</h2>
                <select value={selectedProduct} onChange={handleProductChange}>
                    <option value="">All Products</option>
                    {Array.isArray(productList) && productList.map((product) => (
                        <option key={product.id} value={product.id}>
                            {product.product}
                        </option>
                    ))}
                </select>
            </div>

            <div className='box-scroll'>
                {Array.isArray(uniqueFilteredVendorsList) && uniqueFilteredVendorsList.length > 0 ? (
                    uniqueFilteredVendorsList.map((vendorId, index) => {
                        const vendorDetail = vendorDetailsMap[vendorId];
                        const availableBaskets = getAvailableBaskets(vendorId);
                        const firstBasket = (marketBaskets.length > 0 ? marketBaskets.find(item => item.vendor_id === vendorDetail.id) : '');

                        return (
                            <div key={index} className="market-item">
                                <Link to={`/user/vendors/${vendorId}`} className="market-name">
                                    {vendorDetail.name || 'Loading...'}
                                </Link>
                                <span className="market-name">
                                    {products.find(p => p.id === vendorDetail.product)?.product || 'No product listed'}
                                </span>
                                {availableBaskets.length > 0 ? (
                                    <span className="market-price">
                                        Price: ${firstBasket.price}
                                    </span>
                                ) : (
                                    <span className="market-price"></span>
                                )}
                                {availableBaskets.length > 4 ? (
                                    <span className="market-baskets nowrap">
                                        Baskets Available
                                        <br />
                                        {firstBasket
                                            ? `Pick Up: ${timeConverter(firstBasket.pickup_start)} - ${timeConverter(firstBasket.pickup_end)}`
                                            : ''}
                                    </span>
                                ) : (
                                <span className="market-baskets nowrap margin-r-8">
                                    {availableBaskets.length === 0 ? 'None Available' : `Available Baskets: ${availableBaskets.length}`}
                                    <br />
                                    {firstBasket && firstBasket.pickup_start
                                        ? `Pick Up: ${timeConverter(firstBasket.pickup_start)} - ${timeConverter(firstBasket.pickup_end)}`
                                        : ''}
                                </span>
                                )}
                                {availableBaskets.length > 0 ? (
                                    <button className="btn-add" onClick={() => handleAddToCart(vendorId, vendorDetail, availableBaskets)}>
                                            Add to Cart
                                        </button>
                                    ) : (
                                        <button className="btn-add" onClick={() => handleAddToCart(vendorId, vendorDetail)}>
                                            Sold Out
                                        </button>
                                    )}
                                
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