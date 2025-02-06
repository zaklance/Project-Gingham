import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function BasketSales() {
    const userId = parseInt(localStorage.getItem('user_id'));
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    const addToCalendar = (basket) => {
        if (!basket) return;

        const { market_location, vendor_name, sale_date, pickup_start, pickup_end } = basket;
        if (!sale_date || !pickup_start || !pickup_end) return;

        const startDateTime = new Date(sale_date);
        startDateTime.setHours(...pickup_start.split(":"));
        const endDateTime = new Date(sale_date);
        endDateTime.setHours(...pickup_end.split(":"));

        const startISO = startDateTime.toISOString().replace(/-|:|\.\d+/g, "");
        const endISO = endDateTime.toISOString().replace(/-|:|\.\d+/g, "");

        const eventTitle = `Pickup from ${vendor_name}`;
        const eventDetails = `Pickup your order from ${vendor_name} at ${market_location}.`;

        const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&details=${encodeURIComponent(eventDetails)}&location=${encodeURIComponent(market_location)}&dates=${startISO}/${endISO}`;

        window.open(googleCalUrl, "_blank");
    };

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
                            <th>Pickup Date</th>
                            <th>Pickup Time</th>
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
                                
                                            <td>{firstBasket?.market_location || 'Unknown Market'}</td>  

                                            <td>{firstBasket?.vendor_name || 'Unknown Vendor'}</td>  

                                            <td className='table-center nowrap'>
                                                {firstBasket?.sale_date 
                                                    ? new Date(firstBasket.sale_date).toLocaleDateString() 
                                                    : 'N/A'}
                                            </td>

                                            {/* Google Calendar Link */}
                                            <td className='table-center nowrap'>
                                                {firstBasket?.pickup_start && firstBasket?.pickup_end ? (
                                                    <a
                                                        href="#"
                                                        className="link-edit"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            addToCalendar(firstBasket);
                                                        }}
                                                    >
                                                        {firstBasket.pickup_start} - {firstBasket.pickup_end}
                                                    </a>
                                                ) : 'N/A'}
                                            </td>

                                            {/* Total Price Calculation */}
                                            <td className='table-center'>
                                                ${receipt.baskets.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0).toFixed(2)}
                                            </td>

                                            {/* Receipt PDF Download */}
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
                                <td colSpan="6">No sales history available</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default BasketSales;