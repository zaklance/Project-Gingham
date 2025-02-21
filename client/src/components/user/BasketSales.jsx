import React, { useEffect,useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { receiptDateConverter, formatBasketDate } from '../../utils/helpers';
import ReceiptPDF from './ReceiptPDF';

function BasketSales() {
    const [receipts, setReceipts] = useState(null);
    const [willDownload, setWillDownload] = useState({});

    const userId = parseInt(globalThis.localStorage.getItem('user_id'))

    useEffect(() => {
        if (!userId || isNaN(userId)) {
            // setError("Invalid user ID.");
            // setLoading(false);
            return;
        }

        fetch(`/api/receipts?user_id=${userId}`)
            .then((res) => res.json())
            .then((data) => {
                // console.log("Fetched Receipts:", data);
                if (data.error) {
                    // setError(data.error);
                } else {
                    setReceipts(Array.isArray(data) ? data : []);
                }
                // setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch receipts:", err);
                // setError("Failed to load receipt data.");
                // setLoading(false);
            });
    }, [userId]);

    const handleDownload = (id) => {
        setWillDownload((prev) => ({
            ...prev,
            [id]: true,
        }));
    };

    return (
        <div>
            <h2>Basket History</h2>
            <br />
            <div className='table-overflow'>
                <table className='table-history'>
                    <thead>
                        <tr>
                            <th></th>
                            <th>Market</th>
                            <th>Vendor</th>
                            <th>Sale Date</th>
                            <th>Price</th>
                            <th>Receipt</th>
                        </tr>
                    </thead>
                    <tbody>
                        {receipts?.length > 0 ? (
                            receipts
                                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                .map((receipt, index) => (
                                    <React.Fragment key={index}>
                                        { index > 0 && <tr className="spacer-row"><td colSpan="6"></td></tr>}
                                        {receipt.baskets
                                            .sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date))
                                            .map((item, subIndex) => {
                                                const isFirst = subIndex === 0;
                                                const isLast = subIndex === receipt.baskets.length - 1;
                                                return (
                                                <tr key={`${index}-${subIndex}`}>
                                                    <td className={`group-bar ${isFirst ? 'group-bar-first' : ''} ${isLast ? 'group-bar-last' : ''}`}></td>
                                                    <td>
                                                        <Link className='btn-nav' to={`/user/markets/${item.market_id}`}>
                                                            {item.market_location || 'No Market Name'}
                                                        </Link>
                                                    </td>
                                                    <td>
                                                        <Link className='btn-nav' to={`/user/vendors/${item.vendor_id}`}>
                                                            {item.vendor_name || 'No Vendor Name'}
                                                        </Link>
                                                    </td>
                                                    <td className='table-center nowrap'>{formatBasketDate(item.sale_date) || 'N/A'}</td>
                                                    <td className='table-center'>${item.price ? item.price.toFixed(2) : 'N/A'}</td>
                                                    <td className='table-center' style={{height: '48px'}}>
                                                            <span className='icon-file' onMouseEnter={() => handleDownload(receipt.id)}>
                                                                {isFirst && willDownload[receipt.id] ? <ReceiptPDF receiptId={receipt.id} page={"profile"} /> : '\u2003'}
                                                            </span>
                                                    </td>
                                                </tr>
                                            )}
                                        )}
                                    </React.Fragment>
                                ))
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