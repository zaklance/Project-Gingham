import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import VendorBasketCard from './VendorBasketCard';
import VendorCreate from './VendorCreate';
import VendorNotification from './VendorNotification';

function VendorBaskets({ vendorUserData }) {
    const [vendorId, setVendorId] = useState(null);
    const [allVendorMarkets, setAllVendorMarkets] = useState([]);
    const [filteredMarketDays, setFilteredMarketDays] = useState([]);
    const [nextMarketDays, setNextMarketDays] = useState(null);
    const [baskets, setBaskets] = useState([]);
    const [todayBaskets, setTodayBaskets] = useState([]);
    const [availableBaskets, setAvailableBaskets] = useState([]);
    const [claimedBaskets, setClaimedBaskets] = useState([]);

    const weekDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    function timeConverter(time24) {
        const date = new Date(`1970-01-01T${time24}Z`); // Add 'Z' to indicate UTC
        const time12 = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
        return time12;
    }

    function convertToLocalDate(gmtDateString) {
        const gmtDate = new Date(gmtDateString);
        const localDate = gmtDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',se
        });
        return localDate;
    }

    useEffect(() => {
        const fetchVendorId = async () => {
            const vendorUserId = localStorage.getItem('vendor_user_id');
            if (!vendorUserId) {
                console.error("No vendor user ID found in local storage");
                return;
            }
            try {
                const token = localStorage.getItem('jwt-token');
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
            fetch(`http://127.0.0.1:5555/api/vendor-markets?vendor_id=${vendorId}`)
                .then(response => response.json())
                .then(data => setAllVendorMarkets(data))
                .catch(error => console.error('Error fetching vendor markets:', error));
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
                    setFilteredMarketDays(filteredData);
                })
                .catch(error => console.error('Error fetching market days:', error));
        }
    }, [allVendorMarkets]);

    useEffect(() => {
        if (vendorId) {
            console.log('Fetching today\'s baskets for vendor:', vendorId);
            fetch(`http://127.0.0.1:5555/api/todays-baskets?vendor_id=${vendorId}`)
                .then(response => response.json())
                .then(data => {
                    console.log('Fetched data for today\'s baskets:', data);
    
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
                <div className='market-cards-container'>
                    {todayBaskets.length > 0 ? (
                        todayBaskets.map((entry, index) => (
                            <div key={index} className='basket-card'>
                                <div className='text-center'>
                                    <h4>{entry.marketName}</h4>
                                    <h4>{new convertToLocalDate(Date(entry.baskets[0].sale_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }))}</h4>
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
                                                <td>Pickup Start:</td>
                                                <td className='nowrap text-center'>{timeConverter(entry.baskets[0]?.pickup_start)}</td>
                                            </tr>
                                            <tr>
                                                <td>Pickup End:</td>
                                                <td className='nowrap text-center'>{timeConverter(entry.baskets[0]?.pickup_end)}</td>
                                            </tr>
                                            <tr>
                                                <td>Basket Value:</td>
                                                <td className='text-center'>${entry.baskets[0]?.basket_value}</td>
                                            </tr>
                                            <tr>
                                                <td>Basket Price:</td>
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
                                                <td className='text-light' colspan="2"> Is Grabbed?</td>
                                            </tr>
                                        </thead>
                                        {entry.baskets.filter(basket => basket.is_sold).map((basket) => (
                                            <tr>
                                                <td>Basket ID: {basket.id}</td>
                                                {basket.is_grabbed ? <td className='text-center'>&#10003;</td> : <td className='text-center'>X</td>}
                                            </tr>
                                        ))}
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
                <div className='market-cards-container'>
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
