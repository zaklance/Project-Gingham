import React, { useState, useEffect } from 'react';

function BasketSales() {
    const [salesHistory, setSalesHistory] = useState([]);

    useEffect(() => {
        const token = sessionStorage.getItem('jwt-token');

        if (!token) {
            console.error('JWT token not found in sessionStorage');
            return;
        }

        fetch('http://127.0.0.1:5555/baskets/user-sales-history', {
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
                console.log("Fetched sales history:", data);
                setSalesHistory(data);
            })
            .catch(error => console.error('Error fetching sales history:', error.message));
    }, []);

    return (
        <div>
            <h2>Basket History</h2>
            <br />
            <table>
                <thead>
                    <tr>
                        <th>Market</th>
                        <th>Vendor</th>
                        <th>Sale Date</th>
                        <th>Price</th>
                        <th>Baskets Count</th>
                    </tr>
                </thead>
                <tbody>
                    {salesHistory.length > 0 ? (
                        salesHistory.map((history, index) => (
                            <tr key={index}>
                                <td>
                                    <a href={`/user/markets/${history.market_id}`} target="_blank" rel="noopener noreferrer">
                                        {history.market_name || 'No Market Name'}
                                    </a>
                                </td>                                
                                <td>
                                    <a href={`/user/vendors/${history.vendor_id}`} target="_blank" rel="noopener noreferrer">
                                        {history.vendor_name || 'No Vendor Name'}
                                    </a>
                                </td>                                
                                <td>{history.sale_date || 'N/A'}</td>
                                <td>${history.price ? history.price.toFixed(2) : 'N/A'}</td>
                                <td>{history.baskets_count || '0'}</td>
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
    );
}

export default BasketSales;


