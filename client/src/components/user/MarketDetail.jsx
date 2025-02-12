import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
// import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { weekDay } from '../../utils/common';
import { timeConverter, formatEventDate, formatDate, marketDateConvert, formatPickupText } from '../../utils/helpers';
import ReviewMarket from './ReviewMarket';
import { Annotation, ColorScheme, FeatureVisibility, Map, Marker } from 'mapkit-react'
import { toast } from 'react-toastify';

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
    const [vendorAlertStates, setVendorAlertStates] = useState({});
    const [selectedProduct, setSelectedProduct] = useState("");
    const [marketDays, setMarketDays] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);
    const [vendorMarkets, setVendorMarkets] = useState();
    const [events, setEvents] = useState([]);
    const [marketBaskets, setMarketBaskets] = useState([]);
    const [products, setProducts] = useState([]);
    const [productList, setProductList] = useState({});
    
    const [searchParams, setSearchParams] = useSearchParams(); 
    
    const { handlePopup, amountInCart, setAmountInCart, cartItems, setCartItems } = useOutletContext();
    const userId = parseInt(globalThis.localStorage.getItem('user_id'));
    const token = localStorage.getItem('user_jwt-token');

    const navigate = useNavigate();

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

    const setDayParam = (day) => {
        if (day) {
            setSearchParams({ day });
        }
    };

    useEffect(() => {            
        const urlParams = new URLSearchParams(window.location.search);
        const day = urlParams.get('day');
        if (day) {
            const selected = marketDays.find(item => item.id === Number(day));
            if (selected) {
                setSelectedDay(selected);
            }
        }
    }, [selectedDay]);

    useEffect(() => {
        fetch("/api/products")
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
        fetch(`/api/markets/${id}`)
            .then(response => response.json())
            .then(data => {
                setMarket(data);
            })
            .catch(error => console.error('Error fetching market data:', error));
    }, [id]);

    useEffect(() => {
        if (!market?.id) return;
    
        const fetchData = async () => {
            try {
                const [marketDaysRes, vendorMarketsRes, eventsRes] = await Promise.all([
                    fetch(`/api/market-days?market_id=${market.id}`).then(res => res.json()),
                    fetch(`/api/vendor-markets?market_id=${market.id}`).then(res => res.json()),
                    fetch(`/api/events?market_id=${market.id}`).then(res => res.json()), 
                ]);
    
                setMarketDays(marketDaysRes);
                setAllVendorDetails(marketDaysRes
                    .flatMap((marketDay) => marketDay.vendor_markets)
                    .map((vendorMarket) => vendorMarket.vendor)
                );
    
                if (Array.isArray(vendorMarketsRes)) {
                    const vendorIds = [...new Set(vendorMarketsRes.map(vendor => vendor.vendor_id))];
                    setVendors(vendorIds);
                    setVendorMarkets(vendorMarketsRes);
                }
                setSelectedDay(marketDaysRes.length > 0 ? marketDaysRes[0] : null);
    
                const today = new Date();
                today.setHours(0, 0, 0, 0);
    
                const upcomingEvents = eventsRes.filter(event => {
                    const eventEndDate = new Date(event.end_date + "T23:59:59");
                    return eventEndDate >= today;
                });
    
                setEvents(upcomingEvents);
            } catch (error) {
                console.error("Error fetching data in parallel:", error);
            }
        };
    
        fetchData();
    }, [market?.id, userId]);
    

    useEffect(() => {
        if (!userId) {
            return
        }
        fetch(`/api/market-favorites?user_id=${userId}`, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        })
        .then(res => res.json())
        .then(data => {
            setMarketFavs(data);
        })
    }, [userId]);

    const handleDayChange = (event) => {
        const dayId = parseInt(event.target.value);
        const day = marketDays.find(day => day.id === dayId);
        setSelectedDay(day);
        setSelectedProduct()
        setDayParam(day.id)
    };

    const handleProductChange = (event) => {
        setSelectedProduct(event.target.value);
    };

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
        return vendors.filter((vendorId, index, self) => {
            const vendorDetail = vendorDetailsMap[vendorId];
            if (!vendorDetail) return false;
    
            const availableOnSelectedDay = vendorMarkets.filter(vendorMarket => 
                vendorMarket.vendor_id === vendorId &&
                vendorMarket.market_day.market_id === market.id &&
                vendorMarket.market_day.day_of_week === selectedDay?.day_of_week
            );
            const isUnique = self.findIndex(v => v === vendorId) === index;
            
            const hasSelectedProduct =
                !selectedProduct ||
                (Array.isArray(vendorDetail.products) &&
                    vendorDetail.products.map(Number).includes(Number(selectedProduct)));

            return availableOnSelectedDay.length > 0 && hasSelectedProduct && isUnique;
        });
    }, [vendors, vendorMarkets, selectedDay, selectedProduct, market, vendorDetailsMap]);
    

    // Filter productList so that it only shows products that are in filteredVendorsList
    const filteredProducts = useMemo(() => {
        if (!vendorMarkets || !products?.length || !selectedDay) return [];
        
        const filteredMarketsOnDay = vendorMarkets.filter(
            vendorMarket =>
                vendorMarket.market_day.day_of_week === selectedDay.day_of_week &&
                vendorMarket.market_day.market_id === market.id
        );
        return products.filter(product =>
            filteredMarketsOnDay.some(vendorMarket =>
                Array.isArray(vendorMarket.vendor.products) &&
                vendorMarket.vendor.products.some(vendorProductId =>
                    vendorProductId === product.id
                )
            )
        );
    }, [vendorMarkets, selectedDay, products, market]);
    
    useEffect(() => {
        setProductList(filteredProducts);
    }, [filteredProducts]);  



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
                market_id: market.id,
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

    const handleBackButtonClick = () => {
        if ( isClicked ) {
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
                const response = await fetch('/api/market-favorites', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
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
                    toast.success('Added to favorites!', {
                        autoClose: 2000,
                    });
                });
            } else {
                const findMarketFavId = marketFavs.filter(item => item.market_id == market.id)
                for (const item of findMarketFavId) {
                    fetch(`/api/market-favorites/${item.id}`, {
                        method: "DELETE",
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                    }).then(() => {
                        setMarketFavs((favs) => favs.filter((fav) => fav.market_id !== market.id));
                        toast.success('Removed from favorites!', {
                            autoClose: 2000,
                        });
                    })
                }
            }
        } else {
            handlePopup();
        }
    };

    useEffect(() => {
        if (!selectedDay?.id) return;
        fetch(`/api/baskets?market_day_id=${selectedDay.id}`)
            .then(response => response.json())
            .then(data => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const window48hr = new Date(today);
                window48hr.setDate(today.getDate() + 2);
    
                const filteredBaskets = data.filter((basket) => {
                    const [year, month, day] = basket.sale_date.split('-').map(Number);
                    const saleDate = new Date(year, month - 1, day);
                    saleDate.setHours(0, 0, 0, 0);
                
                    const isWithinWindow = saleDate >= today && saleDate <= window48hr;
                    return isWithinWindow;
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

    const handleNotifyMe = async (vendor) => {
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
                    autoClose: 4000,
                });
            }
        } catch (error) {
            console.error('Error sending request:', error);
            toast.error('An error occurred while sending the request. Please try again later.', {
                autoClose: 4000,
            });
        }
    };

    if (!market) {
        return <div>Loading...</div>;
    }

    const googleMapsLink = market?.coordinates ? `https://www.google.com/maps?q=${market.coordinates.lat},${market.coordinates.lng}` : '#';
    const marketLocation = { 'lat': parseFloat(market.coordinates.lat), 'lng': parseFloat(market.coordinates.lng) }
    const mapToken = import.meta.env.VITE_MAPKIT_TOKEN;


    return (
        <div>
            <div className='flex-space-between'>
                <h2>{market.name}</h2>
                <button onClick={handleBackButtonClick} className='btn btn-small m-hidden'>Back</button>
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
                                    <div className='flex-start flex-center-align flex-gap-16 m-flex-wrap'>
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
            <div className='flex-space-around flex-end margin-t-24 m-flex-wrap'>
                <div className='width-100'>
                    {market.image !== null ? (
                        <img className="img-market" src={`/market-images/${market.image}`} alt="Market Image" />
                    ) : (
                        <img className="img-market" src={`/market-images/_default-images/${market.image_default}`} alt="Market Image" />
                    )}
                </div>
                <div id='map-market-detail'>
                    <Map
                        token={mapToken}
                        initialRegion={{
                            centerLatitude: marketLocation.lat,
                            centerLongitude: marketLocation.lng,
                            latitudeDelta: .008,
                            longitudeDelta: .008,
                        }}
                        colorScheme={ColorScheme.Auto}
                        showsScale={FeatureVisibility.Visible}
                    >
                        <Annotation
                            latitude={marketLocation.lat}
                            longitude={marketLocation.lng}
                        >
                            <div className="map-circle"></div>
                            <div className="map-inside-circle"></div>
                            <div className="map-triangle"></div>
                        </Annotation>
                    </Map>
                </div>
            </div>
            <p>{market.description}</p>
            <div className='flex-start market-details margin-t-8'>
                <h4>Location: <a className='link-yellow' href={googleMapsLink} target="_blank" rel="noopener noreferrer">
                    {market.location}, {market.city}, {market.state}
                </a></h4>
                <div className='flex-start alert-container'>
                    <button
                        className={`btn-like ${isClicked || marketFavs.some(fav => fav.market_id === market.id) ? 'btn-like-on' : ''}`}
                        onClick={handleClick}>&emsp;</button>
                    {showAlert && (
                        <div className={`alert alert-favorites ${!showAlert ? 'alert-favorites-hidden' : ''}`}>
                            {alertMessage}
                        </div>
                    )}
                </div>
            </div>
            <div className='flex-start m-flex-wrap'>
                <label><h4>Schedule:</h4></label>
                {marketDays.length === 1 ? (
                    <h4>&ensp; {weekDay[marketDays[0].day_of_week]}, &ensp;</h4>
                ) : (
                    <select id="marketDaysSelect"
                    className='select-rounded margin-r-4'
                    name="marketDays"
                    value={selectedDay?.id || ''} 
                    onChange={handleDayChange}>
                    {marketDays.map((day, index) => (
                        <option key={index} value={day.id}>
                            {weekDay[day.day_of_week]}
                        </option>
                    ))}
                    </select>
                )}
                {selectedDay && (
                    <h4>Hours: {timeConverter(selectedDay.hour_start)} - {timeConverter(selectedDay.hour_end)}</h4>
                )}
            </div>
            <div className='flex-start'>
                {market.year_round === false && market.season_start && market.season_end ? (
                        <h4>Season: {formatDate(market.season_start)} – {formatDate(market.season_end)}</h4>
                    ) : (
                        market.year_round === false && (!market.season_start || !market.season_end) ? (
                            <h4>No Dates Available</h4>
                        ) : (
                            <h4>Open Year Round</h4>
                        )
                    )}
            </div>
            <div id="vendors" className='flex-space-between margin-t-24'>
                <h2>Vendors:</h2>
                <select 
                    className='select-rounded'
                    value={selectedProduct} 
                    onChange={handleProductChange}>
                    <option value="">All Products</option>
                    {Array.isArray(productList) && productList.map((product) => (
                        <option key={product.id} value={product.id}>
                            {product.product}
                        </option>
                    ))}
                </select>
            </div>
            <div className="box-scroll">
            {Array.isArray(uniqueFilteredVendorsList) && uniqueFilteredVendorsList.length > 0 ? (
                uniqueFilteredVendorsList
                .slice()
                .sort((a, b) => {
                    const availableA = getAvailableBaskets(a).length > 0 ? 1 : 0;
                    const availableB = getAvailableBaskets(b).length > 0 ? 1 : 0;

                    if (availableA !== availableB) {
                    return availableB - availableA;
                    }

                    const nameA = vendorDetailsMap[a]?.name?.toLowerCase() || '';
                    const nameB = vendorDetailsMap[b]?.name?.toLowerCase() || '';
                    return nameA.localeCompare(nameB);
                })
                .map((vendorId, index) => {
                    const vendorDetail = vendorDetailsMap[vendorId];
                    const availableBaskets = getAvailableBaskets(vendorId);
                    const firstBasket = availableBaskets
                        .filter(basket => !isNaN(new Date(basket.sale_date)))
                        .sort((a, b) => new Date(a.sale_date) - new Date(b.sale_date))[0] || {};

                    return (
                    <div key={index} className="market-item flex-center-align">
                        <span className="market-name margin-l-16">
                            <Link to={`/user/vendors/${vendorId}`} className="market-name"> {vendorDetail.name || 'Loading...'} </Link>
                            <br />
                            <p><span className='m-hidden'>Products:</span>{" "}
                                {products
                                    .filter((product) => vendorDetail.products?.includes(product.id))
                                    .map((product) => product.product)
                                    .join(", ") || "No products listed"}
                            </p>
                        </span>
                        {availableBaskets.length > 0 ? (
                        <span className="market-price">
                            <span className="text-500">Price: ${firstBasket.price}</span>
                            <br />
                            Value: ${firstBasket.value}
                        </span>
                        ) : (
                        <span className="market-price"></span>
                        )}
                        {availableBaskets.length > 4 ? (
                        <span className="market-baskets d-nowrap">
                            Baskets Available
                            <br />
                            {firstBasket && firstBasket.sale_date
                            ? formatPickupText(firstBasket, timeConverter, marketDateConvert)
                            : ""}
                        </span>
                        ) : (
                        <span className="market-baskets d-nowrap margin-r-8">
                            {availableBaskets.length > 0 ? `Available Baskets: ${availableBaskets.length}` : <a className="link-edit" onClick={() => handleNotifyMe(vendorDetail)}>Notify Me</a>}
                            <br />
                            {firstBasket && firstBasket.sale_date ? formatPickupText(firstBasket, timeConverter, marketDateConvert) : ""}
                        </span>
                        )}
                        {vendorAlertStates[vendorId] && (
                        <div className={`alert alert-cart-vendor`}>
                            {alertMessage}
                        </div>
                        )}
                        {availableBaskets.length > 0 ? (
                        <button className="btn-add btn-add-green color-7 nowrap" onClick={() => handleAddToCart(vendorId, vendorDetail, availableBaskets)}>
                            Add to Cart
                        </button>
                        ) : (
                        <button className="btn-add nowrap m-hidden" onClick={() => handleAddToCart(vendorId, vendorDetail)}>
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
            <ReviewMarket market={market} />

        </div>
    );
};

export default MarketDetail;