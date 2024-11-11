import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/css/index.css';

function MarketCard({ marketData }) {
    const navigate = useNavigate();

    const weekday = ["Mon", "Tues", "Wed", "Thur", "Fri", "Sat", "Sun"]

    function timeConverter(time24) {
        const date = new Date('1970-01-01T' + time24);

        const time12 = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
        return time12
    }

    const handleLearnMore = () => {
        navigate(`/user/markets/${marketData.id}`);
    };

    return (
        <div className="market-card">
            <img src={`/market-images/${marketData.image}`} alt="Market Image" style={{ width: '260px' }} />
            <h3>{marketData.name}</h3>
            <p><strong>Location:</strong> {marketData.location}</p>
            <p><strong>Schedule:</strong> {marketData.schedule}</p>
            <p><strong>Open Year Round:</strong> {marketData.year_round ? "Yes" : "No"}</p>
            <p><strong>Zipcode:</strong> {marketData.zipcode}</p>
            <button className="market-card-button" onClick={handleLearnMore}>Learn More!</button>
        </div>
    );
}

export default MarketCard; 