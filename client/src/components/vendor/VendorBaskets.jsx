import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import VendorBasketCard from './VendorBasketCard';
import VendorCreate from './VendorCreate';
import VendorNotification from './VendorNotification';

function VendorBaskets({ marketId, vendorUserData }) {
    const [locations, setLocations] = useState([]);
    const [vendorId, setVendorId] = useState(null);
    const [allVendorMarkets, setAllVendorMarkets] = useState([]);
    const [filteredMarketDays, setFilteredMarketDays] = useState([]);
    const [filteredMarkets, setFilteredMarkets] = useState([]);
    const [nextMarketDays, setNextMarketDays] = useState(null);
    const [marketDetails, setMarketDetails] = useState({});
    const [availableBaskets, setAvailableBaskets] = useState({});
    const [price, setPrice] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    const vendorUserId = sessionStorage.getItem('vendor_user_id');
    const marketPrice = price[marketId] !== undefined ? price[marketId] : 0;
    const marketBaskets = availableBaskets[marketId] !== undefined ? availableBaskets[marketId] : 0;
    const today = new Date();
    const dayOfWeek = today.getDay()
    const weekDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

    function convertToLocalDate(gmtDateString) {
        const gmtDate = new Date(gmtDateString);
        const localDate = gmtDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
        return localDate;
    }

    useEffect(() => {
        const fetchVendorId = async () => {
            const vendorUserId = sessionStorage.getItem('vendor_user_id');
            if (!vendorUserId) {
                console.error("No vendor user ID found in session storage");
                return;
            }
            try {
                const token = sessionStorage.getItem('jwt-token');
                const response = await fetch(`http://127.0.0.1:5555/api/vendor-users/${vendorUserId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.vendor_id) {
                        setVendorId(data.vendor_id);
                    }
                } else {
                    console.error('Failed to fetch vendor user data');
                }
            } catch (error) {
                console.error('Error fetching vendor user data:', error);
            }
        };
        fetchVendorId();
    }, []);

    useEffect(() => {
        if (vendorId) {
            fetch(`http://127.0.0.1:5555/api/vendor-markets?vendor_id=${vendorId}`)
                .then(response => response.json())
                .then(data => {
                    setAllVendorMarkets(data)
                    // if (Array.isArray(markets)) {
                    //     const marketIds = markets.map(market => market.market_day_id);
                    //     setMarkets(marketIds);
                    // }
                })
                .catch(error => console.error('Error fetching market locations:', error));
            }
    }, [vendorId]);

    useEffect(() => {
        if (allVendorMarkets.length > 0) {
            fetch("http://127.0.0.1:5555/api/market-days")
                .then(response => response.json())
                .then(data => {
                    const filteredData = data.filter(item =>
                        allVendorMarkets.some(vendorMarket => vendorMarket.market_day_id === item.id)
                    );
                    setFilteredMarketDays(filteredData)
                })
                .catch(error => console.error('Error fetching market days', error));
            }
    }, [allVendorMarkets]);

    useEffect(() => {
        fetch("http://127.0.0.1:5555/api/markets")
            .then(response => response.json())
            .then(data => {
                const filteredData = data.filter(item =>
                    filteredMarketDays.some(vendorMarket => vendorMarket.market_id === item.id)
                );
                setFilteredMarkets(filteredData)
            })
            .catch(error => console.error('Error fetching market days', error));
    }, [filteredMarketDays]);

    const todaysMarketDay = filteredMarketDays.filter(item => item.day_of_week === dayOfWeek);


    useEffect(() => {
        const calculateNextMarketDays = () => {
            const today = new Date();
            const next7Days = Array.from({ length: 7 }, (_, i) => {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                return date;
            });

            const nextMarketDays = filteredMarketDays
                .map(day => ({
                    ...day,
                    date: next7Days.find(d => d.getDay() === day.day_of_week),
                }))
                .filter(day => day.date)
                .sort((a, b) => a.date - b.date);

            setNextMarketDays(nextMarketDays);
        };

        if (filteredMarketDays.length > 0) {
            calculateNextMarketDays();
        }
    }, [filteredMarketDays]);



    // useEffect(() => {
    //     const fetchVendorData = async () => {
    //         try {
    //             const response = await fetch(`http://127.0.0.1:5555/api/vendors/${id}`);
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
    //                     const response = await fetch(`http://127.0.0.1:5555/api/markets/${marketId}`);
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
            {!vendorUserData || !vendorUserData.vendor_id ? (
                <div className='box-bounding'>
                    <VendorCreate />
                </div>
            ) : (
                <div className='box-bounding'>
                    <h3>Todays Markets:</h3>
                    <div className='market-cards-container'>
                        <div className='market-card'>
                                {nextMarketDays ? (
                                <>
                                    <h3>{nextMarketDays[0].markets.name}</h3>
                                    <h4>{weekDay[nextMarketDays[0].date.getDay()]} {convertToLocalDate(nextMarketDays[0].date)}</h4>
                                </>
                            ) : (
                                <h3>Loading...</h3>
                            )}
                    
                            <br />
                            <p>Available Baskets: 5</p>
                            <br />
                            <p>Pick Up Time: </p>
                            <p>04:30 PM (1 hour)</p>
                            <br />
                            <p><strong>Claimed Baskets: 3</strong></p>
                            <div className='box-bounding'>
                                <p>sandroledesma, 04:45 PM<strong> ✓ </strong></p>
                                <p>zaklance, 05:15 PM</p>
                                <p>vhle, 05:15 PM</p>
                            </div>
                        </div>
                    </div>
                    {/* {locations.map((marketId) => (
                            <div key={marketId} className='market-item'>
                                <h3>{marketDetails[marketId]?.name || 'Loading...'}</h3>
                                <div className='market-info'>
                                    <label>
                                        Price: 
                                        <input 
                                            type='number' 
                                            value={marketPrice}
                                            onChange={(e) => handleChange(marketId, 'price', parseFloat(e.target.value))}
                                        />
                                    </label>
                                    <label>
                                        Available Baskets: 
                                        <input 
                                            type='number' 
                                            value={marketBaskets}
                                            onChange={(e) => handleChange(marketId, 'baskets', parseInt(e.target.value))}
                                        />
                                    </label>
                                    <button className='btn-edit' onClick={() => handleSaveChanges(marketId)}>Save Changes</button>
                                </div>
                            </div>
                        ))} */}
                    <h2 className='margin-t-48 margin-b-16'>Future Markets:</h2>
                    <br />
                    <div className='market-cards-container'>
                            {nextMarketDays ? nextMarketDays.map((marketDay, index) => (
                                <VendorBasketCard
                                    key={index}
                                    vendorId={vendorId}
                                    months={months}
                                    weekDay={weekDay}
                                    marketDay={marketDay}
                                />
                            )) : ''}
                    </div>
                </div>
            )}
        </div>
    );
}

export default VendorBaskets;
