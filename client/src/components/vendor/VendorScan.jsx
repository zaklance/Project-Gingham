import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';

function VendorScan() {
    const [qRCode, setQRCode] = useState(null);
    const [vendorId, setVendorId] = useState(null);
    const [isScanning, setIsScanning] = useState(false);

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
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.vendor_id) {
                        setVendorId(data.vendor_id);
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

    const handleScan = (result) => {
        console.log(result[0].rawValue);
        fetch(`http://127.0.0.1:5555/api/qr-codes?vendor_id=${vendorId}&qr_code=${result[0].rawValue}`)
            .then(response => response.json())
            .then(async (data) => {
                console.log(result);
                console.log(data);
                try {
                    const response = await fetch(`http://127.0.0.1:5555/api/baskets/${data.basket_id}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            is_grabbed: true,
                        }),
                    });
                    if (response.ok) {
                        const updatedData = await response.json();
                        console.log('Vendor data updated successfully:', updatedData);
                        alert("Basket successfully picked up");
                        fetch(`http://127.0.0.1:5555/api/qr-codes/${data.id}`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        });
                    } else {
                        console.error('Failed to update basket:', response.statusText);
                        alert("Failed to pick up the basket");
                    }
                    window.location.reload()
                } catch (error) {
                    console.error('Error patching basket:', error);
                }
            })
            .catch(error => {
                alert("Error in QR code scanning:", error);
            });
    };

    const handleCamera = () => {
        setIsScanning(!isScanning);
    };

    return (
        <>
            <div className='flex-center'>
                {isScanning ? (
                    <Scanner
                        onScan={(result) => handleScan(result)}
                        scanDelay={1000}
                        format={'qr_code'}
                    />
                ) : (
                    <div>
                        <button className='btn-basket-save' onClick={handleCamera}>Scan QR Code</button>
                    </div>
                )}
            </div>
        </>
    );
}

export default VendorScan;