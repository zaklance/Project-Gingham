import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { timeConverter, formatBasketDate } from '../../utils/helpers';
import { QRCodeSVG } from 'qrcode.react';

function PickUp() {
    const [baskets, setBaskets] = useState([])
    const [isPickUp, setIsPickUp] = useState(false);
    const [selectedBasketId, setSelectedBasketId] = useState(null);
    const [qRCodes, setQRCodes] = useState([])

    const userId = parseInt(globalThis.localStorage.getItem('user_id'));
    const token = localStorage.getItem('user_jwt-token');

    useEffect(() => {
        const today = new Date();
        const formattedDate = today.toLocaleDateString('en-CA', { // Using en-CA for correct ISO format
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).split('/').reverse().join('-');
        console.log('Formatted date being sent:', formattedDate);
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        console.log('Browser timezone:', browserTimezone);

        fetch(`http://127.0.0.1:5555/api/baskets?user_id=${userId}&sale_date=${formattedDate}`, {
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
        fetch(`http://127.0.0.1:5555/api/qr-codes?user_id=${userId}`, {
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

    const handlePickUp = (basketId) => {
        setSelectedBasketId(prevId => (prevId === basketId ? null : basketId));
    };

    return (
        <>
            <div>
                <h2 className='margin-b-24'>Baskets for Pick-Up Today</h2>
                <div className='basket-cards-container'>
                    {baskets.length > 0 ? (
                        baskets.map((basket, index) => {
                            const matchingQRCode = qRCodes.find(qRCode => qRCode.basket_id === basket.id);
                            const isSelected = selectedBasketId === basket.id;
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
                                                            <td className='text-center'>${basket?.basket_value}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className='nowrap'>Basket Price:</td>
                                                            <td className='text-center'>${basket?.price}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                <div className='flex-center'>
                                                    <button className="btn-basket-save" onClick={() => handlePickUp(basket.id)}>Pick Up Basket</button>
                                                </div>
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
                                                            <button className="btn-basket-save" onClick={() => handlePickUp(basket.id)}>Cancel</button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                        )})
                    ) : (
                        <>
                            <p>No baskets available for today.</p>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

export default PickUp;