import React, { useState } from 'react';
import InputMask from 'react-input-mask';
import '../../assets/css/index.css';

function BasketCard({ vendorId = 2, initialMarketId }) {
    const [startTime, setStartTime] = useState('');
    const [amPm, setAmPm] = useState('PM');
    const [isSaved, setIsSaved] = useState(false);
    const [numBaskets, setNumBaskets] = useState('');
    const [selectedDuration, setSelectedDuration] = useState('0.5');
    const [price, setPrice] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const saleDate = tomorrow.toISOString().substring(0, 10);
    const [marketId, setMarketId] = useState(initialMarketId || 4);

    const handleSave = async () => {
        const parsedNumBaskets = parseInt(numBaskets, 10);
        const parsedPrice = parseFloat(price);
        
        console.log('Saving baskets with the following values:');
        console.log('Vendor ID:', vendorId);
        console.log('Market ID:', marketId);
        console.log('Sale Date:', saleDate);
        console.log('Pickup Time:', `${startTime} ${amPm}`);
        console.log('Price:', parsedPrice);
        console.log('Number of Baskets:', parsedNumBaskets);
        
        if (parsedNumBaskets > 0 && vendorId && marketId && !isNaN(parsedPrice) && parsedPrice > 0) {
            const promises = [];


            for (let i = 0; i < parsedNumBaskets; i++) {
                promises.push(fetch('http://127.0.0.1:5555/baskets', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        vendor_id: vendorId,
                        market_id: marketId,
                        sale_date: saleDate,
                        pickup_time: `${startTime} ${amPm}`,
                        is_sold: false,
                        is_grabbed: false,
                        price: parsedPrice,
                        pick_up_duration: selectedDuration,
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
                setErrorMessage(''); // Clear any previous error messages
            } catch (error) {
                console.error('Error creating baskets:', error);
                setErrorMessage('Failed to create baskets. Please try again.'); // Set user-friendly error message
            }
        } else {
            console.error('Invalid data or missing vendor/market ID');
            setErrorMessage('Please enter valid data for all fields.'); // Set user-friendly error message
        }
    };

    const handleEdit = () => {
        setIsSaved(false);
    };

    return (
        <div className="market-card">
            <h3><strong>Union Square Market</strong></h3>
            <h4>{saleDate}, Wednesday</h4>
            <br />
            <p>Available Baskets:</p>
            <br />
            <input
                type="number"
                name="basket_input"
                className="basket-input"
                onChange={(e) => setNumBaskets(e.target.value)}
                value={numBaskets}
            />
            <br />
            <br />
            <p>Enter Price:</p>
            <input 
                type="number"
                step="0.01"
                name="price"
                placeholder="$4.99"
                className="pickup-time-input"
                onChange={(e) => setPrice(e.target.value)}
                value={price}
            />
            <br />
            <br />
            <p>Pick Up Time Start:</p>
            <div className="time-picker">
                <InputMask
                    mask="99:99"
                    placeholder="HH:MM"
                    name="pickup_start"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="pickup-time-input"
                    maskChar={null}
                />
                <select
                    name="amPm"
                    value={amPm}
                    onChange={(e) => setAmPm(e.target.value)}
                    className="amPm-dropdown"
                >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                </select>
            </div>
            <br />
            <p>Select Duration Window:</p>
            <select
                name="duration"
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
            >
                <option value="0.5">30 mins</option>
                <option value="1">1 hour</option>
                <option value="1.5">1.5 hours</option>
                <option value="2">2 hours</option>
            </select>
            <br/>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            <button
                onClick={handleSave}
                className={`basket-save-button ${isSaved ? 'saved' : ''}`}
            >
                {isSaved ? 'Saved' : 'Save'}
            </button>
            {isSaved && (
                <p>
                    <a href="#edit" onClick={handleEdit} className="edit-link">Edit</a>
                </p>
            )}
        </div>
    );
}

export default BasketCard;
