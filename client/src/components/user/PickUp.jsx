import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { timeConverter, formatBasketDate } from '../../utils/helpers';
import { QRCodeSVG } from 'qrcode.react';

function PickUp() {
    const [baskets, setBaskets] = useState([])
    const [isPickUp, setIsPickUp] = useState(false); 
    const [qRCodes, setQRCodes] = useState({})

    const userId = parseInt(globalThis.localStorage.getItem('user_id'));

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

        fetch(`http://127.0.0.1:5555/api/todays-baskets?user_id=${userId}&date=${formattedDate}`, {
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
                const filteredData = data.filter(item => item.is_grabbed === false);
                setBaskets(filteredData);
            })
            .catch(error => {
                console.error('Error fetching today\'s baskets:', error);
            });
    }, [userId]);

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/api/qr-codes?user_id=${userId}`, {
            method: 'GET',
            headers: {
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

    const handlePickUp = () => {
        if (!isPickUp) {
        }
        setIsPickUp(!isPickUp);
    };

    return (
        <>
            <div>
                <h2 className='margin-b-24'>Baskets for Pick-Up Today</h2>
                <div className='market-cards-container'>
                    {baskets.length > 0 ? (
                        baskets.map((basket, index) => (
                            <div key={index} className='basket-card'>
                                <div className='width-100'>
                                    {!isPickUp ? (
                                        <>
                                            <h4 className='text-center'>{basket.vendor_name}</h4>
                                            <h4 className='text-center'> at {basket.market_name}</h4>
                                            <table className='width-100'>
                                                <tbody className='table-basket'>
                                                    <tr className='row-blank'>
                                                    </tr>
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
                                                <button onClick={handlePickUp} className="btn-basket-save">Pick Up Basket</button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className='flex-column flex-center-align'>
                                                <div className='box-qr'>
                                                    <QRCodeSVG 
                                                        className='img-qr'
                                                        value={basket.qr_code} 
                                                        minVersion={3}
                                                        imageSettings={{
                                                            src: `/site-images/gingham-logo-3.svg`,
                                                            height: 32,
                                                            width: 32,
                                                            excavate: true
                                                            }}
                                                    />
                                                </div>
                                                <br/>
                                                <div className='flex-center'>
                                                    <button onClick={handlePickUp} className="btn-basket-save">Cancel</button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
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