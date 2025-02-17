import React, { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { markets_default, states } from '../../utils/common';
import { formatDate } from '../../utils/helpers';
import { toast } from 'react-toastify';

function AdminMarketEdit({ markets, timeConverter, weekDay, weekDayReverse }) {
    const [marketDayDetails, setMarketDayDetails] = useState([])
    const [marketDays, setMarketDays] = useState([])
    const [selectedDay, setSelectedDay] = useState(null);
    const [query, setQuery] = useState("");
    const [locationQuery, setLocationQuery] = useState([]);
    const [cityQuery, setCityQuery] = useState("");
    const [stateQuery, setStateQuery] = useState("");
    const [isCurrent, setIsCurrent] = useState("");
    const [isVisible, setIsVisible] = useState("");
    const [isYearRound, setIsYearRound] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [editDayMode, setEditDayMode] = useState(false);
    const [adminMarketData, setAdminMarketData] = useState(null);
    const [tempMarketData, setTempMarketData] = useState(null);
    const [tempMarketDayData, setTempMarketDayData] = useState(null);
    const [image, setImage] = useState(null)
    const [showDropdown, setShowDropdown] = useState(false);
    const [status, setStatus] = useState('initial')
    const [showFilters, setShowFilters] = useState(false)

    const dropdownRef = useRef(null);
    const { handlePopup } = useOutletContext();

    const onUpdateQuery = (event) => {
        const value = event.target.value;
        setQuery(value);
        setShowDropdown(value.trim().length > 0);
    };

    const onUpdateLocationQuery = (event) => {
        const value = event.target.value;
        setCityQuery(prev => prev);
        setShowDropdown(value.trim().length > 0);
    };

    const filteredMarketsDropdown = markets.filter(market => {
        if (query && !market?.name?.toLowerCase().includes(query.toLowerCase())) return false;
        if (market.name.toLowerCase() === query.toLowerCase()) return false;
        if (cityQuery && market.city.toLowerCase() !== cityQuery.toLowerCase()) return false;
        if (stateQuery && market.state.toLowerCase() !== stateQuery.toLowerCase()) return false;
        if (isVisible !== "") {
            if (market.is_visible !== isVisible) return false;
        }
        if (isCurrent !== "") {
            if (market.is_current !== isCurrent) return false;
        }
        if (isYearRound !== "") {
            if (market.year_round !== isYearRound) return false;
        }

        return true;
    });

    const filteredLocationDropdown = Array.from(new Set(markets
        .filter(market => {
            // if (query && !market?.name?.toLowerCase().includes(query.toLowerCase())) return false;
            if ((market.city.toLowerCase() === cityQuery.toLowerCase()) && (market.state.toLowerCase() === stateQuery.toLowerCase())) return false;
            if (cityQuery && !market.city.toLowerCase().includes(cityQuery.toLowerCase())) return false;
            if (stateQuery && !market.state.toLowerCase().includes(stateQuery.toLowerCase())) return false;

            return true;
        })
        .map(market => `${market.city}, ${market.state}`)))  // Convert to unique strings
        .map(cityState => {
            const [city, state] = cityState.split(","); // Convert back to object
            return { city, state };
        });

    const filteredMarketsResults = markets.filter(market => {
        if (!market?.name) return false;

        if (query && !market?.name?.toLowerCase().includes(query.toLowerCase())) return false;
        if (locationQuery[0] && market.city.toLowerCase() !== locationQuery[0].toLowerCase()) return false;
        if (locationQuery[1] && market.state.toLowerCase() !== locationQuery[1].toLowerCase()) return false;
        if (isVisible !== "" && market.is_visible !== isVisible) return false;
        if (isCurrent !== "" && market.is_current !== isCurrent) return false;
        if (isYearRound !== "" && market.year_round !== isYearRound) return false;

        return true
    });

    const matchingMarket = markets.find(market => (market.name.toLowerCase() === query.toLowerCase()) && (market.city.toLowerCase().includes(cityQuery.toLowerCase()) && (market.state.toLowerCase() === stateQuery.toLowerCase())));
    const matchingMarketId = matchingMarket ? matchingMarket.id : null;

    const handleVisibilityChange = (value) => {
        setIsVisible(prev => (prev === value ? "" : value));
    };
    
    const handleCurrentChange = (value) => {
        setIsCurrent(prev => (prev === value ? "" : value));
    };
    
    const handleYearRoundChange = (value) => {
        setIsYearRound(prev => (prev === value ? "" : value));
    };

    const handleDropDownFilters = (event) => {
        setShowFilters(!showFilters)
    }

    useEffect(() => {
        fetch(`/api/market-days?market_id=${matchingMarketId}`)
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
                    const response = await fetch(`/api/markets/${matchingMarketId}`, {
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
            const response = await fetch('/api/upload', {
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
            handlePopup();
            return;
        }
    
        try {
            console.log('Deleting image:', adminMarketData.image);
    
            const response = await fetch('/api/delete-image', {
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
    
                toast.success('Image deleted successfully.', {
                    autoClose: 4000,
                });
            } else {
                const errorText = await response.text();
                console.error('Failed to delete image:', errorText);
                toast.success(`Failed to delete the image: ${JSON.parse(errorText).error}`, {
                    autoClose: 6000,
                });
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            toast.success('An unexpected error occurred while deleting the image.', {
                autoClose: 5000,
            });
        }
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setTempMarketData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleCoordinatesInputChange = (event) => {
        const { name, value } = event.target;
        setTempMarketData((prevData) => {
            const newCoordinates = { ...prevData.coordinates };
            if (name === "coordinates_lat") {
                newCoordinates.lat = value;
            } else if (name === "coordinates_lng") {
                newCoordinates.lng = value;
            }

            return {
                ...prevData,
                coordinates: newCoordinates
            };
        });
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

    const handleSaveChanges = async (event) => {
        if (confirm(`Are you sure you want to edit ${adminMarketData.name}'s account?`)) {
            try {
                const response = await fetch(`/api/markets/${matchingMarketId}`, {
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
                    toast.success('Market details updated successfully.', {
                        autoClose: 5000,
                    });
        
                    if (image) {
                        await handleImageUpload(matchingMarketId);
                    }
                } else {
                    console.error('Failed to save market details:', await response.text());
                }
            } catch (error) {
                console.error('Error saving market changes:', error);
            }
        }
    };

    const handleSaveDayChanges = async (event) => {
        try {
            const response = await fetch(`/api/market-days/${selectedDay.id}`, {
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

    const handleClickOutsideDropdown = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setShowDropdown(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutsideDropdown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutsideDropdown);
        };
    }, [showDropdown]);

    
    return(
        <>

            <div className='box-bounding'>
                <h2>Edit Markets</h2>
                <table className='margin-t-16'>
                    <tbody>
                        <tr>
                            <td className='cell-title'>Search:</td>
                            <td className='cell-text search-bar-markets'>
                                <input id='search' className="search-bar-markets" type="text" placeholder="Search market names..." value={query} onChange={onUpdateQuery} />
                                {showDropdown && (
                                    <div className="dropdown-content" ref={dropdownRef}>
                                        {
                                            (query || locationQuery[0] || locationQuery[1] || isCurrent !== "" || isVisible !== "") &&
                                            filteredMarketsDropdown.slice(0, 10).map(item => <div className="search-results" key={item.id} onClick={(e) => { setQuery(item.name); setCityQuery(item.city); setStateQuery(item.state); setShowDropdown(false);}}>
                                                {item.name}
                                            </div>)
                                        }
                                    </div>
                                )}
                            </td>
                            <td className='cell-text search-bar-city'>
                                <div className='flex-space-between'>
                                    <input id='search' className="search-bar-city" type="text" placeholder="Search cities..." value={cityQuery} onChange={(e) => setCityQuery(e.target.value)} />
                                    <select
                                        key={stateQuery}
                                        className='select-state'
                                        name="state"
                                        value={stateQuery || ''}
                                        onChange={(e) => setStateQuery(e.target.value)}
                                    >
                                        <option value="">Select</option>
                                        {states.map(state => (
                                            <option key={state} value={state}>
                                                {state}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="dropdown-content">
                                    {
                                        (cityQuery || stateQuery) &&
                                        filteredLocationDropdown.slice(0, 10).map(item => <div className="search-results-city" key={item.id} onClick={(e) => { setCityQuery(item.city); setStateQuery(item.state.trim());}}>
                                            {item.city}, {item.state}
                                        </div>)
                                    }
                                </div>
                            </td>
                            <td>
                                <button className='btn btn-filter' onClick={handleDropDownFilters}>&#9776;</button>
                                {showFilters && (
                                    <div className='dropdown-content box-filters-admin flex-space-between flex-column'>
                                        <table>
                                            <tbody>
                                                <tr>
                                                    <td><label className='text-500 margin-r-8'>Visible:</label></td>
                                                    <td><input
                                                        className='scale-fix-125 margin-r-4'
                                                        type='checkbox'
                                                        checked={isVisible}
                                                        value={true}
                                                        onChange={() => handleVisibilityChange(true)}
                                                    />
                                                    <label className='margin-r-8'>Yes</label>
                                                    <input
                                                        className='scale-fix-125 margin-r-4'
                                                        type='checkbox'
                                                        checked={isVisible === false}
                                                        value={false}
                                                        onChange={() => handleVisibilityChange(false)}
                                                    />
                                                    <label className='margin-r-8'>No</label></td>
                                                </tr>
                                                <tr>
                                                    <td><label className='text-500 margin-r-8'>Current:</label></td>
                                                    <td><input
                                                        className='scale-fix-125 margin-r-4'
                                                        type='checkbox'
                                                        checked={isCurrent}
                                                        value={true}
                                                        onChange={() => handleCurrentChange(true)}
                                                    />
                                                    <label className='margin-r-8'>Yes</label>
                                                    <input
                                                        className='scale-fix-125 margin-r-4'
                                                        type='checkbox'
                                                        checked={isCurrent === false}
                                                        value={false}
                                                        onChange={() => handleCurrentChange(false)}
                                                    />
                                                    <label className='margin-r-8'>No</label></td>
                                                </tr>
                                                <tr>
                                                    <td><label className='text-500 margin-r-8'>Year Round:&emsp;</label></td>
                                                    <td><input
                                                        className='scale-fix-125 margin-r-4'
                                                        type='checkbox'
                                                        checked={isYearRound}
                                                        value={true}
                                                        onChange={() => handleYearRoundChange(true)}
                                                    />
                                                    <label className='margin-r-8'>Yes</label>
                                                    <input
                                                        className='scale-fix-125 margin-r-4'
                                                        type='checkbox'
                                                        checked={isYearRound === false}
                                                        value={false}
                                                        onChange={() => handleYearRoundChange(false)}
                                                    />
                                                    <label className='margin-r-8'>No</label></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>
                <details className='details-markets'>
                    <summary>Market Results</summary>
                    <div>
                        <div className='box-scroll grid-3'>
                            {filteredMarketsResults
                                .sort((a, b) => {
                                    const nameA = a.name.toLowerCase();
                                    const nameB = b.name.toLowerCase();

                                    const numA = nameA.match(/^\D*(\d+)/)?.[1];
                                    const numB = nameB.match(/^\D*(\d+)/)?.[1];

                                    if (numA && numB && nameA[0] >= "0" && nameA[0] <= "9" && nameB[0] >= "0" && nameB[0] <= "9") {
                                        return parseInt(numA) - parseInt(numB);
                                    }

                                    return nameA.localeCompare(nameB, undefined, { numeric: true });
                                })
                                .map(market => (
                                    <div key={market.id} className='box-bounding'>
                                        <h4>{market.name}</h4>
                                        <p className='margin-b-12 text-500' style={{ borderBottom: "1px solid #3b4752"}}>{market.city}, {market.state}</p>
                                        <div className='text-line-1-4'>
                                            {market.year_round === false && market.season_start && market.season_end ? (
                                                <p>{formatDate(market.season_start)} – {formatDate(market.season_end)}</p>
                                            ) : (
                                                market.year_round === false && (!market.season_start || !market.season_end) ? (
                                                    <></>
                                                ) : (
                                                    <p>Open Year Round</p>
                                                )
                                            )}
                                            {/* <p>{market.schedule}</p> */}
                                            <p>Is Visible: &#8202; &#8202;{market.is_visible ? 'Yes' : 'No'}</p>
                                            <p>Is Current: &#8202;{market.is_current ? 'Yes' : 'No'}</p>
                                            <p>Vendors: &emsp; {market.market_days.reduce((total, marketDay) => total + (marketDay.vendor_markets?.length || 0), 0)}</p>
                                        </div>
                                        <div className='text-center margin-t-8'>
                                            <button className='btn btn-file' onClick={(e) => setQuery(market.name)}>Select</button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </details>
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
                                <label>Bio:</label>
                                <textarea
                                    className='textarea-edit'
                                    type="text"
                                    name="bio"
                                    value={tempMarketData ? tempMarketData.bio : ''}
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
                                <label>City:</label>
                                <input
                                    type="text"
                                    name="city"
                                    placeholder='New York'
                                    value={tempMarketData ? tempMarketData.city : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label>State:</label>
                                <select
                                    className='select-state'
                                    name="state"
                                    value={tempMarketData ? tempMarketData.state : ''}
                                    onChange={handleInputChange}
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
                                    onChange={handleCoordinatesInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label>Longitude:</label>
                                <input
                                    type="text"
                                    name="coordinates_lng"
                                    value={tempMarketData?.coordinates?.lng || ''} 
                                    onChange={handleCoordinatesInputChange}
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
                                    <option value={true}>true</option>
                                    <option value={false}>false</option>
                                </select>
                            </div>
                            {tempMarketData?.year_round === false && (
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
                            <div className='form-group'>
                                <label title="true or false">Is Current:</label>
                                <select
                                    name="is_current"
                                    value={tempMarketData ? tempMarketData.is_current : ''}
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
                                        <td className='cell-title'>Bio:</td>
                                        <td className='cell-text'>{adminMarketData ? adminMarketData.bio : ''}</td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title'>Location:</td>
                                        <td className='cell-text'>{adminMarketData ? adminMarketData.location : ''}</td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title'>City:</td>
                                        <td className='cell-text'>{adminMarketData ? adminMarketData.city : ''}</td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title'>State:</td>
                                        <td className='cell-text'>{adminMarketData ? adminMarketData.state : ''}</td>
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
                                    <tr>
                                        <td className='cell-title' title="true or false">Is Current:</td>
                                        <td className='cell-text'>{adminMarketData ? `${adminMarketData.is_current}` : ''}</td>
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