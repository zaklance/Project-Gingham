import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useOutletContext } from 'react-router-dom';
import { formatDate } from '../../utils/helpers';
import { weekDay } from '../../utils/common';
import { Annotation, ColorScheme, FeatureVisibility, Map, Marker } from 'mapkit-react';
import MarketCard from './MarketCard';

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
    const [filterLocation, setFilterLocation] = useState(false);
    const [filterAddress, setFilterAddress] = useState(false);
    const [filterRadio, setFilterRadio] = useState('az');
    const [address, setAddress] = useState("");
    const [selectedDay, setSelectedDay] = useState('');
    const [isInSeason, setIsInSeason] = useState(false);
    const [addressResults, setAddressResults] = useState();
    const [showAddressDropdown, setShowAddressDropdown] = useState(false);
    const [resultCoordinates, setResultCoordinates] = useState();
    const [userCoordinates, setUserCoordinates] = useState();
    const [markerViews, setMarkerViews] = useState({});
    const [marketCoordinates, setMarketCoordinates] = useState([]);

    const dropdownRef = useRef(null);
    const dropdownAddressRef = useRef(null);
    const debounceTimeout = useRef(null);
    const location = useLocation();
    const { handlePopup } = useOutletContext();
    
    const userId = parseInt(globalThis.localStorage.getItem('user_id'));
    const token = localStorage.getItem('user_jwt-token');
    
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

    const mapToken = import.meta.env.VITE_MAPKIT_TOKEN;

    const handleMarkerClickOn = (marketId) => {
        setMarkerViews((prev) => ({
            ...prev,
            [marketId]: true,
        }));
    };

    const handleMarkerClickOff = (marketId) => {
        setMarkerViews((prev) => ({
            ...prev,
            [marketId]: false,
        }));
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
        fetch("http://127.0.0.1:5555/api/markets")
            .then(response => response.json())
            .then(markets => {
                if (userId & markets.length > 0) {
                    const sortedMarkets = markets
                        .map(market => {
                            let distance = haversineDistance(
                                user.coordinates,
                                market.coordinates
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

    useEffect(() => {
        fetch("http://127.0.0.1:5555/api/markets") 
            .then((response) => response.json())
            .then((markets) => {
                const coordinates = markets
                    .filter((market) => market.coordinates)
                    .map((market) => ({
                        id: market.id,
                        name: market.name,
                        latitude: parseFloat(market.coordinates.lat),
                        longitude: parseFloat(market.coordinates.lng),
                        schedule: market.schedule,
                        season_start: market.season_start,
                        season_end: market.season_end,
                        year_round: market.year_round
                    }));
                setMarketCoordinates(coordinates);
            })
            .catch((error) => {
                console.error("Error fetching markets:", error);
            });
    }, []);

    useEffect(() => {
        if (userId && !isNaN(userId)) {
            fetch(`http://127.0.0.1:5555/api/market-favorites?user_id=${userId}`, {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            })
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

    const handleClickOutsideDropdown = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setShowDropdown(false);
        }
    };
    
    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutsideDropdown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutsideDropdown);
        };
    }, [showDropdown]);
    
    const handleClickOutsideAddressDropdown = (event) => {
        if (dropdownAddressRef.current && !dropdownAddressRef.current.contains(event.target)) {
            setShowAddressDropdown(false);
        }
    };
    
    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutsideAddressDropdown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutsideAddressDropdown);
        };
    }, [showAddressDropdown]);

    const handleDropDownFilters = (event) => {
        setShowFilters(!showFilters)
    }

    const handleDayChange = (event) => {
        setSelectedDay(event.target.value);
    };

    const handleInSeasonChange = (event) => {
        setIsInSeason(!isInSeason)
    }

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
            setFilterLocation(false)
            setFilterAddress(false)
            setAddress('')
            setResultCoordinates(null)
        }
    }

    const handleFilterZA = (event) => {
        if (!filterZA) {
            setFilterAZ(false)
            setFilterZA(!filterZA)
            setFilterLocation(false)
            setFilterAddress(false)
            setAddress()
            setResultCoordinates(null)
        }
    }
    
    const handleFilterLocation = (event) => {
        if (!filterLocation) {
            setFilterAZ(false)
            setFilterZA(false)
            setFilterLocation(true)
            setFilterAddress(false)
            setAddress('')
        }
    }
    
    
    const handleFilterAddress = (event) => {
        if (!filterAddress) {
            setFilterAZ(false)
            setFilterZA(false)
            setFilterLocation(false)
            setFilterAddress(!filterAddress)
            setResultCoordinates(null)
        }
    }

    const handleFiltersAll = (event) => {
        if (event.target.value === "filterAZ") {
            setFilterAZ(!filterAZ)
            setFilterZA(false)
            setFilterLocation(false)
            setFilterAddress(false)
            setAddress('')
            setResultCoordinates(null)
        }
        if (event.target.value === "filterZA") {
            setFilterAZ(false)
            setFilterZA(!filterZA)
            setFilterLocation(false)
            setFilterAddress(false)
            setAddress()
            setResultCoordinates(null)
        }
        if (event.target.value === "filterLocation") {
            setFilterAZ(false)
            setFilterZA(false)
            setFilterLocation(true)
            setFilterAddress(false)
            setAddress('')
        }
        if (event.target.value === "filterAddress") {
            setFilterAZ(false)
            setFilterZA(false)
            setFilterLocation(false)
            setFilterAddress(!filterAddress)
            setResultCoordinates(null)
        }
    }
    
    const toggleRadio = () => {
        if (!filterAddress) {
            setFilterAZ(false)
            setFilterZA(false)
            setFilterLocation(false)
            setFilterAddress(true)
        }
    };

    const handleAddress = (event) => {
        const query = event.target.value;
        setAddress(query);
        toggleRadio()
        // Clear the previous debounce timer
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        // Start a new debounce timer
        debounceTimeout.current = setTimeout(() => {
            if (query.trim() !== '') {
                handleSearchAddress(query);
            }
        }, 600);
    };

    const handleSearchAddress = async (query) => {
        const apiKey = import.meta.env.VITE_RADAR_KEY;

        try {
            const responseRadar = await fetch(`https://api.radar.io/v1/search/autocomplete?query=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: {
                    'Authorization': apiKey,
                },
            });
            if (responseRadar.ok) {
                const data = await responseRadar.json();
                setAddressResults(data.addresses);
                setShowAddressDropdown(true);

                if (data.addresses && data.addresses.length > 0) {
                    const { latitude, longitude } = data.addresses[0];
                    // console.log('Coordinates:', latitude, longitude);
                }
            }
        } catch (error) {
            console.error('Error fetching address:', error);
        }
    };

    function haversineDistance(coord1, coord2) {
        if (coord1 && coord2) {
            const R = 3959; // Earth's radius in miles
    
            const lat1 = coord1.lat;
            const lon1 = coord1.lng;
            const lat2 = coord2.lat;
            const lon2 = coord2.lng;
    
            const dLat = (lat2 - lat1) * (Math.PI / 180);
            const dLon = (lon2 - lon1) * (Math.PI / 180);
    
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
            return R * c; // Distance in miles
        }
    }

    const sortedMarketsResults = useMemo(() => {
        let results = [...filteredMarketsResults];

        if (filterAZ) {
            results.sort((a, b) => a.name.localeCompare(b.name));
        }
        else if (filterZA) {
            results.sort((a, b) => b.name.localeCompare(a.name));
        }
        else if (filterLocation) {
            results = results
                .map(market => {
                    let distance = haversineDistance(
                        userCoordinates,
                        market.coordinates
                    );
                    if (distance === null || isNaN(distance)) {
                        distance = Infinity;
                    }
                    return { ...market, distance };
                })
                .sort((a, b) => a.distance - b.distance);
        }
        else if (filterAddress && address) {
            results = results
                .map(market => {
                    let distance = haversineDistance(
                        resultCoordinates,
                        market.coordinates
                    );
                    if (distance === null || isNaN(distance)) {
                        distance = Infinity;
                    }
                    return { ...market, distance };
                })
                .sort((a, b) => a.distance - b.distance);
        }
        return results;
    }, [filteredMarketsResults, filterAZ, filterZA, filterAddress, address, resultCoordinates]);

    
    return (
        <>
            <div className="markets-container">
                <div className='header'>
                    <div id="map-main">
                        <Map
                            token={mapToken}
                            initialRegion={{
                                centerLatitude: 40.736358642578125,
                                centerLongitude: -73.99076080322266,
                                latitudeDelta: 0.04,
                                longitudeDelta: 0.04
                            }}
                            colorScheme={ColorScheme.Auto}
                            showsScale={FeatureVisibility.Visible}
                            showsUserLocation={true}
                            tracksUserLocation={true}
                            onUserLocationChange={event => setUserCoordinates({ 'lat': event.coordinate.latitude, 'lng': event.coordinate.longitude })}
                        >
                            {marketCoordinates.map((market) => (
                                <Annotation
                                    key={market.id}
                                    latitude={market.latitude}
                                    longitude={market.longitude}
                                    // title={market.name}
                                    // subtitle={market.schedule}
                                    onSelect={() => handleMarkerClickOn(market.id)}
                                    onDeselect={() => handleMarkerClickOff(market.id)}
                                >
                                    {!markerViews[market.id] ? (
                                        <div onClick={() => handleMarkerClickOn(market.id)}>
                                            <div className="map-circle"></div>
                                            <div className="map-inside-circle"></div>
                                            <div className="map-triangle"></div>
                                        </div>
                                    ) : (
                                        <div className="marker-details" onClick={() => handleMarkerClickOff(market.id)}>
                                            <div className='text-center'>
                                                <div className="marker-name"><Link className='link-underline link-scale-96' to={`/user/markets/${market.id}`}>{market.name}</Link></div>
                                                <div className="marker-day">{market.schedule}</div>
                                                {market.year_round ? (
                                                    <div className="marker-day">Open Year-Round</div>
                                                ) : (
                                                    <>
                                                        {market.season_start ? (
                                                            <div className="marker-day">{formatDate(market.season_start)} — {formatDate(market.season_end)}</div>
                                                        ) : (
                                                            null
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div> 
                                    )}
                                </Annotation>
                            ))}
                        </Map>
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
                                        <ul className="dropdown-content" ref={dropdownRef}>
                                            {filteredMarketsDropdown.slice(0, 10).map(item => (
                                                <li
                                                    className="search-results"
                                                    key={item.id}
                                                    onClick={() => {
                                                        setQuery(item.name);
                                                        setShowDropdown(false);
                                                    }}
                                                >
                                                    {item.name}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </td>
                                <td>
                                    <button
                                        className={`btn-fav-filter ${isClicked ? 'btn-fav-filter-on' : ''}`}
                                        title="only show favorites"
                                        onClick={handleClick}>&emsp;
                                    </button>
                                </td>
                                <td>
                                    <button className='btn btn-filter' onClick={handleDropDownFilters}>&#9776;</button>
                                    {showFilters && (
                                        <div className='dropdown-content box-filters'>
                                            <div className='form-filters-markets'>
                                                <input
                                                    id="aZ"
                                                    type="radio"
                                                    name="filters"
                                                    checked={filterAZ}
                                                    value={true}
                                                    onChange={handleFilterAZ}
                                                />
                                                <label htmlFor='aZ'>A to Z</label>
                                            </div>
                                            <div className='form-filters-markets'>
                                                <input
                                                    id="zA"
                                                    type="radio"
                                                    name="filters"
                                                    checked={filterZA}
                                                    value={true}
                                                    onChange={handleFilterZA}
                                                />
                                                <label htmlFor='zA'>Z to A</label>
                                            </div>
                                            <div className='form-filters-markets'>
                                                <input
                                                    id="location"
                                                    type="radio"
                                                    name="filters"
                                                    checked={filterLocation}
                                                    value={true}
                                                    onChange={handleFilterLocation}
                                                />
                                                <label htmlFor='location'>Your Location</label>
                                            </div>
                                            <div className='form-filters-markets'>
                                                <input
                                                    id="address"
                                                    type="radio"
                                                    name="filters"
                                                    checked={filterAddress}
                                                    value={true}
                                                    onChange={handleFilterAddress}
                                                />
                                                <label htmlFor='address'>Address</label>
                                                <input
                                                    className='margin-r-8'
                                                    id="address-address"
                                                    type="text"
                                                    name="addressFilter"
                                                    placeholder="1 Union Square West, New York"
                                                    value={address || ""}
                                                    onChange={(event) => handleAddress(event)}
                                                />
                                                {showAddressDropdown && (
                                                    <ul className="dropdown-content" ref={dropdownAddressRef}>
                                                        {addressResults.map(item => (
                                                            <li
                                                                className="search-results-address"
                                                                key={item.formattedAddress}
                                                                onClick={() => {
                                                                    setAddress(item.formattedAddress);
                                                                    setShowAddressDropdown(false);
                                                                    setResultCoordinates({ 'lat': item.latitude, 'lng': item.longitude })
                                                                }}
                                                            >
                                                                {item.formattedAddress}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
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
                                            <select className='select-dropdown select-blue' value={selectedDay} onChange={handleDayChange}>
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
                            <MarketCard key={marketData.id} marketData={marketData} user={user} haversineDistance={haversineDistance} resultCoordinates={resultCoordinates} userCoordinates={userCoordinates} filterAddress={filterAddress} />
                    ))}
                </div>
            </div>
        </>
    );
}

export default Markets;