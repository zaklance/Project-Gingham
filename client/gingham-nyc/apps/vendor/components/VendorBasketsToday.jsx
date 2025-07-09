import React, { useCallback, useEffect, useState } from 'react';
import { timeConverter, formatBasketDate } from "@repo/ui/helpers.js";

function VendorBasketsToday({vendorId, todaysMarketDays, entry}) {
    const [todayBaskets, setTodayBaskets] = useState([]);
    const [startAmPm, setStartAmPm] = useState('PM');
    const [endAmPm, setEndAmPm] = useState('PM');
    const [numBaskets, setNumBaskets] = useState(() => entry?.baskets?.length || 0);
    const [prevNumBaskets, setPrevNumBaskets] = useState(numBaskets);
    const [editingBasketId, setEditingBasketId] = useState(null);
    const [tempBasketData, setTempBasketData] = useState({});
    const [errorMessage, setErrorMessage] = useState([]);

    useEffect(() => {
        if (vendorId && todaysMarketDays) {   
            const today = new Date();
            const formattedDate = today.toLocaleDateString('en-CA');
            // console.log('Formatted date being sent:', formattedDate);
    
            const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            // console.log('Browser timezone:', browserTimezone);
    
            async function fetchTodaysBaskets() {
                try {
                    const today = new Date().toLocaleDateString('en-CA');
                    
                    // console.log('Formatted date being sent:', formattedDate);
            
                    const response = await fetch(`/api/baskets?vendor_id=${vendorId}&sale_date=${formattedDate}`);
                    
                    if (!response.ok) {
                        console.error('Error fetching baskets:', response.status, response.statusText);
                        setErrorMessage("Failed to fetch today's baskets.");
                        return;
                    }
            
                    const data = await response.json();
                    // console.log('Fetched basket data:', data);
            
                    if (!Array.isArray(data)) {
                        console.error('Fetched data is not an array:', data);
                        return;
                    }
            
                    const todayBaskets = data.filter(basket => {
                        const basketLocalDate = basket.sale_date.substring(0, 10);
                    
                        // console.log(`Basket ID: ${basket.id}, Raw sale_date: ${basket.sale_date}, 
                        //              Extracted as local date: ${basketLocalDate}`);
                    
                        const isToday = basketLocalDate === today;
                        const isMarketDayValid = todaysMarketDays.some(marketDay => marketDay.id === basket.market_day_id);
                        
                        // console.log(`Basket ${basket.id} - isToday: ${isToday}, isMarketDayValid: ${isMarketDayValid}`);
                    
                        return isToday && isMarketDayValid;
                    });
            
                    // console.log('Filtered Today Baskets:', todayBaskets);
            
                    const groupedData = todayBaskets.reduce((acc, basket) => {
                        const { market_day_id, market_name } = basket;
                        if (!acc[market_day_id]) {
                            acc[market_day_id] = { marketId: market_day_id, marketName: market_name, baskets: [] };
                        }
                        acc[market_day_id].baskets.push(basket);
                        return acc;
                    }, {});
            
                    // console.log('Grouped Data:', groupedData);
                    setTodayBaskets(Object.values(groupedData));
            
                } catch (error) {
                    console.error('An error occurred while fetching today\'s baskets:', error);
                    setErrorMessage("An error occurred while fetching today's baskets.");
                }
            }
            
            fetchTodaysBaskets();
        }
    }, [vendorId, todaysMarketDays]);
    
    const toggleEditMode = (basketId) => {
        if (editingBasketId === basketId) {
            setEditingBasketId(null);
            setTempBasketData({});
        } else {
            setEditingBasketId(basketId);
            const entry = todayBaskets.find(e => e.baskets && e.baskets[0] && e.baskets[0].id === basketId);
            if (entry && entry.baskets) {
                setTempBasketData({
                    numBaskets: entry.baskets.length,
                    startTime: entry.baskets[0].pickup_start,
                    endTime: entry.baskets[0].pickup_end,
                    price: entry.baskets[0].price
                });
            }
        }
    };
    
    const handleIncrement = () => {
        setTempBasketData(prev => ({
            ...prev,
            numBaskets: prev.numBaskets + 1
        }));
    };
    
    const handleDecrement = (entry) => {
        const soldBaskets = entry.baskets.filter(basket => basket.is_sold).length;
        setTempBasketData(prev => ({
            ...prev,
            numBaskets: Math.max(prev.numBaskets - 1, soldBaskets)
        }));
    };
      
    const handleSave = async (basketId, startTime, endTime, price) => {
        const entry = todayBaskets.find(e => e.baskets[0]?.id === basketId);
        if (!entry) {
            console.error('No entry found for basketId:', basketId);
            setErrorMessage('Error: No entry found for this basket.');
            return;
        }
        
        const today = new Date();
        const formattedSaleDate = today.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
        
        console.log('startTime:', tempBasketData.startTime, 'startAmPm:', startAmPm);
        console.log('endTime:', tempBasketData.endTime, 'endAmPm:', endAmPm);

        const formatTime = (time) => {
            if (!time || typeof time !== 'string') {
                console.error('Invalid time format:', time);
                return null;
            }
        
            let [hours, minutes] = time.split(':').map(num => parseInt(num, 10));
        
            if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours >= 24 || minutes < 0 || minutes >= 60) {
                console.error('Invalid time:', time);
                return null;
            }
        
            const period = (hours >= 12) ? 'PM' : 'AM';
        
            return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
        };
        
        console.log('Raw input times:', tempBasketData.startTime, tempBasketData.endTime);
        console.log('Selected AM/PM:', startAmPm, endAmPm);

        const formattedPickupStart = formatTime(tempBasketData.startTime);
        const formattedPickupEnd = formatTime(tempBasketData.endTime);

        console.log('Formatted times:', formattedPickupStart, formattedPickupEnd);

        if (!formattedPickupStart || !formattedPickupEnd) {
            console.error('Error formatting times. Aborting save.');
            setErrorMessage('Invalid time format. Please correct and try again.');
            return;
        }
        
        const currentCount = tempBasketData.numBaskets;
        const prevCount = entry.baskets.length;
        const additionalBaskets = currentCount - prevCount;

        if (additionalBaskets > 0) {
            const promises = [];
            for (let i = 0; i < additionalBaskets; i++) {
                promises.push(fetch('/api/baskets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        vendor_id: vendorId,
                        market_day_id: entry.marketId,
                        sale_date: formattedSaleDate,
                        pickup_start: formattedPickupStart,
                        pickup_end: formattedPickupEnd,
                        is_sold: false,
                        is_grabbed: false,
                        price: parseFloat(tempBasketData.price),
                        value: entry.baskets[0]?.value,
                    }),
                }));
            }

            console.log('Data being sent:', {
                vendor_id: vendorId,
                market_day_id: entry.marketId,
                sale_date: formattedSaleDate,
                pickup_start: formattedPickupStart,
                pickup_end: formattedPickupEnd,
                is_sold: false,
                is_grabbed: false,
                price: parseFloat(tempBasketData.price),
                value: entry.baskets[0]?.value,
            });
            
            try {
                await Promise.all(promises);
        
                const updatedBasketsResponse = await fetch(`/api/baskets?vendor_id=${vendorId}&market_day_id=${entry.marketId}&sale_date=${formattedSaleDate}`);
                const updatedBaskets = await updatedBasketsResponse.json();
        
                setTodayBaskets(prevBaskets => {
                    const newBaskets = prevBaskets.map(b => {
                        if (b.marketId === entry.marketId) {
                            return { ...b, baskets: updatedBaskets };
                        }
                        return b;
                    });
                    return newBaskets;
                });
                setPrevNumBaskets(currentCount);
            } catch (error) {
                console.error('Error adding baskets:', error);
                setErrorMessage('Failed to add all baskets. Please try again.');
            }
        } else if (additionalBaskets < 0) {
            const numberOfBasketsToDelete = Math.abs(additionalBaskets);
            const unsoldBaskets = entry.baskets.filter(basket => !basket.is_sold);
            
            if (unsoldBaskets.length < numberOfBasketsToDelete) {
                setErrorMessage('Not enough unsold baskets available for deletion.');
                return;
            }
            
            const basketIdsToDelete = unsoldBaskets.slice(0, numberOfBasketsToDelete).map(basket => basket.id);
            
            try {
                await fetch('/api/baskets', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ basket_ids: basketIdsToDelete }),
                });

                const updatedBasketsResponse = await fetch(`/api/baskets?vendor_id=${vendorId}&market_day_id=${entry.marketId}&sale_date=${formattedSaleDate}`);
                const updatedBaskets = await updatedBasketsResponse.json();

                setTodayBaskets(prevBaskets => {
                    const newBaskets = prevBaskets.map(b => {
                        if (b.marketId === entry.marketId) {
                            return { ...b, baskets: updatedBaskets };
                        }
                        return b;
                    });
                    return newBaskets;
                });

                window.location.reload();
            } catch (error) {
                console.error('Error deleting baskets:', error);
                setErrorMessage('Failed to delete baskets. Please try again.');
            }
        }

        setEditingBasketId(null);
        setTempBasketData({});
        setErrorMessage('');
    };    

    const cancelBasketEdit = () => {
        setEditingBasketId(null);
        setTempBasketData({});
        setErrorMessage('');
    };
      
    return (
        <div>
            <div className="flex flex-nowrap box-scroll-x">
            {
                Array.isArray(todayBaskets) && todayBaskets.length > 0 ? (
                    todayBaskets.filter((entry) => {
                        return todaysMarketDays.some((marketDay) => marketDay.id === entry.baskets[0]?.market_day.id);
                    }).map((entry, index) => {
                        const isEditing = editingBasketId === entry.baskets[0]?.id;

                        return (
                            <div key={index} className="badge-container padding-12">
                                <div className="basket-card">
                                    {entry.baskets.length > 0 && new Date(entry.baskets[0]?.sale_date) <= new Date() && ( <p className="badge-live">Live</p> )}
    
                                    <div className="text-center">
                                        <h4>{entry.baskets[0].market_day.market.name}</h4>
                                        <h4> {entry.baskets.length > 0 ? formatBasketDate(entry.baskets[0]?.sale_date) : "No sale date available"} </h4>
                                    </div>
    
                                    <br />
                                    <table className="table-basket">
                                        <tbody>
                                            <tr className="text-500">
                                                <td>Total Baskets:</td>
                                                <td className="text-center">
                                                {isEditing ? (
                                                    <div className="basket-adjustment flex-space-evenly flex-center-align">
                                                        <button onClick={() => handleDecrement(entry)} className="btn btn-adjust btn-red">-</button>
                                                        <span>{tempBasketData.numBaskets}</span>
                                                        <button onClick={handleIncrement} className="btn btn-adjust btn-green">+</button>
                                                    </div>
                                                ) : (
                                                    entry.baskets.length
                                                )}
                                                </td>
                                            </tr>
                                            <tr className="text-500">
                                                <td>Sold Baskets:</td>
                                                <td className="text-center"> {entry.baskets.filter((basket) => basket.is_sold).length} </td>
                                            </tr>
                                            <tr className="text-500">
                                                <td>Available Baskets:</td>
                                                <td className="text-center"> {entry.baskets.length - entry.baskets.filter((basket) => basket.is_sold).length} </td>
                                            </tr>
                                            <tr className='row-blank'>
                                            </tr>
                                            <tr>
                                                <td className="nowrap">Pick-Up Start:</td>
                                                <td className="nowrap text-center"> {entry.baskets[0]?.pickup_start ? timeConverter(entry.baskets[0]?.pickup_start) : "N/A"} </td>
                                            </tr>
                                            <tr>
                                                <td className="nowrap">Pick-Up End:</td>
                                                <td className="nowrap text-center"> {entry.baskets[0]?.pickup_end ? timeConverter(entry.baskets[0]?.pickup_end) : "N/A"} </td>
                                            </tr>
                                            <tr>
                                                <td className="nowrap">Basket Value:</td>
                                                <td className="text-center">${entry.baskets[0]?.value}</td>
                                            </tr>
                                            <tr>
                                                <td className="nowrap">Basket Price:</td>
                                                <td className="text-center">${entry.baskets[0]?.price}</td>
                                            </tr>
                                        </tbody>
                                    </table>
    
                                    <br />
                                    {entry.baskets.filter((basket) => basket.is_sold).length > 0 && (
                                        <table className="table-basket">
                                            <thead>
                                                <tr className="blue-bright">
                                                    <td className="text-light" colSpan="2"> Is Grabbed? </td>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {entry.baskets
                                                    .filter((basket) => basket.is_sold)
                                                    .map((basket) => (
                                                        <tr key={basket.id}>
                                                            <td>Basket ID: {basket.id}</td>
                                                            {basket.is_grabbed ? ( <td className="text-center">✔</td> ) : ( <td className="text-center">X</td> )}
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    )}
                                    <br />
                                    <div className="text-center basket-actions">
                                        {isEditing ? (
                                            <>
                                                <button onClick={() => handleSave(entry.baskets[0]?.id, entry)} className="btn-basket-save"> Save </button>
                                                <button onClick={cancelBasketEdit} className="btn-basket-save"> Cancel </button>
                                            </>
                                        ) : (
                                            <button onClick={() => toggleEditMode(entry.baskets[0]?.id)} className="btn-basket-save"> Edit </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <p>No baskets available for today.</p>
                )}
            </div>
        </div>
    );
}    

export default VendorBasketsToday;