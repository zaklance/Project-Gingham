import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const MarketDetail = () => {
    const { id } = useParams();
    const [market, setMarket] = useState(null);

    useEffect(() => {
        fetch(`http://localhost:3000/markets/${id}`)
            .then(response => response.json())
            .then(data => setMarket(data))
            .catch(error => console.error('Error fetching market data:', error));
    }, [id]);

    if (!market) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h2>{market.name}</h2>
            <img src={market.image} alt="Market Image" style={{width: '100%'}} />
            <p>{market.description}</p>
            <h4>Location: {market.location}</h4>
            <h4>Hours: {market.hours}</h4>
        </div>
    );
};

export default MarketDetail;