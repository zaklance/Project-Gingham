// VendorDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import buyabag from '../assets/images/GINGHAM_BUYABAG.png';

function VendorDetail () {
    const { id } = useParams();
    const [vendor, setVendor] = useState(null);
    const [availableBaskets, setAvailableBaskets] = useState(5);
    const [addToFav, setAddToFav] = useState([]);
    const [marketDetails, setMarketDetails] = useState({});
    const [locations, setLocations] = useState([]);
    const [vendorReviews, setVendorReviews] = useState([]);
    const [selectedMarket, setSelectedMarket] = useState([]);
    const { amountInCart, setAmountInCart, cartItems, setCartItems } = useOutletContext();
    const [ price, setPrice ] = useState(4.99);

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
                const parsedLocations = JSON.parse(data.locations);
                setLocations(parsedLocations);
            })
            .catch(error => console.error('Error fetching vendor data:', error));
    }, [id]);

    useEffect(() => {
        if (Array.isArray(locations) && locations.length > 0) {
            const fetchMarketDetails = async () => {
                const promises = locations.map(async marketId => {
                    try {
                        const response = await fetch(`http://127.0.0.1:5555/markets/${marketId}`);
                        if (response.ok) {
                            const marketData = await response.json();
                            return { id: marketId, name: marketData.name };
                        } else {
                            console.log(`Failed to fetch market ${marketId}`);
                            return { id: marketId, name: 'Unknown Market' };
                        }
                    } catch (error) {
                        console.error(`Error fetching market ${marketId}:`, error);
                        return { id: marketId, name: 'Unknown Market' };
                    }
                });

                Promise.all(promises)
                    .then(details => {
                        const marketDetailsMap = {};
                        details.forEach(detail => {
                            marketDetailsMap[detail.id] = detail.name;
                        });
                        setMarketDetails(marketDetailsMap);
                    })
                    .catch(error => {
                        console.error('Error fetching market details:', error);
                    });
            };

            fetchMarketDetails();
        }
    }, [locations]);

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
            const marketLocations = locations.map(locationId => marketDetails[locationId]).join(', ');
            setCartItems([...cartItems, { vendorName: vendor.name, location: marketLocations, id: cartItems.length + 1, price: price}]);
        } else {
            alert("Sorry, all baskets are sold out!");
        }
    };

    useEffect(() => {
        console.log("Amount in cart:", amountInCart);
        console.log("Cart items:", cartItems);
    }, [amountInCart, cartItems]);

    const handleMarketChange = (event) => {
        setSelectedMarket(event.target.value);
    }

    if (!vendor) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <div style={{display:'flex'}}>
                <div style={{display: '60%'}}>
                    <h2>{vendor.name}</h2>
                    <img src={vendor.image} alt="Vendor Image" style={{ width: '95%' }} />
                </div>
                <div className='side-basket'>
                    <h2>Buy a Market Basket!</h2>
                    <img src={buyabag} alt="Basket Image" style={{ width: '300px' }} /><br />
                    <div className='basket-details'>
                        <h4>$4.99</h4>
                        <p>Available Baskets: {availableBaskets}</p>
                        <p>Choose a Market:</p>
                        <select value={selectedMarket} onChange={handleMarketChange}>
                        {Array.isArray(locations) && locations.length > 0 ? (
                            locations.map((marketId, index) => (
                                <option key={index} value={marketId}>
                                    {marketDetails[marketId] || 'Loading...'}
                                </option>
                            ))
                        ) : (
                            <option value="">No market locations</option>
                        )}
                    </select>
                    </div>
                    <button className='add-cart' onClick={handleAddToCart}>Add to Cart</button>
                </div>
            </div>
            <div>
                <h4 className='float-left'>Based out of: {vendor.based_out_of}</h4>
                <button className='btn-like'> ❤️ </button>
                <br />
                <br />
                <h2>Farmers Market Locations:</h2>
                {Array.isArray(locations) && locations.length > 0 ? (
                    locations.map((marketId, index) => (
                        <div key={index} style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
                            <Link to={`/markets/${marketId}`}> {marketDetails[marketId] || 'Loading...'} </Link>
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