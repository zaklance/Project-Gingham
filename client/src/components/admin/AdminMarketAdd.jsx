import React, { useState, useEffect } from 'react';

function AdminMarketAdd({ markets, weekdayReverse }) {
    const [newMarket, setNewMarket] = useState(null);
    const [newMarketDay, setNewMarketDay] = useState(null);
    const [marketDays, setMarketDays] = useState([])
    const [image, setImage] = useState(null)
    const [status, setStatus] = useState('initial')
    const [query, setQuery] = useState("");
    const [adminMarketDayData, setAdminMarketDayData] = useState(null);


    const onUpdateQuery = event => setQuery(event.target.value);
    const filteredMarkets = markets.filter(market => market.name.toLowerCase().includes(query.toLowerCase()) && market.name !== query)
    const matchingMarket = markets.find(market => market.name.toLowerCase() === query.toLowerCase());
    const matchingMarketId = matchingMarket ? matchingMarket.id : null;

    useEffect(() => {
        fetch("http://127.0.0.1:5555/api/market-days")
            .then(response => response.json())
            .then(data => {
                const filteredData = data.filter(item => item.market_id === matchingMarketId);
                setMarketDays(filteredData)
            })
            .catch(error => console.error('Error fetching market days', error));
    }, [matchingMarketId]);

    const handleInputMarketChange = (event) => {
        setNewMarket({
            ...newMarket,
            [event.target.name]: event.target.value,
        });
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setNewMarketDay((prev) => ({
            ...prev,
            [name]: value,
            market_id: matchingMarketId
        }));
    };

    const handleSaveMarket = async () => {
        try {
            if (newMarket.year_round === 'True' || "true") {
                newMarket.year_round = true;
            } else if (newMarket.year_round === 'False' || "false") {
                newMarket.year_round = false;
            }

            // Save market details first
            const response = await fetch(`http://127.0.0.1:5555/api/markets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newMarket),
            });

            if (response.ok) {
                const updatedData = await response.json();
                console.log('Market data updated successfully:', updatedData);
                alert('Market successfully created')

                if (image) {
                    await handleImageUpload(updatedData.id);
                }
                window.location.reload();
            } else {
                console.log('Failed to save market details');
                console.log('Response status:', response.status);
                console.log('Response text:', await response.text());
            }
        } catch (error) {
            console.error('Error saving market details:', error);
        }
    };

    const handleImageUpload = async (marketId) => {
        const formData = new FormData();
        formData.append('file', image);
        formData.append('type', 'market');
        formData.append('market_id', marketId);

        try {
            const response = await fetch('http://127.0.0.1:5555/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Image uploaded successfully:', data);
            } else {
                console.error('Failed to upload image');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
        }
    };

    const handleSaveMarketDay = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/market-days`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newMarketDay),

            });
            console.log('Request body:', JSON.stringify(newMarketDay));

            if (response.ok) {
                const updatedData = await response.json();
                alert('Market Day successfully created')
                console.log('Market Day data created successfully:', updatedData);
            } else {
                console.log('Failed to save changes');
                console.log('Response status;', response.status);
                console.log('Response text:', await response.text());
            }
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    };

    const handleWeekdayChange = (event) => {
        setNewMarketDay({
            ...newMarketDay,
            [event.target.name]: weekdayReverse[event.target.value],
        });
    };

    const handleFileChange = (event) => {
        if (event.target.files) {
            setStatus('initial');
            setImage(event.target.files[0]);
        }
    }

    return (
        <>
            <div className='box-bounding flex-start flex-gap-48 flex-wrap'>
                <div>
                    <h2>Add Market</h2>
                    <div className='margin-t-24'>
                        <div className='form-group'>
                            <label>Market Name:</label>
                            <input
                                type="text"
                                name="name"
                                placeholder='Union Square Greenmarket'
                                value={newMarket ? newMarket.name : ''}
                                onChange={handleInputMarketChange}
                            />
                        </div>
                        <div className='form-group'>
                            <label>Location:</label>
                            <input
                                type="text"
                                name="location"
                                placeholder='E. 17th St. & Union Square W.'
                                value={newMarket ? newMarket.location : ''}
                                onChange={handleInputMarketChange}
                            />
                        </div>
                        <div className='form-group'>
                            <label>Zipcode:</label>
                            <input
                                type="text"
                                name="zipcode"
                                placeholder='10003'
                                value={newMarket ? newMarket.zipcode : ''}
                                onChange={handleInputMarketChange}
                            />
                        </div>
                        <div className='form-group'>
                            <label>Latitude:</label>
                            <input
                                type="text"
                                name="coordinates_lat"
                                placeholder='40.736358642578125'
                                value={newMarket ? newMarket.coordinates_lat : ''}
                                onChange={handleInputMarketChange}
                            />
                        </div>
                        <div className='form-group'>
                            <label>Longitude:</label>
                            <input
                                type="text"
                                name="coordinates_lng"
                                placeholder='-73.99076080322266'
                                value={newMarket ? newMarket.coordinates_lng : ''}
                                onChange={handleInputMarketChange}
                            />
                        </div>
                        <div className='form-group'>
                            <label title="Day ( # a.m. - # p.m.)">Schedule:</label>
                            <input
                                type="text"
                                name="schedule"
                                placeholder='Friday & Saturday (8 a.m. - 6 p.m.)'
                                value={newMarket ? newMarket.schedule : ''}
                                onChange={handleInputMarketChange}
                            />
                        </div>
                        <div className='form-group'>
                            <label title="true or false">Year Round:</label>
                            <input
                                type="text"
                                name="year_round"
                                placeholder='true or false'
                                value={newMarket ? newMarket.year_round : ''}
                                onChange={handleInputMarketChange}
                            />
                        </div>
                        <div className='form-group'>
                            <label title="yyyy-mm-dd">Season Start:</label>
                            <input
                                type="text"
                                name="season_start"
                                placeholder='yyyy-mm-dd'
                                value={newMarket ? newMarket.season_start : ''}
                                onChange={handleInputMarketChange}
                            />
                        </div>
                        <div className='form-group'>
                            <label title="yyyy-mm-dd">Season End:</label>
                            <input
                                type="text"
                                name="season_end"
                                placeholder='yyyy-mm-dd'
                                value={newMarket ? newMarket.season_end : ''}
                                onChange={handleInputMarketChange}
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
                        <button className='btn-edit' onClick={handleSaveMarket}>Save Market</button>
                    </div>
                </div>
                <div>
                    <h2>Add Market Day</h2>
                    <table className='margin-t-24'>
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
                    <>
                        <div className='form-group'>
                            <label>Market ID:</label>
                            <input
                                type="text"
                                name="market_id"
                                placeholder='1'
                                value={matchingMarketId ? matchingMarketId : ''}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className='form-group'>
                            <label>Day of Week:</label>
                            <input
                                type="text"
                                name="day_of_week"
                                placeholder='Day will change to number'
                                value={newMarketDay ? newMarketDay.day_of_week : ''}
                                onChange={handleWeekdayChange}
                            />
                        </div>
                        <div className='form-group'>
                            <label>Hour Start:</label>
                            <input
                                type="text"
                                name="hour_start"
                                placeholder='8:00 AM'
                                value={newMarketDay ? newMarketDay.hour_start : ''}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className='form-group'>
                            <label>Location:</label>
                            <input
                                type="text"
                                name="hour_end"
                                placeholder='6:00 PM'
                                value={newMarketDay ? newMarketDay.hour_end : ''}
                                onChange={handleInputChange}
                            />
                        </div>
                        <button className='btn-edit' onClick={handleSaveMarketDay}>Save Market Day</button>
                    </>
                </div>
            </div>
        </>
    )
}

export default AdminMarketAdd;