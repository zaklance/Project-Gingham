import React, { useState, useEffect } from 'react';

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

    const weekDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


    const onUpdateQueryMarkets = event => setQueryMarkets(event.target.value);
    const filteredQueryMarkets = allMarkets.filter(market => market.name.toLowerCase().includes(queryMarkets.toLowerCase()) && market.name !== queryMarkets)
    const matchingMarket = allMarkets.find(market => market.name.toLowerCase() === queryMarkets.toLowerCase());
    const matchingMarketId = matchingMarket ? matchingMarket.id : null;
    
    
    const onUpdateQueryMarketDays = event => setQueryMarketDays(event.target.value);
    const filteredQueryMarketDaysByMarket = allMarketDays.filter(marketDay => marketDay.market_id === matchingMarketId)
    const filteredQueryMarketDays = filteredQueryMarketDaysByMarket.filter(marketDay => weekDay[marketDay.day_of_week].includes(queryMarketDays) && weekDay[marketDay.day_of_week] !== queryMarketDays)
    const matchingMarketDay = filteredQueryMarketDays.find(marketDay => weekDay[marketDay.day_of_week] === queryMarketDays);
    const matchingMarketDayId = matchingMarketDay ? matchingMarketDay.id : null;


    useEffect(() => {
        fetch(`http://127.0.0.1:5555/api/vendor-markets?vendor_id=${vendorId}`)
            .then(response => response.json())
            .then(data => {
                setAllVendorMarkets(data)
                // if (Array.isArray(markets)) {
                //     const marketIds = markets.map(market => market.market_day_id);
                //     setMarkets(marketIds);
                // }
            })
            .catch(error => console.error('Error fetching market locations:', error));
    }, [vendorId]);

    useEffect(() => {
        fetch("http://127.0.0.1:5555/api/market-days")
            .then(response => response.json())
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
        fetch("http://127.0.0.1:5555/api/markets")
            .then(response => response.json())
            .then(data => {
                const filteredData = data.filter(item =>
                    filteredMarketDays.some(vendorMarket => vendorMarket.market_id === item.id)
                );
                setFilteredMarkets(filteredData)
                setAllMarkets(data)
            })
            .catch(error => console.error('Error fetching market days', error));
    }, [filteredMarketDays]);

    useEffect(() => {
        if (allVendorMarkets.length > 0 && markets?.id) {
            setSelectedMarket(allVendorMarkets[0]);
        }
    }, [filteredMarketDays]);

    useEffect(() => {
        if (filteredQueryMarketDaysByMarket.length > 0) {
            const firstMarketDay = filteredQueryMarketDaysByMarket[0];
            if (newMarketDay.market_day_id !== firstMarketDay.id) {
                setNewMarketDay({
                    ...newMarketDay,
                    market_day_id: firstMarketDay.id,
                    vendor_id: parseInt(vendorId, 10),
                });
            }
        }
    }, [filteredQueryMarketDaysByMarket, vendorId, newMarketDay]);

    const handleMarketDayChange = (event) => {
        const marketDayId = parseInt(event.target.value);
        setNewMarketDay((prevEvent) => ({
            ...prevEvent,
            market_day_id: marketDayId,
            vendor_id: parseInt(vendorId, 10)
        }));
    };

    const handleMarketDaySelect = (event) => {
        const marketDayId = parseInt(event.target.value, 10)
        const filteredData = allVendorMarkets.find(vendorMarket => vendorMarket.market_day_id === marketDayId);
        setSelectedMarketDay(filteredData.id)
    }

    const handleAddVendorMarket = async () => {
        const existingVendorMarket = allVendorMarkets.find(
            vendorMarket => vendorMarket.vendor_id === newMarketDay.vendor_id && vendorMarket.market_day_id === newMarketDay.market_day_id
        );
        if (existingVendorMarket) {
            alert('This vendor is already assigned to this market day.');
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:5555/api/vendor-markets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newMarketDay),

            });
            console.log('Request body:', JSON.stringify(newMarketDay));

            if (response.ok) {
                const updatedData = await response.json();
                alert('Market Day successfully added')
                console.log('Market Day data added successfully:', updatedData);
            } else {
                console.log('Failed to save changes');
                console.log('Response status;', response.status);
                console.log('Response text:', await response.text());
            }
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    };

    const handleMarketDayDelete = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/vendor-markets/${selectedMarketDay}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                throw new Error("Failed to delete notification");
            }
            setFilteredMarketDays((prevMarketDays) => prevMarketDays.filter((md) => md.id !== selectedMarketDay));
        } catch (error) {
            console.error("Error deleting notification", error);
        }
    };


    return (
        <>
            <div className='box-bounding'>
                <h2 className='margin-b-16'>Add Markets</h2>
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
                            <select id="marketSelect" name="market" onChange={(e) => handleMarketDayChange(e)}>
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
                    <button className='btn-edit' onClick={handleAddVendorMarket}>Add Day</button>
                </form>
                <h2 className='margin-b-16 margin-t-24'>Delete Markets</h2>
                <form>
                    <div className='form-group'>
                        <label>Market:</label>
                        {filteredMarketDays.length > 0 ? (
                            <select id="marketSelect" name="market" onChange={(e) => handleMarketDaySelect(e)}>
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
                    <button className='btn btn-small btn-x btn-gap margin-t-16' onClick={() => handleMarketDayDelete()}>
                        Delete
                    </button>
                </form>
            </div>
        </>
    )
}
export default VendorLocations;