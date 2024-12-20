import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { timeConverter } from '../../utils/helpers';
import Chart from 'chart.js/auto';

function VendorSales() {
    const chartRef = useRef();
    const [vendorId, setVendorId] = useState(null);
    const [baskets, setBaskets] = useState([]);
    const [salesHistory, setSalesHistory] = useState([]);
    const [marketNames, setMarketNames] = useState([]);
    const [selectedMarket, setSelectedMarket] = useState("");
    const [selectedRangeGraph, setSelectedRangeGraph] = useState(7);
    const [selectedRangeTable, setSelectedRangeTable] = useState(365);
    const [currentMonthSales, setCurrentMonthSales] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [totalBasketCount, setTotalBasketCount] = useState(0);
    const [totalBasketSold, setTotalBasketSold] = useState(0);

    const vendorUserId = localStorage.getItem('vendor_user_id');

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
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
            for (let i = 0; i < Math.abs(range); i++) {
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

    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = date.getDate();
        const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
        return `${month} ${day}`;
    }

    function convertToLocalDate(gmtDateString) {
        const gmtDate = new Date(gmtDateString);
        const localDate = gmtDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
        return localDate;
    }

    const fetchVendorId = async () => {
        if (!vendorUserId) {
            console.error("No vendor user ID found in local storage");
            return;
        }
        try {
            const token = localStorage.getItem('vendor_jwt-token');
            const response = await fetch(`http://127.0.0.1:5555/api/vendor-users/${vendorUserId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                setVendorId(data.vendor_id);
            } else {
                console.error('Failed to fetch vendor user data');
            }
        } catch (error) {
            console.error('Error fetching vendor user data:', error);
        }
    };

    useEffect(() => {
        fetchVendorId();
    }, [vendorUserId]);

    useEffect(() => {
        if (vendorId) {
            fetch(`http://127.0.0.1:5555/api/baskets?vendor_id=${vendorId}`)
                .then(response => response.json())
                .then(data => {
                    setBaskets(data)
                })
                .catch(error => console.error('Error fetching market days', error));
        }
    }, [vendorId]);

    useEffect(() => {
        const fetchSalesHistory = async () => {
            const token = localStorage.getItem('vendor_jwt-token');
            if (!token) {
                console.error('JWT token not found in localStorage');
                return;
            }
            try {
                const response = await fetch('http://127.0.0.1:5555/api/baskets/vendor-sales-history', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setSalesHistory(data);
                } else {
                    console.error('Failed to fetch sales history');
                }
            } catch (error) {
                console.error('Error fetching sales history:', error);
            }
        };
        fetchSalesHistory();
    }, []);

    const handleDateChangeGraph = (event) => {
        setSelectedRangeGraph(event.target.value);
    };
    
    const handleDateChangeTable = (event) => {
        setSelectedRangeTable(event.target.value);
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

    useEffect(() => {
        if (salesHistory.length > 0) {
            const marketNames = salesHistory.map((sale) => sale.market_name);
            const uniqueMarketNames = [...new Set(marketNames)].sort();

            setMarketNames(uniqueMarketNames);
        }
    }, [salesHistory]);

    const handleMarketChange = (event) => {
        setSelectedMarket(event.target.value);
    };

    useEffect(() => {
        const filterSalesHistoryByCurrentMonth = () => {
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

            const filteredSalesHistory = salesHistory.filter((history) => {
                const saleDate = new Date(history.sale_date);
                return saleDate >= startOfMonth && saleDate <= endOfMonth;
            });

            setCurrentMonthSales(filteredSalesHistory);

            // Calculate total price
            const total = salesHistory.reduce((acc, history) => acc + (history.price || 0), 0);
            setTotalPrice(total);
            // Calculate total basket sold
            const totalSold = salesHistory.reduce((acc, history) => acc + (history.sold_baskets || 0), 0);
            setTotalBasketSold(totalSold);
            // Calculate total basket count
            const totalBaskets = salesHistory.reduce((acc, history) => acc + (history.total_baskets || 0), 0);
            setTotalBasketCount(totalBaskets);
        };

        if (salesHistory.length > 0) {
            filterSalesHistoryByCurrentMonth();
        }
    }, [salesHistory]);


    return (
        <div>
            <div className='flex-space-between flex-bottom-align'>
                <h2 className='margin-t-16'>Vendor Sales</h2>
                <select className='' value={selectedRangeGraph} onChange={handleDateChangeGraph}>
                    <option value="">Time Frame</option>
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
                        <h2>Loading...</h2>
                    )}
                </div>
                <div className='box-bounding text-center'>
                    <h1> Month's Sales: ${totalPrice}</h1>
                    <div className='flex-space-evenly'>
                        <h3> Total Baskets: {totalBasketCount}</h3>
                        <h3> Baskets Sold: {totalBasketSold}</h3>
                    </div>
                </div>
                <div className='flex-space-between flex-bottom-align'>
                    <h3 className='margin-t-16'>Sales History:</h3>
                    <div className='form-group'>
                        <select className='' value={selectedRangeTable} onChange={handleDateChangeTable}>
                            <option value="">Time Frame</option>
                            {Object.entries(dateRange).map(([label, value]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        <select
                            name="market"
                            value={selectedMarket || ''}
                            onChange={handleMarketChange}
                        >
                            <option value="">Select Market</option>
                            {marketNames.map((market, index) => (
                                <option key={index} value={market}>
                                    {market}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className='box-scroll'>
                    <table className='table-history width-100'>
                        <thead>
                            <tr>
                                <th>Sale Date</th>
                                <th>Market</th>
                                <th>Pick Up Start</th>
                                <th>Pick Up End</th>
                                <th>Basket Value</th>
                                <th>Price</th>
                                <th>Total</th>
                                <th>Sold</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salesHistory.length > 0 ? (
                                salesHistory
                                    .filter((history) => {
                                        // Filter by selected market if specified
                                        const isMarketMatch =
                                            selectedMarket && selectedMarket !== ""
                                                ? history.market_name === selectedMarket
                                                : true;
                                        // Filter by selected date range
                                        const today = new Date();
                                        const historyDate = new Date(history.sale_date);
                                        const isWithinDateRange = selectedRangeTable
                                            ? historyDate >= new Date(today.setDate(today.getDate() - selectedRangeTable))
                                            : true;
                                        return isMarketMatch && isWithinDateRange;
                                    })
                                    .sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date))
                                    .map((history, index) => (
                                        <tr key={index}>
                                            <td className='table-center nowrap m-wrap'>{convertToLocalDate(history.sale_date) || 'N/A'}</td>
                                            <td>
                                                <Link className='btn-nav' to={`/user/markets/${history.market_id}`}>
                                                    {history.market_name || 'No Market Name'}
                                                </Link>
                                            </td>
                                            <td className='table-center'> {history.pickup_start ? timeConverter(history.pickup_start) : 'N/A'} </td>
                                            <td className='table-center'> {history.pickup_end ? timeConverter(history.pickup_end) : 'N/A'} </td>
                                            <td className='table-center'> ${history.basket_value ? history.basket_value.toFixed(2) : 'N/A'} </td>
                                            <td className='table-center'> ${history.price ? history.price.toFixed(2) : 'N/A'} </td>
                                            <td className='table-center'> {history.total_baskets || 0} </td>
                                            <td className='table-center'> {history.sold_baskets || 0} </td>
                                        </tr>
                                    ))
                            ) : (
                                <tr>
                                    <td colSpan="8">No sales history available</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <br />

            </div>
        </div>
    )
}

export default VendorSales;