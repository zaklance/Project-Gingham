import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/css/index.css';

function VendorCard({ vendorData }) {
    const navigate = useNavigate();

    const handleLearnMore = () => {
        navigate(`/vendors/${vendorData.id}`);
    };

    return (
        <div className="market-card">
            <img src={vendorData.image} alt="Vendor Image" style={{width: '260px'}}/>
            <h2>{vendorData.name}</h2>
            <h4>{vendorData.based_out_of}</h4>
            <h4>{vendorData.product}</h4>
            <button className="market-card-button" onClick={handleLearnMore}>Buy a Farmers Market Basket!</button>
        </div>
    )
}

export default VendorCard;