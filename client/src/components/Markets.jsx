import React, { useState, useEffect } from 'react';
import MarketCard from './MarketCard';
// import AdvancedMarkerCard from './AdvancedMarkerCard';
import '../assets/css/index.css';
import { APIProvider, Map, Marker, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
// import { Map, Marker } from 'mapkit-react';

function Markets() {
    const [markets, setMarkets] = useState([]);
    
    useEffect(() => {
        fetch("http://127.0.0.1:5555/markets")
            .then(response => response.json())
            .then(markets => setMarkets(markets))
            .catch(error => console.error('Error fetching markets', error));
    }, []);

    const unionSquare = { lat:40.736358642578125, lng: -73.99076080322266 }

    // console.log(import.meta.env.VITE_GOOGLE_MAP_ID)

    async function initMap() {

        const { Map } = await google.maps.importLibrary("maps");
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
        const center = unionSquare;
        const map = new Map(document.getElementById("map"), {
            zoom: 13,
            center,
            mapId: "4504f8b37365c3d0",
        });

        for (const market of markets) {
            const AdvancedMarkerElement = new google.maps.marker.AdvancedMarkerElement({
                map,
                content: buildContent(market),
                position: { 'lat': parseFloat(market.coordinates.lat), 'lng': parseFloat(market.coordinates.lng) },
                title: market.name,
            });

            AdvancedMarkerElement.addListener("click", () => {
                toggleHighlight(AdvancedMarker, market);
                console.log("toggle")
            });
        }
    }

    function toggleHighlight(markerView, market) {
        if (markerView.content.classList.contains("highlight")) {
            markerView.content.classList.remove("highlight");
            markerView.zIndex = null;
        } else {
            markerView.content.classList.add("highlight");
            markerView.zIndex = 1;
        }
    }

    function buildContent(property) {
        const content = document.createElement("div");

        content.classList.add("market");
        content.innerHTML = `
            <div class="marker-details">
                <div class="price">${property.name}</div>
                <div class="address">${property.location}</div>
                <div class="hours">${property.hours}</div>
            </div>
            `;
        return content;
    }

    initMap();

    return (
        <>
        <div className="markets-container">
            <div id='map'>
                <APIProvider apiKey={import.meta.env.VITE_GOOGLE_KEY} onLoad={() => console.log('Maps API has loaded.')}>
                        <Map defaultCenter={unionSquare} defaultZoom={13} mapId={import.meta.env.VITE_GOOGLE_MAP_ID}>
                            {/* {markets.map((marketData) => (
                                <AdvancedMarkerCard key={marketData.id} marketData={marketData} />
                            ))}  */}
                    </Map>
                </APIProvider>
                {/* <gmp-map defaultCenter={unionSquare} zoom={13} map-id="DEMO_MAP_ID">
                        <gmp-advanced-marker position={unionSquare} title="Union Square"></gmp-advanced-marker>
                </gmp-map> */}
            </div>
            <br />
            <div className="market-cards-container">
                {markets.map((marketData) => (
                    <MarketCard key={marketData.id} marketData={marketData} />
                ))}
            </div>
        </div>
        </>
    );
}

export default Markets;