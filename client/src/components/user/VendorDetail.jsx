import React, { useEffect, useState } from 'react';
import { useParams, Link, useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { weekDay } from '../../utils/common';
import { timeConverter, formatEventDate, marketDateConvert, formatPickupText } from '../../utils/helpers';
import MarketCard from './MarketCard';
import ReviewVendor from './ReviewVendor';
import { toast } from 'react-toastify';

function VendorDetail() {
    const { id } = useParams();

    const [vendor, setVendor] = useState(null);
    const [products, setProducts] = useState(null);
    const [productList, setProductList] = useState(null);
    const [marketDetails, setMarketDetails] = useState({});
    const [markets, setMarkets] = useState([]);
    const [vendorFavs, setVendorFavs] = useState([]);
    const [isClicked, setIsClicked] = useState(false);
    const [events, setEvents] = useState([]);
    const [marketBaskets, setMarketBaskets] = useState([]);
    
    const { amountInCart, setAmountInCart, cartItems, setCartItems, handlePopup } = useOutletContext();
    
    const userId = parseInt(globalThis.localStorage.getItem('user_id'));
    const token = localStorage.getItem('user_jwt-token');
    const isUserLoggedIn = userId;
    const siteURL = import.meta.env.VITE_SITE_URL;

    const navigate = useNavigate();
    const location = useLocation();
    const { selectedProduct } = location.state || {};

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
        fetch(`/api/vendors/${id}`)
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
            fetch(`/api/products`)
                .then(response => response.json())
                .then(data => setProducts(data))
        }
    }, [vendor]); 

    useEffect(() => {
            if (!vendor || !products?.length) return;
            const filteredProducts = products.filter(product =>
                Array.isArray(vendor.products) &&
                vendor.products.includes(product.id)
            );
            setProductList(filteredProducts);
        }, [vendor, products]);

    useEffect(() => {
        fetch(`/api/vendor-markets?vendor_id=${id}&is_visible=true`)
            .then(response => response.json())
            .then(markets => {
                if (Array.isArray(markets)) {
                    // const marketDayIds = markets.map(market => market.market_day_id);
                    setMarkets(markets);
                }
            })
            .catch(error => console.error('Error fetching market locations:', error));
    }, [id]);

    useEffect(() => {
        const fetchMarketDetails = async () => {
            if (markets.length === 0) return;
    
            const details = await Promise.all(markets.map(async (market) => {
                try {
                    const response = await fetch(`/api/market-days/${market.market_day_id}`);
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
                vendor_name: vendor.name,
                vendor_id: vendor.id,
                market_id: marketDay.market.id,
                fee_vendor: basketInCart.fee_vendor,
                fee_user: basketInCart.fee_user,
                market_name: marketDay.market.name,
                location: marketDay.market.location,
                coordinates: marketDay.market.coordinates,
                id: basketInCart.id,
                price: basketInCart.price,
                pickup_start: basketInCart.pickup_start,
                pickup_end: basketInCart.pickup_end,
                day_of_week: marketDay.day_of_week,
                sale_date: basketInCart.sale_date
            }];
            setCartItems(updatedCartItems);
            setAmountInCart(updatedCartItems.length);
            setMarketBaskets(prevBaskets => prevBaskets.filter(item => item.id !== basketInCart.id));
            toast.success('Added to cart!', {
                autoClose: 2000,
            });
        } else {
            toast.error('All baskets are sold out!', {
                autoClose: 2000,
            });
        }
    };

    useEffect(() => {
        console.log("Amount in cart:", amountInCart);
        console.log("Cart items:", cartItems);
    }, [amountInCart, cartItems]);

    // useEffect(() => {
    //     console.log("Selected Product in VendorDetail:", selectedProduct);
    // }, [selectedProduct]);

    const handleBackButtonClick = () => {
        if (selectedProduct || isClicked) {
            navigate('/user/vendors', { state: { selectedProduct, isClicked } });
        } else {
            console.log("No filters applied");
            navigate('/user/vendors');
        }
    };

    useEffect(() => {
        if (!userId) {
            return
        }
        fetch(`/api/vendor-favorites?user_id=${userId}`, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
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
                const response = await fetch('/api/vendor-favorites', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
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
                    toast.success('Added to favorites!', {
                        autoClose: 2000,
                    });
                });
            } else {
                const findVendorFavId = vendorFavs.filter(item => item.vendor_id == vendor.id)
                for (const item of findVendorFavId) {
                    fetch(`/api/vendor-favorites/${item.id}`, {
                        method: "DELETE",
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        }
                    }).then(() => {
                        setVendorFavs((favs) => favs.filter((fav) => fav.vendor_id !== vendor.id));
                        toast.success('Removed from favorites!', {
                            autoClose: 2000,
                        });
                    })
                }
            }
        } else {
            handlePopup()
        }
    };

    useEffect(() => {
        fetch(`/api/events?vendor_id=${Number(id)}`)
            .then(response => response.json())
            .then(data => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
    
                const upcomingEvents = data.filter(event => {
                    const eventEndDate = new Date(event.end_date + "T23:59:59");
                    return eventEndDate >= today;
                });
    
                setEvents(upcomingEvents);
            })
            .catch(error => console.error('Error fetching events', error));
    }, [id]);
    

    useEffect(() => {
        if (!vendor?.id) return;    
        fetch(`/api/baskets?vendor_id=${vendor.id}`)
            .then((response) => response.json())
            .then((data) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const window48hr = new Date(today);
                window48hr.setDate(today.getDate() + 2);
    
                const filteredBaskets = data.filter((basket) => {
                    const [year, month, day] = basket.sale_date.split('-').map(Number);
                    const saleDate = new Date(year, month - 1, day);
                    const isWithinWindow = saleDate >= today && saleDate < window48hr;

                    return isWithinWindow;
                });
                const filteredData = filteredBaskets.filter(item =>
                    !cartItems.some(cartItem => cartItem.id === item.id)
                );

                setMarketBaskets(filteredData);
            })
            .catch((error) => console.error('Error fetching market baskets', error));
    }, [vendor, cartItems]);

    const handleNotifyMe = async (market) => {

        if (!userId) {
            handlePopup();
            return;
        }
        const token = localStorage.getItem('user_jwt-token');
        if (!token) {
            handlePopup();
            return;
        }

        try {
            const response = await fetch('/api/notify-me-for-more-baskets', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subject: 'basket-notify',
                    message: `A user is interested in buying a basket at ${market.name}, consider adding more for sale.`,
                    link: "/vendor/dashboard?tab=baskets",
                    user_id: userId,
                    market_id: market.id,
                    vendor_id: vendor.id,
                }),
            });

            if (response.ok) {
                const responseData = await response.json();
                toast.success(`Your request has been sent to ${vendor.name}!`, {
                    autoClose: 5000,
                });
            } else {
                const errorData = await response.json();
                toast.error(`Error sending request: ${errorData.message || 'Unknown error'}`, {
                    autoClose: 6000,
                });
            }
        } catch (error) {
            console.error('Error sending request:', error);
            toast.error('An error occurred while sending the request. Please try again later.', {
                autoClose: 5000,
            });
        }
    };


    if (!vendor) {
        return <div>Loading...</div>;
    }
    

    return (
        <div className='markets-container'>
            <title>Gingham • {vendor.name}</title>
            <div className='flex-space-between'>
                <div className='flex-start flex-gap-8 flex-bottom-align'>
                    <h2>{vendor.name}</h2>
                    
                </div>
                <button onClick={handleBackButtonClick} className='btn btn-small'>Back</button>
            </div>
            <div className={events.length < 1 ? 'flex-start flex-start-align flex-gap-16' : 'flex-start flex-gap-16'}>
                {events.length > 0 && (
                    <h2 className='color-4 margin-t-16'>Events:</h2>
                )}
                <div className='flex-wrap margin-t-8'>
                    {events.length > 0 && (
                        events.map((event, index) => (
                            <div key={index} style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
                                <div className='flex-start flex-center-align flex-gap-16 m-flex-wrap'>
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
                    )}
                </div>
            </div>
            <div className='width-100 margin-t-24'>
                {vendor.image !== null ? (
                    <img className='img-vendor' src={`${siteURL}${vendor.image}`} alt="Vendor Image"/>
                ) : (
                    <img className='img-vendor' src={`/vendor-images/_default-images/${vendor.image_default}`} alt="Vendor Image"/>
                )}
            </div>
            <div className='market-details'>
                <div className='flex-start margin-t-8'>
                    <h2 className='margin-r-8'>{productList?.length > 1 ? 'Products: ' : 'Product: '}</h2>
                    <h3 className='margin-t-8'>{productList?.length > 0
                        ? productList.map(p => p.product).join(', ')
                        : "No products available"}
                    </h3>
                </div>
                {vendor.products_subcategories && (
                    <h3 className='margin-t-4 margin-l-4'>
                        {vendor.products_subcategories?.length > 1 ? 'Subcategories:' : 'Subcategory:'}
                        &emsp; {vendor.products_subcategories?.length > 0 &&
                            vendor.products_subcategories.map(p => p).join(', ')
                        }
                    </h3>
                )}
                <div className='flex-start flex-center-align margin-l-4'>
                    <h3 className=''>Based out of: &emsp;{vendor.city}, {vendor.state}</h3>
                    <button 
                        className={`btn-like ${isClicked || vendorFavs.some(fav => fav.vendor_id === vendor.id) ? 'btn-like-on' : ''}`}
                        onClick={handleClick}>&emsp;
                    </button>
                </div>
            </div>
            {vendor.website && (
                <h3 className='margin-l-4'>Click <a className='link-underline-inverse' href={vendor.website} target='_blank' rel="noopener noreferrer">here</a> for {vendor.name} website!</h3>
            )}
            {vendor.bio && (
                <>
                    <h2 className='margin-t-16'>Vendor Bio</h2>
                    <p className='margin-t-8 margin-l-4'>{vendor.bio}</p>
                </>
            )}
            <div>
                <h2 className="margin-t-24" id="markets">Farmers' market Locations:</h2>
                <div className='box-scroll'>
                {Array.isArray(markets) && markets.length > 0 ? (
                    markets
                        .slice()
                        .sort((a, b) => {
                            const today = new Date().getDay();
                        
                            const dayOfWeekA = marketDetails[a.market_day_id]?.day_of_week || 0;
                            const dayOfWeekB = marketDetails[b.market_day_id]?.day_of_week || 0;
                        
                            const adjustedDayA = (dayOfWeekA - today + 7) % 7;
                            const adjustedDayB = (dayOfWeekB - today + 7) % 7;
                        
                            if (adjustedDayA !== adjustedDayB) {
                                return adjustedDayA - adjustedDayB;
                            }
                        
                            const marketNameA = (marketDetails[a.market_day_id]?.markets?.name || "").toLowerCase();
                            const marketNameB = (marketDetails[b.market_day_id]?.markets?.name || "").toLowerCase();
                            return marketNameA.localeCompare(marketNameB);
                        })                               
                        .map((market, index) => {
                            const marketDetail = marketDetails[market.market_day_id] || {};
                            const firstBasket = marketBaskets.find(
                                (item) => item.market_day_id === marketDetail.id && item.is_sold === false
                            );
                            const allBaskets = marketBaskets.filter(
                                (item) => item.market_day_id === marketDetail.id && item.is_sold === false
                            );
                            return (
                                <div key={index} className="market-item flex-gap-8" >
                                    <span className='width-40'>
                                        <Link to={`/user/markets/${market.market_day.market_id}?day=${market.market_day.id}`} className="market-name">
                                            {marketDetail?.markets?.name || 'Loading...'}
                                        </Link>
                                        <br/>
                                        {weekDay[marketDetail?.day_of_week] || 'Loading...'}, 
                                        {` ${marketDetail.hour_start && timeConverter(marketDetail.hour_start)} - 
                                        ${marketDetail.hour_end && timeConverter(marketDetail.hour_end)}`}
                                    </span>
                                    <>
                                        <br className='m-br'/>
                                        {marketBaskets.filter((item) => item.market_day_id === marketDetail.id && item.is_sold === false).length > 0 ? (
                                            <span className="market-price">
                                                <span className="text-500">Price: ${firstBasket ? firstBasket.price : ''}</span>
                                                <br/>
                                                Value: ${firstBasket ? firstBasket.value : ''}
                                            </span>
                                        ) : (
                                            <span className="market-price">Out of Stock</span>
                                        )}
                                        {allBaskets.length > 4 ? (
                                            <span className="market-baskets d-nowrap">
                                                Baskets Available
                                                <br />
                                                {firstBasket && firstBasket.pickup_start ? (
                                                    (() => {
                                                        const today = new Date();
                                                        const todayFormatted = today.toISOString().split('T')[0];
                                                        const saleDate = new Date(firstBasket.sale_date).toISOString().split('T')[0];
                                                        if (saleDate === todayFormatted) {
                                                            return `Pick Up Today at ${timeConverter(firstBasket.pickup_start)}-${timeConverter(firstBasket.pickup_end)}`;
                                                        } else {
                                                            return `Pick Up: ${marketDateConvert(firstBasket.sale_date)} at ${timeConverter(firstBasket.pickup_start)}-${timeConverter(firstBasket.pickup_end)}`;
                                                        }
                                                    })()
                                                ) : (
                                                    'Not Available'
                                                )}
                                            </span>
                                        ) : (
                                            <span className="market-baskets d-nowrap width margin-r-8">
                                                {allBaskets.length > 0 ? (
                                                    `Available Baskets: ${allBaskets.length}`
                                                ) : (
                                                    <a className="link-edit" onClick={() => handleNotifyMe(market.market_day.market)}>Notify Me</a>
                                                )}
                                                <br />
                                                {formatPickupText(firstBasket, timeConverter, marketDateConvert)}
                                            </span>
                                        )}
                                        {allBaskets.length > 0 ? (
                                            <button className="btn-add btn-add-green nowrap" onClick={() => handleAddToCart(marketDetail)}>
                                                Add to Cart
                                            </button>
                                        ) : (
                                            <button className="btn-add nowrap" onClick={() => handleAddToCart(marketDetail)}>
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
                <ReviewVendor vendor={vendor} />
            </div>
        </div>
    );
};

export default VendorDetail;