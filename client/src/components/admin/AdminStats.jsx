import React, { useEffect, useState } from 'react';

function AdminStats() {
    const [userCount, setUserCount] = useState(null)
    const [userCountBanned, setUserCountBanned] = useState(null)
    const [vendorUserCount, setVendorUserCount] = useState(null)
    const [adminUserCount, setAdminUserCount] = useState(null)
    const [top10Cities, setTop10Cities] = useState(null)
    const [userCountNYState, setUserCountNYState] = useState(null)
    const [marketCount, setMarketCount] = useState(null)
    const [marketDayCount, setMarketDayCount] = useState(null)
    const [vendorCount, setVendorCount] = useState(null)
    const [basketCount, setBasketCount] = useState(null)
    const [top10Markets, setTop10Markets] = useState(null)
    const [top10Users, setTop10Users] = useState(null)

    const token = localStorage.getItem('admin_jwt-token');

    useEffect(() => {
        fetch('http://127.0.0.1:5555/api/users/count', {
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
        fetch('http://127.0.0.1:5555/api/vendor-users/count', {
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
        fetch('http://127.0.0.1:5555/api/admin-users/count', {
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
        fetch('http://127.0.0.1:5555/api/users/count?status=banned', {
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
        fetch('http://127.0.0.1:5555/api/users/top-10-cities', {
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
        fetch('http://127.0.0.1:5555/api/markets/count', {
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
        fetch('http://127.0.0.1:5555/api/market-days/count', {
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
        fetch('http://127.0.0.1:5555/api/vendors/count', {
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
        fetch('http://127.0.0.1:5555/api/baskets/count', {
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
        fetch('http://127.0.0.1:5555/api/baskets/top-10-markets', {
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
        fetch('http://127.0.0.1:5555/api/baskets/top-10-users', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
            .then(response => response.json())
            .then(data => {
                setTop10Users(data);
            })
            .catch(error => console.error('Error fetching market data:', error));
    }, []);

    console.log(userCount)
    console.log(vendorUserCount)
    console.log(adminUserCount)
    console.log(top10Cities)
    console.log(top10Users)


    return (
        <>
            <h1>Admin Statistics</h1>
            <div className='box-bounding'>
                <h3>General Count</h3>
                <table className='table-history'>
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
                <table className='table-history'>
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
                <h3 className='margin-t-16'>Top 10 Users</h3>
                <table className='table-history'>
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
                <h3 className='margin-t-16'>Top 10 Cities</h3>
                <table className='table-history'>
                    <thead>
                        <tr>
                            <th>&emsp;</th>
                            <th>City</th>
                            <th>Total Users</th>
                        </tr>
                    </thead>
                    <tbody>
                        {top10Cities && Object.entries(top10Cities)
                            .sort(([, countA], [, countB]) => countB - countA)
                            .map(([city, count], index) => (
                                <tr key={index}>
                                    <th>{index + 1}</th>
                                    <td className='table-center'>{city}</td>
                                    <td className='table-center'>{count}</td>
                                </tr>
                        ))}
                    </tbody>
                </table>
                <h3 className='margin-t-16'>Basket Details</h3>
                <table className='table-history'>
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
                <h3 className='margin-t-16'>Top 10 Markets</h3>
                <table className='table-history'>
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
        </>
    );
}

export default AdminStats;