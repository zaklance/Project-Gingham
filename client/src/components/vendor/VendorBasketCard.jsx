import React, { useState, useEffect } from 'react';
import '../../assets/css/index.css';

function VendorBasketCard({ vendorId, months, weekDay, marketDay }) {
    const [marketId, setMarketId] = useState(null);
    const [marketName, setMarketName] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [startAmPm, setStartAmPm] = useState('PM');
    const [endAmPm, setEndAmPm] = useState('PM');
    const [isSaved, setIsSaved] = useState(false);
    const [isEditing, setIsEditing] = useState(true); 
    const [numBaskets, setNumBaskets] = useState('');
    const [price, setPrice] = useState('');
    const [basketValue, setBasketValue] = useState('')
    const [errorMessage, setErrorMessage] = useState('');
    const [savedBaskets, setSavedBaskets] = useState([]);
    
    function timeConverter(time24) {
        const [hours, minutes, seconds] = time24.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, seconds || 0);
        const time12 = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        });
        return time12;
    }

    function formatDate(dateInput) {
        try {
            if (!dateInput) {
                console.warn('Invalid date input:', dateInput);
                return 'Invalid Date';
            }
    
            let date;
            if (dateInput instanceof Date) {
                date = dateInput;
            } else if (typeof dateInput === 'string') {
                const dateParts = dateInput.split('-');
                date = new Date(`${dateParts[0]}-${dateParts[1]}-${dateParts[2]}T00:00:00`);
            } else {
                console.error('Unsupported date format:', dateInput);
                return 'Invalid Date';
            }
    
            // console.log('Original date input:', dateInput);
            // console.log('Date object created:', date);
    
            if (isNaN(date.getTime())) {
                console.error('Invalid date:', dateInput);
                return 'Invalid Date';
            }
    
            const formattedDate = date.toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            // console.log('Formatted date:', formattedDate);
    
            return formattedDate;
        } catch (error) {
            console.error('Error converting date:', error);
            return 'Invalid Date';
        }
    }    

    useEffect(() => {
        async function fetchSavedBaskets() {
            if (vendorId && marketDay?.market_id) {
                try {
                    console.log('Fetching saved baskets...');
                    const response = await fetch(
                        `http://127.0.0.1:5555/api/baskets?vendor_id=${vendorId}&market_day_id=${marketDay.market_id}`
                    );
                    if (response.ok) {
                        const data = await response.json();
                        console.log('Fetched data:', data);
                        const filteredBaskets = data.filter(basket => basket.market_day_id === marketDay.market_id && basket.vendor_id === vendorId);
                        console.log('Filtered baskets:', filteredBaskets);
            
                        setSavedBaskets(filteredBaskets);
                        setIsSaved(filteredBaskets.length > 0);
                    } else {
                        console.error('Failed to fetch baskets:', response.statusText);
                    }
                } catch (error) {
                    console.error('Error fetching saved baskets:', error);
                }
            }
        }
    
        fetchSavedBaskets();
    }, [vendorId, marketDay]);
    
    useEffect(() => {
        if (savedBaskets.length > 0) {
            // Set the number of baskets
            setNumBaskets(savedBaskets.length);
    
            // Set the basket value and price from the first basket (as they are the same for all)
            const firstBasket = savedBaskets[0];
            setBasketValue(firstBasket.basket_value);
            setPrice(firstBasket.price);
    
            // Set pickup times if they're consistent across all saved baskets
            if (firstBasket.pickup_start) {
                const start = timeConverter(firstBasket.pickup_start);
                setStartTime(start);
            }
            if (firstBasket.pickup_end) {
                const end = timeConverter(firstBasket.pickup_end);
                setEndTime(end);
            }
        } else {
            // Reset values if there are no saved baskets
            setNumBaskets('');
            setBasketValue('');
            setPrice('');
            setStartTime('');
            setEndTime('');
        }
    }, [savedBaskets]);    

    useEffect(() => {
        console.log('Updated savedBaskets:', savedBaskets);
        setIsSaved(savedBaskets.length > 0);
    }, [savedBaskets]);

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

    useEffect(() => {
        console.log('marketDay object:', marketDay);
        if (marketDay) {
            setMarketId(marketDay.market_id);
            console.log('Market Day ID:', marketDay.id);
        }
    }, [marketDay]);

    const handleSave = async () => {
        const parsedNumBaskets = parseInt(numBaskets, 10);
        const parsedPrice = parseFloat(price);

        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        const formattedStartHour =
            startAmPm === 'PM' && startHour !== 12
                ? startHour + 12
                : amPm === 'AM' && startHour === 12
                ? 0
                : startHour;

        const formattedEndHour =
            endAmPm === 'PM' && endHour !== 12
                ? endHour + 12
                : amPm === 'AM' && endHour === 12
                ? 0
                : endHour;
        
        const localDate = new Date(marketDay.date);
        const localDateString = localDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short', 
            day: 'numeric'
        });

        const saleDate = new Date(localDateString);
        const formattedSaleDate = saleDate.toISOString().split('T')[0];

        const startTimeDate = new Date();
        startTimeDate.setHours(formattedStartHour, startMinute, 0, 0);

        const endTimeDate = new Date();
        endTimeDate.setHours(formattedEndHour, endMinute, 0, 0);

        // console.log('Formatted start time:', startTimeDate);
        // console.log('Formatted end time:', endTimeDate);

        const formattedPickupStart = `${startTimeDate.getHours().toString().padStart(2, '0')}:${startTimeDate.getMinutes().toString().padStart(2, '0')} ${startAmPm}`;
        const formattedPickupEnd = `${endTimeDate.getHours().toString().padStart(2, '0')}:${endTimeDate.getMinutes().toString().padStart(2, '0')} ${endAmPm}`;

        // console.log('Formatted pickup start:', formattedPickupStart);
        // console.log('Formatted pickup end:', formattedPickupEnd);

        console.log('Market Day ID to be posted:', marketDay.market_day_id);

        if (parsedNumBaskets > 0 && vendorId && marketDay && marketDay.id && !isNaN(parsedPrice) && parsedPrice > 0) {
            const promises = [];
            console.log('Posting to API with market_day_id:', marketDay.id); // Ensure you're using `marketDay.id` here
    
            for (let i = 0; i < parsedNumBaskets; i++) {
                promises.push(fetch('http://127.0.0.1:5555/api/baskets', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        vendor_id: vendorId,
                        market_day_id: marketDay.id, // Use the correct market_day_id here
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
    
            try {
                const responses = await Promise.all(promises);
                for (const response of responses) {
                    if (!response.ok) {
                        throw new Error(`Error creating basket: ${response.statusText}`);
                    }
                    await response.json();
                }
                setIsEditing(false);
                setIsSaved(true);
                setErrorMessage('');
            } catch (error) {
                console.error('Error creating baskets:', error);
                setErrorMessage('Failed to create baskets. Please try again.');
            }
        } else {
            console.error('Invalid data or missing vendor/market ID');
            setErrorMessage('Please enter valid data for all fields.');
        }
    };

    const handleDelete = async () => {
        if (vendorId && marketDay?.id) {
            console.log('vendorId:', vendorId);
            console.log('marketDay:', marketDay);
            console.log('marketDay.id:', marketDay.id);
    
            try {
                const response = await fetch(
                    `http://127.0.0.1:5555/api/baskets?vendor_id=${vendorId}&market_day_id=${marketDay.id}`,
                    {
                        method: 'DELETE',
                    }
                );
    
                if (response.ok) {
                    console.log('Baskets deleted successfully');
                    setSavedBaskets([]);
                    setIsSaved(false);
                } else {
                    console.error('Failed to delete baskets:', response.statusText);
                    setErrorMessage('Failed to delete baskets. Please try again.');
                }
            } catch (error) {
                console.error('Error deleting baskets:', error);
                setErrorMessage('An error occurred while deleting baskets.');
            }
        } else {
            console.error('Missing vendorId or marketDay.id');
            setErrorMessage('Missing vendor ID or market day ID.');
        }
    };

    return (
        <div className="basket-card">
            {marketDay && marketDay.date ? (
                <>
                    <div className='text-center'>
                    <div className='text-center'>
                    <h4>{marketName ? marketName : 'Loading Market...'}</h4>
                    <h4 className='margin-t-8'>
                            {formatDate(marketDay.date)}
                        </h4>
                    </div>
                    </div>
                </>
            ) : (
                <h3>Loading...</h3>
            )}
            <br />
            <br />
            {isSaved ? (
                <>
                    <table className='table-basket'>
                        <tbody>
                            <tr>
                                <td>Baskets Saved:</td>
                                <td className='text-center'>{numBaskets}</td>
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
                        </tbody>
                    </table>
                    <div className='text-center'>
                        <button onClick={handleDelete} className="btn-basket-save">
                            Delete All Baskets
                        </button>
                    </div>
                </>
            ) : isEditing ? (
                <>
                    <div className='form-baskets'>
                        <label className='margin-t-16 margin-b-8'>Baskets Available:</label>
                        <input
                            type="text"
                            name="basket_input"
                            placeholder="5"
                            size="4"
                            onChange={(e) => setNumBaskets(e.target.value)}
                            value={numBaskets}
                        />
                    </div>
                    <div className='form-baskets'>
                        <label className='margin-t-16 margin-b-8'>Basket Value:</label>
                        <input 
                            type="text"
                            name="price"
                            placeholder="$15.00"
                            size="4"
                            onChange={(e) => setBasketValue(e.target.value)}
                            value={basketValue}
                        />
                    </div>
                    <div className='form-baskets'>
                        <label className='margin-t-16 margin-b-8'>Basket Price:</label>
                        <input 
                            type="text"
                            step="0.01"
                            name="price"
                            size="4"
                            placeholder="$5.00"
                            onChange={(e) => setPrice(e.target.value)}
                            value={price}
                        />
                    </div>
                    <br></br>
                    <div className='form-baskets-small'>
                        <label className='margin-t-16 margin-b-8'>Pick Up Start:</label>
                        <div className='flex-start'>
                            <input
                                // mask="99:99"
                                placeholder="HH:MM"
                                size="4"
                                name="pickup_start"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                // maskChar={null}
                                />
                            <select
                                name="amPm"
                                value={startAmPm}
                                className='am-pm'
                                onChange={(e) => setStartAmPm(e.target.value)}
                            >
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                            </select>
                        </div>
                    </div>
                    <div className='form-baskets-small'>
                        <label className='margin-t-16 margin-b-8'>Pick Up End:</label>
                        <div className='flex-start'>
                            <input
                                // mask="99:99"
                                placeholder="HH:MM"
                                size="4"
                                name="pickup_end"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                // maskChar={null}
                                />
                            <select
                                name="amPm"
                                value={endAmPm}
                                className='am-pm'
                                onChange={(e) => setEndAmPm(e.target.value)}
                            >
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                            </select>
                        </div>
                    </div>
                    {/* If baskets are saved - and the page is refreshed, the saved baskets should still show as saved...  */}
                   <div className='text-center'>
                        <button
                            onClick={handleSave}
                            className={`btn-basket-save ${isSaved ? 'saved' : ''}`}
                            >
                            {isSaved ? 'Saved' : 'Save'}
                        </button>
                   </div>
                </>
            ) : null}
        </div>
    );
}

export default VendorBasketCard;
