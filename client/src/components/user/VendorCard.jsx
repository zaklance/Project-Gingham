import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function VendorCard({ vendorData, selectedProduct, products }) {
    const navigate = useNavigate();

    const handleLearnMore = () => {
        navigate(`/user/vendors/${vendorData.id}`, { state: { selectedProduct } });
    };

    const productList = products.filter(p => vendorData.products.includes(p.id));


    return (
        <div className="market-card flex-space-between flex-column text-center">
            {vendorData.image !== null ? (
                <img className='img-market-card' src={`https://www.gingham.nyc${vendorData.image}`} alt="Vendor Image" />
            ) : (
                <img className='img-market-card' src={`/vendor-images/_default-images/${vendorData.image_default}`} alt="Vendor Image" />
            )}
            <h2 className='center margin-t-8 margin-b-8'>{vendorData.name}</h2>
            <p><strong>From: &emsp;</strong>{vendorData.city}, {vendorData.state}</p>
            <p><strong>Products: &emsp;</strong>
                {productList.length > 0
                    ? productList.map(p => p.product).join(', ')
                    : "No products available"}
            </p>
            {vendorData.products_subcategories && (
                <p><strong>Subcategories: &emsp;</strong>
                    {vendorData.products_subcategories?.length > 0 &&
                        vendorData.products_subcategories.map(p => p).join(', ')
                    }
                </p>
            )}
            <button className="btn-market-card" onClick={handleLearnMore}>Learn More</button>
        </div>
    )
}

export default VendorCard;