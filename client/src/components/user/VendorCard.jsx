import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/css/index.css';

function VendorCard({ vendorData, selectedProduct, products }) {
    const navigate = useNavigate();

    const handleLearnMore = () => {
        navigate(`/user/vendors/${vendorData.id}`, { state: { selectedProduct } });
    };

    const product = products.find(p => p.id == vendorData.product);

    const randomImage = [
        "vendor-default-1_1600px.png",
        "vendor-default-2_1600px.png",
        "vendor-default-3_1600px.png"
    ]

    const vendorImage = vendorData.image
        ? `/vendor-images/${vendorData.image}`
        : `/vendor-images/_default-images/${randomImage[Math.floor(Math.random() * randomImage.length)]}`;


    return (
        <div className="market-card">
            <img src={vendorImage} alt="Vendor Image" style={{width: '260px'}}/>
            <h2>{vendorData.name}</h2>
            <h4>{vendorData.city}, {vendorData.state}</h4>
            <h4>{product ? product.product : ""}</h4>
            <button className="btn-market-card" onClick={handleLearnMore}>Learn More</button>
        </div>
    )
}

export default VendorCard;