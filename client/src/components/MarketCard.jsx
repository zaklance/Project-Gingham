import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/css/index.css';

function MarketCard({ marketData }) {
    const navigate = useNavigate();

    const handleLearnMore = () => {
        navigate(`/markets/${marketData.id}`);
    };

    return (
        <div className="market-card">
            <h3>{marketData.name}</h3>
            <p><strong>Location:</strong> {marketData.location}</p>
            <p><strong>Hours:</strong> {marketData.hours}</p>
            <p><strong>Open Year Round:</strong> {marketData.year_round ? "Yes" : "No"}</p>
            <p><strong>Zipcode:</strong> {marketData.zipcode}</p>
            <button className="market-card-button" onClick={handleLearnMore}>Learn More!</button>
        </div>
    );
}

export default MarketCard; 