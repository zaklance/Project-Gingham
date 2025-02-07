import React, { useEffect,useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

function BasketSales({ salesHistory }) {
    const [receipts, setReceipts] = useState(null);

    const userId = parseInt(globalThis.localStorage.getItem('user_id'))

    useEffect(() => {
        if (!userId || isNaN(userId)) {
            setError("Invalid user ID.");
            setLoading(false);
            return;
        }

        fetch(`/api/receipts?user_id=${userId}`)
            .then((res) => res.json())
            .then((data) => {
                console.log("Fetched Receipts:", data);
                if (data.error) {
                    setError(data.error);
                } else {
                    setReceipts(Array.isArray(data) ? data : []);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch receipts:", err);
                setError("Failed to load receipt data.");
                setLoading(false);
            });
    }, [userId]);

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
                                        <td className='table-center nowrap'>{history.sale_date || 'N/A'}</td>
                                        <td className='table-center'>${history.price ? history.price.toFixed(2) : 'N/A'}</td>
                                        <td className='table-center'><Link className='icon-file' to={`/user/profile/${userId}`} target="_blank" rel="noopener noreferrer">&emsp;</Link></td>
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

