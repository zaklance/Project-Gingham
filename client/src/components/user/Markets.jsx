import React, { useState, useEffect } from 'react';
import MarketCard from './MarketCard';
// import AdvancedMarkerCard from './AdvancedMarkerCard';
import '../../assets/css/index.css';
import { APIProvider, Map, Marker, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
// import { Map, Marker } from 'mapkit-react';

function Markets() {
    const [markets, setMarkets] = useState([]);
    const [query, setQuery] = useState("");
    const [marketFavs, setMarketFavs] = useState([]);
    const [isClicked, setIsClicked] = useState(false);

    const userId = parseInt(globalThis.localStorage.getItem('user_id'));

    
    const onUpdateQuery = event => setQuery(event.target.value);
    const filteredMarkets = markets.filter(market =>
        market.name.toLowerCase().includes(query.toLowerCase()) &&
        market.name !== query &&
        (!isClicked || marketFavs.some(marketFavs => marketFavs.market_id === market.id)) // Filter by favVendors only when isClicked is true
    );
    const matchingMarket = markets.find(market => market.name.toLowerCase() === query.toLowerCase());
    const matchingMarketId = matchingMarket ? matchingMarket.id : null;
    
    console.log(filteredMarkets)
    
    function timeConverter(time24) {
        const date = new Date('1970-01-01T' + time24);

        const time12 = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
        return time12
    }
    
    useEffect(() => {
        fetch("http://127.0.0.1:5555/api/markets")
            .then(response => response.json())
            .then(markets => setMarkets(markets))
            .catch(error => console.error('Error fetching markets', error));
    }, []);


    const unionSquare = { lat:40.736358642578125, lng: -73.99076080322266 }

    async function initMap() {

        const { Map } = await google.maps.importLibrary("maps");
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
        const center = unionSquare;
        const map = new Map(document.getElementById("map"), {
            zoom: 13,
            center,
            mapId: "4504f8b37365c3d0",
        });

        const uniqueNames = new Set();

        for (const market of markets) {
            if (!uniqueNames.has(market.name)) {
                uniqueNames.add(market.name);

                const content = buildContent(market); // Generate the content
                const marker = new AdvancedMarkerElement({
                    map,
                    content,
                    position: { lat: parseFloat(market.coordinates.lat), lng: parseFloat(market.coordinates.lng) },
                    title: market.name,
                });

                marker.addListener("click", () => {
                    toggleHighlight(marker, market); // Pass the marker instance directly
                    console.log("toggle");
                });
            }
        }
    }

    function toggleHighlight(markerView, market) {
        if (markerView.content.classList.contains("highlight")) {
            markerView.content.classList.remove("highlight");
            // markerView.content.classList.add("map-invisible");
            markerView.zIndex = null;
            // <h1 class="map-marker">•</h1>
            markerView.content.innerHTML = `
                <div class="map-circle"></div>
                <div class="map-inside-circle"></div>
                <div class="map-triangle"></div>
            `;
        } else {
            markerView.content.classList.add("highlight");
            // markerView.content.classList.remove("map-invisible");
            markerView.zIndex = 1;
            markerView.content.innerHTML = `
                <div class="marker-details">
                    <div class="marker-name">${market.name}</div>
                    <div class="marker-day">${market.schedule}</div>
                </div>
            `;
        }
        // console.log(markerView.content)
    }

    function buildContent(property) {
        const content = document.createElement("div");

        // <h1 class="map-marker">•</h1>
        content.classList.add("market");
        content.innerHTML = `
            <div class="map-circle"></div>
            <div class="map-inside-circle"></div>
            <div class="map-triangle"</div>
        `;
        return content;
    }

    useEffect(() => {
        if (markets.length > 0) {
            initMap();
        }
    }, [markets]);

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/api/market-favorites?user_id=${userId}`)
            .then(response => response.json())
            .then(data => { setMarketFavs(data) })
            .catch(error => console.error('Error fetching market favorites', error));
    }, []);

    const handleClick = (event) => {
        setIsClicked((isClick) => !isClick);
    }

    return (
        <>
        <div className="markets-container">
            <div className='header'>
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
                <table className='table-search margin-t-24'>
                    <tbody>
                        <tr>
                            <td className='cell-title'>Search:</td>
                            <td className='cell-text'>
                                <input id='search' className="search-bar" type="text" placeholder="Search vendors..." value={query} onChange={onUpdateQuery} />
                                <div className="dropdown-content">
                                    {
                                        query &&
                                            filteredMarkets.slice(0, 10).map(item => <div className="search-results" key={item.id} onClick={(e) => setQuery(item.name)}>
                                                {item.name}
                                        </div>)
                                    }
                                </div>
                            </td>
                            <td className='cell-text cell-filter'>Filters: </td>
                            <td>
                                <button
                                    className={`btn-fav-filter ${isClicked ? 'btn-fav-filter-on' : ''}`}
                                    onClick={handleClick}>&#9829;
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="market-cards-container box-scroll-large margin-t-24">
                {filteredMarkets.map((marketData) => (
                    <MarketCard key={marketData.id} marketData={marketData} />
                ))}
            </div>
        </div>
        </>
    );
}

export default Markets;