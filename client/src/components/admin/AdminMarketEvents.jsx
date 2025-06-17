import React, { useState, useEffect } from 'react';
import PulseLoader from 'react-spinners/PulseLoader';
import { toast } from 'react-toastify';

function AdminMarketEvents({ markets }) {
    const [newEvent, setNewEvent] = useState({});
    const [query, setQuery] = useState("");
    const [events, setEvents] = useState([]);
    const [editingEventId, setEditingEventId] = useState(null);
    const [tempEventData, setTempEventData] = useState(null);
    const [isPosting, setIsPosting] = useState(false);

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
        const { name, value } = event.target;
        setNewEvent({
            ...newEvent,
            [name]: name === 'schedule_change' ? (value === 'true') : value,
        });
    };
    
    const handleEditInputChange = (event) => {
        const { name, value } = event.target;
        setTempEventData((prev) => ({
            ...prev,
            [name]: name === 'schedule_change' ? (value === 'true') : value,
        }));
    };
    
    const handleEventEditToggle = (eventId, title, message, start_date, end_date, schedule_change) => {
        setEditingEventId(eventId);
        setTempEventData({ title, message, start_date, end_date, schedule_change });
    };

    const handleSaveNewEvent = async () => {
        if (!newEvent.market_id) {
            console.error("Market ID is missing. Cannot save event.");
            toast.success('Please select a valid market before saving the event.', {
                autoClose: 5000,
            });
            return;
        }
    
        const formattedEvent = {
            ...newEvent,
            vendor_id: null,
        };

        setIsPosting(true);
    
        try {
            console.log("Saving event with formatted data:", formattedEvent);
    
            const response = await fetch(`/api/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formattedEvent),
            });
    
            if (response.ok) {
                const createdEvent = await response.json();
                console.log('Event created successfully:', createdEvent);
                toast.success('Market Event successfully created.', {
                    autoClose: 4000,
                });
                setEvents((prevEvents) => [...prevEvents, createdEvent]);
                setNewEvent({});
                setIsPosting(false);
            } else {
                const errorMessage = await response.text();
                console.error('Failed to save event:', errorMessage);
                setIsPosting(false);
            }
        } catch (error) {
            console.error('Error saving event:', error);
            setIsPosting(false);
        }
    };

    useEffect(() => {
        fetch(`/api/events?market_id=${matchingMarketId}`)
            .then(response => response.json())
            .then(data => {
    
                if (data.error) {
                    setEvents([]);
                    return;
                }
    
                if (!Array.isArray(data)) {
                    console.error("Unexpected response format. Expected an array but got:", data);
                    setEvents([]);  // Reset to an empty array
                    return;
                }
    
                const today = new Date();
                const sevenDaysFromNow = new Date();
                sevenDaysFromNow.setDate(today.getDate() + 30);
    
                const filteredData = data.filter(item => {
                    const startDate = new Date(item.start_date);
                    const endDate = new Date(item.end_date);
                    return item.market_id === Number(matchingMarketId) &&
                        (today >= startDate && today <= endDate || startDate <= sevenDaysFromNow);
                });
    
                setEvents(filteredData);
            })
            .catch(error => {
                console.error('Error fetching events:', error);
                setEvents([]);  // Reset to avoid undefined issues
            });
    
    }, [matchingMarketId]);

    const handleEventUpdate = async (eventId) => {
        try {
            const response = await fetch(`/api/events/${eventId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tempEventData),
            });
            console.log(tempEventData.schedule_change)

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
    
                fetch(`/api/events/${eventId}`, {
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
            <title>gingham • Admin Markets • Events</title>
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
                            type="date"
                            name="start_date"
                            placeholder='yyyy-mm-dd'
                            value={newEvent.start_date || ''}
                            onChange={handleInputEventChange}
                        />
                    </div>
                    <div className='form-group'>
                        <label title="yyyy-mm-dd">Event End:</label>
                        <input
                            type="date"
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
                            <option value={true}>Yes</option>
                            <option value={false}>No</option>
                        </select>
                    </div>
                    {isPosting ? (
                        <PulseLoader
                            className='margin-t-12'
                            color={'#ff806b'}
                            size={10}
                            aria-label="Loading Spinner"
                            data-testid="loader"
                        />
                    ) : (
                        <button className='btn-edit' onClick={handleSaveNewEvent}>Create Event</button>
                    )}
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
                                            <div className='form-group'>
                                                <label title="true or false">Change in Schedule:</label>
                                                <select
                                                    name="schedule_change"
                                                    value={tempEventData?.schedule_change?.toString() || ''}
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
                                        <button className='btn btn-small margin-b-16 margin-r-8' onClick={() => handleEventEditToggle(event.id, event.title, event.message, event.start_date, event.end_date, event.schedule_change)}>
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