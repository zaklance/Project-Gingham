import React, { useState, useEffect, useMemo } from 'react';
import { timeConverter } from '../../utils/helpers';
import { weekDay } from '../../utils/common';
import { toast } from 'react-toastify';

function VendorLocations({ vendors, vendorId, vendorUserData, allMarketDays, allMarkets, filteredMarketDays, setFilteredMarketDays, filteredMarkets, allVendorMarkets }) {
    const [newMarketDay, setNewMarketDay] = useState({});
    const [markets, setMarkets] = useState([]);
    const [selectedMarket, setSelectedMarket] = useState(null);
    const [selectedMarketDay, setSelectedMarketDay] = useState(null);
    const [queryMarkets, setQueryMarkets] = useState("");
    const [queryMarketDays, setQueryMarketDays] = useState("");
    
    const onUpdateQueryMarkets = event => setQueryMarkets(event.target.value);
    const filteredQueryMarkets = allMarkets?.filter(market => market.name.toLowerCase().includes(queryMarkets.toLowerCase()) && market.name !== queryMarkets)
    const matchingMarket = allMarkets?.find(market => market.name.toLowerCase() === queryMarkets.toLowerCase());
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
        if (allVendorMarkets?.length > 0 && markets?.id) {
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
            toast.warning('Please select a market day.', {
                autoClose: 4000,
            });
            return;
        }
        const existingVendorMarket = allVendorMarkets.find(
            vm => vm.vendor_id === newMarketDay.vendor_id && vm.market_day_id === newMarketDay.market_day_id
        );
        if (existingVendorMarket) {
            toast.warning('This vendor is already assigned to this market day.', {
                autoClose: 5000,
            });
            return;
        }
        try {
            const response = await fetch("/api/vendor-markets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newMarketDay),
            });
            if (response.ok) {
                const updatedData = await response.json();
                toast.success('Market Day successfully added!', {
                    autoClose: 4000,
                });
                // console.log("Market Day data added successfully:", updatedData);
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
                const response = await fetch(`/api/vendor-markets/${Number(selectedMarketDay)}`, {
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
                    {filteredMarketDays
                        .sort((a, b) => {
                            const nameA = a.market.name.toLowerCase();
                            const nameB = b.market.name.toLowerCase();

                            const numA = nameA.match(/^\D*(\d+)/)?.[1];
                            const numB = nameB.match(/^\D*(\d+)/)?.[1];

                            if (numA && numB && nameA[0] >= "0" && nameA[0] <= "9" && nameB[0] >= "0" && nameB[0] <= "9") {
                                return parseInt(numA) - parseInt(numB);
                            }

                            return nameA.localeCompare(nameB, undefined, { numeric: true });
                        })
                        .map((market, index) => (
                            <li key={index} value={market.id} className='li-team'>
                                <strong>{market.market.name}</strong> on <i>{weekDay[market.day_of_week]}s</i> from {timeConverter(market.hour_start)} to {timeConverter(market.hour_end)}
                            </li>
                    ))}
                </ul>
                {vendorUserData?.vendor_role[vendorUserData.active_vendor] <= 1 ? (
                    <>
                        <h2 className='margin-b-16 margin-t-24'>Add Markets</h2>
                        <form>
                            <div className='form-group'>
                                <label>Search Market:</label>
                                <input id='search' className="search-bar" type="text" placeholder="Search markets..." value={queryMarkets} onChange={onUpdateQueryMarkets} />
                                <div className="dropdown-content">
                                    {
                                        queryMarkets &&
                                        filteredQueryMarkets
                                            .slice(0, 10)
                                            .sort((a, b) => {
                                                const nameA = a.name.toLowerCase();
                                                const nameB = b.name.toLowerCase();

                                                const numA = nameA.match(/^\D*(\d+)/)?.[1];
                                                const numB = nameB.match(/^\D*(\d+)/)?.[1];

                                                if (numA && numB && nameA[0] >= "0" && nameA[0] <= "9" && nameB[0] >= "0" && nameB[0] <= "9") {
                                                    return parseInt(numA) - parseInt(numB);
                                                }

                                                return nameA.localeCompare(nameB, undefined, { numeric: true });
                                            })
                                            .map(item => <div className="search-results" key={item.id} onClick={(e) => setQueryMarkets(item.name)}>
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
                                    null
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
                                        {filteredMarketDays
                                            .sort((a, b) => {
                                                const nameA = a.market.name.toLowerCase();
                                                const nameB = b.market.name.toLowerCase();

                                                const numA = nameA.match(/^\D*(\d+)/)?.[1];
                                                const numB = nameB.match(/^\D*(\d+)/)?.[1];

                                                if (numA && numB && nameA[0] >= "0" && nameA[0] <= "9" && nameB[0] >= "0" && nameB[0] <= "9") {
                                                    return parseInt(numA) - parseInt(numB);
                                                }

                                                return nameA.localeCompare(nameB, undefined, { numeric: true });
                                            })
                                            .map((market, index) => (
                                                <option key={index} value={market.id}>
                                                    {market.market.name} on {weekDay[market.day_of_week]}s
                                                </option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className='margin-t-4 margin-l-8'>No market locations...</p> // Optional: Placeholder or spinner while loading
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