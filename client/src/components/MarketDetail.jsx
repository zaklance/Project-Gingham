import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';

function MarketDetail ({ match }) {
    const { id } = useParams();

    const [market, setMarket] = useState(null);
    const [vendors, setVendors] = useState({});
    const [randomImage, setRandomImage] = useState('');
    const [marketReviews, setMarketReviews] = useState([]);
    const [marketFavs, setMarketFavs] = useState([]);
    const [isClicked, setIsClicked] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);
    const [showAlert, setShowAlert] = useState(false);

    const { handlePopup, } = useOutletContext();

    const navigate = useNavigate();

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
        fetch(`http://127.0.0.1:5555/market_reviews?market_id=${id}`)
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setMarketReviews(data);
                } else {
                    console.error('Unexpected response format:', data);
                    setMarketReviews([]);
                }
            })
            .catch(error => console.error('Error fetching reviews:', error));
    }, [id]);

    const handleBackButtonClick = () => {
        navigate('/markets');
    };

    useEffect(() => {
        fetch("http://127.0.0.1:5555/market_favorites")
            .then(response => response.json())
            .then(data => {
                const filteredData = data.filter(item => item.user_id === parseInt(globalThis.sessionStorage.getItem('user_id')));
                setMarketFavs(filteredData)
            })
            .catch(error => console.error('Error fetching favorites', error));
    }, []);

    const handleClick = async (event) => {
        if (globalThis.sessionStorage.getItem('user_id') !== null) {
            setIsClicked((isClick) => !isClick);
            if (isClicked == false) {
                const response = await fetch('http://127.0.0.1:5555/market_favorites', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: globalThis.sessionStorage.getItem('user_id'),
                        market_id: market.id
                    })
                    // credentials: 'include'
                }).then((resp) => {
                    return resp.json()
                }).then(data => {
                    setMarketFavs([...marketFavs, data]);
                    setAlertMessage('added to favorites');
                });
            } else {
                const findMarketFavId = marketFavs.filter(item => item.market_id == market.id)
                for (const item of findMarketFavId) {
                    fetch(`http://127.0.0.1:5555/market_favorites/${item.id}`, {
                        method: "DELETE",
                    }).then(() => {
                        setMarketFavs((favs) => favs.filter((fav) => fav.market_id !== market.id));
                        setAlertMessage('removed from favorites');
                    })
                }
            }
        } else {
            handlePopup()
        }

        setShowAlert(true);
        setTimeout(() => {
            setShowAlert(false);
        }, 1000);
    };


    if (!market) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <button onClick={handleBackButtonClick} className='back-button'>
                Back to Markets
            </button>
            <h2>{market.name}</h2>
            <img src={randomImage} alt="Market Image" style={{ width: '70%' }} />
            <p>{market.description}</p>
            <div className='float-left'>
                <h4>Location: {market.location}</h4>
                <h4>Hours: {market.hours}</h4>
            </div>
            <br />
            <div>
                <button
                    className={`btn-like ${isClicked || marketFavs.some(fav => fav.market_id === market.id) ? 'btn-like-on' : ''}`}
                    onClick={handleClick}> ❤️ </button>
                {showAlert && (
                    <div className={`favorites-alert ${!showAlert ? 'favorites-alert-hidden' : ''}`}>
                        {alertMessage}
                    </div>
                )}
            </div>
            <br />
            <br />
            <h2>Vendors in this Market:</h2>
            <ul>

            </ul>
            <br />
            <div>
                <h2>Reviews</h2>
                {marketReviews.length > 0 ? (
                    marketReviews.map((review, index) => (
                        <div key={index} style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
                            <h4>{review.user ? review.user.first_name : 'Anonymous'}</h4>
                            <p>{review.review_text}</p>
                        </div>
                    ))
                ) : (
                    <p>No reviews available.</p>
                )}
            </div>
        </div>
    );
};

export default MarketDetail;
