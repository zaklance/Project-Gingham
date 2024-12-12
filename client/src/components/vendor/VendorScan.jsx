import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';

function VendorScan() {
    const [qRCode, setQRCode] = useState(null);

    const handleScan = (result) => {
        console.log(result[0].rawValue)
        fetch(`http://127.0.0.1:5555/api/qr-codes?qr_code=${result[0].rawValue}`)
            .then(response => response.json())
            .then(data => {
                console.log(data[0].basket_id)
                try {
                    const response = fetch(`http://127.0.0.1:5555/api/baskets/${data[0].basket_id}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            is_grabbed: true
                        }),
                    });
                    if (response.ok) {
                        const updatedData = response.json();
                        console.log('Vendor data updated successfully:', updatedData);
                        alert("Basket successfully picked up")
                    }
                } catch (error) {
                    console.error('Error patching basket:', error);
                }
            });
    }

    return (
        <>
            <div className="flex-center">
                <Scanner
                    onScan={(result) => handleScan(result)}
                    scanDelay={1000}
                    format={'qr_code'}
                />
            </div>
        </>
    );
}

export default VendorScan;