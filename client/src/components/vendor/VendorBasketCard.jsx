import React, { useState, useEffect } from 'react';
import { timeConverter, formatBasketDate } from '../../utils/helpers';
import '../../assets/css/index.css';

function VendorBasketCard({ vendorId, marketDay }) {
    const [marketId, setMarketId] = useState(null);
    const [marketName, setMarketName] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [startAmPm, setStartAmPm] = useState('PM');
    const [endAmPm, setEndAmPm] = useState('PM');
    const [isSaved, setIsSaved] = useState(true);
    const [isEditing, setIsEditing] = useState(false); 
    const [numBaskets, setNumBaskets] = useState(0);
    const [prevNumBaskets, setPrevNumBaskets] = useState(numBaskets);
    const [price, setPrice] = useState('');
    const [basketValue, setBasketValue] = useState('')
    const [errorMessage, setErrorMessage] = useState('');
    const [savedBaskets, setSavedBaskets] = useState([]);
    const [tempSavedBaskets, setTempSavedBaskets] = useState(null);
    const [isLive, setIsLive] = useState(false);

    useEffect(() => {
        if (vendorId && marketDay?.id && marketDay?.vendor_markets) {
            const vendorMarketEntry = marketDay.vendor_markets.find(vm => vm.vendor_id === vendorId);
    
            if (vendorMarketEntry) {
                const marketDayId = vendorMarketEntry.market_day_id;
    
                if (marketDayId && marketDay?.date) {
                    const formattedMarketDate = new Date(marketDay.date).toISOString().split('T')[0];
                    async function fetchSavedBaskets() {
                        try {
                            const response = await fetch(
                                `http://127.0.0.1:5555/api/baskets?vendor_id=${vendorId}&market_day_id=${marketDayId}&sale_date=${formattedMarketDate}`
                            );
    
                            if (response.ok) {
                                const data = await response.json();
                                console.log('Fetched Saved Baskets:', data); 
                                
                                if (data.length === 0) {
                                    setSavedBaskets([]);
                                    setIsSaved(false);
                                    setErrorMessage('No saved baskets found for future markets');
                                } else {
                                    setSavedBaskets(data);
                                    setIsSaved(true);
                                }
                            } else {
                                console.error('Failed to fetch baskets:', response.statusText);
                                setErrorMessage('Failed to fetch saved baskets.');
                            }
                        } catch (error) {
                            console.error('Error fetching saved baskets:', error);
                            setErrorMessage('An error occurred while fetching saved baskets.');
                        }
                    }
                    fetchSavedBaskets();
                }
            }
        }
    }, [vendorId, marketDay]);
    
    useEffect(() => {
        if (savedBaskets.length === 0) {
            setIsEditing(true);
            setIsSaved(false);
        } else {
            setIsEditing(false);
            setIsSaved(true);
        }
    }, [savedBaskets]);
    
    useEffect(() => {
        if (savedBaskets.length > 0) {
            console.log('Saved Baskets:', savedBaskets);
            const firstBasket = savedBaskets[0];
    
            setNumBaskets(savedBaskets.length);
            setBasketValue(firstBasket.basket_value || '');
            setPrice(firstBasket.price || '');
    
            if (firstBasket.pickup_start) {
                const start = timeConverter(firstBasket.pickup_start);
                setStartTime(start);
            } else {
                setStartTime('');
            }
    
            if (firstBasket.pickup_end) {
                const end = timeConverter(firstBasket.pickup_end);
                setEndTime(end);
            } else {
                setEndTime('');
            }
        } else {
            console.log('No Saved Baskets Found');
            setNumBaskets('');
            setBasketValue('');
            setPrice('');
            setStartTime('');
            setEndTime('');
        }
    }, [savedBaskets]);
    
    useEffect(() => {
        if (savedBaskets.length > 0) {
            const firstBasket = savedBaskets[0];
            const now = new Date();
    
            if (marketDay.date && firstBasket.pickup_start) {
                let formattedMarketDate;
    
                if (typeof marketDay.date === 'string') {
                    formattedMarketDate = marketDay.date; 
                } else if (marketDay.date instanceof Date) {
                    formattedMarketDate = marketDay.date.toISOString().split('T')[0];
                } else {
                    console.error('Invalid format for marketDay.date:', marketDay.date);
                    setIsLive(false);
                    return;
                }
    
                const [hour, minute] = firstBasket.pickup_start.split(':');
    
                const [year, month, day] = formattedMarketDate.split('-');
                const combinedDateTime = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
    
                console.log('Combined DateTime:', combinedDateTime);
    
                if (isNaN(combinedDateTime.getTime())) {
                    console.error('Invalid Date format for Pickup Start:', `${year}-${month}-${day}T${hour}:${minute}:00`);
                    setIsLive(false);
                    return;
                }
    
                if (combinedDateTime.getTime() - now.getTime() <= 48 * 60 * 60 * 1000) {
                    setIsLive(true);
                } else {
                    setIsLive(false);
                }
            } else {
                console.error('Missing marketDay.date or firstBasket.pickup_start');
                setIsLive(false);
            }
        } else {
            setIsLive(false);
        }
    }, [savedBaskets, marketDay]);    
    
    useEffect(() => {
        async function fetchMarketName(marketId) {
            if (marketId) {
                try {
                    const response = await fetch(`http://127.0.0.1:5555/api/markets/${marketId}`);
                    if (response.ok) {
                        const data = await response.json();
                        setMarketName(data.name);
                    } else {
                        console.error('Failed to fetch market:', response.statusText);
                    }
                } catch (error) {
                    console.error('Error fetching market name:', error);
                }
            }
        }
        if (marketDay && marketDay.market_id) {
            setMarketId(marketDay.market_id);
            fetchMarketName(marketDay.market_id);
        }
    }, [marketDay]);

    const handleIncrement = () => {
        setPrevNumBaskets(prevNumBaskets);
        setNumBaskets(prevState => prevState + 1);
    };
     
    const handleDecrement = () => {
        const soldBasketsCount = savedBaskets.filter(basket => basket.is_sold).length;
        setPrevNumBaskets(numBaskets);
        // setNumBaskets((prevNum) => (Number(prevNum) > soldBasketsCount ? Number(prevNum) - 1 : Number(prevNum)));
        setNumBaskets((prevNum) => Math.max(prevNum - 1, soldBasketsCount));
    };

    useEffect(() => {
        setPrevNumBaskets(savedBaskets.length);
        setNumBaskets(savedBaskets.length);
    }, [savedBaskets]);
    
    const handleSave = async () => {
        const parsedNumBaskets = numBaskets;
        const parsedPrice = parseFloat(price);
    
        const soldBasketsCount = savedBaskets.filter(basket => basket.is_sold).length;
    
        if (parsedNumBaskets < soldBasketsCount) {
            setErrorMessage(`You cannot reduce the number of baskets below the sold count (${soldBasketsCount}).`);
            return;
        }
    
        const [startHour, startMinute] = startTime.split(':').map(num => parseInt(num, 10));
        const [endHour, endMinute] = endTime.split(':').map(num => parseInt(num, 10));
    
        if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
            console.error('Invalid hour or minute values for pickup start or end.');
            setErrorMessage('Invalid time values for pickup start or end.');
            return;
        }
    
        const formattedStartHour = startAmPm === 'PM' && startHour !== 12
            ? startHour + 12
            : startAmPm === 'AM' && startHour === 12
            ? 0
            : startHour;
    
        const formattedEndHour = endAmPm === 'PM' && endHour !== 12
            ? endHour + 12
            : startAmPm === 'AM' && endHour === 12
            ? 0
            : endHour;
    
        const localDate = new Date(marketDay.date);
        const formattedSaleDate = localDate.toISOString().split('T')[0];
    
        const startTimeDate = new Date();
        startTimeDate.setHours(formattedStartHour, startMinute, 0, 0);
    
        const endTimeDate = new Date();
        endTimeDate.setHours(formattedEndHour, endMinute, 0, 0);
    
        const formattedPickupStart = `${startTimeDate.getHours().toString().padStart(2, '0')}:${startTimeDate.getMinutes().toString().padStart(2, '0')} ${startAmPm}`;
        const formattedPickupEnd = `${endTimeDate.getHours().toString().padStart(2, '0')}:${endTimeDate.getMinutes().toString().padStart(2, '0')} ${endAmPm}`;
    
        if (parsedNumBaskets > 0 && vendorId && marketDay && marketDay.id && !isNaN(parsedPrice) && parsedPrice > 0) {
            const promises = [];
            const additionalBaskets = parsedNumBaskets - prevNumBaskets;
    
            if (additionalBaskets > 0) {
                for (let i = 0; i < additionalBaskets; i++) {
                    promises.push(fetch('http://127.0.0.1:5555/api/baskets', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            vendor_id: vendorId,
                            market_day_id: marketDay.id,
                            sale_date: formattedSaleDate,
                            pickup_start: formattedPickupStart,
                            pickup_end: formattedPickupEnd,
                            is_sold: false,
                            is_grabbed: false,
                            price: parsedPrice,
                            basket_value: basketValue,
                        }),
                    }));
                }
            } 
            else if (additionalBaskets < 0) {
                const basketsToDelete = savedBaskets.slice(0, Math.abs(additionalBaskets));
                const unsoldBasketsToDelete = basketsToDelete.filter(basket => !basket.is_sold);
    
                if (unsoldBasketsToDelete.length < Math.abs(additionalBaskets)) {
                    setErrorMessage('You cannot delete sold baskets.');
                    return;
                }
    
                for (const basket of unsoldBasketsToDelete) {
                    promises.push(fetch(`http://127.0.0.1:5555/api/baskets/${basket.id}`, {
                        method: 'DELETE',
                    }));
                }
            }
    
            try {
                const responses = await Promise.all(promises);
                for (const response of responses) {
                    if (!response.ok) {
                        throw new Error(`Error creating/deleting basket: ${response.statusText}`);
                    }
                    await response.json();
                }
                setPrevNumBaskets(numBaskets);
                setIsEditing(false);
                setIsSaved(true);
                setErrorMessage('');
            } catch (error) {
                console.error('Error creating or deleting baskets:', error);
                setErrorMessage('Failed to update baskets. Please try again.');
            }
        } else {
            console.error('Invalid data or missing vendor/market ID');
            setErrorMessage('Please enter valid data for all fields.');
        }
    };

    const editSavedBaskets = () => {
        if (!isEditing) {
            setTempSavedBaskets({
                savedBaskets: numBaskets,
            });
        }
        setIsEditing(!isEditing);
    };

    const cancelBasketEdit = () => {
        setIsEditing(false);
        if (tempSavedBaskets) {
            setNumBaskets(tempSavedBaskets.savedBaskets || savedBaskets.length);
        }
        setErrorMessage('');
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete all unsold baskets?')) {
            return;
        }
    
        const unsoldBaskets = savedBaskets.filter(basket => !basket.is_sold);
    
        if (unsoldBaskets.length === 0) {
            setErrorMessage('No unsold baskets available for deletion.');
            return;
        }
    
        if (vendorId && marketDay?.id && marketDay?.date) {
            const formattedSaleDate = new Date(marketDay.date).toISOString().split('T')[0];
    
            try {
                const response = await fetch(
                    `http://127.0.0.1:5555/api/baskets?vendor_id=${vendorId}&market_day_id=${marketDay.id}&sale_date=${formattedSaleDate}`,
                    {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            baskets: unsoldBaskets.map(basket => basket.id),
                        }),
                    }
                );
    
                if (response.ok) {
                    console.log('Unsold baskets deleted successfully');
                    setSavedBaskets(savedBaskets.filter(basket => basket.is_sold));
                    setIsSaved(false);
                    setIsEditing(true);
                    setNumBaskets('');
                    setBasketValue('');
                    setPrice('');
                    setStartTime('');
                    setEndTime('');
                } else {
                    console.error('Failed to delete baskets:', response.statusText);
                    setErrorMessage('Failed to delete baskets. Please try again.');
                }
            } catch (error) {
                console.error('Error deleting baskets:', error);
                setErrorMessage('An error occurred while deleting baskets.');
            }
        } else {
            console.error('Missing vendorId, marketDay.id, or marketDay.date');
            setErrorMessage('Missing vendor ID, market day ID, or sale date.');
        }
    };

    useEffect(() => {
        if (marketDay?.date) {
            const now = new Date();
            const marketDate = new Date(marketDay.date);
            const diffInHours = Math.abs(now - marketDate) / (1000 * 60 * 60); // Difference in hours
            setIsLive(diffInHours <= 48);
        }
    }, [marketDay]);

    return (
        <div className='badge-container'>
            <div className="basket-card">
                {isLive ? (
                    <p className="badge-live">Live</p>
                ) : isSaved ? (
                    <p className="badge-pending">Pending</p>
                ) : null}

                {marketDay && marketDay.date ? (
                    <>
                        <div className='text-center'>
                            <div className='text-center'>
                                <h4>{marketName ? marketName : 'Loading Market...'}</h4>
                                <h4 className='margin-t-8'> {formatBasketDate(marketDay.date)} </h4>
                            </div>
                        </div>
                    </>
                ) : (
                    <h3>Loading...</h3>
                )}
                <br />
                {isSaved ? (
                    <>
                        <table className='table-basket'>
                            <tbody>
                                <tr>
                                    <td>Baskets Saved:</td>
                                    <td className='text-center'>
                                        {isEditing ? (
                                            <div className="basket-adjustment flex-space-evenly flex-center-align">
                                                <button onClick={handleDecrement} className="btn btn-adjust btn-red">–</button>
                                                <span>{numBaskets}</span>
                                                <button onClick={handleIncrement} className="btn btn-adjust btn-green">+</button>
                                            </div>                                    
                                        ) : (
                                            numBaskets
                                        )}
                                    </td>
                                </tr>
                                <tr>
                                    <td>Estimated Value:</td>
                                    <td className='text-center'>${basketValue}</td>
                                </tr>
                                <tr>
                                    <td>Price:</td>
                                    <td className='text-center'>${price}</td>
                                </tr>
                                <tr>
                                    <td>Pick-Up Start:</td>
                                    <td className='text-center'>{startTime}</td>
                                </tr>
                                <tr>
                                    <td>Pick-Up End:</td>
                                    <td className='text-center'>{endTime}</td>
                                </tr>
                                <tr className='row-blank'>
                                </tr>
                                <tr>
                                    <td className='text-500'>Sold Baskets:</td>
                                    <td className='text-center text-blue'>
                                        {savedBaskets.filter(basket => basket.is_sold).length}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div className='text-center'>
                            {isEditing ? (
                                <>
                                    <button onClick={handleSave} className={`btn-basket-save ${isSaved ? 'Saved' : ''}`}>
                                        Save
                                    </button>
                                    <button onClick={cancelBasketEdit} className="btn-basket-save">Cancel</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={editSavedBaskets} className="btn-basket-save">
                                        Add Baskets
                                    </button>
                                    <button onClick={handleDelete} className="btn-basket-save">Delete All Baskets</button>
                                </>
                            )}
                        </div>
                        {errorMessage && <p className="error-message">{errorMessage}</p>}
                    </>
                ) : isEditing ? (
                    <>
                        <div className='form-baskets'>
                            <label className='margin-t-16 margin-b-8'>Baskets Available:</label>
                            <input type="text" name="basket_input" placeholder="5" onChange={(e) => setNumBaskets(Number(e.target.value))} value={numBaskets} />
                        </div>
                        <div className='form-baskets'>
                            <label className='margin-t-16 margin-b-8'>Basket Value:</label>
                            <input type="text" name="price" placeholder="$10.00" onChange={(e) => setBasketValue(e.target.value)} value={basketValue} />
                        </div>
                        <div className='form-baskets'>
                            <label className='margin-t-16 margin-b-8'>Basket Price:</label>
                            <input type="text" step="0.01" name="price" placeholder="$5.00" onChange={(e) => setPrice(e.target.value)} value={price} />
                        </div>
                        <br></br>
                        <div className='form-baskets-small'>
                            <label className='margin-t-16 margin-b-8'>Pick Up Start:</label>
                            <div className='flex-start'>
                                <input placeholder="HH:MM" name="pickup_start" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                                <select name="amPm" value={startAmPm} className='am-pm' onChange={(e) => setStartAmPm(e.target.value)} >
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                </select>
                            </div>
                        </div>
                        <div className='form-baskets-small'>
                            <label className='margin-t-16 margin-b-8'>Pick Up End:</label>
                            <div className='flex-start'>
                                <input placeholder="HH:MM" name="pickup_end" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                                <select name="amPm" value={endAmPm} className='am-pm' onChange={(e) => setEndAmPm(e.target.value)} >
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                </select>
                            </div>
                        </div>
                    <div className='text-center'>
                            <button onClick={handleSave} className={`btn-basket-save ${isSaved ? 'saved' : ''}`} >
                                {isSaved ? 'Saved' : 'Save'}
                            </button>
                    </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}

export default VendorBasketCard;
