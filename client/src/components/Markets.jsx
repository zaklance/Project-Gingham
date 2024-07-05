import React from 'react';
import { useState, useEffect } from 'react';
import MarketCard from './MarketCard';
import '../assets/css/index.css';

function Markets() {
    const [ market, setMarket] = useState([]);
    
    useEffect(() => {
        fetch("http://localhost:3000/markets")
        .then(response => response.json())
        .then(data => setMarket(data))
    }, []);

    return (
        <div className="markets-container">
            <br/>
            <header>FIND A FARMERS MARKET TODAY</header>
            <h4>Click on the image to learn more</h4>
            <br/>
            <div className="market-cards-container">
                {market.map((marketData) => (
                    <MarketCard key={marketData.id} marketData={marketData} />
                ))}
            </div>
        </div>
    )
}

export default Markets;