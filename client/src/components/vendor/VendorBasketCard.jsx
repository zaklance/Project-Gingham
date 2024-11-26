import React, { useState, useEffect } from 'react';
// import InputMask from 'react-input-mask';
import '../../assets/css/index.css';

function VendorBasketCard({ vendorId, months, weekDay, marketDay }) {
    const [marketId, setMarketId] = useState(4);
    const [startTime, setStartTime] = useState('');
    const [amPm, setAmPm] = useState('PM');
    const [isSaved, setIsSaved] = useState(false);
    const [numBaskets, setNumBaskets] = useState('');
    const [selectedDuration, setSelectedDuration] = useState('0.5');
    const [price, setPrice] = useState('');
    const [basketValue, setBasketValue] = useState('')
    const [errorMessage, setErrorMessage] = useState('');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const saleDate = tomorrow.toISOString().substring(0, 10);


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
    
        console.log('Saving baskets with the following values:');
        console.log('Vendor ID:', vendorId);
        console.log('Market ID:', marketDay.market_id);
        console.log('Sale Date:', saleDate);
        console.log('Pickup Time:', formattedPickupTime);
        console.log('Basket Value:', basketValue);
        console.log('Price:', parsedPrice);
        console.log('Number of Baskets:', parsedNumBaskets);
    
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
                    const data = await response.json();
                    console.log('Basket created:', data);
                }
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
    

    const handleEdit = () => {
        setIsSaved(false);
    };


    return (
        <div className="market-card">
            {marketDay && marketDay.date ? (
                <>
                    <h4>{marketDay ? marketDay.markets.name : ''}</h4>
                    <h4 className='margin-t-8'>{marketDay.date ? weekDay[marketDay.date.getDay()] : ''}, {marketDay.date ? months[marketDay.date.getMonth()] : ''} {marketDay.date ? marketDay.date.getDate() : ''}</h4>
                </>
            ) : (
                <h3>Loading...</h3>
            )}
            <br></br>
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
            <button
                onClick={handleSave}
                className={`btn-basket-save ${isSaved ? 'saved' : ''}`}
                >
                {isSaved ? 'Saved' : 'Save'}
            </button>
            {errorMessage && <p className="error-message margin-t-16">{errorMessage}</p>}
            {isSaved && (
                <p>
                    <a href="#edit" onClick={handleEdit} className="link-edit">Edit</a>
                </p>
            )}
        </div>
    );
}

export default VendorBasketCard;
