import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function BasketSales() {
    const userId = parseInt(localStorage.getItem('user_id'));
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`/api/receipt?user_id=${userId}`)
            .then((res) => res.json())
            .then((data) => {
                console.log("Fetched Receipts:", data); // Debugging
                if (data.error) {
                    setError(data.error);
                } else {
                    setReceipts(data);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch receipts:", err);
                setError("Failed to load receipt data.");
                setLoading(false);
            });
    }, [userId]);

    if (loading) return <p>Loading sales history...</p>;
    if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

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
                        {receipts.length > 0 ? (
                            receipts
                                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                .map((receipt, index) => {
                                    const firstBasket = receipt.baskets.length > 0 ? receipt.baskets[0] : null;

                                    return (
                                        <tr key={index}>
                                            <td>
                                                {firstBasket ? (
                                                    <Link className='btn-nav' to={`/user/markets/${firstBasket.market_id}`}>
                                                        {firstBasket.market_name || 'Unknown Market'}
                                                    </Link>
                                                ) : 'N/A'}
                                            </td>                                
                                            <td>
                                                {firstBasket ? (
                                                    <Link className='btn-nav' to={`/user/vendors/${firstBasket.vendor_id}`}>
                                                        {firstBasket.vendor_name || 'Unknown Vendor'}
                                                    </Link>
                                                ) : 'N/A'}
                                            </td>                                
                                            <td className='table-center nowrap'>
                                                {new Date(receipt.created_at).toLocaleDateString()}
                                            </td>
                                            <td className='table-center'>
                                                ${receipt.baskets.reduce((total, item) => total + item.price, 0).toFixed(2)}
                                            </td>
                                            <td className='table-center'>
                                                {receipt.id ? (
                                                    <Link 
                                                        className='icon-file' 
                                                        to={`/user/receipt-pdf/${receipt.id}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                    >
                                                        📄
                                                    </Link>
                                                ) : (
                                                    <span>No Receipt</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                        ) : (
                            <tr>
                                <td colSpan="5">No sales history available</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default BasketSales;