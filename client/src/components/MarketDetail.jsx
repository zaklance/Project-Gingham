import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const MarketDetail = () => {
    const { id } = useParams();
    const [market, setMarket] = useState(null);
    const [randomImage, setRandomImage] = useState('');
    const [marketReviews, setMarketReviews] = useState([]);

    const images = [
        'https://neighbors.columbia.edu/sites/default/files/content/2023/farmers-market.jpg',
        'https://www.grownyc.org/files/gmkt/mkts/bronxborhall_shaylahunter_re_xy4a4543.jpg',
        'https://lh5.googleusercontent.com/proxy/Nd-2s7WjGA8FU3DU_URBrXwuo9dcyXtJwyJ7nmtY1HDszee2DnvtQ5IA1US5bkIP6A9RpD5FK0-H1GYin6b3tl7PORAbABPy-T-l_2Ak9ERf5VpENFF3uA',
        'https://cdn.vox-cdn.com/thumbor/K7pJk3lLSH60zEbktRL0AQ-jNfA=/0x0:4500x2994/1200x900/filters:focal(1890x1137:2610x1857)/cdn.vox-cdn.com/uploads/chorus_image/image/65219436/6329735393_3a905a118a_o.0.jpg',
        'https://assets3.thrillist.com/v1/image/1725017/828x610/flatten;crop;webp=auto;jpeg_quality=60.jpg',
        'https://offloadmedia.feverup.com/secretnyc.co/wp-content/uploads/2022/04/25075251/greenmarket-grownyc-768x512.jpeg',
        'https://offloadmedia.feverup.com/secretnyc.co/wp-content/uploads/2022/04/25075224/c.-Martin-Seck-GAP-1-768x531.jpg',
        'https://www.officialworldtradecenter.com/content/dam/wtc/site-resources/wtc-website-photography/events/WTC_Events_FarmersMarket.JPG.transform/wtc-960/image.jpeg'
    ];

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/markets/${id}`)
            .then(response => response.json())
            .then(data => {
                setMarket(data);
                const randomIndex = Math.floor(Math.random() * images.length);
                setRandomImage(images[randomIndex]);
            })
            .catch(error => console.error('Error fetching market data:', error));
    }, [id]);

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/market_reviews/${id}`)
            .then(response => response.json())
            .then(data => setMarketReviews(data))
            .catch(error => console.error('Error fetching reviews:', error));
    }, [id]);

    if (!market) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h2>{market.name}</h2>
            <img src={randomImage} alt="Market Image" style={{ width: '70%' }} />
            <p>{market.description}</p>
            <h4>Location: {market.location}</h4>
            <h4>Hours: {market.hours}</h4>
            <br />
            <h2>Reviews</h2>
            <br />
            {marketReviews.map((review, index) => (
                <div key={index}>
                    <h4>{review.user_first_name}</h4>
                    <p>{review.review_text}</p>
                </div>
            ))}
        </div>
    );
};

export default MarketDetail;