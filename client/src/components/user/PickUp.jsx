import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { timeConverter } from '../../utils/helpers';
import { QRCodeSVG } from 'qrcode.react';
import UserIssues from './UserIssues';

function PickUp() {
    const [baskets, setBaskets] = useState([])
    const [isPickUp, setIsPickUp] = useState(false);
    const [selectedBasketId, setSelectedBasketId] = useState(null);
    const [qRCodes, setQRCodes] = useState([]);
    const [showQR, setShowQR] = useState(null);
    const [showPopup, setShowPopup] = useState(false);

    const userId = parseInt(globalThis.localStorage.getItem('user_id'));
    const token = localStorage.getItem('user_jwt-token');

    const handleIssuePopup = (event, basketId) => {
        event.stopPropagation();
        setSelectedBasketId(basketId);
        setShowPopup(true);
    };

    const handleCloseIssuePopup = () => {
        setShowPopup(false);
        setSelectedBasketId(null);
    };

    useEffect(() => {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        console.log('Formatted date being sent:', formattedDate);
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        console.log('Browser timezone:', browserTimezone);

        fetch(`/api/baskets?user_id=${userId}&sale_date=${formattedDate}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Timezone': browserTimezone
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // console.log("Baskets received from API:", data);
                const filteredData = data.filter(item => item.is_grabbed === false);
                setBaskets(filteredData);
            })
            .catch(error => {
                console.error('Error fetching today\'s baskets:', error);
            });
    }, [userId, qRCodes]);

    useEffect(() => {
        fetch(`/api/qr-codes?user_id=${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                setQRCodes(data);
            })
            .catch(error => {
                console.error('Error fetching hashes:', error);
            });
    }, [userId]);

    const handlePickUp = (event, basketId) => {
        event.stopPropagation();
        setShowQR(prevId => (prevId === basketId ? null : basketId));
    };

    const isPickupTime = (pickupStart, pickupEnd) => {
        const now = new Date();
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
        const todayDate = new Date().toISOString().split('T')[0];
    
        const startString = `${todayDate} ${pickupStart}`;
        const endString = `${todayDate} ${pickupEnd}`;
    
        const start = new Date(startString);
        const end = new Date(endString);
    
        // console.log("Current Local Time:", now.toLocaleString('en-US', { timeZone }));
        // console.log("Pickup Start (Local):", isNaN(start) ? "Invalid Time" : start.toLocaleString('en-US', { timeZone }));
        // console.log("Pickup End (Local):", isNaN(end) ? "Invalid Time" : end.toLocaleString('en-US', { timeZone }));
    
        const isWithinTime = now >= start && now <= end;
        // console.log("In Pickup Window:", isWithinTime);
    
        return isWithinTime;
    };
    
    return (
        <>
            <div>
                <h2 className='margin-b-24'>Baskets for Pick-Up Today</h2>
                {baskets.length > 0 ? (
                    <div className='basket-cards-container'>
                        {baskets.length > 0 ? (
                            baskets.map((basket, index) => {
                                const matchingQRCode = qRCodes.find(qRCode => qRCode.basket_id === basket.id);
                                const isSelected = showQR === basket.id;
                                const inPickupWindow = isPickupTime(basket.pickup_start, basket.pickup_end);
                                return (
                                    <div key={index} className='basket-card'>
                                        <div className='width-100'>
                                            {!isSelected ? (
                                                <>
                                                    <h4 className='text-center'>{basket.vendor.name}</h4>
                                                    <h4 className='text-center'> at {basket.market_day.markets.name}</h4>
                                                    <table className='width-100'>
                                                        <tbody className='table-basket'>
                                                            <tr>
                                                                <td className='nowrap'>Pickup Start:</td>
                                                                <td className='nowrap text-center'>{timeConverter(basket?.pickup_start)}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className='nowrap'>Pickup End:</td>
                                                                <td className='nowrap text-center'>{timeConverter(basket?.pickup_end)}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className='nowrap'>Basket Value:</td>
                                                                <td className='text-center'>${basket?.value}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className='nowrap'>Basket Price:</td>
                                                                <td className='text-center'>${basket?.price}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <div className='flex-center'>
                                                        <button className="btn-basket-save" onClick={(event) => handlePickUp(event, basket.id)}>Pick Up Basket</button>
                                                    </div>
                                                    {inPickupWindow && (
                                                        <div className='flex-center margin-t-4'>
                                                            <a className="forgot-password" onClick={(event) => handleIssuePopup(event, basket.id)}>Problems with pickup?</a>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <div>
                                                        <div className='box-qr'>
                                                            <QRCodeSVG
                                                                className='img-qr'
                                                                value={matchingQRCode ? matchingQRCode.qr_code : 'Invalid QR Code'}
                                                                minVersion={4}
                                                            />
                                                        </div>
                                                        <div className='text-center margin-t-16'>
                                                                <button className="btn-basket-save" onClick={(event) => handlePickUp(event, basket.id)}>Cancel</button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                            )})
                        ) : (
                            null
                        )}
                    </div>
                ) : (
                    <>
                        <div className='box-bounding text-center'>
                            <h1 className='title-med'>No purchased baskets for today</h1>
                        </div>
                    </>
                )}
            </div>
            {showPopup && <UserIssues basketId={selectedBasketId} handleClose={handleCloseIssuePopup} />}
        </>
    );
}

export default PickUp;