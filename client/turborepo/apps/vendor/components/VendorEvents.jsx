import React, { useState, useEffect } from 'react';
import PulseLoader from 'react-spinners/PulseLoader';
import { toast } from 'react-toastify';

function VendorEvents({ vendorId, vendorUserData }) {
    const [newEvent, setNewEvent] = useState({});
    const [events, setEvents] = useState([]);
    const [pastEvents, setPastEvents] = useState([]);
    const [editingEventId, setEditingEventId] = useState(null);
    const [editedEventData, setEditedEventData] = useState({});
    const [isPosting, setIsPosting] = useState(false);

    const activeVendorId = vendorUserData?.active_vendor;

    useEffect(() => {
        if (activeVendorId) {
            setNewEvent((prevEvent) => ({
                ...prevEvent,
                vendor_id: activeVendorId,
            }));
        }
    }, [activeVendorId]);

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
        if (!newEvent.title || !newEvent.message || !newEvent.start_date || !newEvent.end_date) {
            toast.warning('All fields are required.', {
                autoClose: 4000,
            });
            return;
        }
    
        if (newEvent.title.length > 24) {
            toast.warning('Title cannot exceed 24 characters.', {
                autoClose: 4000,
            });
            return;
        }
    
        let vendorId = vendorUserData.vendor_id;
        if (typeof vendorId === 'object' && vendorId !== null) {
            vendorId = Object.keys(vendorId)[0];
            vendorId = Number(vendorId);
        }
        
        if (!vendorId) {
            toast.warning('Invalid vendor ID. Please try again.', {
                autoClose: 4000,
            });
            return;
        }

        setIsPosting(true)
    
        try {
            console.log("Sending event data:", { vendor_id: vendorId, title: newEvent.title, message: newEvent.message, start_date: newEvent.start_date, end_date: newEvent.end_date, schedule_change: newEvent.schedule_change });
            
            const response = await fetch(`/api/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    vendor_id: vendorId,
                    title: newEvent.title,
                    message: newEvent.message,
                    start_date: newEvent.start_date,
                    end_date: newEvent.end_date,
                    schedule_change: newEvent.schedule_change
                }),
            });
    
            if (response.ok) {
                const createdEvent = await response.json();
                console.log("Created Event:", createdEvent);
                toast.success('Vendor Event successfully created!', {
                    autoClose: 4000,
                });
                setEvents((prevEvents) => [...prevEvents, createdEvent]);
                setNewEvent({});
                setIsPosting(false)
            } else {
                console.log('Failed to save event details');
                console.log('Response status:', response.status);
                console.log('Response text:', await response.text());
                setIsPosting(false)
            }
        } catch (error) {
            console.error('Error saving event details:', error);
            setIsPosting(false)
        }
    };
    
    useEffect(() => {
        if (!vendorId) return;
    
        fetch(`/api/events?vendor_id=${activeVendorId}`)
            .then(response => response.json())
            .then(data => {
    
                const today = new Date();
                const upcoming = [];
                const past = [];
    
                data.forEach(event => {
                    const endDate = new Date(event.end_date);
                    
                    if (endDate >= today) {
                        upcoming.push(event);
                    } else {
                        past.push(event);
                    }
                });
    
                setEvents(upcoming);
                setPastEvents(past);
            })
            .catch(error => console.error('Error fetching events', error));
    }, [activeVendorId]);

    const handleEventUpdate = async (eventId) => {
        try {
            const response = await fetch(`/api/events/${eventId}`, {
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

    console.log(events)
    console.log(newEvent)


    return (
        <>
            <title>gingham • Vendor Events</title>
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
                            <option value={true}>true</option>
                            <option value={false}>false</option>
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
                                            <button className='btn btn-small' onClick={() => setEditingEventId(null)}>Cancel</button>

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
                                        <button className='btn btn-small btn-x' onClick={() => handleEventDelete(event.id)}>
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
            <div className='box-bounding'>
                <h2>Past Events</h2>
                <div className='flex-wrap'>
                    {pastEvents.length > 0 ? (
                        pastEvents.map((event, index) => (
                            <div key={index} style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
                                <div className='flex-start flex-center-align flex-gap-16 m-flex-wrap'>
                                    <p className='text-italic nowrap'>
                                        {event.start_date}
                                        {event.end_date !== event.start_date && ` - `}
                                        <br />
                                        {event.end_date !== event.start_date && `${event.end_date}`}
                                    </p>
                                    <h3 className='nowrap'>{event.title ? event.title : 'Loading...'}:</h3>
                                    <p>{event.message}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <></>
                    )}
                </div>
            </div>
        </>
    )
}

export default VendorEvents;