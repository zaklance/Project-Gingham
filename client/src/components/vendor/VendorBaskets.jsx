import React, { useEffect, useState } from 'react';
import { weekDay } from '../../utils/common';
import { timeConverter, formatBasketDate } from '../../utils/helpers';
import VendorBasketCard from './VendorBasketCard';
import VendorCreate from './VendorCreate';
import VendorNotification from './VendorNotification';

function VendorBaskets({ vendorUserData }) {
    const [vendorId, setVendorId] = useState(null);
    const [allVendorMarkets, setAllVendorMarkets] = useState([]);
    const [filteredMarketDays, setFilteredMarketDays] = useState([]);
    const [nextMarketDays, setNextMarketDays] = useState(null);
    const [todayBaskets, setTodayBaskets] = useState([]);
    const [availableBaskets, setAvailableBaskets] = useState([]);
    const [claimedBaskets, setClaimedBaskets] = useState([]);

    useEffect(() => {
        const fetchVendorId = async () => {
            const vendorUserId = localStorage.getItem('vendor_user_id');
            if (!vendorUserId) {
                console.error("No vendor user ID found in local storage");
                return;
            }
            try {
                const token = localStorage.getItem('vendor_jwt-token');
                const response = await fetch(`http://127.0.0.1:5555/api/vendor-users/${vendorUserId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setVendorId(data.vendor_id);
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
            fetch(`http://127.0.0.1:5555/api/vendor-markets?vendor_id=${vendorId}`, )
                .then(response => response.json())
                .then(data => setAllVendorMarkets(data))
                .catch(error => console.error('Error fetching vendor markets:', error));
        }
    }, [vendorId]);

    useEffect(() => {
        if (allVendorMarkets.length > 0) {
            const token = localStorage.getItem('vendor_jwt-token');

            fetch("http://127.0.0.1:5555/api/market-days", {
                method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (Array.isArray(data)) {
                        const filteredData = data.filter(item =>
                            allVendorMarkets.some(vendorMarket => vendorMarket.market_day_id === item.id)
                        );
                        setFilteredMarketDays(filteredData);
                    } else {
                        console.error("Unexpected response format:", data);
                    }
                })
                .catch(error => console.error('Error fetching market days:', error));
            }
        }, [allVendorMarkets]);

        useEffect(() => {
            if (vendorId) {
                console.log('Fetching today\'s baskets for vendor:', vendorId);
        
                const today = new Date();
                const formattedDate = today.toLocaleDateString('en-CA', { // Using en-CA as this has the correct ISO format 
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                }).split('/').reverse().join('-');

                console.log('Formatted date being sent:', formattedDate);
        
                const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                console.log('Browser timezone:', browserTimezone);
        
                fetch(`http://127.0.0.1:5555/api/todays-baskets?vendor_id=${vendorId}&date=${formattedDate}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Timezone': browserTimezone
                    }
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Fetched data for today\'s baskets:', data);
                    if (Array.isArray(data)) {
                        data.forEach(basket => {
                            // console.log('Basket date:', basket.sale_date);
                        });
        
                        const groupedData = data.reduce((acc, basket) => {
                            const { market_day_id, market_name } = basket;
        
                            if (!acc[market_day_id]) {
                                acc[market_day_id] = {
                                    marketId: market_day_id,
                                    marketName: market_name,
                                    baskets: []
                                };
                            }
                            acc[market_day_id].baskets.push(basket);
                            return acc;
                        }, {});
        
                        const groupedBasketsArray = Object.values(groupedData);
                        setTodayBaskets(groupedBasketsArray);
        
                        const availableBasketsArray = groupedBasketsArray
                            .map(entry => entry.baskets.filter(basket => !basket.is_sold))
                            .flat();
                        const claimedBasketsArray = groupedBasketsArray
                            .map(entry => entry.baskets.filter(basket => basket.is_sold))
                            .flat();
        
                        setAvailableBaskets(availableBasketsArray);
                        setClaimedBaskets(claimedBasketsArray);
                    } else {
                        console.error('Unexpected data format:', data);
                    }
                })
                .catch(error => {
                    console.error('Error fetching today\'s baskets:', error);
                });
            } else {
                console.log('Vendor ID is not available');
            }
        }, [vendorId]);
        
    

    useEffect(() => {
        const calculateNextMarketDays = () => {
            const today = new Date();
            const currentTime = today.getTime();
            const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
            const nineAMToday = new Date(today);
            nineAMToday.setHours(9, 0, 0, 0);
            const nineAMTime = nineAMToday.getTime();
    
            const next7Days = Array.from({ length: 7 }, (_, i) => {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                return date;
            });
    
            const nextMarketDays = filteredMarketDays
                .map(day => {
                    const date = next7Days.find(d => d.getDay() === day.day_of_week);
                    return {
                        ...day,
                        date: date ? new Date(date.setHours(0, 0, 0, 0)) : null,
                    };
                })
                .filter(day => {
                    if (!day.date) return false;
    
                    const dayTime = new Date(day.date);
                    dayTime.setHours(9, 0, 0, 0); // Show todays market as future market until 9:00AM of market day
    
                    if (day.date.toDateString() === today.toDateString() && currentTime >= nineAMTime) {
                        return false;
                    }
                    return day.date.getTime() > today.getTime();
                })
                .sort((a, b) => a.date - b.date);
    
            setNextMarketDays(nextMarketDays);
        };
    
        if (filteredMarketDays.length > 0) {
            calculateNextMarketDays();
        }
    }, [filteredMarketDays]);

    return (
        <div>
            {!vendorUserData || !vendorUserData.vendor_id ? (
                <div className='box-bounding'>
                    <VendorCreate />
                </div>
            ) : (
                <div className='box-bounding'>
                <h2>Today's Baskets</h2>
                <br />
                <div className='flex flex-gap-36 flex-nowrap box-scroll-x'>
                    {todayBaskets.length > 0 ? (
                        todayBaskets.map((entry, index) => (
                            <div key={index} className='basket-card'>
                                <div className='text-center'>
                                    <h4>{entry.marketName}</h4>
                                    {entry.baskets.length > 0 ? (
                                        <h4>
                                            {entry.baskets.length > 0 ? formatBasketDate(entry.baskets[0].sale_date) : 'No sale date available'}
                                        </h4>
                                    ) : (
                                        <h4>No sale date available</h4>
                                    )}
                                </div>
                                <br/>          
                                {entry.baskets.length > 0 && (
                                    <table>
                                        <tbody className='table-basket'>
                                            <tr className='blue'>
                                                <td>Total Available Baskets:</td>
                                                <td className='text-center'>{entry.baskets.length}</td>
                                            </tr>
                                            <tr className='row-blank'>
                                            </tr>
                                            <tr>
                                                <td className='nowrap'>Pickup Start:</td>
                                                <td className='nowrap text-center'>{timeConverter(entry.baskets[0]?.pickup_start)}</td>
                                            </tr>
                                            <tr>
                                                <td className='nowrap'>Pickup End:</td>
                                                <td className='nowrap text-center'>{timeConverter(entry.baskets[0]?.pickup_end)}</td>
                                            </tr>
                                            <tr>
                                                <td className='nowrap'>Basket Value:</td>
                                                <td className='text-center'>${entry.baskets[0]?.basket_value}</td>
                                            </tr>
                                            <tr>
                                                <td className='nowrap'>Basket Price:</td>
                                                <td className='text-center'>${entry.baskets[0]?.price}</td>
                                            </tr>
                                            <tr className='row-blank'>
                                            </tr>
                                            <tr className='blue'>
                                                <td>Sold Baskets:</td>
                                                <td className='text-center'>{entry.baskets.filter(basket => basket.is_sold).length}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                )}
                                <br/>
                                <h4> </h4>
                                {entry.baskets.filter(basket => basket.is_sold).length > 0 && (
                                    <table className='table-basket'>
                                        <thead>
                                            <tr className='blue-bright'>
                                                <td className='text-light' colSpan="2"> Is Grabbed?</td>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {entry.baskets.filter(basket => basket.is_sold).map((basket, index) => (
                                                <tr key={basket.id || index}>
                                                    <td>Basket ID: {basket.id}</td>
                                                    {basket.is_grabbed ? <td className='text-center'>&#10003;</td> : <td className='text-center'>X</td>}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                )}
                            </div>
                        ))
                    ) : (
                        <p>No baskets available for today.</p>
                    )}
                    </div>            
                    <h2 className='margin-t-48 margin-b-16'>Future Markets:</h2>
                    <br />
                    <div className='flex flex-gap-36 flex-nowrap box-scroll-x'>
                        {nextMarketDays ? nextMarketDays.map((marketDay, index) => (
                            <VendorBasketCard key={index} vendorId={vendorId} marketDay={marketDay} weekDay={weekDay} />
                        )) : <p>No upcoming market days available.</p>}
                    </div>
                </div>
                )}
        </div>
    );
}    

export default VendorBaskets;