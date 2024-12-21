import React, { useState, useEffect } from 'react';

function AdminMarketEvents({ markets }) {
    const [newEvent, setNewEvent] = useState({});
    const [query, setQuery] = useState("");
    const [events, setEvents] = useState([]);
    const [editingEventId, setEditingEventId] = useState(null);
    const [tempEventData, setTempEventData] = useState(null);

    const onUpdateQuery = event => setQuery(event.target.value);
    const filteredMarkets = markets.filter(market => market.name.toLowerCase().includes(query.toLowerCase()) && market.name !== query)
    const matchingMarket = markets.find(market => market.name.toLowerCase() === query.toLowerCase());
    const matchingMarketId = matchingMarket ? matchingMarket.id : null;


    useEffect(() => {
        setNewEvent((prevEvent) => ({
            ...prevEvent,
            market_id: matchingMarketId,
        }));
    }, [matchingMarketId]);

    const handleInputEventChange = (event) => {
        setNewEvent({
            ...newEvent,
            [event.target.name]: event.target.value,
        });
    };
    
    const handleEditInputChange = (event) => {
        const { name, value } = event.target;
        setTempEventData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };
    
    const handleEventEditToggle = (eventId, title, message, start_date, end_date) => {
        setEditingEventId(eventId);
        setTempEventData({ title, message, start_date, end_date });
    };

    const handleSaveNewEvent = async () => {
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
                    return item.market_id === Number(matchingMarketId) &&
                        // Check if today is within range or start_date is within 7 days from now
                        (today >= startDate && today <= endDate || startDate <= sevenDaysFromNow);
                });
                setEvents(filteredData);
            })
            .catch(error => console.error('Error fetching events', error));
    }, [matchingMarketId]);

    const handleEventUpdate = async (eventId) => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/events/${eventId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tempEventData),
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

    return(
        <>
            <div className='box-bounding'>
                <h2>Search Markets</h2>
                <table className='margin-t-16'>
                    <tbody>
                        <tr>
                            <td className='cell-title'>Search:</td>
                            <td className='cell-text'>
                                <input id='search' className="search-bar" type="text" placeholder="Search markets..." value={query} onChange={onUpdateQuery} />
                                <div className="dropdown-content">
                                    {
                                        query &&
                                        filteredMarkets.slice(0, 10).map(item => <div className="search-results" key={item.id} onClick={(e) => setQuery(item.name)}>
                                            {item.name}
                                        </div>)
                                    }
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className='box-bounding'>
            <h2>Add Events</h2>
                <div className='margin-t-24'>
                    <div className='form-group'>
                        <label>Title:</label>
                        <input
                            type="text"
                            name="title"
                            placeholder='Holiday Market'
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
                        <label>Market ID:</label>
                        <input
                            type="text"
                            name="market_id"
                            placeholder='Search markets above'
                            value={matchingMarketId || ''}
                            readOnly
                        />
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
                                                    value={tempEventData ? tempEventData.title : ''}
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
                                                    value={tempEventData ? tempEventData.message : ''}
                                                    onChange={handleEditInputChange}
                                                />
                                            </div>
                                            <div className='form-group'>
                                                <label title="yyyy-mm-dd">Event Start:</label>
                                                <input
                                                    type="text"
                                                    name="start_date"
                                                    placeholder='yyyy-mm-dd'
                                                    value={tempEventData ? tempEventData.start_date : ''}
                                                    onChange={handleEditInputChange}
                                                />
                                            </div>
                                            <div className='form-group'>
                                                <label title="yyyy-mm-dd">Event End:</label>
                                                <input
                                                    type="text"
                                                    name="end_date"
                                                    placeholder='yyyy-mm-dd'
                                                    value={tempEventData ? tempEventData.end_date : ''}
                                                    onChange={handleEditInputChange}
                                                />
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
                                        <button className='btn btn-small margin-b-16 margin-r-8' onClick={() => handleEventEditToggle(event.id, event.title, event.message, event.start_date, event.end_date)}>
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
export default AdminMarketEvents;