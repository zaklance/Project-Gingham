import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/css/index.css';

function MarketCard({ marketData }) {
    const navigate = useNavigate();
    const [ randomImage, setRandomImage ] = useState('');

    const images = [
        'https://neighbors.columbia.edu/sites/default/files/content/2023/farmers-market.jpg',
        'https://www.grownyc.org/files/gmkt/mkts/bronxborhall_shaylahunter_re_xy4a4543.jpg',
        'https://lh5.googleusercontent.com/proxy/Nd-2s7WjGA8FU3DU_URBrXwuo9dcyXtJwyJ7nmtY1HDszee2DnvtQ5IA1US5bkIP6A9RpD5FK0-H1GYin6b3tl7PORAbABPy-T-l_2Ak9ERf5VpENFF3uA',
        'https://cdn.vox-cdn.com/thumbor/K7pJk3lLSH60zEbktRL0AQ-jNfA=/0x0:4500x2994/1200x900/filters:focal(1890x1137:2610x1857)/cdn.vox-cdn.com/uploads/chorus_image/image/65219436/6329735393_3a905a118a_o.0.jpg',
        'https://assets3.thrillist.com/v1/image/1725017/828x610/flatten;crop;webp=auto;jpeg_quality=60.jpg',
        'https://offloadmedia.feverup.com/secretnyc.co/wp-content/uploads/2022/04/25075251/greenmarket-grownyc-768x512.jpeg',
        'https://offloadmedia.feverup.com/secretnyc.co/wp-content/uploads/2022/04/25075224/c.-Martin-Seck-GAP-1-768x531.jpg',
        'https://www.officialworldtradecenter.com/content/dam/wtc/site-resources/wtc-website-photography/events/WTC_Events_FarmersMarket.JPG.transform/wtc-960/image.jpeg',
        'https://cdn.vox-cdn.com/thumbor/yPQbB1QqymUa85rML9qCDtEpSFE=/0x319:4500x2675/fit-in/1200x630/cdn.vox-cdn.com/uploads/chorus_asset/file/19184719/6329735393_3a905a118a_o.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/2/28/Union_Square_Farmers_Market.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/d/da/10292023_Broadway_farmers%27_market_Columbia_NYC.jpg',
        'https://www.officialworldtradecenter.com/content/dam/wtc/site-resources/wtc-website-photography/events/WTC_Events_FarmersMarket.JPG.transform/wtc-960/image.jpeg'
    ];

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * images.length);
        setRandomImage(images[randomIndex]);
    }, []);

    const handleLearnMore = () => {
        navigate(`/markets/${marketData.id}`);
    };

    return (
        <div className="market-card">
            <img src={randomImage} alt="Market Image" style={{ width: '260px' }} />
            <h3>{marketData.name}</h3>
            <p><strong>Location:</strong> {marketData.location}</p>
            <p><strong>Hours:</strong> {marketData.hours}</p>
            <p><strong>Open Year Round:</strong> {marketData.year_round ? "Yes" : "No"}</p>
            <p><strong>Zipcode:</strong> {marketData.zipcode}</p>
            <button className="market-card-button" onClick={handleLearnMore}>Learn More!</button>
        </div>
    );
}

export default MarketCard; 