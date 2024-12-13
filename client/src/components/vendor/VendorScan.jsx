import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';

function VendorScan() {
    const [qRCode, setQRCode] = useState(null);

    const handleScan = (result) => {
        console.log(result[0].rawValue);
        fetch(`http://127.0.0.1:5555/api/qr-codes?qr_code=${result[0].rawValue}`)
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

    return (
        <>
            <div className="flex-center">
                <Scanner
                    onScan={(result) => handleScan(result)}
                    // scanDelay={100}
                    format={'qr_code'}
                />
            </div>
        </>
    );
}

export default VendorScan;