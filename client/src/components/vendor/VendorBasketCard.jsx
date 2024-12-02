import React, { useState, useEffect } from 'react';
import '../../assets/css/index.css';

function VendorBasketCard({ vendorId, months, weekDay, marketDay }) {
    const [marketId, setMarketId] = useState(4);
    const [startTime, setStartTime] = useState('');
    const [amPm, setAmPm] = useState('PM');
    const [isSaved, setIsSaved] = useState(false);
    const [isEditing, setIsEditing] = useState(true); 
    const [numBaskets, setNumBaskets] = useState('');
    const [selectedDuration, setSelectedDuration] = useState('0.5');
    const [price, setPrice] = useState('');
    const [basketValue, setBasketValue] = useState('')
    const [errorMessage, setErrorMessage] = useState('');
    const [savedBaskets, setSavedBaskets] = useState([]);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const saleDate = tomorrow.toISOString().substring(0, 10);

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
        async function fetchSavedBaskets() {
            if (vendorId && marketDay?.market_id) {
                try {
                    const response = await fetch(
                        `http://127.0.0.1:5555/api/baskets?vendor_id=${vendorId}&market_day_id=${marketDay.market_id}`
                    );
                    if (response.ok) {
                        const data = await response.json();
                        setSavedBaskets(data.filter(basket => basket.market_day_id === marketDay.market_id && basket.vendor_id === vendorId));
                        setIsSaved(savedBaskets.length > 0);
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

    const handleSave = async () => {
        const parsedNumBaskets = parseInt(numBaskets, 10);
        const parsedPrice = parseFloat(price);

        const durationInMinutes = parseFloat(selectedDuration) * 60;
        const hours = Math.floor(durationInMinutes / 60);
        const minutes = Math.round(durationInMinutes % 60);
        const formattedDuration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

        const [hour, minute] = startTime.split(':').map(Number);
        const formattedHour =
            amPm === 'PM' && hour !== 12
                ? hour + 12
                : amPm === 'AM' && hour === 12
                ? 0
                : hour;
        const formattedPickupTime = `${formattedHour}:${minute.toString().padStart(2, '0')} ${amPm}`;

        if (parsedNumBaskets > 0 && vendorId && marketId && !isNaN(parsedPrice) && parsedPrice > 0) {
            const promises = [];

            for (let i = 0; i < parsedNumBaskets; i++) {
                promises.push(fetch('http://127.0.0.1:5555/api/baskets', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        vendor_id: vendorId,
                        market_day_id: marketDay.market_id,
                        sale_date: saleDate,
                        pickup_time: formattedPickupTime,
                        is_sold: false,
                        is_grabbed: false,
                        price: parsedPrice,
                        basket_value: basketValue,
                        pickup_duration: formattedDuration,
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

    return (
        <div className="market-card">
            {marketDay && marketDay.date ? (
                <>
                    <h4>{marketDay ? marketDay.markets.name : ''}</h4>
                    <h4 className='margin-t-8'>
                        {marketDay.date
                            ? `${weekDay[marketDay.date.getDay()]}, ${convertToLocalDate(marketDay.date)}`
                            : ''}
                    </h4>
                </>
            ) : (
                <h3>Loading...</h3>
            )}
            <br />
            <br />
            {isSaved ? (
                <div className="">
                    <p><strong>Baskets Saved:</strong> {numBaskets}</p>
                    <p><strong>Estimated Value:</strong> ${basketValue}</p>
                    <p><strong>Price:</strong> ${price}</p>
                    <p><strong>Pick-Up Time:</strong> {startTime} {amPm}</p>
                    <p><strong>Duration:</strong> {selectedDuration} hours</p>
                </div>
            ) : isEditing ? (
                <>
                    <div className='form-baskets'>
                        <label className='margin-t-16 margin-b-8'>Baskets for Sale:</label>
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
                        <label className='margin-t-16 margin-b-8'>Enter est. Value:</label>
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
                        <label className='margin-t-16 margin-b-8'>Enter Price:</label>
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
                    <div className='form-baskets'>
                        <label className='margin-t-16 margin-b-8'>Pick Up:</label>
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
                                value={amPm}
                                className='am-pm'
                                onChange={(e) => setAmPm(e.target.value)}
                            >
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                            </select>
                        </div>
                    </div>
                    {/* <br></br> */}
                    <div className='form-baskets'>
                        <label className='margin-t-16 margin-b-8'>Duration:</label>
                        <select
                            name="duration"
                            value={selectedDuration}
                            onChange={(e) => setSelectedDuration(e.target.value)}
                        >
                            <option value="0.5">30 mins</option>
                            <option value="0.75">45 mins</option>
                            <option value="1">1 hour</option>
                            <option value="1.25">1.25 hours</option>
                            <option value="1.5">1.5 hours</option>
                            {/* <option value="1.75">1.75 hours</option>
                            <option value="2">2 hours</option>
                            <option value="3">3 hours</option>
                            <option value="4">4 hours</option> */}
                        </select>
                    </div>
                    {/* If baskets are saved - and the page is refreshed, the saved baskets should still show as saved...  */}
                    <button
                        onClick={handleSave}
                        className={`btn-basket-save ${isSaved ? 'saved' : ''}`}
                        >
                        {isSaved ? 'Saved' : 'Save'}
                    </button>
                </>
            ) : null}
        </div>
    );
}

export default VendorBasketCard;
