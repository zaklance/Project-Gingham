import React, { useEffect, useState } from 'react';
import { useParams, Link, useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { weekDay } from '../../utils/common';
import { timeConverter, formatEventDate } from '../../utils/helpers';
import MarketCard from './MarketCard';
import ReviewVendor from './ReviewVendor';

function VendorDetail({ products }) {
    const { id } = useParams();

    const [vendor, setVendor] = useState(null);
    const [product, setProduct] = useState(null);
    const [marketDetails, setMarketDetails] = useState({});
    const [markets, setMarkets] = useState([]);
    const [vendorFavs, setVendorFavs] = useState([]);
    const [isClicked, setIsClicked] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);
    const [showAlert, setShowAlert] = useState(false);
    const [events, setEvents] = useState([]);
    const [marketBaskets, setMarketBaskets] = useState([]);
    
    const { amountInCart, setAmountInCart, cartItems, setCartItems, handlePopup } = useOutletContext();
    
    const userId = parseInt(globalThis.localStorage.getItem('user_id'));
    const isUserLoggedIn = userId;

    const navigate = useNavigate();
    const location = useLocation();
    const { selectedProduct } = location.state || {};

    useEffect(() => {
        // Timer to clear cart items after 3 seconds
        if (cartItems.length > 0) {
            const timer = setTimeout(() => {
                setCartItems([]);
                setAmountInCart(0);
                console.log("Cart cleared after 3 seconds");
            }, ((3 * 60) * (60 * 1000)));

            // Clear the timer if cartItems changes
            return () => clearTimeout(timer);
        }
    }, [cartItems, setCartItems, setAmountInCart]);

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
        if (vendor) {
            fetch(`http://127.0.0.1:5555/api/products/${vendor.product}`)
                .then(response => response.json())
                .then(data => setProduct(data))
        }
    }, [vendor]); 

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/api/vendor-markets?vendor_id=${id}`)
            .then(response => response.json())
            .then(markets => {
                if (Array.isArray(markets)) {
                    const marketDayIds = markets.map(market => market.market_day_id);
                    setMarkets(markets);

                    // const initialBaskets = {};
                    // marketDayIds.forEach(marketDayId => initialBaskets[marketDayId] = 5);
                    // setMarketBaskets(initialBaskets);
                }
            })
            .catch(error => console.error('Error fetching market locations:', error));
    }, [id]);

    useEffect(() => {
        const fetchMarketDetails = async () => {
            if (markets.length === 0) return;
    
            const details = await Promise.all(markets.map(async (market) => {
                try {
                    const response = await fetch(`http://127.0.0.1:5555/api/market-days/${market.market_day_id}`);
                    if (!response.ok) throw new Error(`Failed to fetch market ${market.market_day_id}`);
                    return await response.json();
                } catch (error) {
                    console.error(error);
                    return { id: market.market_day_id, name: 'Unknown Market' };
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

    const handleAddToCart = (marketDay) => {
        const basketInCart = marketBaskets.find(
            item => item.market_day_id === marketDay.id && item.is_sold === false
        );
        if (basketInCart) {
            const updatedCartItems = [...cartItems, {
                vendorName: vendor.name,
                location: marketDay.markets.name,
                id: basketInCart.id,
                price: basketInCart.price,
                pickup_start: basketInCart.pickup_start,
                pickup_end: basketInCart.pickup_end,
                day_of_week: marketDay.day_of_week
            }];
            setCartItems(updatedCartItems);
            setAmountInCart(updatedCartItems.length);
            setMarketBaskets(prevBaskets => prevBaskets.filter(item => item.id !== basketInCart.id));
        } else {
            alert("Sorry, all baskets are sold out!");
        }
    };

    useEffect(() => {
        console.log("Amount in cart:", amountInCart);
        console.log("Cart items:", cartItems);
    }, [amountInCart, cartItems]);

    useEffect(() => {
        console.log("Selected Product in VendorDetail:", selectedProduct);
    }, [selectedProduct]);

    const handleBackButtonClick = () => {
        if (selectedProduct || isClicked) {
            navigate('/user/vendors', { state: { selectedProduct, isClicked } });
        } else {
            console.log("No filters applied");
            navigate('/user/vendors');
        }
    };

    useEffect(() => {
        console.log("Products passed to VendorDetail:", products);
    }, [products]);

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/api/vendor-favorites?user_id=${userId}`)
            .then(response => response.json())
            .then(data => { setVendorFavs(data) })
            .catch(error => console.error('Error fetching vendor favorites', error));
    }, []);

    useEffect(() => {
        if (vendor && vendorFavs.some(fav => fav.vendor_id === vendor.id)) {
            setIsClicked(true);
        }
    }, [vendor, vendorFavs]);
    
    const handleClick = async (event) => {
        if (globalThis.localStorage.getItem('user_id') !== null) {
            setIsClicked((isClick) => !isClick);
            if (isClicked == false) {
                const response = await fetch('http://127.0.0.1:5555/api/vendor-favorites', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: globalThis.localStorage.getItem('user_id'),
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

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/api/events?vendor_id=${Number(id)}`)
            .then(response => response.json())
            .then(data => {
                // const filteredData = data.filter(item => item.vendor_id === Number(id));
                setEvents(data)
            })
            .catch(error => console.error('Error fetching events', error));
    }, [id]);

    useEffect(() => {
        if (!vendor?.id) return;

        fetch(`http://127.0.0.1:5555/api/baskets?vendor_id=${vendor.id}`)
            .then((response) => response.json())
            .then((data) => {
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
            .catch((error) => console.error('Error fetching market baskets', error));
    }, [vendor]);


    if (!vendor) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <div className='flex-space-between'>
                <div className='flex-start flex-gap-8 flex-bottom-align'>
                    <h2>{vendor.name}</h2>
                    
                </div>
                <button onClick={handleBackButtonClick} className='btn btn-small'>Back to Vendors</button>
            </div>
            <div className={events.length < 1 ? 'flex-start flex-start-align flex-gap-16' : 'flex-start flex-gap-16'}>
                {events.length > 0 ? (
                    <h2 className='color-4 margin-t-16'>Events:</h2>
                ) : (
                    <>
                    </>
                )}
                <div className='flex-wrap margin-t-8'>
                    {events.length > 0 ? (
                        events.map((event, index) => (
                            <div key={index} style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
                                <div className='flex-start flex-center-align flex-gap-16'>
                                    <p className='text-italic nowrap'>
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
            <div className='flex-space-between margin-t-24 flex-wrap'>
                <div>
                    <img className='img-vendor' src={`/vendor-images/${vendor.image}`} alt="Vendor Image"/>
                </div>
                <div className='side-basket'>
                    <h3 className='margin-t-8'>Product: {product ? product.product : ""}</h3>
                    <div className='flex-start'>
                        <h4 className='nowrap'>Based out of: {vendor.city}, {vendor.state}</h4>
                        <div className='button-container flex-start flex-center-align nowrap'>
                            <button 
                                className={`btn-like ${isClicked || vendorFavs.some(fav => fav.vendor_id === vendor.id) ? 'btn-like-on' : ''}`}
                                onClick={handleClick}>&#9829;
                            </button>
                            {showAlert && (
                                <div className='alert-favorites nowrap'>
                                    {alertMessage}
                                </div>
                            )}
                        </div>
                    </div>
                    <h2 className='margin-t-16'>Vendor Bio</h2>
                    <p className='margin-t-8'>{vendor.bio}</p>
                </div>
            </div>
            <div>
                <br />
                <br />
                <h2>Farmers Market Locations:</h2>
                <div className='box-scroll'>
                {Array.isArray(markets) && markets.length > 0 ? (
                    markets.map((market, index) => {
                        const marketDetail = marketDetails[market.market_day_id] || {};
                        const firstBasket = (marketBaskets.length > 0 ? marketBaskets.find((item) => item.market_day_id === marketDetail.id && item.is_sold === false) : '');
                        const allBaskets = (marketBaskets.length > 0 ? marketBaskets.filter((item) => item.market_day_id === marketDetail.id && item.is_sold === false) : '');
                        return (
                            <div key={index} className="market-item" >
                                <span>
                                    <Link to={`/user/markets/${market.market_day.market_id}`} className="market-name">
                                        {marketDetail?.markets?.name || 'Loading...'}
                                    </Link>
                                    <br/>
                                    Hours: {marketDetail.day_of_week ? `${weekDay[marketDetail.day_of_week]}, ` : 'Loading...'}
                                    {`${marketDetail.hour_start && timeConverter(marketDetail.hour_start)} - 
                                    ${marketDetail.hour_end && timeConverter(marketDetail.hour_end)}`}
                                </span>
                                <span></span>
                                    <>
                                    {marketBaskets.filter((item) => item.market_day_id === marketDetail.id && item.is_sold === false).length > 0 ? (
                                            <span className="market-price">Price: ${firstBasket ? firstBasket.price : ''}</span>
                                        ) : (
                                            <span className="market-price">Out of Stock</span>
                                        )}
                                        <span className="market-baskets nowrap">
                                            Available Baskets: {allBaskets.length}
                                            <br/>
                                            Pick Up:
                                            {firstBasket && firstBasket.pickup_start
                                                ? ` ${timeConverter(firstBasket.pickup_start)} - ${timeConverter(firstBasket.pickup_end)}`
                                                : ' Not Available'}
                                        </span>
                                        {allBaskets.length > 0 ? (
                                            <button className="btn-add" onClick={() => handleAddToCart(marketDetail)}>
                                                Add to Cart
                                            </button>
                                        ) : (
                                            <button className="btn-add" onClick={() => handleAddToCart(marketDetail)}>
                                                Sold Out
                                            </button>
                                        )}                                
                                    </>
                            </div>
                        );
                    })
                    ) : (
                        <p>No market locations at this time</p>
                    )}
                </div>
                <br />
                <ReviewVendor vendor={vendor} alertMessage={alertMessage} setAlertMessage={setAlertMessage} />
            </div>
        </div>
    );
};

export default VendorDetail;