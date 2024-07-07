import React, { useState, useEffect } from 'react';
import MarketCard from './MarketCard';
import { Map, Marker } from 'mapkit-react';
import '../assets/css/index.css';

function Markets() {
    const [markets, setMarkets] = useState([]);

    useEffect(() => {
        fetch("http://127.0.0.1:5555/markets")
            .then(response => response.json())
            .then(markets => setMarkets(markets))
            .catch(error => console.error('Error fetching markets', error));
    }, []);

    return (
        <div className="markets-container">
            <br />
            <header>FIND A FARMERS MARKET TODAY</header>
            <br/>
            {/* <div id='map'>
                <h2>Please Work</h2>
                <Map token={process.env.REACT_APP_MAP_KEY}>
                    {markets.map((market) => (
                        <Marker 
                            key={market.id} 
                            latitude={market.latitude} 
                            longitude={market.longitude} 
                            title={market.name} 
                        />
                    ))}
                </Map>
            </div>
            <script src="https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.core.js"
                crossOrigin='async'
                data-callback="initMapKit"
                data-libraries="services,full-map,geojson">
            </script>
            <br /> */}
            <div className="market-cards-container">
                {markets.map((marketData) => (
                    <MarketCard key={marketData.id} marketData={marketData} />
                ))}
            </div>
        </div>
    );
}

export default Markets;