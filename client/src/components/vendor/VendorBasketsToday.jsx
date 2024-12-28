import React, { useEffect, useState } from 'react';
import { timeConverter, formatBasketDate } from '../../utils/helpers';

function VendorBasketsToday({vendorId, marketDay, entry}) {
    const [todayBaskets, setTodayBaskets] = useState([]);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [startAmPm, setStartAmPm] = useState('PM');
    const [endAmPm, setEndAmPm] = useState('PM');
    const [isEditing, setIsEditing] = useState(null);
    const [basketCounts, setBasketCounts] = useState({});
    const [numBaskets, setNumBaskets] = useState(0);
    const [prevNumBaskets, setPrevNumBaskets] = useState(numBaskets);
    const [savedBaskets, setSavedBaskets] = useState([]);
    const [price, setPrice] = useState('');
    const [basketValue, setBasketValue] = useState('');
    const [tempSavedBaskets, setTempSavedBaskets] = useState(null);
    // const [availableBaskets, setAvailableBaskets] = useState([]);
    // const [claimedBaskets, setClaimedBaskets] = useState([]);
    const [errorMessage, setErrorMessage] = useState([]);

    useEffect(() => {
        if (vendorId) {
            console.log('Fetching today\'s baskets for vendor:', vendorId);
        
            const today = new Date();
            const formattedDate = today.toLocaleDateString('en-CA', { 
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            }).split('/').reverse().join('-');

            console.log('Formatted date being sent:', formattedDate);

            const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            console.log('Browser timezone:', browserTimezone);

            fetch(`http://127.0.0.1:5555/api/todays-baskets?vendor_id=${vendorId}&date=${formattedDate}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Timezone': browserTimezone
                }
            })
            .then(response => response.json())
            .then(data => {
                console.log('Fetched data for today\'s baskets:', data);
                if (Array.isArray(data)) {
                    const groupedData = data.reduce((acc, basket) => {
                        const { market_day_id, market_name } = basket;

                        if (!acc[market_day_id]) {
                            acc[market_day_id] = {
                                marketId: market_day_id,
                                marketName: market_name,
                                baskets: []
                            };
                        }
                        acc[market_day_id].baskets.push(basket);
                        return acc;
                    }, {});

                    const groupedBasketsArray = Object.values(groupedData);
                    setTodayBaskets(groupedBasketsArray);

                    const initialBasketCounts = {};
                    groupedBasketsArray.forEach(entry => {
                        entry.baskets.forEach(basket => {
                            initialBasketCounts[basket.id] = basket.basket_count || 0;
                        });
                    });
                    setBasketCounts(initialBasketCounts);
                } else {
                    console.error('Unexpected data format:', data);
                }
            })
            .catch(error => {
                console.error('Error fetching today\'s baskets:', error);
            });
        } else {
            console.log('Vendor ID is not available');
        }
    }, [vendorId]);  

    const toggleEditMode = (basketId) => {
        if (isEditing !== basketId) {
            setTempSavedBaskets(prevState => ({
                ...prevState,
                [basketId]: basketCounts[basketId] || 0
            }));
        }
    
        setIsEditing(basketId);
    }; 
    
    const handleIncrement = (basketId) => {
        setBasketCounts(prevState => ({
            ...prevState,
            [basketId]: (prevState[basketId] || 0) + 1
        }));
    };

    const handleDecrement = (basketId) => {
        setBasketCounts(prevState => ({
            ...prevState,
            [basketId]: Math.max((prevState[basketId] || 0) - 1, 0)
        }));
    };
    
    const handleSave = async () => {
        const parsedNumBaskets = numBaskets;
        const parsedPrice = parseFloat(price);
        const soldBasketsCount = savedBaskets.filter(basket => basket.is_sold).length;
    
        if (parsedNumBaskets < soldBasketsCount) {
            setErrorMessage(`You cannot reduce the number of baskets below the sold count (${soldBasketsCount}).`);
            return;
        }
    
        // Check if startTime and endTime are valid before splitting and parsing
        if (!startTime || !endTime) {
            console.error('Start time or end time is not set.');
            setErrorMessage('Start time or end time is missing.');
            return;
        }
    
        console.log("startTime:", startTime);
        console.log("endTime:", endTime);
    
        // Split and parse the times, ensuring they are valid
        const [startHour, startMinute] = startTime.split(':').map(num => parseInt(num, 10));
        const [endHour, endMinute] = endTime.split(':').map(num => parseInt(num, 10));
    
        console.log("Parsed start hour:", startHour);
        console.log("Parsed start minute:", startMinute);
        console.log("Parsed end hour:", endHour);
        console.log("Parsed end minute:", endMinute);
    
        // Validate the parsed values
        if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
            console.error('Invalid hour or minute values for pickup start or end.');
            setErrorMessage('Invalid time values for pickup start or end.');
            return;
        }
    
        // Continue with formatting and logic
        const formattedStartHour = startAmPm === 'PM' && startHour !== 12
            ? startHour + 12
            : startAmPm === 'AM' && startHour === 12
            ? 0
            : startHour;
        const formattedEndHour = endAmPm === 'PM' && endHour !== 12
            ? endHour + 12
            : startAmPm === 'AM' && endHour === 12
            ? 0
            : endHour;
    
        console.log("Formatted start hour:", formattedStartHour);
        console.log("Formatted end hour:", formattedEndHour);
    
        const localDate = new Date(marketDay.date);
        const formattedSaleDate = localDate.toISOString().split('T')[0];
    
        const startTimeDate = new Date();
        startTimeDate.setHours(formattedStartHour, startMinute, 0, 0);
    
        const endTimeDate = new Date();
        endTimeDate.setHours(formattedEndHour, endMinute, 0, 0);
    
        console.log("Final start time:", startTimeDate);
        console.log("Final end time:", endTimeDate);
    
        const formattedPickupStart = `${startTimeDate.getHours().toString().padStart(2, '0')}:${startTimeDate.getMinutes().toString().padStart(2, '0')} ${startAmPm}`;
        const formattedPickupEnd = `${endTimeDate.getHours().toString().padStart(2, '0')}:${endTimeDate.getMinutes().toString().padStart(2, '0')} ${endAmPm}`;
    
        console.log("Formatted pickup start time:", formattedPickupStart);
        console.log("Formatted pickup end time:", formattedPickupEnd);
    
        // Ensure the necessary data is present
        if (parsedNumBaskets > 0 && vendorId && marketDay && marketDay.id && !isNaN(parsedPrice) && parsedPrice > 0) {
            const promises = [];
            const additionalBaskets = parsedNumBaskets - prevNumBaskets;
    
            const basketsToDelete = savedBaskets.filter(basket => basket.shouldDelete);
    
            // Add new baskets (POST)
            if (additionalBaskets > 0) {
                for (let i = 0; i < additionalBaskets; i++) {
                    promises.push(fetch('http://127.0.0.1:5555/api/baskets', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            vendor_id: vendorId,
                            market_day_id: marketDay.id,
                            sale_date: formattedSaleDate,
                            pickup_start: formattedPickupStart,
                            pickup_end: formattedPickupEnd,
                            is_sold: false,
                            is_grabbed: false,
                            price: parsedPrice,
                            basket_value: basketValue,
                        }),
                    }));
                }
            } 
            // Delete unsold baskets (DELETE)
            else if (additionalBaskets < 0) {
                const numberOfBasketsToDelete = Math.abs(additionalBaskets);
                const unsoldBaskets = savedBaskets.filter(basket => !basket.is_sold);
    
                if (unsoldBaskets.length < numberOfBasketsToDelete) {
                    console.error(`Not enough unsold baskets available for deletion. Expected to delete ${numberOfBasketsToDelete}, but only found ${unsoldBaskets.length}.`);
                    setErrorMessage('Not enough unsold baskets available for deletion.');
                    return;
                }
    
                const availableBasketsToDelete = unsoldBaskets.slice(0, numberOfBasketsToDelete);
                const basketIdsToDelete = availableBasketsToDelete.map(basket => basket.id);
    
                try {
                    const response = await fetch('http://127.0.0.1:5555/api/baskets', {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ basket_ids: basketIdsToDelete }),
                    });
    
                    if (response.ok) {
                        console.log('Baskets successfully deleted.');
    
                        const updatedBaskets = savedBaskets.filter(basket => !basketIdsToDelete.includes(basket.id));
                        setSavedBaskets(updatedBaskets); 
    
                        setPrevNumBaskets(numBaskets);
                        setIsEditing(false);
                        setIsSaved(true);
                        setErrorMessage('');
                    } else {
                        console.error('Failed to delete some baskets.');
                        setErrorMessage('Failed to delete some baskets. Please try again.');
                    }
                } catch (error) {
                    console.error('Error during deletion process:', error);
                    setErrorMessage('Failed to delete baskets. Please try again.');
                }
            }
    
            // Wait for POST requests to complete
            await Promise.all(promises);
    
            // Fetch the updated basket list after addition/deletion
            try {
                const fetchResponse = await fetch(`http://127.0.0.1:5555/api/baskets?vendor_id=${vendorId}&market_day_id=${marketDay.id}&sale_date=${formattedSaleDate}`);
                const updatedBaskets = await fetchResponse.json();
                setSavedBaskets(updatedBaskets);
            } catch (error) {
                console.error('Error fetching updated baskets:', error);
                setErrorMessage('An error occurred while fetching updated baskets.');
            }
    
            setPrevNumBaskets(numBaskets);
            setIsEditing(false);
            setIsSaved(true);
            setErrorMessage('');
        } else {
            setErrorMessage('Please enter valid data for all fields.');
        }
    };    

    const cancelBasketEdit = (basketId) => {
        setBasketCounts(prevState => ({
            ...prevState,
            [basketId]: tempSavedBaskets[basketId] || 0
        }));
    
        setIsEditing(null);
    };
    
    return (
        <div>
            <div className='flex flex-nowrap box-scroll-x'>
            {Array.isArray(todayBaskets) && todayBaskets.length > 0 ? (
            todayBaskets.map((entry, index) => {
                    const isLive = entry.baskets.length > 0 && new Date(entry.baskets[0].sale_date) <= new Date()

                    return (
                        <div key={index} className='badge-container'>
                            <div className='basket-card'>
                                {isLive && <p className='badge-live'>Live</p>}
                                <div className='text-center'>
                                    <h4>{entry.marketName}</h4>
                                    {entry.baskets.length > 0 ? (
                                        <h4> {entry.baskets.length > 0 ? formatBasketDate(entry.baskets[0].sale_date) : 'No sale date available'} </h4>
                                    ) : (
                                        <h4> No sale date available </h4>
                                    )}
                                </div>
                                <br/>          
                                <table>
                                    <tbody className="table-basket">
                                        <tr className="text-500">
                                            <td>Total Baskets Available:</td>
                                            <td className='text-center'>
                                                {isEditing === entry.baskets[0].id ? (
                                                    <div className="basket-adjustment flex-space-evenly flex-center-align">
                                                        <button
                                                            onClick={() => handleDecrement(entry.baskets[0].id)}
                                                            className="btn btn-adjust btn-red">–</button>
                                                        <span>{tempSavedBaskets[entry.baskets[0].id] || basketCounts[entry.baskets[0].id] || 0}</span>
                                                        <button
                                                            onClick={() => handleIncrement(entry.baskets[0].id)}
                                                            className="btn btn-adjust btn-green">+</button>
                                                    </div>
                                                ) : (
                                                    basketCounts[entry.baskets[0].id] || 0
                                                )}
                                            </td>
                                        </tr>
                                        <tr className='text-500'>
                                            <td>Sold Baskets:</td>
                                            <td className='text-center'>{entry.baskets.filter(basket => basket.is_sold).length}</td>
                                        </tr>
                                        <tr className='row-blank'>
                                        </tr>
                                        <tr>
                                            <td className="nowrap">Pick-Up Start:</td>
                                            <td className="nowrap text-center">
                                                {entry.baskets[0]?.pickup_start ? timeConverter(entry.baskets[0]?.pickup_start) : "N/A"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="nowrap">Pick-Up End:</td>
                                            <td className="nowrap text-center">
                                                {entry.baskets[0]?.pickup_end ? timeConverter(entry.baskets[0]?.pickup_end) : "N/A"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className='nowrap'>Basket Value:</td>
                                            <td className='text-center'>${entry.baskets[0]?.basket_value}</td>
                                        </tr>
                                        <tr>
                                            <td className='nowrap'>Basket Price:</td>
                                            <td className='text-center'>${entry.baskets[0]?.price}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            <br/>
                            <h4> </h4>
                            {entry.baskets.filter(basket => basket.is_sold).length > 0 && (
                                <table className='table-basket'>
                                    <thead>
                                        <tr className='blue-bright'>
                                            <td className='text-light' colSpan="2"> Is Grabbed?</td>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {entry.baskets.filter(basket => basket.is_sold).map((basket, index) => (
                                            <tr key={basket.id || index}>
                                                <td>Basket ID: {basket.id}</td>
                                                {basket.is_grabbed ? <td className='text-center'>&#10003;</td> : <td className='text-center'>X</td>}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                            )}
                            <br/>
                            <div className="text-center basket-actions">
                                {entry.baskets.map((basket) => (
                                    <div key={basket.id}>
                                        {isEditing === basket.id ? (
                                            <>
                                                <button onClick={handleSave} className="btn-basket-save"> Save </button>
                                                <button onClick={() => cancelBasketEdit(basket.id)} className="btn-basket-save">Cancel</button>
                                            </>
                                        ) : (
                                            <button onClick={() => toggleEditMode(basket.id)} className="btn-basket-save"> Edit </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    );
                })
            ) : (
                <p>No baskets available for today.</p>
            )}
            </div>   
        </div>
    );
}

export default VendorBasketsToday;