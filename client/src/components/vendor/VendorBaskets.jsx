import React, { useEffect, useState } from 'react';
import { weekDay } from '../../utils/common';
import { timeConverter, formatBasketDate } from '../../utils/helpers';
import VendorBasketsToday from './VendorBasketsToday';
import VendorBasketCard from './VendorBasketCard';
import VendorCreate from './VendorCreate';

function VendorBaskets({ vendorUserData }) {
    const [vendorId, setVendorId] = useState(null);
    const [allVendorMarkets, setAllVendorMarkets] = useState([]);
    const [filteredMarketDays, setFilteredMarketDays] = useState([]);
    const [nextMarketDays, setNextMarketDays] = useState(null);

    useEffect(() => {
        const fetchVendorId = async () => {
            const vendorUserId = localStorage.getItem('vendor_user_id');
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
                        'Content-Type': 'application/json',
                    },
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
        fetchVendorId();
    }, []);

    useEffect(() => {
        if (vendorId) {
            fetch(`http://127.0.0.1:5555/api/vendor-markets?vendor_id=${vendorId}`)
                .then((response) => response.json())
                .then((data) => setAllVendorMarkets(data))
                .catch((error) => console.error('Error fetching vendor markets:', error));
        }
    }, [vendorId]);

    useEffect(() => {
        if (allVendorMarkets.length > 0) {
            const token = localStorage.getItem('vendor_jwt-token');
            fetch('http://127.0.0.1:5555/api/market-days', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then((data) => {
                    if (Array.isArray(data)) {
                        const filteredData = data.filter((item) =>
                            allVendorMarkets.some((vendorMarket) => vendorMarket.market_day_id === item.id)
                        );
                        setFilteredMarketDays(filteredData);
                    } else {
                        console.error('Unexpected response format:', data);
                    }
                })
                .catch((error) => console.error('Error fetching market days:', error));
        }
    }, [allVendorMarkets]);

    useEffect(() => {
        const calculateNextMarketDays = () => {
            const today = new Date();
            const next7Days = Array.from({ length: 7 }, (_, i) => {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                return date;
            });

            const nextMarketDays = filteredMarketDays
                .map((day) => {
                    const date = next7Days.find((d) => d.getDay() === day.day_of_week);
                    return {
                        ...day,
                        date: date ? new Date(date.setHours(0, 0, 0, 0)) : null,
                    };
                })
                .filter((day) => day.date && day.date.getTime() > today.getTime())
                .sort((a, b) => a.date - b.date);

            setNextMarketDays(nextMarketDays);
        };

        if (filteredMarketDays.length > 0) {
            calculateNextMarketDays();
        }
    }, [filteredMarketDays]);

    return (
        <div>
            {!vendorUserData || !vendorUserData.vendor_id ? (
                <div className="box-bounding">
                    <VendorCreate />
                </div>
            ) : (
                <div className="box-bounding">
                    <h2>Today's Baskets:</h2>
                    <br/>
                    <div className="flex flex-nowrap box-scroll-x">
                        <VendorBasketsToday vendorId={vendorId} />
                    </div>
                    <h2 className="margin-t-48 margin-b-16">Future Markets:</h2>
                    <div className="flex flex-nowrap box-scroll-x">
                        {nextMarketDays ? (
                            nextMarketDays.map((marketDay, index) => (
                                <VendorBasketCard key={index} vendorId={vendorId} marketDay={marketDay} weekDay={weekDay} />
                            ))
                        ) : (
                            <p>No upcoming market days available.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default VendorBaskets;
