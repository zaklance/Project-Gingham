import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Chart from 'chart.js/auto';

function VendorSales({ timeConverter, convertToLocalDate }) {
    const chartRef = useRef();
    const [vendorId, setVendorId] = useState(null);
    const [baskets, setBaskets] = useState([]);
    const [salesHistory, setSalesHistory] = useState([]);
    const [selectedRange, setSelectedRange] = useState(31);

    const vendorUserId = localStorage.getItem('vendor_user_id');

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const dateRange = {
        "Week": 7,
        "Month": 31,
        "3 Months": 91,
        "6 Months": 183,
        "12 Months": 365,
    }

    function getDatesForRange(range = 31) {
        const dates = [];
        const today = new Date();

        // Start from today and go backwards by the specified range (days, months, or years)
        for (let i = 0; i < range; i++) {
            const currentDate = new Date(today);
            currentDate.setDate(today.getDate() - i);
            dates.push(`${months[currentDate.getMonth()]} ${currentDate.getDate()}`);
        }
        return dates.reverse(); // reverse to start from the earliest date
    }

    // const datesThisYear = getDatesForYear(2024);

    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = date.getDate();
        // const suffix = getDaySuffix(day);
        const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
        return `${month} ${day}`;
    }
    // function getDaySuffix(day) {
    //     if (day >= 11 && day <= 13) return 'th';
    //     switch (day % 10) {
    //         case 1:
    //             return 'st';
    //         case 2:
    //             return 'nd';
    //         case 3:
    //             return 'rd';
    //         default:
    //             return 'th';
    //     }
    // }

    function timeConverter(time24) {
        const date = new Date(`1970-01-01T${time24}Z`); // Add 'Z' to indicate UTC
        const time12 = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
        return time12;
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
            const token = localStorage.getItem('jwt-token');
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
            const token = localStorage.getItem('jwt-token');
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

    useEffect(() => {
        const ctx = document.getElementById(`chart-baskets`);

        if (chartRef.current) {
            chartRef.current.destroy();
        }

        // Create a function to process baskets into chart data
        const processBaskets = (baskets) => {
            const soldData = {};
            const unsoldData = {};
            // Iterate over baskets and group by formatted sale_date
            baskets.forEach((basket) => {
                const formattedDate = formatDate(basket.sale_date);
                if (basket.is_sold) {
                    soldData[formattedDate] = (soldData[formattedDate] || 0) + 1;
                } else {
                    unsoldData[formattedDate] = (unsoldData[formattedDate] || 0) + 1;
                }
            });
            return { soldData, unsoldData };
        };

        const { soldData, unsoldData } = processBaskets(baskets);

        const data = {
            labels: getDatesForRange(selectedRange), // Use your function to get all dates for the year
            datasets: [
                {
                    label: 'Sold Baskets',
                    data: soldData, // Dynamic data for sold baskets
                    borderColor: "#007BFF",
                    backgroundColor: "#6c7ae0",
                    borderWidth: 2,
                    borderRadius: 2,
                    borderSkipped: false,
                },
                {
                    label: 'Unsold Baskets',
                    data: unsoldData, // Dynamic data for unsold baskets
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
                        // max: 5,
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
    }, [baskets]);


    return (
        <div>
            <h2 className='margin-t-16'>Vendor Sales</h2>
            <div>
                <div className='box-bounding'>
                    {baskets ? (
                        <canvas id="chart-baskets"></canvas>
                    ) : (
                        <h2>Loading...</h2>
                    )}
                </div>
                <br/>
                    <h3>Sales Breakdown:</h3>
                    <div className='box-scroll'>
                        <table className='table-basket'>
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