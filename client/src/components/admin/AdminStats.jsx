import React, { useEffect, useRef, useState } from 'react';
import PulseLoader from 'react-spinners/PulseLoader';
import Chart from 'chart.js/auto';

function AdminStats() {
    const [userCount, setUserCount] = useState(null)
    const [userCountBanned, setUserCountBanned] = useState(null)
    const [vendorUserCount, setVendorUserCount] = useState(null)
    const [adminUserCount, setAdminUserCount] = useState(null)
    const [marketCount, setMarketCount] = useState(null)
    const [marketDayCount, setMarketDayCount] = useState(null)
    const [vendorCount, setVendorCount] = useState(null)
    const [basketCount, setBasketCount] = useState(null)
    const [top10Markets, setTop10Markets] = useState(null)
    const [top10Vendors, setTop10Vendors] = useState(null)
    const [top10MarketFavs, setTop10MarketFavs] = useState(null)
    const [top10VendorFavs, setTop10VendorFavs] = useState(null)
    const [top10Users, setTop10Users] = useState(null)
    const [top10Cities, setTop10Cities] = useState(null)
    const [baskets, setBaskets] = useState([]);
    const [selectedRangeGraph, setSelectedRangeGraph] = useState(7);
    const [userData, setUserData] = useState(null);

    const chartRef = useRef();

    const adminUserId = localStorage.getItem('admin_user_id')
    const token = localStorage.getItem('admin_jwt-token');

    useEffect(() => {
        if (!adminUserId) return
        const fetchUserData = async () => {
            try {
                const response = await fetch(`/api/admin-users/${adminUserId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUserData(data);
                } else {
                    console.error('Error fetching profile:', response.status);
                    if (response.status === 401) {
                        console.error('Unauthorized: Token may be missing or invalid');
                    }
                }
            } catch (error) {
                console.error('Error fetching vendor data:', error);
            }
        };
        fetchUserData();
    }, [adminUserId]);

    useEffect(() => {
        fetch('/api/users/count', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
            .then(response => response.json())
            .then(data => {
                setUserCount(data);
            })
            .catch(error => console.error('Error fetching user data:', error));
    }, []);

    useEffect(() => {
        fetch('/api/vendor-users/count', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
            .then(response => response.json())
            .then(data => {
                setVendorUserCount(data);
            })
            .catch(error => console.error('Error fetching vendor user data:', error));
    }, []);

    useEffect(() => {
        fetch('/api/admin-users/count', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
            .then(response => response.json())
            .then(data => {
                setAdminUserCount(data);
            })
            .catch(error => console.error('Error fetching admin user data:', error));
    }, []);

    useEffect(() => {
        fetch('/api/users/count?status=banned', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
            .then(response => response.json())
            .then(data => {
                setUserCountBanned(data);
            })
            .catch(error => console.error('Error fetching banned user data:', error));
    }, []);

    useEffect(() => {
        fetch('/api/users/top-10-cities', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
            .then(response => response.json())
            .then(data => {
                setTop10Cities(data);
            })
            .catch(error => console.error('Error fetching city data:', error));
    }, []);

    useEffect(() => {
        fetch('/api/markets/count', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
            .then(response => response.json())
            .then(data => {
                setMarketCount(data);
            })
            .catch(error => console.error('Error fetching market data:', error));
    }, []);

    useEffect(() => {
        fetch('/api/market-days/count', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
            .then(response => response.json())
            .then(data => {
                setMarketDayCount(data);
            })
            .catch(error => console.error('Error fetching market day data:', error));
    }, []);

    useEffect(() => {
        fetch('/api/vendors/count', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
            .then(response => response.json())
            .then(data => {
                setVendorCount(data);
            })
            .catch(error => console.error('Error fetching vendor data:', error));
    }, []);

    useEffect(() => {
        fetch('/api/baskets/count', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
            .then(response => response.json())
            .then(data => {
                setBasketCount(data);
            })
            .catch(error => console.error('Error fetching basket data:', error));
    }, []);

    useEffect(() => {
        fetch('/api/baskets/top-10-markets', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
            .then(response => response.json())
            .then(data => {
                setTop10Markets(data);
            })
            .catch(error => console.error('Error fetching market data:', error));
    }, []);

    useEffect(() => {
        fetch('/api/baskets/top-10-vendors', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
            .then(response => response.json())
            .then(data => {
                setTop10Vendors(data);
            })
            .catch(error => console.error('Error fetching basket vendor data:', error));
    }, []);

    useEffect(() => {
        fetch('/api/baskets/top-10-users', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
            .then(response => response.json())
            .then(data => {
                setTop10Users(data);
            })
            .catch(error => console.error('Error fetching basket user data:', error));
    }, []);

    useEffect(() => {
        fetch('/api/market-favorites/top-10-markets', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
            .then(response => response.json())
            .then(data => {
                setTop10MarketFavs(data);
            })
            .catch(error => console.error('Error fetching market data:', error));
    }, []);

    useEffect(() => {
        fetch('/api/vendor-favorites/top-10-vendors', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
            .then(response => response.json())
            .then(data => {
                setTop10VendorFavs(data);
            })
            .catch(error => console.error('Error fetching vendor data:', error));
    }, []);

    const handleDownloadCSV = async (route) => {
        try {
            const response = await fetch(`/api/export-csv/${route}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to download file');
            }

            const json = await response.json();

            if (!json.csv) {
                throw new Error('Invalid CSV data received');
            }

            const filename = json.filename || "export.csv";
            const csvData = json.csv;

            const blob = new Blob([csvData], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.setAttribute('download', filename);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading file:', error);
        }
    };

    const dateRange = {
        "Next Week": -7,
        "Week": 7,
        "Month": 31,
        "3 Months": 91,
        "6 Months": 183,
        "Year": 365,
    }

    function getDatesForRange(range = 31, baskets = []) {
        const dates = [];
        const today = new Date();

        if (range < 0) {
            // Future range (moving forward in time)
            for (let i = 1; i < Math.abs(range); i++) {
                const currentDate = new Date(today);
                currentDate.setDate(today.getDate() + i);
                dates.push(currentDate.toDateString()); // Use full date format
            }
        } else {
            // Past range (moving backward in time)
            for (let i = 0; i < range; i++) {
                const currentDate = new Date(today);
                currentDate.setDate(today.getDate() - i);
                dates.push(currentDate.toDateString()); // Use full date format
            }
            dates.reverse(); // Reverse to keep chronological order
        }
        return dates;
    }

    useEffect(() => {
        fetch('/api/baskets')
            .then(response => response.json())
            .then(data => {
                setBaskets(data)
            })
            .catch(error => console.error('Error fetching baskets', error));
    }, []);

    const handleDateChangeGraph = (event) => {
        setSelectedRangeGraph(event.target.value);
    };

    useEffect(() => {
            const ctx = document.getElementById(`chart-baskets`);
    
            if (chartRef.current) {
                chartRef.current.destroy();
            }
    
            // Process baskets and filter based on the selected date range
            function processBaskets(baskets) {
                const isFuture = selectedRangeGraph < 0;
    
                // Get allowed dates based on the range
                const allowedDates = getDatesForRange(selectedRangeGraph).map((date) =>
                    new Date(date).toDateString()
                );
    
                // Filter baskets based on allowed dates
                const filteredBaskets = baskets.filter((basket) => {
                    const basketDate = new Date(basket.sale_date).toDateString();
                    return allowedDates.includes(basketDate);
                });
    
                const soldData = {};
                const unsoldData = {};
    
                // Group baskets by sale_date and categorize into sold/unsold
                filteredBaskets.forEach((basket) => {
                    const basketDate = new Date(basket.sale_date).toDateString(); // Normalize date
                    if (basket.is_sold) {
                        soldData[basketDate] = (soldData[basketDate] || 0) + 1;
                    } else {
                        unsoldData[basketDate] = (unsoldData[basketDate] || 0) + 1;
                    }
                });
    
                return { soldData, unsoldData };
            }
            
            const { soldData, unsoldData } = processBaskets(baskets);
            
            const data = {
                labels: getDatesForRange(selectedRangeGraph),
                datasets: [
                    {
                        label: 'Sold Baskets',
                        data: getDatesForRange(selectedRangeGraph).map(date => soldData[date] || 0),
                        borderColor: "#007BFF",
                        backgroundColor: "#6c7ae0",
                        borderWidth: 2,
                        borderRadius: 2,
                        borderSkipped: false,
                    },
                    {
                        label: 'Unsold Baskets',
                        data: getDatesForRange(selectedRangeGraph).map(date => unsoldData[date] || 0),
                        borderColor: "#ff6699",
                        backgroundColor: "#ff806b",
                        borderWidth: 2,
                        borderRadius: 2,
                        borderSkipped: false,
                    }
                ]
            };
    
            chartRef.current = new Chart(ctx, {
                type: 'bar',
                data: data,
                options: {
                    scales: {
                        x: {
                            stacked: true,
                        },
                        y: {
                            stacked: true,
                            min: 0,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: true
                        }
                    }
                }
            });
    
            return () => {
                if (chartRef.current) {
                    chartRef.current.destroy();
                }
            };
        }, [baskets, selectedRangeGraph]);


    return (
        <>
            <h1>Admin Statistics</h1>
            {userData?.admin_role <= 3 && (
                <>
                    <div className='box-bounding'>
                        <h2>Export Database</h2>
                        <div className='flex-space-between flex-wrap'>
                            <table>
                                <tbody>
                                    <tr>
                                        <td><p>Export Users table as CSV &emsp;</p></td>
                                        <td><button className='btn btn-add' onClick={() => handleDownloadCSV("users")}>Download</button></td>
                                    </tr>
                                    <tr>
                                        <td><p>Export Markets table as CSV &emsp;</p></td>
                                        <td><button className='btn btn-add' onClick={() => handleDownloadCSV('markets')}>Download</button></td>
                                    </tr>
                                    <tr>
                                        <td><p>Export Vendors table as CSV &emsp;</p></td>
                                        <td><button className='btn btn-add' onClick={() => handleDownloadCSV('vendors')}>Download</button></td>
                                    </tr>
                                </tbody>
                            </table>
                            <table>
                                <tbody>
                                    <tr>
                                        <td><p>Export Vendor Users table as CSV &emsp;</p></td>
                                        <td><button className='btn btn-add' onClick={() => handleDownloadCSV("vendor-users")}>Download</button></td>
                                    </tr>
                                    <tr>
                                        <td><p>Export Baskets table as CSV &emsp;</p></td>
                                        <td><button className='btn btn-add' onClick={() => handleDownloadCSV("baskets")}>Download</button></td>
                                    </tr>
                                    <tr>
                                        <td><p>Export Products table as CSV &emsp;</p></td>
                                        <td><button className='btn btn-add' onClick={() => handleDownloadCSV("products")}>Download</button></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className='box-bounding'>
                        <div className='flex-space-between flex-bottom-align'>
                            <h2 className='margin-t-16'>Basket Sales</h2>
                            <select className='' value={selectedRangeGraph} onChange={handleDateChangeGraph}>
                                {/* <option value="">Time Frame</option> */}
                                {Object.entries(dateRange).map(([label, value]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <div className='box-bounding'>
                                {baskets ? (
                                    <canvas id="chart-baskets"></canvas>
                                ) : (
                                    <PulseLoader
                                        className='margin-t-12'
                                        color={'#ff806b'}
                                        size={10}
                                        aria-label="Loading Spinner"
                                        data-testid="loader"
                                    />
                                )}
                            </div>
                        </div>
                        <h3 className='margin-t-16'>Basket Details</h3>
                        <table className='table-stats'>
                            <thead>
                                <tr>
                                    <th>&emsp;</th>
                                    <th>Baskets</th>
                                    <th>Sold</th>
                                    <th>Grabbed</th>
                                    <th>Unsold</th>
                                    <th>Sold Price</th>
                                    <th>Sold Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <th>Total:</th>
                                    <td className='table-center'>{basketCount?.count}</td>
                                    <td className='table-center'>{basketCount?.sold_count}</td>
                                    <td className='table-center'>{basketCount?.grabbed_count}</td>
                                    <td className='table-center'>{basketCount?.unsold_count}</td>
                                    <td className='table-center'>${basketCount?.sold_price}</td>
                                    <td className='table-center'>${basketCount?.sold_value}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </>
            )}
            <div className='box-bounding'>
                <h3>General Count</h3>
                <table className='table-stats'>
                    <thead>
                        <tr>
                            <th>&emsp;</th>
                            <th>Markets</th>
                            <th>Market Days</th>
                            <th>Vendors</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th>Total:</th>
                            <td className='table-center'>{marketCount?.count}</td>
                            <td className='table-center'>{marketDayCount?.count}</td>
                            <td className='table-center'>{vendorCount?.count}</td>
                        </tr>
                    </tbody>
                </table>
                <h3 className='margin-t-16'>User Totals</h3>
                <table className='table-stats'>
                    <thead>
                        <tr>
                            <th>&emsp;</th>
                            <th>Users</th>
                            <th>Vendor Users</th>
                            <th>Admin Users</th>
                            <th>All Users</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th>Total</th>
                            <td className='table-center'>{userCount?.count}</td>
                            <td className='table-center'>{vendorUserCount?.count}</td>
                            <td className='table-center'>{adminUserCount?.count}</td>
                            <td className='table-center'>{userCount?.count + vendorUserCount?.count + adminUserCount?.count}</td>
                        </tr>
                        <tr>
                            <th>Banned</th>
                            <td className='table-center'>{userCountBanned?.count}</td>
                            <td className='table-center'>0</td>
                            <td className='table-center'>0</td>
                            <td className='table-center'>{userCountBanned?.count}</td>
                        </tr>
                    </tbody>
                </table>
                <div className='flex-space-between flex-gap-16 m-flex-wrap'>
                    <div className='flex-grow-1'>
                        <h3 className='margin-t-16'>Top 10 User Cities</h3>
                        <table className='table-stats'>
                            <thead>
                                <tr>
                                    <th>&emsp;</th>
                                    <th>City</th>
                                    <th>State</th>
                                    <th>Total Users</th>
                                </tr>
                            </thead>
                            <tbody>
                                {top10Cities && top10Cities
                                    .sort((a, b) => b.count - a.count)
                                    .map((item, index) => (
                                        <tr key={index}>
                                            <th>{index + 1}</th>
                                            <td>{item.city}</td>
                                            <td>{item.state}</td>
                                            <td className='table-center'>{item.count}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                    <div className='flex-grow-1'>
                        <h3 className='margin-t-16'>Top 10 Users</h3>
                        <table className='table-stats'>
                            <thead>
                                <tr>
                                    <th>&emsp;</th>
                                    <th>Name</th>
                                    <th>Baskets Bought</th>
                                    <th>Email</th>
                                </tr>
                            </thead>
                            <tbody>
                                {top10Users && top10Users
                                    .sort((userA, userB) => userB.basket_count - userA.basket_count) // Sort by basket_count descending
                                    .map((user, index) => (
                                        <tr key={index}>
                                            <th>{index + 1}</th>
                                            <td className='table-center'>{user.first_name} {user.last_name}</td>
                                            <td className='table-center'>{user.basket_count}</td>
                                            <td>{user.email}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className='flex-space-between flex-gap-16 m-flex-wrap'>
                    <div className='flex-grow-1'>
                        <h3 className='margin-t-16'>Top 10 Markets</h3>
                        <table className='table-stats'>
                            <thead>
                                <tr>
                                    <th>&emsp;</th>
                                    <th>Market</th>
                                    <th>Baskets Sold</th>
                                </tr>
                            </thead>
                            <tbody>
                                {top10Markets && Object.entries(top10Markets)
                                    .sort(([, countA], [, countB]) => countB - countA)
                                    .map(([market, count], index) => (
                                        <tr key={index}>
                                            <th>{index + 1}</th>
                                            <td>{market}</td>
                                            <td className='table-center'>{count}</td>
                                        </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className='flex-grow-1'>
                        <h3 className='margin-t-16'>Top 10 Favorite Markets</h3>
                        <table className='table-stats'>
                            <thead>
                                <tr>
                                    <th>&emsp;</th>
                                    <th>Market</th>
                                    <th>Times Favorited</th>
                                </tr>
                            </thead>
                            <tbody>
                                {top10MarketFavs && top10MarketFavs
                                    .sort((a, b) => b.favorite_count - a.favorite_count)
                                    .map((item, index) => (
                                        <tr key={index}>
                                            <th>{index + 1}</th>
                                            <td>{item.market_name}</td>
                                            <td className='table-center'>{item.favorite_count}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className='flex-space-between flex-gap-16 m-flex-wrap'>
                    <div className='flex-grow-1'>
                        <h3 className='margin-t-16'>Top 10 Vendors</h3>
                        <table className='table-stats'>
                            <thead>
                                <tr>
                                    <th>&emsp;</th>
                                    <th>Vendor</th>
                                    <th>Baskets Sold</th>
                                </tr>
                            </thead>
                            <tbody>
                                {top10Vendors && Object.entries(top10Vendors)
                                    .sort(([, countA], [, countB]) => countB - countA)
                                    .map(([vendor, count], index) => (
                                        <tr key={index}>
                                            <th>{index + 1}</th>
                                            <td>{vendor}</td>
                                            <td className='table-center'>{count}</td>
                                        </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className='flex-grow-1'>
                        <h3 className='margin-t-16'>Top 10 Favorite Vendors</h3>
                        <table className='table-stats'>
                            <thead>
                                <tr>
                                    <th>&emsp;</th>
                                    <th>Vendor</th>
                                    <th>Times Favorited</th>
                                </tr>
                            </thead>
                            <tbody>
                                {top10VendorFavs && top10VendorFavs
                                    .sort((a, b) => b.favorite_count - a.favorite_count)
                                    .map((item, index) => (
                                        <tr key={index}>
                                            <th>{index + 1}</th>
                                            <td>{item.vendor_name}</td>
                                            <td className='table-center'>{item.favorite_count}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

export default AdminStats;