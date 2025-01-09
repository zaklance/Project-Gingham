import React, { useState, useEffect } from 'react';

function VendorEvents({ vendorId, vendorUserData }) {
    const [newEvent, setNewEvent] = useState({});
    const [events, setEvents] = useState([]);
    const [editingEventId, setEditingEventId] = useState(null);
    const [editedEventData, setEditedEventData] = useState({});
    const [markets, setMarkets] = useState([]);
    const [allVendorMarkets, setAllVendorMarkets] = useState([]);
    const [allMarketDays, setAllMarketDays] = useState([]);
    const [allMarkets, setAllMarkets] = useState([]);
    const [selectedMarket, setSelectedMarket] = useState(null);

    console.log()

    useEffect(() => {
        if (vendorUserData && vendorUserData.id) {
            setNewEvent((prevEvent) => ({
                ...prevEvent,
                vendor_id: vendorUserData.id,
            }));
        }
    }, [vendorUserData]);

    const handleInputEventChange = (event) => {
        const { name, value } = event.target;
        setNewEvent((prevEvent) => ({
            ...prevEvent,
            [name]: value,
            vendor_id: prevEvent.vendor_id,
        }));
    };

    const handleEditInputChange = (event) => {
        const { name, value } = event.target;
        setEditedEventData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleEventEditToggle = (eventId, title, message, start_date, end_date, schedule_change) => {
        setEditingEventId(eventId);
        setEditedEventData({ title, message, start_date, end_date, schedule_change });
    };

    const handleSaveNewEvent = async () => {

        if (newEvent.title && newEvent.title.length > 24) {
            alert('Title cannot exceed 24 characters.');
            return;
        }

        try {
            console.log(newEvent);
            // Save market details first
            const response = await fetch(`http://127.0.0.1:5555/api/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newEvent),
            });

            if (response.ok) {
                const createdEvent = await response.json();
                console.log('Event data updated successfully:', createdEvent);
                alert('Market Event successfully created')
                setEvents((prevEvents) => [...prevEvents, createdEvent]);
                setNewEvent({})
            } else {
                console.log('Failed to save event details');
                console.log('Response status:', response.status);
                console.log('Response text:', await response.text());
            }
        } catch (error) {
            console.error('Error saving event details:', error);
        }
    };

    useEffect(() => {
        fetch("http://127.0.0.1:5555/api/events")
            .then(response => response.json())
            .then(data => {
                const today = new Date();
                const sevenDaysFromNow = new Date();
                sevenDaysFromNow.setDate(today.getDate() + 30);

                const filteredData = data.filter(item => {
                    const startDate = new Date(item.start_date);
                    const endDate = new Date(item.end_date);
                    return item.vendor_id === Number(vendorUserData.id) &&
                        // Check if today is within range or start_date is within 7 days from now
                        (today >= startDate && today <= endDate || startDate <= sevenDaysFromNow);
                });
                setEvents(filteredData);
            })
            .catch(error => console.error('Error fetching events', error));
    }, [vendorUserData.id]);

    const handleEventUpdate = async (eventId) => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/events/${eventId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editedEventData),
            });

            if (response.ok) {
                const updatedEvent = await response.json();
                setEvents((prevEvents) =>
                    prevEvents.map((event) => (event.id === eventId ? updatedEvent : event))
                );
                setEditingEventId(null);
                console.log('Event updated successfully:', updatedEvent);
            } else {
                console.error('Failed to update event:', await response.text());
            }
        } catch (error) {
            console.error('Error updating event:', error);
        }
    };

    const handleEventDelete = async (eventId) => {
        if (confirm(`Are you sure you want to delete this event?`)) {
            try {

                fetch(`http://127.0.0.1:5555/api/events/${eventId}`, {
                    method: "DELETE",
                }).then(() => {
                    setEvents((prevEvents) => prevEvents.filter((review) => review.id !== eventId))
                })
            } catch (error) {
                console.error("Error deleting review", error)
            }
        }
    }

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
                setAllMarketDays(filteredData)
            })
            .catch(error => console.error('Error fetching market days', error));
    }, [allVendorMarkets]);

    useEffect(() => {
        fetch("http://127.0.0.1:5555/api/markets")
            .then(response => response.json())
            .then(data => {
                const filteredData = data.filter(item =>
                    allMarketDays.some(vendorMarket => vendorMarket.market_id === item.id)
                );
                setAllMarkets(filteredData)
            })
            .catch(error => console.error('Error fetching market days', error));
    }, [allMarketDays]);

    useEffect(() => {
        if (allVendorMarkets.length > 0 && markets?.id) {
            setSelectedMarket(allVendorMarkets[0]);
        }
    }, [allMarketDays]);

    const handleMarketChange = (event) => {
        const marketId = parseInt(event.target.value);
        setSelectedMarket(marketId);
        setNewEvent((prevEvent) => ({
            ...prevEvent,
            market_id: marketId,
        }));
    };

    return (
        <>
            <div className='box-bounding'>
                <h2>Add Events</h2>
                <div className='margin-t-24'>
                    <div className='form-group'>
                        <label>Title:</label>
                        <input
                            type="text"
                            name="title"
                            placeholder='Weekly Special'
                            value={newEvent.title || ''}
                            onChange={handleInputEventChange}
                        />
                    </div>
                    <div className='form-group'>
                        <label>Message:</label>
                        <textarea
                            className='textarea-edit'
                            type="text"
                            name="message"
                            placeholder='Description here'
                            value={newEvent.message || ''}
                            onChange={handleInputEventChange}
                        />
                    </div>
                    <div className='form-group'>
                        <label>Market:</label>
                        {allMarkets.length > 0 ? (
                            <select id="marketSelect" name="market" onChange={handleMarketChange}>
                                {allMarkets.map((market, index) => (
                                    <option key={index} value={market.id}>
                                        {market.name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <p>Loading markets...</p> // Optional: Placeholder or spinner while loading
                        )}
                    </div>
                    <div className='form-group'>
                        <label title="yyyy-mm-dd">Event Start:</label>
                        <input
                            type="text"
                            name="start_date"
                            placeholder='yyyy-mm-dd'
                            value={newEvent.start_date || ''}
                            onChange={handleInputEventChange}
                        />
                    </div>
                    <div className='form-group'>
                        <label title="yyyy-mm-dd">Event End:</label>
                        <input
                            type="text"
                            name="end_date"
                            placeholder='yyyy-mm-dd'
                            value={newEvent.end_date || ''}
                            onChange={handleInputEventChange}
                        />
                    </div>
                    <div className='form-group'>
                        <label title="true or false">Change in Schedule:</label>
                        <select
                            name="schedule_change"
                            value={newEvent.schedule_change || ''}
                            onChange={handleInputEventChange}
                        >
                            <option value="">Select</option>
                            <option value={true}>true</option>
                            <option value={false}>false</option>
                        </select>
                    </div>
                    <button className='btn-edit' onClick={handleSaveNewEvent}>Create Event</button>
                </div>
            </div>
            <div className='box-bounding'>
                <h2>Edit Events</h2>
                <div className='flex-wrap'>
                    {events.length > 0 ? (
                        events.map((event, index) => (
                            <div key={index} style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
                                {editingEventId === event.id ? (
                                    <>
                                        <div>
                                            <div className='form-group'>
                                                <label>Title:</label>
                                                <input
                                                    type="text"
                                                    name="title"
                                                    placeholder='Holiday Market'
                                                    value={editedEventData ? editedEventData.title : ''}
                                                    onChange={handleEditInputChange}
                                                />
                                            </div>
                                            <div className='form-group'>
                                                <label>Message:</label>
                                                <textarea
                                                    className='textarea-edit'
                                                    type="text"
                                                    name="message"
                                                    placeholder='Description here'
                                                    value={editedEventData ? editedEventData.message : ''}
                                                    onChange={handleEditInputChange}
                                                />
                                            </div>
                                            <div className='form-group'>
                                                <label title="yyyy-mm-dd">Event Start:</label>
                                                <input
                                                    type="text"
                                                    name="start_date"
                                                    placeholder='yyyy-mm-dd'
                                                    value={editedEventData ? editedEventData.start_date : ''}
                                                    onChange={handleEditInputChange}
                                                />
                                            </div>
                                            <div className='form-group'>
                                                <label title="yyyy-mm-dd">Event End:</label>
                                                <input
                                                    type="text"
                                                    name="end_date"
                                                    placeholder='yyyy-mm-dd'
                                                    value={editedEventData ? editedEventData.end_date : ''}
                                                    onChange={handleEditInputChange}
                                                />
                                            </div>
                                            <div className='form-group'>
                                                <label title="true or false">Change in Schedule:</label>
                                                <select
                                                    name="schedule_change"
                                                    value={editedEventData?.schedule_change?.toString() || ''}
                                                    onChange={handleEditInputChange}
                                                >
                                                    <option value="">Select</option>
                                                    <option value="true">true</option>
                                                    <option value="false">false</option>
                                                </select>
                                            </div>
                                            <button className='btn btn-small margin-t-24 margin-r-8' onClick={() => handleEventUpdate(event.id)}>Save</button>
                                            <button className='btn btn-small btn-gap' onClick={() => setEditingEventId(null)}>Cancel</button>

                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className='flex-start flex-center-align flex-gap-16 m-flex-wrap'>
                                            <p className='text-italic nowrap'>
                                                {event.start_date}
                                                {event.end_date !== event.start_date && ` - `}
                                                <br></br>
                                                {event.end_date !== event.start_date && `${event.end_date}`}
                                            </p>
                                            <h3 className='nowrap'>{event.title ? event.title : 'Loading...'}:</h3>
                                            <p>{event.message}</p>
                                        </div>
                                        <button className='btn btn-small margin-t-16 margin-r-8' onClick={() => handleEventEditToggle(event.id, event.title, event.message, event.start_date, event.end_date, event.schedule_change)}>
                                            Edit
                                        </button>
                                        <button className='btn btn-small btn-x btn-gap' onClick={() => handleEventDelete(event.id)}>
                                            Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        ))
                    ) : (
                        <>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}
export default VendorEvents;