import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/css/index.css';

function MarketCard({ marketData }) {
    const navigate = useNavigate();

    const weekDay = ["Mon", "Tues", "Wed", "Thur", "Fri", "Sat", "Sun"]

    function timeConverter(time24) {
        const date = new Date('1970-01-01T' + time24);

        const time12 = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
        return time12
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = date.getDate();
        const year = date.getFullYear();;
        const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
        return `${month} ${day}`;
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
            
            {marketData.year_round === false ? (
                <p><strong>Season:</strong> {formatDate(marketData.season_start)} – {formatDate(marketData.season_end)}</p>  
            ) : (
                <p><strong>Open Year Round</strong></p>
            )}
            <button className="btn-market-card" onClick={handleLearnMore}>Learn More!</button>
        </div>
    );
}

export default MarketCard; 