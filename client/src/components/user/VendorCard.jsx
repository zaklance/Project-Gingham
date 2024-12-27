import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/css/index.css';

function VendorCard({ vendorData, selectedProduct, products }) {
    const navigate = useNavigate();

    const handleLearnMore = () => {
        navigate(`/user/vendors/${vendorData.id}`, { state: { selectedProduct } });
    };

    const product = products.find(p => p.id == vendorData.product);


    return (
        <div className="market-card">
            {vendorData.image !== null ? (
                <img style={{ width: '260px' }} src={`/vendor-images/${vendorData.image}`} alt="Vendor Image" />
            ) : (
                <img style={{ width: '260px' }} src={`/vendor-images/_default-images/${vendorData.image_default}`} alt="Vendor Image" />
            )}
            <h2>{vendorData.name}</h2>
            <h4>{vendorData.city}, {vendorData.state}</h4>
            <h4>{product ? product.product : ""}</h4>
            <button className="btn-market-card" onClick={handleLearnMore}>Learn More</button>
        </div>
    )
}

export default VendorCard;