import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


function AdminMarketDelete({ markets, weekDay, weekDayReverse }) {
    const [query, setQuery] = useState("");
    const [adminMarketData, setAdminMarketData] = useState(null);
    const [marketDays, setMarketDays] = useState([])

    const navigate = useNavigate();

    const onUpdateQuery = event => setQuery(event.target.value);
    const filteredMarkets = markets.filter(market => market.name.toLowerCase().includes(query.toLowerCase()) && market.name !== query)
    const matchingMarket = markets.find(market => market.name.toLowerCase() === query.toLowerCase());
    const matchingMarketId = matchingMarket ? matchingMarket.id : null;

    useEffect(() => {
        const fetchAdminMarketData = async () => {
            if (!matchingMarketId) return
            try {
                const token = localStorage.getItem('admin_jwt-token');
                // console.log('JWT Token:', token);
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
    }, [matchingMarketId]);

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/api/market-days?market_id=${matchingMarketId}`)
            .then(response => response.json())
            .then(data => {
                setMarketDays(data)
            })
            .catch(error => console.error('Error fetching market days', error));
    }, [matchingMarketId]);

    const handleDelete = async (event) => {
        if (confirm(`Are you sure you want to delete ${matchingMarket.name} and all its associated days?`)) {
            const token = localStorage.getItem('admin_jwt-token');

            try {
                for (const day of marketDays) {
                    await fetch(`http://127.0.0.1:5555/api/market-days/${day.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    });
                }
                await fetch(`http://127.0.0.1:5555/api/markets/${matchingMarketId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                alert(`Market "${matchingMarket.name}" and its associated days were successfully deleted.`);
                window.location.href = "/admin/markets?tab=delete";
            } catch (error) {
                console.error('Error deleting market or associated days:', error);
                alert('An error occurred while deleting the market and its associated days.');
            }
        } else {
            setQuery('');
        }
    };

    return(
        <>
            <div className='box-bounding'>
                <h2>Delete Markets</h2>
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
                <table>
                    <tbody>
                        <tr>
                            <td className='cell-title'>Image:</td>
                            <td className='cell-text'>{adminMarketData ? <img className='img-market' src={`/market-images/${adminMarketData.image}`} alt="Market Image" style={{ maxWidth: '100%', height: 'auto' }} /> : ''}</td>
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
                            <td className='cell-text'>{adminMarketData?.coordinates?.lat || ''}</td>
                        </tr>
                        <tr>
                            <td className='cell-title'>Longitude:</td>
                            <td className='cell-text'>{adminMarketData?.coordinates?.lng || ''}</td>
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
                <button className='btn-edit' onClick={handleDelete}>Delete</button>
            </div>
        </>
    )
}
export default AdminMarketDelete;