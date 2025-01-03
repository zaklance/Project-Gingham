import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import { weekDay } from '../../utils/common';
import MarketCard from './MarketCard';
import '../../assets/css/index.css';
import { APIProvider, Map, Marker, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { getRadius, zipCodeData, zipCodeDistance } from 'zipcode-city-distance';
// import { Map, Marker } from 'mapkit-react';


function Markets() {
    const [user, setUser] = useState({});
    const [markets, setMarkets] = useState([]);
    const [marketDays, setMarketDays] = useState([]);
    const [query, setQuery] = useState("");
    const [marketFavs, setMarketFavs] = useState([]);
    const [isClicked, setIsClicked] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filterAZ, setFilterAZ] = useState(false);
    const [filterZA, setFilterZA] = useState(false);
    const [filterZipcode, setFilterZipcode] = useState(false);
    const [filterZipcodeNum, setFilterZipcodeNum] = useState();
    const [selectedDay, setSelectedDay] = useState('');
    const [isInSeason, setIsInSeason] = useState(false);

    const dropdownRef = useRef(null);
    const location = useLocation();
    
    const { handlePopup } = useOutletContext();
    const userId = parseInt(globalThis.localStorage.getItem('user_id'));
    
    const onUpdateQuery = (event) => {
        const value = event.target.value;
        setQuery(value);
        setShowDropdown(value.trim().length > 0); // Show dropdown if there's input
    };

    const filteredMarketsDropdown = markets.filter(market =>
        market?.name?.toLowerCase().includes(query.toLowerCase()) &&
        market.name !== query &&
        (!isClicked || marketFavs.some(marketFavs => marketFavs.market_id === market.id))
    );

    const filteredMarketsResults = markets.filter(market => {
        if (!market?.name) return false;

        const today = new Date();
        const seasonStart = new Date(market.season_start);
        const seasonEnd = new Date(market.season_end);
        const inSeason = market.year_round || (today >= seasonStart && today <= seasonEnd);

        const matchesSelectedDay = marketDays.some(marketDay =>
            marketDay.market_id === market.id &&
            marketDay.day_of_week === parseInt(selectedDay)
        );

        return (
            market.name.toLowerCase().includes(query.toLowerCase()) &&
            (!isClicked || marketFavs.some(fav => fav.market_id === market.id)) &&
            (!isInSeason || inSeason) &&
            (!selectedDay || matchesSelectedDay)
        );
    });

    const decodeJwt = (token) => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload;
        } catch (error) {
            console.error('Failed to decode JWT:', error);
            return null;
        }
    };

    useEffect(() => {
        if (userId) {

            const fetchProfileData = async () => {
                try {
                    const token = localStorage.getItem('user_jwt-token');
                    if (token) {
                        const decodedToken = decodeJwt(token);
                        if (decodedToken && decodedToken.role) {
                        }
                    }
                    const response = await fetch(`http://127.0.0.1:5555/api/users/${userId}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    const text = await response.text();
                    if (response.ok) {
                        try {
                            const data = JSON.parse(text);
                            setUser({ ...data });
                        } catch (jsonError) {
                            console.error('Error parsing JSON:', jsonError);
                        }
                    } else {
                        console.error('Error fetching profile:', response.status);
                        if (response.status === 401) {
                            console.error('Unauthorized: Token may be missing or invalid');
                        }
                    }
                } catch (error) {
                    console.error('Error fetching profile data:', error);
                }
            };
            fetchProfileData();
        }
        }, [userId]);

    useEffect(() => {
        if (location.state?.isClicked !== undefined) {
            setIsClicked(location.state.isClicked);
        }
        if (location.state?.resetFilters) {
            setIsClicked(false);
        }
        fetch("http://127.0.0.1:5555/api/markets?is_visible=true")
            .then(response => response.json())
            .then(markets => {
                if (userId & markets.length > 0) {
                    const sortedMarkets = markets
                        .map(market => {
                            let distance = zipCodeDistance(
                                user.zipcode,
                                market.zipcode,
                                'M'
                            );
                            if (distance === null || isNaN(distance)) {
                                distance = Infinity;
                            }
                            return { ...market, distance };
                        })
                        .sort((a, b) => a.distance - b.distance);
                    setMarkets(sortedMarkets);
                } else {
                    setMarkets(markets)
                }
            })
            .catch(error => console.error('Error fetching markets', error));
    }, [location.state, user]);

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/api/market-days`)
            .then(response => response.json())
            .then(data => {
                setMarketDays(data);
            })
            .catch(error => console.error('Error fetching market data:', error));
    }, []);

    const unionSquare = { lat:40.736358642578125, lng: -73.99076080322266 }

    async function initMap() {

        const { Map } = await google.maps.importLibrary("maps");
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
        const center = unionSquare;
        const map = new Map(document.getElementById("map"), {
            zoom: 13,
            center,
            mapId: import.meta.env.VITE_GOOGLE_MAP_ID,
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
        if (userId && !isNaN(userId)) {
            fetch(`http://127.0.0.1:5555/api/market-favorites?user_id=${userId}`)
                .then(response => response.json())
                .then(data => { setMarketFavs(data) })
                .catch(error => console.error('Error fetching market favorites', error));
        }
    }, [userId]);

    const handleClick = (event) => {
        if (globalThis.localStorage.getItem('user_id') !== null) {
            setIsClicked((isClick) => !isClick);
        } else {
            handlePopup()
        }
    }

    // Close dropdown if clicked outside
    const handleClickOutsideDropdown = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setShowDropdown(false);
        }
    };

    const handleDropDownFilters = (event) => {
        setShowFilters(!showFilters)
    }

    const handleDayChange = (event) => {
        setSelectedDay(event.target.value);
    };

    const handleInSeasonChange = (event) => {
        setIsInSeason(!isInSeason)
    }

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutsideDropdown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutsideDropdown);
        };
    }, [showDropdown]);

    const closePopup = () => {
        if (showFilters) {
            setShowFilters(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Enter' && showDropdown) {
                setShowDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutsideDropdown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleClickOutsideDropdown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [showDropdown]);

    const handleFilterAZ = (event) => {
        if (!filterAZ) {
            setFilterAZ(!filterAZ)
            setFilterZA(false)
            setFilterZipcode(false)
            setFilterZipcodeNum()
        }
    }

    const handleFilterZA = (event) => {
        if (!filterZA) {
            setFilterAZ(false)
            setFilterZA(!filterZA)
            setFilterZipcode(false)
            setFilterZipcodeNum()
        }
    }

    const handleFilterZipcode = (event) => {
        if (!filterZipcode) {
            setFilterAZ(false)
            setFilterZA(false)
            setFilterZipcode(!filterZipcode)
        }
    }

    const handleFilterZipcodeNum = (event) => {
        setFilterZipcodeNum(event.target.value)
    }

    const sortedMarketsResults = useMemo(() => {
        let results = [...filteredMarketsResults]; // Create a shallow copy

        if (filterAZ) {
            results.sort((a, b) => a.name.localeCompare(b.name));
        }
        else if (filterZA) {
            results.sort((a, b) => b.name.localeCompare(a.name));
        }
        else if (filterZipcode && filterZipcodeNum) {
            results = results
                .map(market => {
                    let distance = zipCodeDistance(
                        filterZipcodeNum,
                        market.zipcode,
                        'M'
                    );
                    if (distance === null || isNaN(distance)) {
                        distance = Infinity;
                    }
                    return { ...market, distance };
                })
                .sort((a, b) => a.distance - b.distance);
        }

        return results;
    }, [filteredMarketsResults, filterAZ, filterZA, filterZipcode, filterZipcodeNum]);


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
                            {/* <td className='cell-title btn-grey m-hidden'>Search:</td> */}
                            <td className='cell-text'>
                                <input
                                    id='search'
                                    className="search-bar" 
                                    type="text" 
                                    placeholder="Search markets..." 
                                    value={query || ""} 
                                    onChange={onUpdateQuery} />
                                {showDropdown && (
                                    <div className="dropdown-content" ref={dropdownRef}>
                                        {filteredMarketsDropdown.slice(0, 10).map(item => (
                                            <div
                                                className="search-results"
                                                key={item.id}
                                                onClick={() => {
                                                    setQuery(item.name);
                                                    setShowDropdown(false);
                                                }}
                                            >
                                                {item.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </td>
                            {/* <td className='cell-text cell-filter m-hidden'>Filters: </td> */}
                            <td>
                                <button
                                    className={`btn-fav-filter ${isClicked ? 'btn-fav-filter-on' : ''}`}
                                    title="show favorites"
                                    onClick={handleClick}>&#9829;
                                </button>
                            </td>
                            <td>
                                <button className='btn btn-filter' onClick={handleDropDownFilters}>&#9776;</button>
                                {showFilters && (
                                    <div className='dropdown-content box-filters'>
                                        <div className='form-filters-markets'>
                                            <input
                                                className='margin-r-8'
                                                id="aZ"
                                                type="radio"
                                                name="filters"
                                                value={true}
                                                onChange={handleFilterAZ}
                                            />
                                            <label htmlFor='aZ'>A to Z</label>
                                        </div>
                                        <div className='form-filters-markets'>
                                            <input
                                                className='margin-r-8'
                                                id="zA"
                                                type="radio"
                                                name="filters"
                                                value={true}
                                                onChange={handleFilterZA}
                                            />
                                            <label htmlFor='zA'>Z to A</label>
                                        </div>
                                        <div className='form-filters-markets'>
                                            <input
                                                className='margin-r-8'
                                                id="zipcode"
                                                type="radio"
                                                name="filters"
                                                value={true}
                                                onChange={handleFilterZipcode}
                                            />
                                            <label htmlFor='zipcode'>By Zipcode</label>
                                            <input
                                                className='margin-r-8'
                                                id="zipcodeNum"
                                                type="text"
                                                name="zipcode"
                                                placeholder='10003'
                                                value={filterZipcodeNum}
                                                onChange={(event) => handleFilterZipcodeNum(event)}
                                            />
                                        </div>
                                        <div className='form-filters'>
                                            <label className='margin-r-26'>In Season:</label>
                                            <input
                                                type="checkbox"
                                                name="in_season"
                                                value={true}
                                                onChange={handleInSeasonChange}
                                            />
                                        </div>
                                        <select className='select-dropdown' value={selectedDay} onChange={handleDayChange}>
                                            <option value="">Days Open</option>
                                            {Array.isArray(weekDay) && weekDay.map((product, index) => (
                                                <option key={index} value={index}>
                                                    {product}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {showFilters && (
                                    <div className="popup-overlay-clear" onClick={closePopup}></div>
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="market-cards-container box-scroll-large margin-t-24">
                {sortedMarketsResults
                    .map((marketData) => (
                        <MarketCard key={marketData.id} marketData={marketData} userZipcode={user.zipcode} />
                ))}
            </div>
        </div>
        </>
    );
}

export default Markets;