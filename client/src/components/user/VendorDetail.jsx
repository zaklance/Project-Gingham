import React, { useEffect, useState } from 'react';
import { useParams, Link, useOutletContext, useNavigate } from 'react-router-dom';
import buyabag from '../../assets/images/GINGHAM_BUYABAG.png';
import MarketCard from './MarketCard';

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
    
    const [hoveredMarket, setHoveredMarket] = useState(null);
    
    //Can this be deleted?
    const [addToFav, setAddToFav] = useState([]);
    const [selectedVendor, setSelectedVendor] = useState('');
    
    // To be deleted after baskets state is moved to BasketCard
    const [availableBaskets, setAvailableBaskets] = useState(5);
    const [price, setPrice] = useState(4.99);

    const { amountInCart, setAmountInCart, cartItems, setCartItems, handlePopup } = useOutletContext();
    
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/vendors/${id}`)
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
        fetch(`http://127.0.0.1:5555/vendor_markets?vendor_id=${id}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch market locations');
                }
                return response.json();
            })
            .then(markets => {
                console.log('Fetched markets:', markets);
                if (Array.isArray(markets)) {
                    const marketIds = markets.map(market => market.market_id);
                    setMarkets(marketIds);
                } else {
                    console.error('Unexpected response format:', markets);
                    setMarkets([]);
                }
            })
            .catch(error => console.error('Error fetching market locations:', error));
    }, [id]);

    useEffect(() => {
        const fetchMarketDetails = async () => {
            if (markets.length === 0) return;
    
            const details = await Promise.all(markets.map(async (marketId) => {
                try {
                    const response = await fetch(`http://127.0.0.1:5555/markets/${marketId}`);
                    if (!response.ok) throw new Error(`Failed to fetch market ${marketId}`);
                    return await response.json();
                } catch (error) {
                    console.error(error);
                    return { id: marketId, name: 'Unknown Market' };
                }
            }));
    
            const vendorDetailsMap = {};
            details.forEach(market => {
                vendorDetailsMap[market.id] = market.name;
            });
            setMarketDetails(vendorDetailsMap);
        };
    
        fetchMarketDetails();
    }, [markets]);

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/vendor_reviews?vendor_id=${id}`)
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setVendorReviews(data);
                } else {
                    console.error('Unexpected response format:', data);
                    setVendorReviews([]);
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
        navigate('/user/vendors');
    };

    // const handleMarketChange = (event) => {
    //     setSelectedVendor(parseInt(event.target.value));
    // };

    useEffect(() => {
        fetch("http://127.0.0.1:5555/vendor_favorites")
            .then(response => response.json())
            .then(data => {
                const filteredData = data.filter(item => item.user_id === parseInt(globalThis.sessionStorage.getItem('user_id')));
                setVendorFavs(filteredData)
            })
            .catch(error => console.error('Error fetching favorites', error));
    }, []);

    const handleClick = async (event) => {
        if (globalThis.sessionStorage.getItem('user_id') !== null) {
            setIsClicked((isClick) => !isClick);
            if (isClicked == false) {
                const response = await fetch('http://127.0.0.1:5555/vendor_favorites', {
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
                    fetch(`http://127.0.0.1:5555/vendor_favorites/${item.id}`, {
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
            < br />
            <div style={{display:'flex'}}>
                <div style={{display: '60%'}}>
                    <img src={vendor.image} alt="Vendor Image" style={{ width: '95%' }} />
                </div>
                <div className='side-basket'>
                    <h2>Buy a Market Basket!</h2>
                    <img src={buyabag} alt="Basket Image" style={{ width: '200px' }} /><br />
                </div>
            </div>
            <div>
                <h4 className='float-left'>Based out of: {vendor.city}, {vendor.state}</h4>
                <div className='button-container'>
                    <button 
                        className={`btn-like ${isClicked || vendorFavs.some(fav => fav.vendor_id === vendor.id) ? 'btn-like-on' : ''}`}
                        onClick={handleClick}> ❤️ </button>
                        {showAlert && (
                            <div className='favorites-alert'>
                                {alertMessage}
                            </div>
                        )}
                </div>
                <br />
                <br />
                <h2>Farmers Market Locations:</h2>
                {Array.isArray(markets) && markets.length > 0 ? (
                    markets.map((marketId, index) => (
                        <div 
                            key={index} 
                            className="market-item"
                            onMouseEnter={() => setHoveredMarket(marketId)}
                            onMouseLeave={() => setHoveredMarket(null)}
                        >
                            <Link to={`/user/markets/${marketId}`} className="market-name">
                                {marketDetails[marketId] || 'Loading...'}
                            </Link>
                            <span className="market-price">Price: ${price.toFixed(2)}</span>
                            <span className="market-baskets">Available Baskets: {availableBaskets}</span>
                            <button className="btn-edit" onClick={() => handleAddToCart(marketId)}>
                                Add to Cart
                            </button>
                            {hoveredMarket === marketId && (
                                <div className='market-card-popup'>
                                    <MarketCard marketData={marketId} />
                                    {/* Why isnt the other info populating?!? */}
                                </div>
                            )}
                        </div>
                        ))
                    ) : (
                        <p>No market locations at this time</p>
                    )}
                <br />
                <h2>Reviews</h2>
                <br />
                {vendorReviews.length > 0 ? (
                    vendorReviews.map((review, index) => (
                        <div key={index} style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
                        <h4>{review.user ? review.user.first_name : 'Anonymous'}</h4>
                        <p>{review.review_text}</p>
                    </div>
                ))
            ) : (
                <p>No reviews available.</p>
            )}
            </div>
        </div>
    );
};

export default VendorDetail;