import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { states, weekDay } from '../../utils/common';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

function AdminMarketAdd({ markets, weekDayReverse }) {
    const [marketDays, setMarketDays] = useState([])
    const [image, setImage] = useState(null)
    const [status, setStatus] = useState('initial')
    const [query, setQuery] = useState("");
    const [adminMarketDayData, setAdminMarketDayData] = useState(null);
    const [newMapDay, setNewMapDay] = useState(0);
    const [newMapLink, setNewMapLink] = useState(null);
    const [newMarket, setNewMarket] = useState({
        name: '',
        website: '',
        location: '',
        zipcode: '',
        coordinates: { lat: '', lng: '' },
        schedule: '',
        maps_organizer: '',
        maps: '',
        year_round: '',
        is_flagship: '',
        is_current: '',
        is_visible: '',
        season_start: '',
        season_end: '',
    });
    const [newMarketDay, setNewMarketDay] = useState({
        market_id: '',
        day_of_week: '',
        hour_start: '',
        hour_end: '',
    });

    const onUpdateQuery = event => setQuery(event.target.value);
    const filteredMarkets = markets.filter(market => market.name.toLowerCase().includes(query.toLowerCase()) && market.name !== query)
    const matchingMarket = markets.find(market => market.name.toLowerCase() === query.toLowerCase());
    const matchingMarketId = matchingMarket ? matchingMarket.id : null;

    useEffect(() => {
        fetch("/api/market-days")
            .then(response => response.json())
            .then(data => {
                const filteredData = data.filter(item => item.market_id === matchingMarketId);
                setMarketDays(filteredData)
            })
            .catch(error => console.error('Error fetching market days', error));
    }, [matchingMarketId]);

    const handleInputMarketChange = (event) => {
        const { name, value } = event.target;
    
        setNewMarket((prev) => {
            const updatedMarket = {
                ...prev,
                [name]: value,
            };
    
            if (name === 'coordinates_lat' || name === 'coordinates_lng') {
                updatedMarket.coordinates = {
                    lat: updatedMarket.coordinates_lat,
                    lng: updatedMarket.coordinates_lng,
                };
            }
    
            return updatedMarket;
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

    const handleAddMap = () => {
        setNewMarket((prevData) => ({
            ...prevData,
            maps: {
                ...prevData.maps,
                [newMapDay]: newMapLink,
            },
        }));
    };

    const handleDeleteMap = (mapId) => {
        setNewMarket((prev) => {
            const newMaps = { ...prev.maps };
            delete newMaps[mapId];
            return {
                ...prev,
                maps: newMaps
            };
        });
    };

    const handleCreateMarket = async (event) => {
        event.preventDefault();
        try {
            // Convert year_round to boolean
            newMarket.year_round = newMarket.year_round === 'true' || newMarket.year_round === true;
            newMarket.is_current = newMarket.is_current === 'true' || newMarket.is_current === true;
            newMarket.is_visible = newMarket.is_visible === 'true' || newMarket.is_visible === true;
            newMarket.is_flagship = newMarket.is_flagship === 'true' || newMarket.is_flagship === true;
    
            // Save market details first
            const response = await fetch(`/api/markets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newMarket),
            });
    
            if (response.ok) {
                const updatedData = await response.json();
                console.log('Market data updated successfully:', updatedData);
                alert('Market successfully created!');
                if (image) {
                    await handleImageUpload(updatedData.id);
                }
                window.location.href = "/admin/markets?tab=add";
            } else {
                console.error('Failed to save market details');
                console.error('Response:', await response.text());
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
            const response = await fetch('/api/upload', {
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

    const handleCreateMarketDay = async (event) => {
        event.preventDefault();
        try {
            if (!newMarketDay.market_id || !newMarketDay.day_of_week) {
                toast.warning('Market ID and Day of Week are required.', {
                    autoClose: 4000,
                });
                return;
            }
    
            const response = await fetch(`/api/market-days`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newMarketDay),
            });
    
            console.log('Request body:', JSON.stringify(newMarketDay));
    
            if (response.ok) {
                const updatedData = await response.json();
                toast.success('Market Day successfully created!', {
                    autoClose: 4000,
                });
                console.log('Market Day data created successfully:', updatedData);
            } else {
                console.error('Failed to save changes');
                console.error('Response:', await response.text());
            }
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    };

    const handleWeekDayChange = (event) => {
        const dayValue = weekDayReverse[event.target.value.toLowerCase()];    
        setNewMarketDay({
            ...newMarketDay,
            day_of_week: dayValue,
        });
    };

    const handleFileChange = (event) => {
        if (event.target.files) {
            const file = event.target.files[0];
            const maxFileSize = 5 * 1024 * 1024; // 5 MB limit
    
            if (file.size > maxFileSize) {
                toast.warning('File size exceeds 5 MB. Please upload a smaller file', {
                    autoClose: 4000,
                });
                return;
            }
    
            setStatus('initial');
            setImage(file);
        }
    };

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
                            <label>Website:</label>
                            <input
                                type="text"
                                name="website"
                                placeholder='https://www.unionsquare.market'
                                value={newMarket ? newMarket.website : ''}
                                onChange={handleInputMarketChange}
                            />
                        </div>
                        <div className='form-group'>
                            <label>Bio:</label>
                            <textarea
                                className='textarea-edit'
                                type="text"
                                name="bio"
                                value={newMarket.bio || ''}
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
                            <label>City:</label>
                            <input
                                type="text"
                                name="city"
                                placeholder='New York'
                                value={newMarket ? newMarket.city : ''}
                                onChange={handleInputMarketChange}
                            />
                        </div>
                        <div className='form-group'>
                            <label>State:</label>
                            <select
                                className='select-state'
                                name="state"
                                value={newMarket ? newMarket.state : ''}
                                onChange={handleInputMarketChange}
                            >
                                <option value="">Select</option>
                                {states.map((state, index) => (
                                    <option key={index} value={state}>
                                        {state}
                                    </option>
                                ))}
                            </select>
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
                                value={newMarket ? newMarket.coordinates?.lat : ''}
                                onChange={handleInputMarketChange}
                            />
                        </div>
                        <div className='form-group'>
                            <label>Longitude:</label>
                            <input
                                type="text"
                                name="coordinates_lng"
                                placeholder='-73.99076080322266'
                                value={newMarket ? newMarket.coordinates?.lng : ''}
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
                            <label>Maps Organizer:</label>
                            <input
                                type="text"
                                name="maps_organizer"
                                placeholder='GrowNYC'
                                value={newMarket ? newMarket.maps_organizer : ''}
                                onChange={handleInputMarketChange}
                            />
                        </div>
                        <div className='form-group'>
                            <label>Maps:</label>
                            <select
                                id="marketSelect"
                                name="map_day"
                                value={newMapDay || ""}
                                onChange={(e) => setNewMapDay(e.target.value)}
                            >
                                {weekDay.map((day, index) => (
                                  <option key={index} value={index}>
                                    {day}
                                  </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                name="map_link"
                                placeholder='If you focus on specific things; ex: "Apples"'
                                value={newMapLink ? newMapLink : ''}
                                onChange={(e) => setNewMapLink(e.target.value)}
                            />
                            <button className='btn btn-small margin-l-8 margin-b-4' onClick={() => handleAddMap()}>Add</button>
                            <Stack className='padding-4' direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                                {newMarket?.maps &&
                                Object.entries(newMarket.maps).map(([dayKey, mapValue]) => (
                                  <Chip
                                    key={dayKey}
                                    style={{
                                      backgroundColor: "#eee",
                                      fontSize: ".9em"
                                    }}
                                    label={
                                      <a
                                        href={mapValue}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ textDecoration: 'none', color: 'inherit' }}
                                      >
                                        {weekDay[dayKey]}
                                      </a>
                                    }
                                    size="small"
                                    onDelete={() => handleDeleteMap(dayKey)}
                                  />
                                ))}
                            </Stack>
                        </div>
                        <div className='form-group'>
                            <label title="true or false">Is Flagship:</label>
                            <select
                                name="is_flagship"
                                value={newMarket ? newMarket.is_flagship : ''}
                                onChange={handleInputMarketChange}
                            >
                                <option value="">Select</option>
                                <option value={true}>Yes</option>
                                <option value={false}>No</option>
                            </select>
                        </div>
                        <div className='form-group'>
                            <label title="true or false">Is Current:</label>
                            <select
                                name="is_current"
                                value={newMarket ? newMarket.is_current : ''}
                                onChange={handleInputMarketChange}
                            >
                                <option value="">Select</option>
                                <option value={true}>Yes</option>
                                <option value={false}>No</option>
                            </select>
                        </div>
                        <div className='form-group'>
                            <label title="true or false">Is Visible:</label>
                            <select
                                name="is_visible"
                                value={newMarket ? newMarket.is_visible : ''}
                                onChange={handleInputMarketChange}
                            >
                                <option value="">Select</option>
                                <option value={true}>Yes</option>
                                <option value={false}>No</option>
                            </select>
                        </div>
                        <div className='form-group'>
                            <label title="true or false">Year Round:</label>
                            <select
                                name="year_round"
                                value={newMarket ? newMarket.year_round : ''}
                                onChange={handleInputMarketChange}
                            >
                                <option value="">Select</option>
                                <option value={true}>Yes</option>
                                <option value={false}>No</option>
                            </select>
                        </div>
                        {newMarket?.year_round === 'false' && (
                            <>
                                <div className='form-group'>
                                    <label title="yyyy-mm-dd">Season Start:</label>
                                    <input
                                        type="date"
                                        name="season_start"
                                        placeholder='yyyy-mm-dd'
                                        value={newMarket ? newMarket.season_start : ''}
                                        onChange={handleInputMarketChange}
                                        required
                                    />
                                </div>
                                <div className='form-group'>
                                    <label title="yyyy-mm-dd">Season End:</label>
                                    <input
                                        type="date"  // Changed to 'date' to enforce the format
                                        name="season_end"
                                        placeholder='yyyy-mm-dd'
                                        value={newMarket ? newMarket.season_end : ''}
                                        onChange={handleInputMarketChange}
                                        required
                                    />
                                </div>
                            </>
                        )}
                        <div className='form-group'>
                            <label>Market Image:</label>
                            <div className='flex-start flex-center-align'>
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
                        <button className='btn-edit' onClick={handleCreateMarket}>Save Market</button>
                    </div>
                </div>
                <div>
                    <h2>Add Market Day</h2>
                    <table className='margin-t-24 margin-b-16'>
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
                                value={matchingMarketId || ''}
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
                                onChange={handleWeekDayChange}
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
                            <label>Hour End:</label>
                            <input
                                type="text"
                                name="hour_end"
                                placeholder='6:00 PM'
                                value={newMarketDay ? newMarketDay.hour_end : ''}
                                onChange={handleInputChange}
                            />
                        </div>
                        <button className='btn-edit' onClick={handleCreateMarketDay}>Save Market Day</button>
                    </>
                </div>
            </div>
        </>
    )
}

export default AdminMarketAdd;