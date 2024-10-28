import React, { useState } from 'react';
import InputMask from 'react-input-mask';
import '../../assets/css/index.css';

function BasketCard() {
    const [startTime, setStartTime] = useState('');
    const [amPm, setAmPm] = useState('PM');
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = () => {
        setIsSaved(true);
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
            />
            <br />
            {/* What about pricing? */}
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
