import React from 'react';
import { useState, useEffect } from 'react';
import VendorCard from './VendorCard';
import '../assets/css/index.css';

function Vendors() {
    const [ vendor, setVendor] = useState([]);
    
    useEffect(() => {
        fetch("http://127.0.0.1:5555/vendors")
        .then(response => response.json())
        .then(data => setVendor(data))
    }, []);
    
    return (
        <div className="markets-container">
            <br/>
            <header>FIND A MARKET VENDOR TODAY</header>
            <h4>Click on the image to learn more</h4>
            <br/>
            <div className="market-cards-container">
                {vendor.map((vendorData) => (
                    <VendorCard key={vendorData.id} vendorData={vendorData} />
                ))}
            </div>
        </div>
    )
}

export default Vendors;