import React from 'react';
import { useNavigate } from 'react-router-dom';

function VendorSignUpCard() {
    const navigate = useNavigate();

    const handleJoinToday = () => {
        navigate(`/vendor`);
    };


    return (
        <div className="market-card flex-space-between flex-column">
            <img className='img-market-card' src={`/vendor-images/_default-images/vendor-default-1_1600px.png`} alt="Vendor Image" />
            <h2 className='center margin-t-8 margin-b-8'>Looking to Join?</h2>
            <div className='center'>
                <p className='text-500'>Sell your goods on Gingham!</p>
                <ul className='ul-bullet'>
                    <li>Reach more customers!</li>
                    <li>Profit while reducing waste!</li>
                    <li>Click below to find out more!</li>
                </ul>
            </div>
            <button className="btn-market-card text-500" onClick={handleJoinToday}>Join Today!</button>
        </div>
    )
}

export default VendorSignUpCard;