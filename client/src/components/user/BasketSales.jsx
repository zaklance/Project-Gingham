import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';

function BasketSales() {
    const [salesHistory, setSalesHistory] = useState([]);

    const userId = parseInt(globalThis.localStorage.getItem('user_id'))

    useEffect(() => {
        const token = localStorage.getItem('user_jwt-token');

        if (!token) {
            console.error('JWT token not found in localStorage');
            return;
        }

        fetch('http://127.0.0.1:5555/api/baskets/user-sales-history', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // console.log("Fetched sales history:", data);
                setSalesHistory(data);
            })
            .catch(error => console.error('Error fetching sales history:', error.message));
    }, []);
    
    return (
        <div>
            <h2>Basket History</h2>
            <br />
            <div className='table-overflow'>
                <table className='table-history'>
                    <thead>
                        <tr>
                            <th>Market</th>
                            <th>Vendor</th>
                            <th>Sale Date</th>
                            <th>Price</th>
                            <th>Receipt</th>
                        </tr>
                    </thead>
                    <tbody>
                        {salesHistory.length > 0 ? (
                            salesHistory
                                .sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date))
                                .map((history, index) => (
                                    <tr key={index}>
                                        <td>
                                            <Link className='btn-nav' to={`/user/markets/${history.market_id}`}>
                                                {history.market_name || 'No Market Name'}
                                            </Link>
                                        </td>                                
                                        <td>
                                            <Link className='btn-nav' to={`/user/vendors/${history.vendor_id}`}>
                                                {history.vendor_name || 'No Vendor Name'}
                                            </Link>
                                        </td>                                
                                        <td className='table-center'>{history.sale_date || 'N/A'}</td>
                                        <td className='table-center'>${history.price ? history.price.toFixed(2) : 'N/A'}</td>
                                        <td className='table-center '><Link className='img-file' to={`/user/profile/${userId}`} target="_blank" rel="noopener noreferrer">&emsp;</Link></td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4">No sales history available</td>
                                </tr>
                            )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default BasketSales;


