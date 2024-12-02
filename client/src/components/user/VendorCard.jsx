import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/css/index.css';

function VendorCard({ vendorData }) {
    const navigate = useNavigate();

    const handleLearnMore = () => {
        navigate(`/user/vendors/${vendorData.id}`);
    };

    return (
        <div className="market-card">
            <img src={`/vendor-images/${vendorData.image}`} alt="Vendor Image" style={{width: '260px'}}/>
            <h2>{vendorData.name}</h2>
            <h4>{vendorData.city}, {vendorData.state}</h4>
            <h4>{vendorData.product}</h4>
            <button className="btn-market-card" onClick={handleLearnMore}>Learn More</button>
        </div>
    )
}

export default VendorCard;