import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/css/index.css';

function VendorCard({ vendorData, selectedProduct, products }) {
    const navigate = useNavigate();

    const handleLearnMore = () => {
        navigate(`/user/vendors/${vendorData.id}`, { state: { selectedProduct } });
    };

    const productList = products.filter(p => vendorData.products.includes(p.id));


    return (
        <div className="market-card flex-space-between flex-column text-center">
            {vendorData.image !== null ? (
                <img className='img-market-card' src={`/vendor-images/${vendorData.image}`} alt="Vendor Image" />
            ) : (
                <img className='img-market-card' src={`/vendor-images/_default-images/${vendorData.image_default}`} alt="Vendor Image" />
            )}
            <h2 className='center margin-t-8 margin-b-8'>{vendorData.name}</h2>
            <h4>{vendorData.city}, {vendorData.state}</h4>
            <h4>
                {productList.length > 0
                    ? productList.map(p => p.product).join(', ')
                    : "No products available"}
            </h4>
            <button className="btn-market-card" onClick={handleLearnMore}>Learn More</button>
        </div>
    )
}

export default VendorCard;