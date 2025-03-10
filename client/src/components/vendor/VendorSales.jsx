import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { timeConverter, convertToLocalDate, formatToLocalDateString } from '../../utils/helpers';
import Chart from 'chart.js/auto';
import PulseLoader from 'react-spinners/PulseLoader';
import VendorActiveVendor from './VendorActiveVendor';
import { months } from '../../utils/common.js'
import VendorPDFMonthlyBaskets from './VendorPDFMonthlyBaskets.jsx';

function VendorSales() {
    const chartRef = useRef();
    const [vendorId, setVendorId] = useState(null);
    const [baskets, setBaskets] = useState([]);
    const [monthlyBaskets, setMonthlyBaskets] = useState({});
    const [salesHistory, setSalesHistory] = useState([]);
    const [marketNames, setMarketNames] = useState([]);
    const [selectedMarket, setSelectedMarket] = useState("");
    const [selectedRangeGraph, setSelectedRangeGraph] = useState(7);
    const [selectedRangeTable, setSelectedRangeTable] = useState(365);
    const [currentMonthSales, setCurrentMonthSales] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [totalBasketCount, setTotalBasketCount] = useState(0);
    const [totalBasketSold, setTotalBasketSold] = useState(0);
    const [openDetail, setOpenDetail] = useState(null);
    const [loading, setLoading] = useState(true);

    const vendorUserId = localStorage.getItem('vendor_user_id');

    const dateRange = { "Next 7 Days": -7, "7 Days": 7, "30 Days": 30, "90 Days": 90, "180 Days": 180, "Year": 365, }

    function getDatesForRange(range = 31) {
        const dates = [];
        const today = new Date();
    
        if (range < 0) {
            for (let i = 1; i <= Math.abs(range); i++) {
                const currentDate = new Date(today);
                currentDate.setDate(today.getDate() + i);
                dates.push(currentDate.toISOString().split('T')[0]);
            }
        } else {
            for (let i = 0; i < range; i++) {
                const currentDate = new Date(today);
                currentDate.setDate(today.getDate() - i);
                dates.push(currentDate.toISOString().split('T')[0]);
            }
            dates.reverse();
        }
    
        return dates;
    }  

    useEffect(() => {
        const anchor = window.location.hash.slice(1);
        setTimeout(() => {
            if (anchor) {
                const anchorEl = document.getElementById(anchor);
                if (anchorEl) {
                    anchorEl.scrollIntoView();
                }
            }
        }, 500);
    }, []);  

    const fetchVendorId = async () => {
        if (!vendorUserId) {
            console.error("No vendor user ID found in local storage");
            return;
        }
        try {
            const token = localStorage.getItem('vendor_jwt-token');
            const response = await fetch(`/api/vendor-users/${vendorUserId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                setVendorId(data.vendor_id[[data.active_vendor]]);
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
            fetch(`/api/baskets?vendor_id=${vendorId}`)
                .then(response => response.json())
                .then(data => {
                    setBaskets(data)
                    organizeByMonth(data);
                })
                .catch(error => console.error('Error fetching baskets', error));
        }
    }, [vendorId]);

    useEffect(() => {
        const fetchSalesHistory = async () => {
            if (!vendorId) return;
            const token = localStorage.getItem('vendor_jwt-token');
            if (!token) {
                console.error('JWT token not found in localStorage');
                return;
            }
            try {
                const response = await fetch(`/api/baskets/vendor-sales-history?vendor_id=${vendorId}`, {
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
    }, [vendorId]);

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

        function processBaskets(baskets) {
            const allowedDates = getDatesForRange(selectedRangeGraph);
        
            const soldData = {};
            const unsoldData = {};
        
            allowedDates.forEach(date => {
                soldData[date] = 0;
                unsoldData[date] = 0;
            });
        
            baskets.forEach((basket) => {
                const basketDate = new Date(basket.sale_date).toISOString().split('T')[0];
        
                if (allowedDates.includes(basketDate)) {
                    if (basket.is_sold) {
                        soldData[basketDate] += 1;
                    } else {
                        unsoldData[basketDate] += 1;
                    }
                }
            });
        
            return { soldData, unsoldData };
        }
        
        const allowedDates = getDatesForRange(selectedRangeGraph);

        const { soldData, unsoldData } = processBaskets(baskets);

        const data = {
            labels: allowedDates.map(date => convertToLocalDate(date)),
            datasets: [
                {
                    label: 'Sold Baskets',
                    data: allowedDates.map(date => soldData[date] ?? 0),
                    borderColor: "#007BFF",
                    backgroundColor: "#6c7ae0",
                    borderWidth: 2,
                    borderRadius: 2,
                    borderSkipped: false,
                },
                {
                    label: 'Unsold Baskets',
                    data: allowedDates.map(date => unsoldData[date] ?? 0),
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
                },
                aspectRatio: 3 / 2
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

    const organizeByMonth = (baskets) => {
        const monthlyData = {};
        baskets.forEach(basket => {
            if (basket.sale_date) {
                const date = new Date(basket.sale_date);
                const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
                if (!monthlyData[key]) {
                    monthlyData[key] = [];
                }
                monthlyData[key].push(basket);
            }
        });
        setMonthlyBaskets(monthlyData);
    };

    const downloadCSV = (year, month) => {
        const url = `/api/export-csv/for-vendor/baskets?vendor_id=${vendorId}&year=${year}&month=${month}`;
        window.open(url, '_blank');
    };

    const handleToggle = (name) => {
        setOpenDetail((prev) => (prev === name ? null : name));
    };

    useEffect(() => {
        const sortedYears = Object.entries(
            Object.keys(monthlyBaskets)
                .map(monthKey => {
                    const [year, month] = monthKey.split('-');
                    return { year, month, monthKey, count: monthlyBaskets[monthKey].length };
                })
                .sort((a, b) => {
                    return b.year - a.year || a.month - b.month;
                })
                .reduce((years, { year, month, monthKey, count }) => {
                    if (!years[year]) {
                        years[year] = [];
                    }
                    years[year].push({ month, monthKey, count });
                    return years;
                }, {})
        ).sort(([yearA], [yearB]) => yearB - yearA);

        setTimeout(() => {
            setOpenDetail(sortedYears.length > 0 ? sortedYears[0][0] : null)
            setLoading(false)
        }, 400);
    }, [monthlyBaskets]);


    return (
        <>
            <VendorActiveVendor className={'box-bounding'} />
            <div className='flex-space-between flex-bottom-align'>
                <h1 className='margin-t-16'>Vendor Sales</h1>
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
                        <PulseLoader
                            className='margin-t-12'
                            color={'#ff806b'}
                            size={10}
                            aria-label="Loading Spinner"
                            data-testid="loader"
                        />
                    )}
                </div>
                <div className='box-bounding text-center'>
                    <h1> Month's Sales: ${totalPrice}</h1>
                    <div className='flex-space-evenly'>
                        <h3> Total Baskets: {totalBasketCount}</h3>
                        <h3> Baskets Sold: {totalBasketSold}</h3>
                    </div>
                </div>
                <div className='box-bounding'>
                    <div className='flex-space-between flex-bottom-align'>
                        <h3>Sales History:</h3>
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
                                    <th>Pick Up Duration</th>
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
                                                <td className='table-center'> {history.pickup_start ? timeConverter(history.pickup_start) : 'N/A'} - {history.pickup_end ? timeConverter(history.pickup_end) : 'N/A'} </td>
                                                <td className='table-center'> ${history.value ? history.value.toFixed(2) : 'N/A'} </td>
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
                </div>
            </div>
            {baskets && !loading && (
                <div id="statements" className='box-bounding box-scroll'>
                    <h3 className='margin-b-16'>Monthly Statements</h3>
                    {Object.entries(
                        Object.keys(monthlyBaskets)
                            .map(monthKey => {
                                const [year, month] = monthKey.split('-');
                                return { year, month, monthKey, count: monthlyBaskets[monthKey].length };
                            })
                            .sort((a, b) => {
                                return b.year - a.year || a.month - b.month;
                            })
                            .reduce((years, { year, month, monthKey, count }) => {
                                if (!years[year]) {
                                    years[year] = [];
                                }
                                years[year].push({ month, monthKey, count });
                                return years;
                            }, {})
                        ).sort(([yearA], [yearB]) => yearB - yearA)
                        .map(([year, monthsInYear]) => (
                            <details 
                                key={year} 
                                className='details-basket-sales'
                                open={openDetail === year}
                            >
                                <summary 
                                    className="text-500"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleToggle(year);
                                    }}
                                >{year}</summary>
                                <div className="grid-3">
                                    {monthsInYear.sort((a, b) => {
                                        const monthA = parseInt(a.month, 10);
                                        const monthB = parseInt(b.month, 10);
                                        return monthB - monthA;
                                    }).map(monthData => {
                                        const month = monthData.month;
                                        const monthKey = monthData.monthKey;
                                        const count = monthlyBaskets[monthKey].length;
                                        return (
                                            <div 
                                                key={monthKey} 
                                                className="flex-start flex-center-align"
                                                style={{ display: (new Date().getFullYear() === parseInt(year) && new Date().getMonth() === parseInt(month) 
                                                    && new Date().getDate() > 9) || (new Date().getFullYear() > parseInt(year) || (new Date().getFullYear() === parseInt(year)
                                                    && new Date().getMonth() > parseInt(month))) ? 'flex' : 'none' }}
                                            >
                                                <div>
                                                    <p className='text-500'>{months[parseInt(month) - 1]} {year} &emsp;</p>
                                                    <p>Baskets: {count}</p>
                                                </div>
                                                <div className='flex-column flex-space-between'>
                                                    <VendorPDFMonthlyBaskets monthlyBaskets={monthlyBaskets} year={year} month={month} vendorId={vendorId} />
                                                    <button
                                                        onClick={() => downloadCSV(year, month)}
                                                        className="btn btn-file"
                                                    >
                                                        Download CSV
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </details>
                    ))}
                </div>
            )}
        </>
    )
}

export default VendorSales;