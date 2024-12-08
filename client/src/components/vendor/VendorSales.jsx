import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { timeConverter } from '../../utils/helpers';
import Chart from 'chart.js/auto';

function VendorSales() {
    const chartRef = useRef();
    const [vendorId, setVendorId] = useState(null);
    const [baskets, setBaskets] = useState([]);
    const [salesHistory, setSalesHistory] = useState([]);
    const [selectedRange, setSelectedRange] = useState(7);

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
        // Extract years from baskets for proper date comparison
        const basketYears = new Set(baskets.map((basket) => new Date(basket.sale_date).getFullYear()));
        // If basket years are available, use them for date generation
        const yearsToConsider = basketYears.size ? [...basketYears] : [today.getFullYear()];
        if (range < 0) {
            // Future range (moving forward in time)
            for (let i = 0; i < Math.abs(range); i++) {
                yearsToConsider.forEach((year) => {
                    const currentDate = new Date(today);
                    currentDate.setDate(today.getDate() + i);
                    // Set the year as the current year, since we are moving into future dates
                    currentDate.setFullYear(today.getFullYear());
                    dates.push(`${months[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`);
                });
            }
        } else {
            // Past range (moving backward in time)
            for (let i = 0; i < range; i++) {
                yearsToConsider.forEach((year) => {
                    const currentDate = new Date(today);
                    currentDate.setDate(today.getDate() - i);
                    // When moving backward and it goes past December, update the year to last year
                    if (currentDate.getMonth() === 11 && currentDate.getDate() > today.getDate()) {
                        currentDate.setFullYear(today.getFullYear() - 1);
                    } else {
                        currentDate.setFullYear(today.getFullYear());
                    }

                    dates.push(`${months[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`);
                });
            }
            dates.reverse();
        }
        return dates;
    }



    // const datesThisYear = getDatesForYear(2024);

    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = date.getDate();
        // const suffix = getDaySuffix(day);
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

    const handleDateChange = (event) => {
        setSelectedRange(event.target.value);
    };

    useEffect(() => {
        const ctx = document.getElementById(`chart-baskets`);

        if (chartRef.current) {
            chartRef.current.destroy();
        }

        // Process baskets and filter based on the selected date range
        const processBaskets = (baskets) => {
            const isFuture = selectedRange < 0;

            // Get the correct range of dates for the selected range, including the year
            const allowedDates = getDatesForRange(Math.abs(selectedRange), baskets).map(
                (date) => new Date(date).toDateString() // Ensures full date format including year
            );

            const filteredBaskets = baskets.filter((basket) => {
                const basketDate = new Date(basket.sale_date).toDateString(); // Normalize the date format
                return allowedDates.includes(basketDate);
            });

            const soldData = {};
            const unsoldData = {};

            // Group baskets by sale_date and categorize into sold/unsold
            filteredBaskets.forEach((basket) => {
                const formattedDate = formatDate(basket.sale_date); // Ensure formatted date includes month and day
                const fullFormattedDate = `${formattedDate}, ${new Date(basket.sale_date).getFullYear()}`; // Add the year
                if (basket.is_sold) {
                    soldData[fullFormattedDate] = (soldData[fullFormattedDate] || 0) + 1;
                } else {
                    unsoldData[fullFormattedDate] = (unsoldData[fullFormattedDate] || 0) + 1;
                }
            });

            return { soldData, unsoldData };
        };
        
        const { soldData, unsoldData } = processBaskets(baskets);
        
        const data = {
            labels: getDatesForRange(selectedRange),
            datasets: [
                {
                    label: 'Sold Baskets',
                    data: getDatesForRange(selectedRange).map(date => soldData[date] || 0),
                    borderColor: "#007BFF",
                    backgroundColor: "#6c7ae0",
                    borderWidth: 2,
                    borderRadius: 2,
                    borderSkipped: false,
                },
                {
                    label: 'Unsold Baskets',
                    data: getDatesForRange(selectedRange).map(date => unsoldData[date] || 0),
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
    }, [baskets, selectedRange]);


    return (
        <div>
            <div className='flex-space-between flex-bottom-align'>
                <h2 className='margin-t-16'>Vendor Sales</h2>
                <select className='' value={selectedRange} onChange={handleDateChange}>
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
                <h3 className='margin-t-16'>Sales Breakdown:</h3>
                <div className='box-scroll'>
                    <table className='table-history'>
                        <thead>
                            <tr>
                                <th>Sale Date</th>
                                <th>Market</th>
                                <th>Pick Up Start</th>
                                <th>Pick Up End</th>
                                <th>Basket Value</th>
                                <th>Price</th>
                                <th>Available</th>
                                <th>Sold</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salesHistory.length > 0 ? (
                                salesHistory
                                    .sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date))
                                    .map((history, index) => (
                                        <tr key={index}>
                                            <td className='table-center nowrap'>{convertToLocalDate(history.sale_date) || 'N/A'}</td>
                                            <td>
                                                <Link className='btn-nav' to={`/user/markets/${history.market_id}`}>
                                                    {history.market_name || 'No Market Name'}
                                                </Link>
                                            </td>
                                            <td className='table-center'> {history.pickup_start ? timeConverter(history.pickup_start) : 'N/A'} </td>
                                            <td className='table-center'> {history.pickup_end ? timeConverter(history.pickup_end) : 'N/A'} </td>
                                            <td className='table-center'> ${history.basket_value ? history.basket_value.toFixed(2) : 'N/A'} </td>
                                            <td className='table-center'> ${history.price ? history.price.toFixed(2) : 'N/A'} </td>
                                            <td className='table-center'> {history.available_baskets || 0} </td>
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