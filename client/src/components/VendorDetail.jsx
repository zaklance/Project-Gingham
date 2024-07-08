import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const VendorDetail = () => {
    const { id } = useParams();
    const [vendor, setVendor] = useState(null);
    const [availableBaskets, setAvailableBaskets] = useState(5);
    const [marketDetails, setMarketDetails] = useState({});
    const [locations, setLocations] = useState([]); // Initialize as empty array

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/vendors/${id}`)
            .then(response => response.json())
            .then(data => {
                setVendor(data);
                setLocations(data.locations || []);
            })
            .catch(error => console.error('Error fetching vendor data:', error));
    }, [id]);

    useEffect(() => {
        if (Array.isArray(locations) && locations.length > 0) { // Check if locations is an array
            const fetchMarketDetails = async () => {
                const promises = locations.map(async marketId => {
                    const response = await fetch(`http://127.0.0.1:5555/markets/${marketId}`);
                    if (response.ok) {
                        const marketData = await response.json();
                        return { id: marketId, name: marketData.name };
                    } else {
                        console.log(`Failed to fetch market ${marketId}`);
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
            <div>
                <h2>{vendor.name}</h2>
                <img src={vendor.image} alt="Vendor Image" style={{ width: '70%' }} />
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
            <div>
                <br />
                <h2>Buy a Market Basket for $4.99!</h2>
                <p>Pick up your basket at 2pm!</p>
                <h3><strong>$4.99</strong></h3>
                <img src="https://hgtvhome.sndimg.com/content/dam/images/hgtv/products/2021/4/1/4/RX_Food-52_multi-pocket-canvas-market-tote.jpg.rend.hgtvcom.616.616.85.suffix/1617303356725.jpeg"
                    alt="Basket Image" style={{ width: '300px' }} /><br />
                <button onClick={handleAddToCart}>Add to Cart</button>
                <p>Available Baskets: {availableBaskets}</p>
            </div>
        </div>
    );
};

export default VendorDetail;
