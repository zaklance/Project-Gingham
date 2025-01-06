import React, { useState, useEffect } from 'react';
import { markets_default } from '../../utils/common';

function AdminMarketEdit({ markets, timeConverter, weekDay, weekDayReverse }) {
    const [marketDayDetails, setMarketDayDetails] = useState([])
    const [marketDays, setMarketDays] = useState([])
    const [selectedDay, setSelectedDay] = useState(null);
    const [query, setQuery] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [editDayMode, setEditDayMode] = useState(false);
    const [adminMarketData, setAdminMarketData] = useState(null);
    const [tempMarketData, setTempMarketData] = useState(null);
    const [tempMarketDayData, setTempMarketDayData] = useState(null);
    const [image, setImage] = useState(null)
    const [status, setStatus] = useState('initial')

    const onUpdateQuery = event => setQuery(event.target.value);
    const filteredMarkets = markets.filter(market => market.name.toLowerCase().includes(query.toLowerCase()) && market.name !== query)
    const matchingMarket = markets.find(market => market.name.toLowerCase() === query.toLowerCase());
    const matchingMarketId = matchingMarket ? matchingMarket.id : null;

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/api/market-days?market_id=${matchingMarketId}`)
            .then(response => response.json())
            .then(data => {
                setMarketDays(data)
                setSelectedDay(data[0]);
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
                    const token = localStorage.getItem('admin_jwt-token');
                    const response = await fetch(`http://127.0.0.1:5555/api/markets/${matchingMarketId}`, {
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

    const handleImageUpload = async (marketId) => {
        if (!image) return;
    
        const formData = new FormData();
        formData.append('file', image);
        formData.append('type', 'market'); // Indicate it's a market image
        formData.append('market_id', marketId);
    
        try {
            const response = await fetch('http://127.0.0.1:5555/api/upload', {
                method: 'POST',
                body: formData,
            });
    
            if (response.ok) {
                const data = await response.json();
                setAdminMarketData((prevData) => ({
                    ...prevData,
                    image: `${matchingMarketId}/${data.filename}`, // Update the image in the state
                }));
                setTempMarketData((prevData) => ({
                    ...prevData,
                    image: `${matchingMarketId}/${data.filename}`,
                }));
                setStatus('success');
            } else {
                setStatus('fail');
                console.error('Failed to upload image:', await response.text());
            }
        } catch (error) {
            setStatus('fail');
            console.error('Error uploading image:', error);
        }
    };

    const handleImageDelete = async () => {
        const token = localStorage.getItem('admin_jwt-token');
        if (!token) {
            alert('Admin is not authenticated. Please log in again.');
            return;
        }
    
        try {
            console.log('Deleting image:', adminMarketData.image);
    
            const response = await fetch('http://127.0.0.1:5555/api/delete-image', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    filename: adminMarketData.image,
                    market_id: adminMarketData.id,
                    type: 'market',
                }),
            });
    
            if (response.ok) {
                const result = await response.json();
                console.log('Image deleted successfully:', result);
    
                setAdminMarketData((prevData) => ({
                    ...prevData,
                    image: null,
                }));
    
                alert('Image deleted successfully.');
            } else {
                const errorText = await response.text();
                console.error('Failed to delete image:', errorText);
                alert(`Failed to delete the image: ${JSON.parse(errorText).error}`);
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            alert('An unexpected error occurred while deleting the image.');
        }
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setTempMarketData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleInputMarketDayChange = (event) => {
        setSelectedDay({
            ...selectedDay,
            [event.target.name]: event.target.value,
        });
    };

    const handleWeekDayChange = (event) => {
        setSelectedDay({
            ...selectedDay,
            [event.target.name]: weekDayReverse[event.target.value],
        });
    };

    const handleEditToggle = () => {
        if (!editMode) {
            setTempMarketData({
                ...adminMarketData,
                coordinates: {
                    lat: adminMarketData?.coordinates?.lat || '',
                    lng: adminMarketData?.coordinates?.lng || '',
                },
            });
        } else {
            setTempMarketData(null);
        }
        setEditMode(!editMode);
    };

    const handleEditDayToggle = () => {
        setEditDayMode(!editDayMode);
    };

    const handleSaveChanges = async (event) => {;
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/markets/${matchingMarketId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tempMarketData),
            });
    
            if (response.ok) {
                const updatedData = await response.json();
                setAdminMarketData(updatedData);
                setEditMode(false);
                alert('Market details updated successfully.');
    
                if (image) {
                    await handleImageUpload(matchingMarketId);
                }
            } else {
                console.error('Failed to save market details:', await response.text());
            }
        } catch (error) {
            console.error('Error saving market changes:', error);
        }
    };

    const handleSaveDayChanges = async (event) => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/market-days/${selectedDay.id}`, {
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
            setImage(event.target.files[0]);
            setStatus('initial');
        }
    };

    
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
                <div>
                    {editMode ? (
                        <>
                            <div className='form-group'>
                                <label>Market Name:</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={tempMarketData ? tempMarketData.name : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label>Location:</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={tempMarketData ? tempMarketData.location : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label>Zipcode:</label>
                                <input
                                    type="text"
                                    name="zipcode"
                                    value={tempMarketData ? tempMarketData.zipcode : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label>Latitude:</label>
                                <input
                                    type="text"
                                    name="coordinates_lat"
                                    value={tempMarketData?.coordinates?.lat || ''} 
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label>Longitude:</label>
                                <input
                                    type="text"
                                    name="coordinates_lng"
                                    value={tempMarketData?.coordinates?.lng || ''} 
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label title="Day ( # a.m. - # p.m.)">Schedule:</label>
                                <input
                                    type="text"
                                    name="schedule"
                                    value={tempMarketData ? tempMarketData.schedule : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label title="true or false">Year Round:</label>
                                <select
                                    name="year_round"
                                    value={tempMarketData ? tempMarketData.year_round : ''}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select</option>
                                    <option value={true}>true</option>
                                    <option value={false}>false</option>
                                </select>
                            </div>
                            {tempMarketData?.year_round === 'false' && (
                                <>
                                    <div className='form-group'>
                                        <label title="yyyy-mm-dd">Season Start:</label>
                                        <input
                                            type="date"
                                            name="season_start"
                                            placeholder='yyyy-mm-dd'
                                            value={tempMarketData ? tempMarketData.season_start : ''}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className='form-group'>
                                        <label title="yyyy-mm-dd">Season End:</label>
                                        <input
                                            type="date"  // Changed to 'date' to enforce the format
                                            name="season_end"
                                            placeholder='yyyy-mm-dd'
                                            value={tempMarketData ? tempMarketData.season_end : ''}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </>
                            )}
                            <div className='form-group'>
                                <label title="true or false">Is Visible:</label>
                                <select
                                    name="is_visible"
                                    value={tempMarketData ? tempMarketData.is_visible : ''}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select</option>
                                    <option value={true}>true</option>
                                    <option value={false}>false</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Default Image:</label>
                                <select className='select'
                                    name="image_default"
                                    value={tempMarketData ? tempMarketData.image_default : ''}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select</option>
                                    {Object.entries(markets_default).map(([key, value], index) => (
                                        <option key={index} value={value}>
                                            {key}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className='form-group'>
                                <label>Market Image:</label>
                                {tempMarketData ? (
                                    <>
                                        <img 
                                            style={{ maxWidth: '100%', height: 'auto' }}
                                            src={tempMarketData.image ? `/market-images/${tempMarketData.image}` : `/market-images/_default-images/${tempMarketData.image_default}`}
                                            alt="Market Image" />
                                    </>
                                ) : (
                                    <>No uploaded Image</>
                                )}
                                <div className='flex-start flex-center-align'>
                                    <div className='margin-l-8'>
                                        <button className='btn btn-small btn-blue' onClick={handleImageDelete}>Delete Image</button>
                                    </div>
                                    <label htmlFor='file-upload' className='btn btn-small btn-file nowrap'>Choose File <span className='text-white-background'>{image?.name}</span></label>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        name="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>
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
                                            <td className='cell-text'>{adminMarketData ? <img className='img-market' src={adminMarketData.image ? `/market-images/${adminMarketData.image}` : `/market-images/_default-images/${adminMarketData.image_default}`} alt="Market Image" style={{ maxWidth: '100%', height: 'auto' }} /> : ''}</td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title'>ID:</td>
                                        <td className='cell-text'>{adminMarketData ? `${adminMarketData.id}` : ''}</td>
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
                                    {tempMarketData?.year_round === 'false' && (
                                        <>
                                            <tr>
                                                <td className='cell-title' title="yyyy-mm-dd">Season Start:</td>
                                                <td className='cell-text'>{adminMarketData ? adminMarketData.season_start : ''}</td>
                                            </tr>
                                            <tr>
                                                <td className='cell-title' title="yyyy-mm-dd">Season End:</td>
                                                <td className='cell-text'>{adminMarketData ? adminMarketData.season_end : ''}</td>
                                            </tr>
                                        </>
                                    )}
                                    <tr>
                                        <td className='cell-title' title="true or false">Is Visible:</td>
                                        <td className='cell-text'>{adminMarketData ? `${adminMarketData.is_visible}` : ''}</td>
                                    </tr>
                                </tbody>
                            </table>
                            {matchingMarketId ? (
                                <button className='btn-edit' onClick={handleEditToggle}>Edit</button>
                            ) : (
                                <>
                                </>
                            )}
                        </>
                    )}
                    <div className='flex-start margin-t-16'>
                        <label><h4>Market Day: &emsp;</h4></label>
                        <select id="marketDaysSelect" name="marketDays" onChange={handleDayChange}>
                            {marketDays.map((day, index) => (
                                <option key={index} value={day.id}>
                                    {weekDay[day.day_of_week]}
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
                                value={selectedDay ? weekDay[selectedDay.day_of_week] : ''}
                                onChange={handleWeekDayChange}
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
                                    <td className='cell-text'>{selectedDay ? weekDay[selectedDay.day_of_week] : ''}</td>
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