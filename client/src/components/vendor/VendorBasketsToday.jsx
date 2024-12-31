import React, { useEffect, useState } from 'react';
import { timeConverter, formatBasketDate } from '../../utils/helpers';

function VendorBasketsToday({vendorId, marketDay, entry}) {
    const [todayBaskets, setTodayBaskets] = useState([]);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [startAmPm, setStartAmPm] = useState('PM');
    const [endAmPm, setEndAmPm] = useState('PM');
    const [isEditing, setIsEditing] = useState({});
    const [basketCounts, setBasketCounts] = useState({});
    const [numBaskets, setNumBaskets] = useState(() => entry?.baskets?.length || 0);
    const [prevNumBaskets, setPrevNumBaskets] = useState(numBaskets);
    const [savedBaskets, setSavedBaskets] = useState([]);
    const [price, setPrice] = useState('');
    const [basketValue, setBasketValue] = useState('');
    const [tempSavedBaskets, setTempSavedBaskets] = useState({});
    const [errorMessage, setErrorMessage] = useState([]);

    useEffect(() => {
        if (vendorId) {
            console.log('Fetching today\'s baskets for vendor:', vendorId);
    
            const today = new Date();
            const formattedDate = today.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', }).split('/').reverse().join('-');
            console.log('Formatted date being sent:', formattedDate);
    
            const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            console.log('Browser timezone:', browserTimezone);
    
            async function fetchTodaysBaskets() {
                try {
                    const response = await fetch(
                        `http://127.0.0.1:5555/api/baskets?vendor_id=${vendorId}&date=${formattedDate}`
                    );
    
                    if (response.ok) {
                        const data = await response.json();
                        console.log('Fetched Data:', data);
    
                        if (Array.isArray(data)) {
                            const todayBaskets = data.filter(basket => {
                                const basketDate = new Date(basket.sale_date).toISOString().split('T')[0];
                                return basketDate === formattedDate;
                            });

                            const groupedData = todayBaskets.reduce((acc, basket) => {
                                const { market_day_id, market_name, pickup_start, pickup_end, price, basket_value } = basket;
    
                                if (!acc[market_day_id]) {
                                    acc[market_day_id] = { marketId: market_day_id, marketName: market_name, baskets: [], };
                                }
                                acc[market_day_id].baskets.push({ ...basket, pickup_start, pickup_end, price, basket_value, });
                                return acc;
                            }, {});
    
                            const groupedBasketsArray = Object.values(groupedData);
                            setTodayBaskets(groupedBasketsArray);

                            const initialBasketCounts = {};
                            groupedBasketsArray.forEach((entry) => {
                                entry.baskets.forEach((basket) => {
                                    initialBasketCounts[basket.id] = entry.baskets.length;
                                });
                            });
                            setBasketCounts(initialBasketCounts);
                            setNumBaskets(groupedBasketsArray[0]?.baskets.length || 0);
                            setPrevNumBaskets(groupedBasketsArray[0]?.baskets.length || 0);
                        }
                        
                    } else {
                        console.error('Failed to fetch baskets:', response.statusText);
                        setErrorMessage('Failed to fetch today\'s baskets.');
                    }
                } catch (error) {
                    console.error('Error fetching today\'s baskets:', error);
                    setErrorMessage('An error occurred while fetching today\'s baskets.');
                }
            }    
            fetchTodaysBaskets();
        }
    }, [vendorId]);
    
    const toggleEditMode = (basketId) => {
        setIsEditing((prevState) => {
            const newEditingState = { ...prevState, [basketId]: !prevState[basketId] };
            if (!prevState[basketId]) {
                const entry = todayBaskets.find(e => e.baskets && e.baskets[0] && e.baskets[0].id === basketId);
                if (entry && entry.baskets) {
                    setNumBaskets(entry.baskets.length);
                    setTempSavedBaskets((prev) => ({
                        ...prev,
                        [basketId]: entry.baskets.length,
                    }));
                } else {
                console.error('Entry or baskets not found for basketId:', basketId);
                setNumBaskets(0);
                }
            }
            return newEditingState;
        });
    };
      
    const handleIncrement = () => {
        setNumBaskets((prevNum) => prevNum + 1);
    };
    
    const handleDecrement = (basketId, entry) => {
        const soldBaskets = entry.baskets.filter(basket => basket.is_sold).length;
        setNumBaskets(prevNum => {
            const newNum = prevNum > soldBaskets ? prevNum - 1 : prevNum;
            return newNum;
        });
    };
      
    const handleSave = async (basketId, startTime, endTime) => {
        const parsedNumBaskets = numBaskets;
        const today = new Date();
        const formattedSaleDate = today.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', }).split('/').reverse().join('-');
        const parsedPrice = parseFloat(price);

        const entry = todayBaskets.find(e => e.baskets[0]?.id === basketId);
        if (!entry) {
            console.error('No entry found for basketId:', basketId);
            setErrorMessage('Error: No entry found for this basket.');
            return;
        }
      
        const formatTime = (time, amPm) => {
            if (!time || typeof time !== 'string') {
                console.error('Invalid time format:', time);
                return null;
            }
            let [hours, minutes] = time.split(':').map(num => parseInt(num, 10));
            if (isNaN(hours) || isNaN(minutes)) {
                console.error('Invalid hour or minute:', hours, minutes);
                return null;
            }
            // if (amPm === 'PM' && hours !== 12) hours += 12;
            // if (amPm === 'AM' && hours === 12) hours = 0;
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        };
      
        const formattedPickupStart = formatTime(startTime, startAmPm);
        const formattedPickupEnd = formatTime(endTime, endAmPm);

        console.log(formattedPickupStart);
        console.log(formattedPickupEnd);
      
        if (!formattedPickupStart || !formattedPickupEnd) {
            setErrorMessage('Invalid start or end time format.');
            return;
        }
      
        const additionalBaskets = parsedNumBaskets - prevNumBaskets;
      
        if (additionalBaskets > 0) {
            const promises = [];
            for (let i = 0; i < additionalBaskets; i++) {
                promises.push(fetch('http://127.0.0.1:5555/api/baskets', {
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
                    price: parsedPrice,
                    basket_value: entry.baskets[0]?.basket_value,
                }),
                }));
            }
            await Promise.all(promises);
        } else if (additionalBaskets < 0) {
            const numberOfBasketsToDelete = Math.abs(additionalBaskets);
            const unsoldBaskets = entry.baskets.filter(basket => !basket.is_sold);
            if (unsoldBaskets.length < numberOfBasketsToDelete) {
                setErrorMessage('Not enough unsold baskets available for deletion.');
                return;
            }
            const basketIdsToDelete = unsoldBaskets.slice(0, numberOfBasketsToDelete).map(basket => basket.id);
            await fetch('http://127.0.0.1:5555/api/baskets', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ basket_ids: basketIdsToDelete }),
            });
        }
      
        const response = await fetch(`http://127.0.0.1:5555/api/baskets?vendor_id=${vendorId}&market_day_id=${entry.marketId}&sale_date=${formattedSaleDate}`);
        const updatedBaskets = await response.json();
      
        setTodayBaskets(prevBaskets => {
          return prevBaskets.map(b => {
            if (b.marketId === entry.marketId) { return { ...b, baskets: updatedBaskets }; }
            return b;
          });
        });
      
        setPrevNumBaskets(parsedNumBaskets);
        setIsEditing(prev => ({ ...prev, [basketId]: false }));
        setErrorMessage('');
    };
      
    const cancelBasketEdit = (basketId) => {
        setIsEditing((prevState) => ({ ...prevState, [basketId]: false }));
        setNumBaskets(tempSavedBaskets[basketId] || entry.baskets.length);
        setErrorMessage('');
    };
      
    
    return (
        <div>
            <div className="flex flex-nowrap box-scroll-x">
            {
                Array.isArray(todayBaskets) && todayBaskets.length > 0 ? (
                    todayBaskets.map((entry, index) => {

                        return (
                            <div key={index} className="badge-container">
                                <div className="basket-card">
                                    {entry.baskets.length > 0 && new Date(entry.baskets[0]?.sale_date) <= new Date() && ( <p className="badge-live">Live</p> )}
    
                                    <div className="text-center">
                                        <h4>{entry.marketName}</h4>
                                        <h4> {entry.baskets.length > 0 ? formatBasketDate(entry.baskets[0]?.sale_date) : "No sale date available"} </h4>
                                    </div>
    
                                    <br />
                                    <table>
                                        <tbody className="table-basket">
                                            <tr className="text-500">
                                                <td>Total Baskets:</td>
                                                <td className="text-center">
                                                {isEditing[entry.baskets[0]?.id] ? (
                                                    <>
                                                        <button onClick={() => handleDecrement(entry.baskets[0]?.id, entry)} className="btn btn-adjust btn-red">-</button>
                                                        <span>{numBaskets}</span>
                                                        <button onClick={() => handleIncrement(entry.baskets[0]?.id)} className="btn btn-adjust btn-green">+</button>
                                                    </>
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
                                                <td className="nowrap text-center">
                                                    {entry.baskets[0]?.pickup_start ? timeConverter(entry.baskets[0]?.pickup_start) : "N/A"}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="nowrap">Pick-Up End:</td>
                                                <td className="nowrap text-center">
                                                    {entry.baskets[0]?.pickup_end ? timeConverter(entry.baskets[0]?.pickup_end) : "N/A"}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="nowrap">Basket Value:</td>
                                                <td className="text-center">${entry.baskets[0]?.basket_value}</td>
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
                                        {isEditing[entry.baskets[0]?.id] ? (
                                            <>
                                                <button onClick={() => handleSave(entry.baskets[0]?.id, entry.baskets[0]?.pickup_start, entry.baskets[0]?.pickup_end)} className="btn-basket-save" > Save </button>
                                                <button onClick={() => cancelBasketEdit(entry.baskets[0]?.id)} className="btn-basket-save" > Cancel </button>
                                            </>
                                        ) : (
                                            <button onClick={() => toggleEditMode(entry.baskets[0]?.id)} className="btn-basket-save" > Edit </button>
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