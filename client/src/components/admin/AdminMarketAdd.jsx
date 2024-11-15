import React, { useState } from 'react';

function AdminMarketAdd() {
    const [newMarket, setNewMarket] = useState(null);


    const handleInputMarketChange = (event) => {
        setNewMarket({
            ...newMarket,
            [event.target.name]: event.target.value,
        });
    };

    const handleSaveMarket = async () => {
        try {
            if (newMarket.year_round === 'True' || "true") {
                newMarket.year_round = true;
            } else if (newMarket.year_round === 'False' || "false") {
                newMarket.year_round = false;
            }

            const response = await fetch(`http://127.0.0.1:5555/markets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newMarket),

            });
            console.log('Request body:', JSON.stringify(newMarket));

            if (response.ok) {
                const updatedData = await response.json();
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

    return (
        <>
            <div className='bounding-box'>
                <h2>Add Market</h2>
                <div className='title'>
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
                    <button className='btn-edit' onClick={handleSaveMarket}>Save Market</button>
                </div>
            </div>
        </>
    )
}

export default AdminMarketAdd;