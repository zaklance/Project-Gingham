import React, { useState, useEffect } from 'react';

function AdminMarketEdit({ markets, timeConverter, weekday, weekdayReverse }) {
    const [marketDayDetails, setMarketDayDetails] = useState([])
    const [marketDays, setMarketDays] = useState([])
    const [selectedDay, setSelectedDay] = useState(null);
    const [query, setQuery] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [editDayMode, setEditDayMode] = useState(false);
    const [adminMarketData, setAdminMarketData] = useState(null);
    const [image, setImage] = useState(null)
    const [status, setStatus] = useState('initial')
    

    const onUpdateQuery = event => setQuery(event.target.value);
    const filteredMarkets = markets.filter(market => market.name.toLowerCase().includes(query.toLowerCase()) && market.name !== query)
    const matchingMarket = markets.find(market => market.name.toLowerCase() === query.toLowerCase());
    const matchingMarketId = matchingMarket ? matchingMarket.id : null;

    useEffect(() => {
        fetch("http://127.0.0.1:5555/market-days")
            .then(response => response.json())
            .then(data => {
                const filteredData = data.filter(item => item.market_id === matchingMarketId);
                setMarketDays(filteredData)
                setSelectedDay(filteredData[0]);
            })
            .catch(error => console.error('Error fetching market days', error));
    }, [matchingMarketId]);

    const handleDayChange = (event) => {
        const dayId = parseInt(event.target.value);
        const day = marketDays.find(day => day.id === dayId);
        setSelectedDay(day);
    };

    useEffect(() => {
        if (matchingMarketId) {
            const fetchAdminMarketData = async () => {
                try {
                    const token = sessionStorage.getItem('jwt-token');
                    const response = await fetch(`http://127.0.0.1:5555/markets/${matchingMarketId}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        console.log('Fetched admin market data:', data);
                        setAdminMarketData(data);
                    } else {
                        console.error('Error fetching profile:', response.status);
                        if (response.status === 401) {
                            console.error('Unauthorized: Token may be missing or invalid');
                        }
                    }
                } catch (error) {
                    console.error('Error fetching market data:', error);
                }
            };
            fetchAdminMarketData();
        }
    }, [matchingMarketId]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        if (name === 'coordinates_lat' || name === 'coordinates_lng') {
            setAdminMarketData(prevData => ({
                ...prevData,
                coordinates: {
                    ...prevData.coordinates, // Keep other coordinate values intact
                    [name === 'coordinates_lat' ? 'lat' : 'lng']: value
                }
            }));
        } else {
            setAdminMarketData({
                ...adminMarketData,
                [name]: value
            });
        }
    };

    const handleInputMarketDayChange = (event) => {
        setSelectedDay({
            ...selectedDay,
            [event.target.name]: event.target.value,
        });
    };

    const handleWeekdayChange = (event) => {
        setSelectedDay({
            ...selectedDay,
            [event.target.name]: weekdayReverse[event.target.value],
        });
    };

    const handleEditToggle = () => {
        setEditMode(!editMode);
    };

    const handleEditDayToggle = () => {
        setEditDayMode(!editDayMode);
    };

    const handleSaveChanges = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/markets/${matchingMarketId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(adminMarketData),

            });
            console.log('Request body:', JSON.stringify(adminMarketData));

            if (response.ok) {
                const updatedData = await response.json();
                setAdminMarketData(updatedData);
                setEditMode(false);
                alert('Market successfully updated')
                console.log('Market data updated successful:', updatedData);
                // window.location.reload();
            } else {
                console.log('Failed to save changes');
                console.log('Response status;', response.status);
                console.log('Response text:', await response.text());
                window.location.reload();
            }
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    };

    const handleSaveDayChanges = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/market-days/${selectedDay.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(selectedDay)
            });
            console.log('Request body:', JSON.stringify(selectedDay));

            if (response.ok) {
                const updatedData = await response.json();
                setSelectedDay(updatedData);
                setEditDayMode(false);
                console.log('Market data updated successful:', updatedData);
                window.location.reload();
            } else {
                console.log('Failed to save changes');
                console.log('Response status;', response.status);
                console.log('Response text:', await response.text());
            }
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    };

    const handleFileChange = (event) => {
        if (event.target.files) {
            setStatus('initial');
            setImage(event.target.files[0]);
        }
    }

    
    return(
        <>

            <div className='box-bounding'>
                <h2>Edit Markets</h2>
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
                <div className='margin-t-16'>
                    {editMode ? (
                        <>
                            <div className='form-group'>
                                <label>Market Name:</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={adminMarketData ? adminMarketData.name : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label>Location:</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={adminMarketData ? adminMarketData.location : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label>Zipcode:</label>
                                <input
                                    type="text"
                                    name="zipcode"
                                    value={adminMarketData ? adminMarketData.zipcode : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label>Latitude:</label>
                                <input
                                    type="text"
                                    name="coordinates_lat"
                                    value={adminMarketData ? adminMarketData.coordinates.lat : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label>Longitude:</label>
                                <input
                                    type="text"
                                    name="coordinates_lng"
                                    value={adminMarketData ? adminMarketData.coordinates.lng : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label title="Day ( # a.m. - # p.m.)">Schedule:</label>
                                <p>True</p>
                                <input
                                    type="text"
                                    name="schedule"
                                    value={adminMarketData ? adminMarketData.schedule : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label title="true or false">Year Round:</label>
                                <input
                                    type="text"
                                    name="year_round"
                                    value={adminMarketData ? adminMarketData.year_round : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label title="yyyy-mm-dd">Season Start:</label>
                                <input
                                    type="text"
                                    name="season_start"
                                    placeholder='yyyy-mm-dd if Year Round is False'
                                    value={adminMarketData ? adminMarketData.season_start : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label title="yyyy-mm-dd">Season End:</label>
                                <input
                                    type="text"
                                    name="season_end"
                                    placeholder='yyyy-mm-dd if Year Round is False'
                                    value={adminMarketData ? adminMarketData.season_end : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label>Vendor Image:</label>
                                <input
                                    type="file"
                                    name="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                            <button className='btn-edit' onClick={handleSaveChanges}>Save Changes</button>
                            <button className='btn-edit' onClick={handleEditToggle}>Cancel</button>
                        </>
                    ) : (
                        <>
                            <table>
                                <tbody>
                                    <tr>
                                        <td className='cell-title'>Image:</td>
                                        <td className='cell-text'>{adminMarketData ? <img className='img-market' src={`/market-images/${adminMarketData.image}`} alt="Market Image" /> : ''}</td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title'>Name:</td>
                                        <td className='cell-text'>{adminMarketData ? `${adminMarketData.name}` : ''}</td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title'>Location:</td>
                                        <td className='cell-text'>{adminMarketData ? adminMarketData.location : ''}</td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title'>Zipcode:</td>
                                        <td className='cell-text'>{adminMarketData ? adminMarketData.zipcode : ''}</td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title'>Latitude:</td>
                                        <td className='cell-text'>{adminMarketData ? adminMarketData.coordinates.lat : ''}</td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title'>Longitude:</td>
                                        <td className='cell-text'>{adminMarketData ? adminMarketData.coordinates.lng : ''}</td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title' title="Day ( # a.m. - # p.m.)">Schedule:</td>
                                        <td className='cell-text'>{adminMarketData ? adminMarketData.schedule : ''}</td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title' title="true or false">Year Round:</td>
                                        <td className='cell-text'>{adminMarketData ? `${adminMarketData.year_round}` : ''}</td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title' title="yyyy-mm-dd">Season Start:</td>
                                        <td className='cell-text'>{adminMarketData ? adminMarketData.season_start : ''}</td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title' title="yyyy-mm-dd">Season End:</td>
                                        <td className='cell-text'>{adminMarketData ? adminMarketData.season_end : ''}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <button className='btn-edit' onClick={handleEditToggle}>Edit</button>
                        </>
                    )}
                    <div className='flex-start margin-t-16'>
                        <label><h4>Market Day: &emsp;</h4></label>
                        <select id="marketDaysSelect" name="marketDays" onChange={handleDayChange}>
                            {marketDays.map((day, index) => (
                                <option key={index} value={day.id}>
                                    {weekday[day.day_of_week]}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                {editDayMode ? (
                    <>
                        <div className='form-group'>
                            <label>Market Day:</label>
                            <input
                                type="text"
                                name="day_of_week"
                                value={selectedDay ? weekday[selectedDay.day_of_week] : ''}
                                onChange={handleWeekdayChange}
                            />
                        </div>
                        <div className='form-group'>
                            <label>Start Time:</label>
                            <input
                                type="text"
                                name="hour_start"
                                value={selectedDay ? selectedDay.hour_start : ''}
                                onChange={handleInputMarketDayChange}
                            />
                        </div>
                        <div className='form-group'>
                            <label>End Time:</label>
                            <input
                                type="text"
                                name="hour_end"
                                value={selectedDay ? selectedDay.hour_end : ''}
                                onChange={handleInputMarketDayChange}
                            />
                        </div>
                        <button className='btn-edit' onClick={handleSaveDayChanges}>Save Changes</button>
                        <button className='btn-edit' onClick={handleEditDayToggle}>Cancel</button>
                    </>
                ) : (
                    <>
                        <table>
                            <tbody>
                                <tr>
                                    <td className='cell-title'>Day of Week:</td>
                                    <td className='cell-text'>{selectedDay ? weekday[selectedDay.day_of_week] : ''}</td>
                                </tr>
                                <tr>
                                    <td className='cell-title'>Start Time:</td>
                                    <td className='cell-text'>{selectedDay ? timeConverter(selectedDay.hour_start) : ''}</td>
                                </tr>
                                <tr>
                                    <td className='cell-title'>End Time:</td>
                                    <td className='cell-text'>{selectedDay ? timeConverter(selectedDay.hour_end) : ''}</td>
                                </tr>
                            </tbody>
                        </table>
                        <button className='btn-edit' onClick={handleEditDayToggle}>Edit</button>
                    </>
                )}
            </div>
        </>
    )
}
export default AdminMarketEdit;