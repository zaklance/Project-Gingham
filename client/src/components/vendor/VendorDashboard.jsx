import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BasketCard from './BasketCard';

function VendorDashboard() {
    const { id } = useParams();
    const [locations, setLocations] = useState([]);
    const [marketDetails, setMarketDetails] = useState({});
    const [availableBaskets, setAvailableBaskets] = useState({});
    const [price, setPrice] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // useEffect(() => {
    //     const fetchVendorData = async () => {
    //         try {
    //             const response = await fetch(`http://127.0.0.1:5555/vendors/${id}`);
    //             if (!response.ok) {
    //                 throw new Error('Network response was not ok');
    //             }
    //             const data = await response.json();
    //             const parsedLocations = JSON.parse(data.locations);
    //             setLocations(parsedLocations);
    //             setAvailableBaskets(parsedLocations.reduce((acc, loc) => ({ ...acc, [loc]: 5 }), {})); // Set initial baskets
    //             setPrice(parsedLocations.reduce((acc, loc) => ({ ...acc, [loc]: 4.99 }), {})); // Set initial prices
    //         } catch (error) {
    //             console.error('Error fetching vendor data:', error);
    //             setError(error.message);
    //         } finally {
    //             setLoading(false);
    //         }
    //     };
    //     fetchVendorData();
    // }, [id]);

    // useEffect(() => {
    //     if (locations.length > 0) {
    //         const fetchMarketDetails = async () => {
    //             const promises = locations.map(async (marketId) => {
    //                 try {
    //                     const response = await fetch(`http://127.0.0.1:5555/markets/${marketId}`);
    //                     if (response.ok) {
    //                         const marketData = await response.json();
    //                         return { 
    //                             id: marketId, 
    //                             name: marketData.name
    //                         };
    //                     } else {
    //                         console.log(`Failed to fetch market ${marketId}`);
    //                         return { id: marketId, name: 'Unknown Market' };
    //                     }
    //                 } catch (error) {
    //                     console.error(`Error fetching market ${marketId}:`, error);
    //                     return { id: marketId, name: 'Unknown Market' };
    //                 }
    //             });

    //             const details = await Promise.all(promises);
    //             const marketDetailsMap = {};
    //             details.forEach(detail => {
    //                 marketDetailsMap[detail.id] = detail;
    //             });
    //             setMarketDetails(marketDetailsMap);
    //         };

    //         fetchMarketDetails();
    //     }
    // }, [locations]);

    // const handleChange = (marketId, type, value) => {
    //     if (type === 'price') {
    //         setPrice(prevPrices => ({
    //             ...prevPrices,
    //             [marketId]: value
    //         }));
    //     } else if (type === 'baskets') {
    //         setAvailableBaskets(prevBaskets => ({
    //             ...prevBaskets,
    //             [marketId]: value
    //         }));
    //     }
    // };

    // const handleSaveChanges = (marketId) => {
    //     console.log(`Saving changes for market ${marketId}: Price: $${price[marketId].toFixed(2)}, Available Baskets: ${availableBaskets[marketId]}`);
    // };

    // if (loading) {
    //     return <div>Loading...</div>;
    // }

    // if (error) {
    //     return <div>Error: {error}</div>;
    // }

    return (
        <div>
            <h2 className='title'>Vendor Dashboard</h2>
            <div className='bounding-box'>
                <h3>Todays Markets:</h3>
                <div className='market-cards-container'>
                    <div className='market-card'>
                        <h3><strong>Union Square Market</strong></h3>
                        <h4>April 9, Wednesday</h4>
                        <br />
                        <p>Available Baskets: 5</p>
                        <br />
                        <p>Pick Up Time: 04:30 PM (1 hour) </p>
                        <br />
                        <p><strong>Claimed Baskets: 3</strong></p>
                        <div className='bounding-box'>
                            <p>sandroledesma, 04:45 PM<strong> ✓ </strong></p>
                            <p>zaklance, 05:15 PM</p>
                            <p>vhle, 05:15 PM</p>
                        </div>
                    </div>
                </div>
                <br/>
                {/* {locations.map((marketId) => (
                    <div key={marketId} className='market-item'>
                        <h3>{marketDetails[marketId]?.name || 'Loading...'}</h3>
                        <div className='market-info'>
                            <label>
                                Price: 
                                <input 
                                    type='number' 
                                    value={price[marketId] || 0} 
                                    onChange={(e) => handleChange(marketId, 'price', parseFloat(e.target.value))}
                                />
                            </label>
                            <label>
                                Available Baskets: 
                                <input 
                                    type='number' 
                                    value={availableBaskets[marketId] || 0}
                                    onChange={(e) => handleChange(marketId, 'baskets', parseInt(e.target.value))}
                                />
                            </label>
                            <button className='btn-edit' onClick={() => handleSaveChanges(marketId)}>Save Changes</button>
                        </div>
                    </div>
                ))} */}
                <h3>Future Markets:</h3>
                <br/>
                <div className='market-cards-container'>
                    <BasketCard />
                    <BasketCard />
                    <BasketCard />
                </div>
            </div>
        </div>
    );
}

export default VendorDashboard;
