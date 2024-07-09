import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import buyabag from '../assets/images/GINGHAM_BUYABAG.png';

const VendorDetail = () => {
    const { id } = useParams();
    const [vendor, setVendor] = useState(null);
    const [availableBaskets, setAvailableBaskets] = useState(5);
    const [marketDetails, setMarketDetails] = useState({});
    const [locations, setLocations] = useState([]);

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

    const handleAddToCart = () => {
        if (availableBaskets > 0) {
            setAvailableBaskets(prevCount => prevCount - 1);
        } else {
            alert("Sorry, all baskets are sold out!");
        }
    };

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
                <div style={{marginLeft:'20px'}}>
                    <h2>Buy a Market Basket!</h2>
                    <img src={buyabag} alt="Basket Image" style={{ width: '300px' }} /><br />
                    <h4>$4.99</h4>
                    <p>Available Baskets: {availableBaskets}</p>
                    <button onClick={handleAddToCart}>Add to Cart</button>
                </div>
            </div>
            <div>
                <h4>Based out of: {vendor.based_out_of}</h4>
                <br />
                <h4>Farmers Market Locations:</h4>
                {Array.isArray(locations) && locations.length > 0 ? (
                    locations.map((marketId, index) => (
                        <div key={index} style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
                            <Link to={`/markets/${marketId}`}> {marketDetails[marketId] || 'Loading...'} </Link>
                        </div>
                    ))
                ) : (
                    <p>No market locations at this time</p>
                )}
            </div>
        </div>
    );
};

export default VendorDetail;
