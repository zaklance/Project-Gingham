import React from 'react';
import '../assets/css/index.css';

function VendorCard({ vendorData }) {
    return (
        <div className="market-card">
            <img src={vendorData.image} alt="Vendor Image" style={{width: '260px'}}/>
            <h2>{vendorData.name}</h2>
            <h4>{vendorData.based_out_of}</h4>
            <h4>{vendorData.locations}</h4>
            <h4>{vendorData.product}</h4>
        </div>
    )
}
export default VendorCard;