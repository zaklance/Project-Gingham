import React, { useEffect, useState } from 'react';
import { weekDay } from '../../utils/common';
import { timeConverter, formatBasketDate } from '../../utils/helpers';

function VendorBasketsToday({vendorId, marketDay}) {
    const [todayBaskets, setTodayBaskets] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [numBaskets, setNumBaskets] = useState(0);
    const [prevNumBaskets, setPrevNumBaskets] = useState(numBaskets);
    const [savedBaskets, setSavedBaskets] = useState([]);
    const [price, setPrice] = useState('');
    const [basketValue, setBasketValue] = useState('');
    const [tempSavedBaskets, setTempSavedBaskets] = useState(null);
    const [availableBaskets, setAvailableBaskets] = useState([]);
    const [claimedBaskets, setClaimedBaskets] = useState([]);
    const [errorMessage, setErrorMessage] = useState([]);

    useEffect(() => {
        if (vendorId && marketDay?.id) {
            const fetchSavedBaskets = async () => {
                try {
                    const response = await fetch(
                        `http://127.0.0.1:5555/api/baskets?vendor_id=${vendorId}&market_day_id=${marketDay.id}`
                    );
                    if (response.ok) {
                        const data = await response.json();
                        setSavedBaskets(data);
                        setNumBaskets(data.length);
                        setPrevNumBaskets(data.length);
                        if (data.length > 0) {
                            const firstBasket = data[0];
                            setPrice(firstBasket.price || '');
                            setBasketValue(firstBasket.basket_value || '');
                        }
                    } else {
                        console.error('Error fetching baskets:', response.statusText);
                    }
                } catch (error) {
                    console.error('Error fetching baskets:', error);
                }
            };
            fetchSavedBaskets();
        }
    }, [vendorId, marketDay]);

    const handleIncrement = () => {
        setPrevNumBaskets(prevNumBaskets);
        setNumBaskets(prevState => prevState + 1);
    };
     
    const handleDecrement = () => {
        const soldBasketsCount = availableBaskets.filter(basket => basket.is_sold).length;
        setPrevNumBaskets(numBaskets);
        setNumBaskets((prevNum) => Math.max(prevNum - 1, soldBasketsCount));
    };

    useEffect(() => {
        if (vendorId) {
            console.log('Fetching today\'s baskets for vendor:', vendorId);
    
            const today = new Date();
            const formattedDate = today.toLocaleDateString('en-CA', { // Using en-CA as this has the correct ISO format 
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
                    data.forEach(basket => {
                        // console.log('Basket date:', basket.sale_date);
                    });
    
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
    
                    const availableBasketsArray = groupedBasketsArray
                        .map(entry => entry.baskets.filter(basket => !basket.is_sold))
                        .flat();
                    const claimedBasketsArray = groupedBasketsArray
                        .map(entry => entry.baskets.filter(basket => basket.is_sold))
                        .flat();
    
                    setAvailableBaskets(availableBasketsArray);
                    setClaimedBaskets(claimedBasketsArray);
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

    const handleSave = async () => {
        const parsedNumBaskets = numBaskets;
        const parsedPrice = parseFloat(price);
    
        const soldBasketsCount = savedBaskets.filter(basket => basket.is_sold).length;
    
        if (parsedNumBaskets < soldBasketsCount) {
            setErrorMessage(`You cannot reduce the number of baskets below the sold count (${soldBasketsCount}).`);
            return;
        }
    
        const [startHour, startMinute] = startTime.split(':').map(num => parseInt(num, 10));
        const [endHour, endMinute] = endTime.split(':').map(num => parseInt(num, 10));
    
        if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
            console.error('Invalid hour or minute values for pickup start or end.');
            setErrorMessage('Invalid time values for pickup start or end.');
            return;
        }
    
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
    
        const localDate = new Date(marketDay.date);
        const formattedSaleDate = localDate.toISOString().split('T')[0];
    
        const startTimeDate = new Date();
        startTimeDate.setHours(formattedStartHour, startMinute, 0, 0);
    
        const endTimeDate = new Date();
        endTimeDate.setHours(formattedEndHour, endMinute, 0, 0);
    
        const formattedPickupStart = `${startTimeDate.getHours().toString().padStart(2, '0')}:${startTimeDate.getMinutes().toString().padStart(2, '0')} ${startAmPm}`;
        const formattedPickupEnd = `${endTimeDate.getHours().toString().padStart(2, '0')}:${endTimeDate.getMinutes().toString().padStart(2, '0')} ${endAmPm}`;
    
        if (parsedNumBaskets > 0 && vendorId && marketDay && marketDay.id && !isNaN(parsedPrice) && parsedPrice > 0) {
            const promises = [];
            const additionalBaskets = parsedNumBaskets - prevNumBaskets;
    
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
            else if (additionalBaskets < 0) {
                const basketsToDelete = savedBaskets.slice(0, Math.abs(additionalBaskets));
                const unsoldBasketsToDelete = basketsToDelete.filter(basket => !basket.is_sold);
    
                if (unsoldBasketsToDelete.length < Math.abs(additionalBaskets)) {
                    setErrorMessage('You cannot delete sold baskets.');
                    return;
                }
    
                for (const basket of unsoldBasketsToDelete) {
                    promises.push(fetch(`http://127.0.0.1:5555/api/baskets/${basket.id}`, {
                        method: 'DELETE',
                    }));
                }
            }
    
            try {
                const responses = await Promise.all(promises);
                for (const response of responses) {
                    if (!response.ok) {
                        throw new Error(`Error creating/deleting basket: ${response.statusText}`);
                    }
                    await response.json();
                }
                setPrevNumBaskets(numBaskets);
                setIsEditing(false);
                setIsSaved(true);
                setErrorMessage('');
            } catch (error) {
                console.error('Error creating or deleting baskets:', error);
                setErrorMessage('Failed to update baskets. Please try again.');
            }
        } else {
            console.error('Invalid data or missing vendor/market ID');
            setErrorMessage('Please enter valid data for all fields.');
        }
    };

    const editSavedBaskets = () => {
        if (!isEditing) {
            setTempSavedBaskets({
                savedBaskets: numBaskets,
            });
        }
        setIsEditing(!isEditing);
    };

    const cancelBasketEdit = () => {
        setIsEditing(false);
        if (tempSavedBaskets) {
            setNumBaskets(tempSavedBaskets.savedBaskets || savedBaskets.length);
        }
        setErrorMessage('');
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete all unsold baskets?')) {
            return;
        }
    
        const unsoldBaskets = savedBaskets.filter(basket => !basket.is_sold);
    
        if (unsoldBaskets.length === 0) {
            setErrorMessage('No unsold baskets available for deletion.');
            return;
        }
    
        if (vendorId && marketDay?.id && marketDay?.date) {
            const formattedSaleDate = new Date(marketDay.date).toISOString().split('T')[0];
    
            try {
                const response = await fetch(
                    `http://127.0.0.1:5555/api/baskets?vendor_id=${vendorId}&market_day_id=${marketDay.id}&sale_date=${formattedSaleDate}`,
                    {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            baskets: unsoldBaskets.map(basket => basket.id),
                        }),
                    }
                );
    
                if (response.ok) {
                    console.log('Unsold baskets deleted successfully');
                    setSavedBaskets(savedBaskets.filter(basket => basket.is_sold));
                    setIsSaved(false);
                    setIsEditing(true);
                    setNumBaskets('');
                    setBasketValue('');
                    setPrice('');
                    setStartTime('');
                    setEndTime('');
                } else {
                    console.error('Failed to delete baskets:', response.statusText);
                    setErrorMessage('Failed to delete baskets. Please try again.');
                }
            } catch (error) {
                console.error('Error deleting baskets:', error);
                setErrorMessage('An error occurred while deleting baskets.');
            }
        } else {
            console.error('Missing vendorId, marketDay.id, or marketDay.date');
            setErrorMessage('Missing vendor ID, market day ID, or sale date.');
        }
    };

    return (
        <div>
            <div className='flex flex-nowrap box-scroll-x'>
            {todayBaskets.length > 0 ? (
                todayBaskets.map((entry, index) => {
                    const isLive = entry.baskets.length > 0 &&
                        new Date(entry.baskets[0].sale_date) <= new Date()
                    return (
                        <div key={index} className='badge-container'>
                            <div className='basket-card'>
                                {isLive && <p className='badge-live'>Live</p>}
                                <div className='text-center'>
                                    <h4>{entry.marketName}</h4>
                                    {entry.baskets.length > 0 ? (
                                        <h4>
                                            {entry.baskets.length > 0 ? formatBasketDate(entry.baskets[0].sale_date) : 'No sale date available'}
                                        </h4>
                                    ) : (
                                        <h4>No sale date available</h4>
                                    )}
                                </div>
                                <br/>          
                                {entry.baskets.length > 0 && (
                                    <table>
                                        <tbody className='table-basket'>
                                            <tr className='text-500'>
                                                <td>Total Available Baskets:</td>
                                                <td className='text-center'>
                                                    {isEditing ? (
                                                        <div className="basket-adjustment flex-space-evenly flex-center-align">
                                                            <button onClick={handleDecrement} className="btn btn-adjust btn-red">–</button>
                                                            <span>{numBaskets}</span>
                                                            <button onClick={handleIncrement} className="btn btn-adjust btn-green">+</button>
                                                        </div>                                    
                                                    ) : (
                                                        numBaskets
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
                                                <td className='nowrap'>Pickup Start:</td>
                                                <td className='nowrap text-center'>{timeConverter(entry.baskets[0]?.pickup_start)}</td>
                                            </tr>
                                            <tr>
                                                <td className='nowrap'>Pickup End:</td>
                                                <td className='nowrap text-center'>{timeConverter(entry.baskets[0]?.pickup_end)}</td>
                                            </tr>
                                            <tr>
                                                <td className='nowrap'>Basket Value:</td>
                                                <td className='text-center'>${entry.baskets[0]?.basket_value}</td>
                                            </tr>
                                            <tr>
                                                <td className='nowrap'>Basket Price:</td>
                                                <td className='text-center'>${entry.baskets[0]?.price}</td>
                                            </tr>
                                            {/* <tr className='row-blank'>
                                            </tr> */}
                                        </tbody>
                                    </table>
                                )}
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
                                    {isEditing ? (
                                        <>
                                            <button
                                                onClick={handleSave}
                                                className="btn-basket-save"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setNumBaskets(prevNumBaskets);
                                                    setIsEditing(false);
                                                }}
                                                className="btn-basket-save"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={editSavedBaskets} className="btn-basket-save"> Edit </button>
                                    )}
                                </div>

                            </div>
                        </div>
                    )
                })
            ) : (
                <p>No baskets available for today.</p>
            )}
            </div>   
        </div>
    );
}

export default VendorBasketsToday;
