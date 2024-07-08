import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/css/index.css';

function VendorCard({ vendorData }) {
    const navigate = useNavigate();
    const [ randomImage, setRandomImage ] = useState('');

    const images = [
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJdUQVqfYHV6YWtlJYuNouSOjUqHSEetAGSg&s',
        'https://www.opkansas.org/wp-content/uploads/2019/06/opfm-vendor-web2.jpg',
        'https://static.wixstatic.com/media/05bd2f_2b30b89b49eb4b2e95810360a9357bd2~mv2_d_7360_4912_s_4_2.jpeg/v1/fill/w_640,h_434,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/05bd2f_2b30b89b49eb4b2e95810360a9357bd2~mv2_d_7360_4912_s_4_2.jpeg',
        'https://www.merriam.org/files/sharedassets/public/v/1/1.-photos/parks/farmers-market-1.jpg?dimension=pageimage&w=480',
        'https://c8.alamy.com/comp/2R82FT1/st-jacobs-farmers-market-fruit-and-vegetable-vendors-ontario-canada-2R82FT1.jpg',
        'https://www.fairburn.com/sites/default/files/uploads/ParksAndRecreation/document_2.jpg',
        'https://www.lanecountyfarmersmarket.org/wp-content/uploads/2022/02/Vendor-Slider-3-scaled.jpg',
        'https://frontierefarmhouse.wordpress.com/wp-content/uploads/2019/09/66422240_2392773677468030_9162452177778638848_o.jpg?w=1024'
    ]

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * images.length);
        setRandomImage(images[randomIndex]);
    }, []);

    const handleLearnMore = () => {
        navigate(`/vendors/${vendorData.id}`);
    };

    return (
        <div className="market-card">
            <img src={randomImage} alt="Vendor Image" style={{width: '260px'}}/>
            <h2>{vendorData.name}</h2>
            <h4>{vendorData.based_out_of}</h4>
            <h4>{vendorData.product}</h4>
            <button className="market-card-button" onClick={handleLearnMore}>Buy a Farmers Market Basket!</button>
        </div>
    )
}

export default VendorCard;