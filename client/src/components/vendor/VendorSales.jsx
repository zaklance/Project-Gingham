import React, { useEffect, useState, useRef } from 'react';
import Chart from 'chart.js/auto';

function VendorSales () {
    const chartRef = useRef();
    const [vendorId, setVendorId] = useState(null);
    const [baskets, setBaskets] = useState([]);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // Get Every Date of a year
    function getDatesForYear(year) {
        const dates = [];
        let currentDate = new Date(year, 0, 1); // January 1st of the given year
        while (currentDate.getFullYear() === year) {
            dates.push(`${months[new Date(currentDate).getMonth()]} ${new Date(currentDate).getDate()}`);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    }

    function getDatesForMonth(year, month) {
        const dates = [];
        let currentDate = new Date(year, month, 1); // First day of the given month
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextMonthYear = month === 11 ? year + 1 : year;

        while (currentDate < new Date(nextMonthYear, nextMonth, 1)) {
            dates.push(`${months[currentDate.getMonth()]} ${currentDate.getDate()}`);
            currentDate.setDate(currentDate.getDate() + 1);
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

    const formattedDate = formatDate("2024-06-24");

    useEffect(() => {
        const fetchVendorId = async () => {
            const vendorUserId = sessionStorage.getItem('vendor_user_id');
            if (!vendorUserId) {
                console.error("No vendor user ID found in session storage");
                return;
            }
            try {
                const token = sessionStorage.getItem('jwt-token');
                const response = await fetch(`http://127.0.0.1:5555/api/vendor-users/${vendorUserId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.vendor_id) {
                        setVendorId(parseInt(data.vendor_id, 10));
                    }
                } else {
                    console.error('Failed to fetch vendor user data');
                }
            } catch (error) {
                console.error('Error fetching vendor user data:', error);
            }
        };
        fetchVendorId();
    }, []);

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/api/baskets?vendor_id=${vendorId}`)
            .then(response => response.json())
            .then(data => {
                // console.log("Raw basket data:", data);
                // const filteredData = data.filter(item => item.vendor_id === vendorId)
                setBaskets(data)
            })
            .catch(error => console.error('Error fetching market days', error));
    }, [vendorId]);


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
            labels: getDatesForMonth(2024, 10), // Use your function to get all dates for the year
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
                        max: 5,
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


    return(
        <div>
            <h2 className='margin-t-16'>Vendor Sales</h2>
            <div className='box-bounding'>
                {baskets ? (
                    <canvas id="chart-baskets"></canvas>
                ) : (
                    <h2>Loading...</h2>
                )}
            </div>
        </div>
    )
}

export default VendorSales;
