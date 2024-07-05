import React from 'react';
import '../assets/css/index.css';

function MarketCard({ marketData }) {
    return (
        <div className="market-card">
            <img src={marketData.image} alt="Market Image" style={{width: '260px'}}/>
            <h2>{marketData.name}</h2>
            <h4>{marketData.location}</h4>
            <h4>{marketData.hours}</h4>
            <button className="market-card-button">Learn More!</button>
        </div>
    )
}

export default MarketCard;