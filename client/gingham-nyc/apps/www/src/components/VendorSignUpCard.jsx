import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

function VendorSignUpCard() {
    const navigate = useNavigate();

    const urlVendor = import.meta.env.VITE_URL_VENDOR;


    return (
        <div className="market-card flex-space-between flex-column">
            <img className='img-market-card' src={`/vendor-images/_default-images/vendor-default-1_1600px.jpg`} alt="Vendor Image" />
            <h2 className='center margin-t-8 margin-b-8'>Looking to Join?</h2>
            <div className='center'>
                <p className='text-500'>Sell your goods on <span className='font-cera-gingham text-900'>gingham</span>!</p>
                <ul className='ul-bullet'>
                    <li>Reach more customers!</li>
                    <li>Profit while reducing waste!</li>
                    <li>Click below to find out more!</li>
                </ul>
            </div>
            <NavLink to={urlVendor} className="btn-market-card text-500">
                Join Today!
            </NavLink>
        </div>
    )
}

export default VendorSignUpCard;