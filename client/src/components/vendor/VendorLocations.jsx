import React, { useState, useEffect, useMemo } from 'react';
import { timeConverter } from '../../utils/helpers';
import { weekDay } from '../../utils/common';

function VendorLocations({ vendors, vendorId, vendorUserData }) {
    const [newMarketDay, setNewMarketDay] = useState({});
    const [markets, setMarkets] = useState([]);
    const [allVendorMarkets, setAllVendorMarkets] = useState([]);
    const [filteredMarketDays, setFilteredMarketDays] = useState([]);
    const [allMarketDays, setAllMarketDays] = useState([]);
    const [allMarkets, setAllMarkets] = useState([]);
    const [filteredMarkets, setFilteredMarkets] = useState([]);
    const [selectedMarket, setSelectedMarket] = useState(null);
    const [selectedMarketDay, setSelectedMarketDay] = useState(null);
    const [queryMarkets, setQueryMarkets] = useState("");
    const [queryMarketDays, setQueryMarketDays] = useState("");
    
    const onUpdateQueryMarkets = event => setQueryMarkets(event.target.value);
    const filteredQueryMarkets = allMarkets.filter(market => market.name.toLowerCase().includes(queryMarkets.toLowerCase()) && market.name !== queryMarkets)
    const matchingMarket = allMarkets.find(market => market.name.toLowerCase() === queryMarkets.toLowerCase());
    const matchingMarketId = matchingMarket ? matchingMarket.id : null;
    
    const onUpdateQueryMarketDays = event => setQueryMarketDays(event.target.value);
    const filteredQueryMarketDaysByMarket = useMemo(() => {
        return allMarketDays.filter(marketDay =>
            marketDay.market_id === matchingMarketId &&
            weekDay[marketDay.day_of_week].includes(queryMarketDays)
        );
    }, [allMarketDays, matchingMarketId, queryMarketDays]);
    const filteredQueryMarketDays = filteredQueryMarketDaysByMarket.filter(marketDay => weekDay[marketDay.day_of_week].includes(queryMarketDays) && weekDay[marketDay.day_of_week] !== queryMarketDays)
    const matchingMarketDay = filteredQueryMarketDays.find(marketDay => weekDay[marketDay.day_of_week] === queryMarketDays);
    const matchingMarketDayId = matchingMarketDay ? matchingMarketDay.id : null;
    

    useEffect(() => {
    
        fetch(`http://127.0.0.1:5555/api/vendor-markets?vendor_id=${vendorId}`)
            .then(response => response.json())
            .then(data => {
                setAllVendorMarkets(data)
            })
            .catch(error => console.error('Error fetching market locations:', error));
    }, [vendorId]);

    useEffect(() => {
        const token = localStorage.getItem('vendor_jwt-token');

        fetch("http://127.0.0.1:5555/api/market-days", {
            method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const filteredData = data.filter(item =>
                    allVendorMarkets.some(vendorMarket => vendorMarket.market_day_id === item.id)
                );
                setAllMarketDays(data)
                setFilteredMarketDays(filteredData)
            })
            .catch(error => console.error('Error fetching market days', error));
    }, [allVendorMarkets]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch("http://127.0.0.1:5555/api/markets?is_visible=true");
                const data = await response.json();
                setAllMarkets(data);
                if (filteredMarketDays.length > 0) {
                    const filteredData = data.filter(item =>
                        filteredMarketDays.some(vendorMarket => vendorMarket.market_id === item.id)
                    );
                    setFilteredMarkets(filteredData);
                }
            } catch (error) {
                console.error("Error fetching markets:", error);
            }
        };
        fetchData();
    }, [filteredMarketDays, allMarketDays]);

    useEffect(() => {
        if (allVendorMarkets.length > 0 && markets?.id) {
            setSelectedMarket(allVendorMarkets[0]);
        }
    }, [filteredMarketDays]);

    useEffect(() => {
        if (filteredQueryMarketDaysByMarket.length > 0 && !newMarketDay.market_day_id) {
            setNewMarketDay((prev) => ({
                ...prev,
                market_day_id: filteredQueryMarketDaysByMarket[0].id,
                vendor_id: parseInt(vendorId, 10),
            }));
        }
    }, [filteredQueryMarketDaysByMarket, vendorId]);

    const handleMarketDayChange = (event) => {
        const marketDayId = parseInt(event.target.value, 10);
        setNewMarketDay((prev) => ({
            ...prev,
            market_day_id: marketDayId,
            vendor_id: parseInt(vendorId, 10),
        }));
    };

    const handleMarketDaySelect = (event) => {
        const marketDayId = parseInt(event.target.value, 10)
        const filteredData = allVendorMarkets.find(vendorMarket => vendorMarket.market_day_id === marketDayId);
        setSelectedMarketDay(filteredData.id)
    }

    const handleAddVendorMarket = async () => {
        if (!newMarketDay.market_day_id) {
            alert("Please select a market day.");
            return;
        }
        const existingVendorMarket = allVendorMarkets.find(
            vm => vm.vendor_id === newMarketDay.vendor_id && vm.market_day_id === newMarketDay.market_day_id
        );
        if (existingVendorMarket) {
            alert("This vendor is already assigned to this market day.");
            return;
        }
        try {
            const response = await fetch("http://127.0.0.1:5555/api/vendor-markets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newMarketDay),
            });
            if (response.ok) {
                const updatedData = await response.json();
                alert("Market Day successfully added");
                console.log("Market Day data added successfully:", updatedData);
            } else {
                console.error("Failed to save changes:", response.statusText);
            }
        } catch (error) {
            console.error("Error saving changes:", error);
        }
    };

    const handleMarketDayDelete = async (event) => {
        if (confirm(`Are you sure you want to delete the chosen Market?`)) {
            // event.preventDefault()
            try {
                const response = await fetch(`http://127.0.0.1:5555/api/vendor-markets/${Number(selectedMarketDay)}`, {
                    method: "DELETE",
                });
                if (!response.ok) {
                    throw new Error("Failed to delete notification");
                }
                setFilteredMarketDays((prevMarketDays) => prevMarketDays.filter((md) => md.id !== Number(selectedMarketDay)));
            } catch (error) {
                console.error("Error deleting notification", error);
            }
        }
    };

    return (
        <>
            <div>
                <h2 className='margin-t-24 margin-b-16'>Locations</h2>
                <ul className='ul-team'>
                    {filteredMarketDays.map((market, index) => (
                        <li key={index} value={market.id} className='li-team'>
                            <strong>{market.markets.name}</strong> on <i>{weekDay[market.day_of_week]}s</i> from {timeConverter(market.hour_start)} to {timeConverter(market.hour_end)}
                        </li>
                    ))}
                </ul>
                {vendorUserData?.is_admin[vendorUserData.active_vendor] === true ? (
                    <>
                        <h2 className='margin-b-16 margin-t-24'>Add Markets</h2>
                        <form>
                            <div className='form-group'>
                                <label>Search Market:</label>
                                <input id='search' className="search-bar" type="text" placeholder="Search markets..." value={queryMarkets} onChange={onUpdateQueryMarkets} />
                                <div className="dropdown-content">
                                    {
                                        queryMarkets &&
                                        filteredQueryMarkets.slice(0, 10).map(item => <div className="search-results" key={item.id} onClick={(e) => setQueryMarkets(item.name)}>
                                            {item.name}
                                        </div>)
                                    }
                                </div>
                            </div>
                            <div className='form-group'>
                                <label>Day of Week:</label>
                                {filteredQueryMarketDaysByMarket.length > 0 ? (
                                    <select
                                        id="marketSelect"
                                        name="market"
                                        value={newMarketDay.market_day_id || ""}
                                        onChange={handleMarketDayChange}
                                    >
                                        {filteredQueryMarketDaysByMarket.map((market, index) => (
                                            <option key={index} value={market.id}>
                                                {weekDay[market.day_of_week]}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <>
                                    </>
                                )}
                            </div>
                            <p className='margin-t-8 margin-l-8'>Can't find a market? Email us at hello@gingham.nyc today!</p>
                            <button className='btn-edit' onClick={handleAddVendorMarket}>Add Day</button>
                        </form>
                        <h2 className='margin-b-16 margin-t-24'>Delete Markets</h2>
                        <form>
                            <div className='form-group'>
                                <label>Market:</label>
                                {filteredMarketDays.length > 0 ? (
                                    <select id="marketSelect" name="market" onChange={(e) => handleMarketDaySelect(e)}>
                                        <option value="">Select Market</option>
                                        {filteredMarketDays.map((market, index) => (
                                            <option key={index} value={market.id}>
                                                {market.markets.name} on {weekDay[market.day_of_week]}s
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <p>Loading markets...</p> // Optional: Placeholder or spinner while loading
                                )}
                            </div>
                            <button className='btn btn-small btn-x btn-gap margin-t-16' onClick={() => handleMarketDayDelete(event)}>
                                Delete
                            </button>
                        </form>
                    </>
                ) : (
                    <></>
                )}
            </div>
        </>
    )
}
export default VendorLocations;