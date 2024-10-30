import React, { useState } from 'react';
import InputMask from 'react-input-mask';
import '../../assets/css/index.css';

function BasketCard() {
    const [startTime, setStartTime] = useState('');
    const [amPm, setAmPm] = useState('PM');
    const [isSaved, setIsSaved] = useState(false);
    const [numBaskets, setNumBaskets] = useState('');
    const [selectedDuration, setSelectedDuration] = useState('0.5');
    const [saleDate, setSaleDate] = useState('');
    const [price, setPrice] = useState('');

    const handleSave = () => {
        const parsedNumBaskets = parseInt(numBaskets, 10);
        const parsedPrice = parseFloat(price);

        if (parsedNumBaskets > 0 && vendorId && marketId && !isNaN(parsedPrice)) {
            for (let i = 0; i < parsedNumBaskets; i++) {
                fetch('http://127.0.0.1:5555/baskets', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        vendor_id: vendorId, 
                        market_id: marketId,
                        sale_date: saleDate,
                        pickup_time: startTime + " " + amPm,
                        is_sold: false, 
                        is_grabbed: false, 
                        price: parsedPrice,
                        pick_up_duration: selectedDuration,
                    }),
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Basket created:', data);
                    setIsSaved(true);
                })
                .catch(error => console.error('Error creating basket:', error));
            }
        } else {
            console.error('Invalid data or missing vendor/market ID');
        }
    };

    const handleEdit = () => {
        setIsSaved(false);
    };

    return (
        <div className="market-card">
            <h3><strong>Union Square Market</strong></h3>
            <h4>April 9, Wednesday</h4>
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
