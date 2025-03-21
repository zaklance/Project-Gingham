import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import VendorActiveVendor from './VendorActiveVendor';
import { toast } from 'react-toastify';

function VendorScan() {
    const [qRCode, setQRCode] = useState(null);
    const [vendorId, setVendorId] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    
    const vendorUserId = localStorage.getItem('vendor_user_id');

    useEffect(() => {
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
                    if (data.vendor_id) {
                        setVendorId(data.vendor_id[data.active_vendor]);
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
        fetch(`/api/qr-codes?vendor_id=${vendorId}&qr_code=${result[0].rawValue}`)
            .then(response => response.json())
            .then(async (data) => {
                console.log(result);
                console.log(data);
                try {
                    const response = await fetch(`/api/baskets/${data.basket_id}`, {
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
                        toast.success('Basket successfully picked up!', {
                            autoClose: 4000,
                        });
                        fetch(`/api/qr-codes/${data.id}`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        });
                    }
                } catch (error) {
                    console.error('Error patching basket:', error);
                    toast.error('Error, no QR code found!', {
                        autoClose: 4000,
                    });
                }
            })
            .catch(error => {;
                toast.error('Error in QR code scanning:', error, {
                    autoClose: 4000,
                });
            });
    };

    const handleCamera = () => {
        setIsScanning(!isScanning);
    };

    return (
        <>
            <VendorActiveVendor className="box-bounding margin-b-16" />
            <div className='flex-center'>
                <Scanner
                    onScan={(result) => handleScan(result)}
                    scanDelay={1000}
                    format={'qr_code'}
                    allowMultiple={true}
                />
            </div>
        </>
    );
}

export default VendorScan;