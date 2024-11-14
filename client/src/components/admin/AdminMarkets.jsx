import React, { useState, useEffect } from 'react';


function AdminMarkets () {
    const [markets, setMarkets] = useState([]);
    const [marketDays, setMarketDays] = useState([])
    const [selectedDay, setSelectedDay] = useState(null);
    const [query, setQuery] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [adminMarketData, setAdminMarketData] = useState(null);
    
    const weekday = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    useEffect(() => {
        fetch("http://127.0.0.1:5555/markets")
        .then(response => response.json())
        .then(markets => setMarkets(markets))
        .catch(error => console.error('Error fetching markets', error));
    }, []);
    
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
            .catch(error => console.error('Error fetching favorites', error));
    }, [matchingMarketId]);

    const handleDayChange = (event) => {
        const dayId = parseInt(event.target.value);
        const day = marketDays.find(day => day.id === dayId);
        setSelectedDay(day);
        setSelectedProduct()
    };

    useEffect(() => {
        const fetchAdminMarketData = async () => {
            try {
                const token = sessionStorage.getItem('jwt-token');
                // console.log('JWT Token:', token);
                const response = await fetch(`http://127.0.0.1:5555/markets/${matchingMarketId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Fetched admin user data:', data);
                    setAdminMarketData(data);
                } else {
                    console.error('Error fetching profile:', response.status);
                    if (response.status === 401) {
                        console.error('Unauthorized: Token may be missing or invalid');
                    }
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
            }
        };
        fetchAdminMarketData();
    }, [matchingMarketId]);

    const handleInputChange = (event) => {
        setAdminMarketData({
            ...adminMarketData,
            [event.target.name]: event.target.value,
        });
    };

    const handleEditToggle = () => {
        setEditMode(!editMode);
    };

    const handleSaveChanges = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/markets/${matchingMarketId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(adminMarketData)
            });
            console.log('Request body:', JSON.stringify(adminMarketData));

            if (response.ok) {
                const updatedData = await response.json();
                setAdminMarketData(updatedData);
                setEditMode(false);
                console.log('Market data updated successfull:', updatedData);
            } else {
                console.log('Failed to save changes');
                console.log('Response status;', response.status);
                console.log('Response text:', await response.text());
            }
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    };
    
    return(
        <div>
            <h2 className='title'>Markets Management</h2>
            <div className='bounding-box'>
                <input className="search-bar" type="text" placeholder="Search markets..." value={query} onChange={onUpdateQuery} />
                <div className="dropdown-content">
                    {
                        query &&
                        filteredMarkets.slice(0, 10).map(item => <div className="search-results" key={item.id} onClick={(e) => setQuery(item.name)}>
                            {item.name}
                        </div>)
                    }
                </div>
                <div className='title'>
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
                                <input
                                    type="text"
                                    name="schedule"
                                    value={adminMarketData ? adminMarketData.schedule : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label title="true or false">Year Round?:</label>
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
                                    value={adminMarketData ? adminMarketData.season_start : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label title="yyyy-mm-dd">Season End:</label>
                                <input
                                    type="text"
                                    name="season_end"
                                    value={adminMarketData ? adminMarketData.season_end : ''}
                                    onChange={handleInputChange}
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
                                        <td className='cell-text'>{adminMarketData ? <img className='img-market' src={`/market-images/${adminMarketData.image}`} alt="Market Image" /> : ' Select a Market...'}</td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title'>Name:</td>
                                        <td className='cell-text'>{adminMarketData ? `${adminMarketData.name}` : 'Select a Market...'}</td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title'>Location:</td>
                                        <td className='cell-text'>{adminMarketData ? adminMarketData.location : ' Select a Market...'}</td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title'>Zipcode:</td>
                                        <td className='cell-text'>{adminMarketData ? adminMarketData.zipcode : ' Select a Market...'}</td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title'>Latitude:</td>
                                        <td className='cell-text'>{adminMarketData ? adminMarketData.coordinates.lat : ' Select a Market...'}</td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title'>Longitude:</td>
                                        <td className='cell-text'>{adminMarketData ? adminMarketData.coordinates.lng : ' Select a Market...'}</td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title' title="Day ( # a.m. - # p.m.)">Schedule:</td>
                                        <td className='cell-text'>{adminMarketData ? adminMarketData.schedule : ' Select a Market...'}</td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title' title="true or false">Year Round? :</td>
                                        <td className='cell-text'>{adminMarketData ? `${adminMarketData.year_round}` : ' Select a Market...'}</td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title' title="yyyy-mm-dd">Season Start:</td>
                                        <td className='cell-text'>{adminMarketData ? adminMarketData.season_start : ' Select a Market...'}</td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title' title="yyyy-mm-dd">Season End:</td>
                                        <td className='cell-text'>{adminMarketData ? adminMarketData.season_end : ' Select a Market...'}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <button className='btn-edit' onClick={handleEditToggle}>Edit</button>
                        </>
                    )}
                    <div className='flex-start'>
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
                <p>**market additions, revisions, etc goes here**</p>
            </div>
        </div>
    )
}

export default AdminMarkets;