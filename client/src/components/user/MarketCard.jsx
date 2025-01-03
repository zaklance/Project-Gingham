import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/css/index.css';
import { timeConverter, formatDate } from '../../utils/helpers';
import { getRadius, zipCodeData, zipCodeDistance } from 'zipcode-city-distance';


function MarketCard({ marketData, userZipcode }) {
    const navigate = useNavigate();

    const handleLearnMore = () => {
        navigate(`/user/markets/${marketData.id}`);
    };


    return (
        <div className="market-card flex-space-between flex-column">
            <div>
                {marketData.image !== null ? (
                    <img className="img-market-card" src={`/market-images/${marketData.image}`} alt="Market Image" />
                ) : (
                    <img className="img-market-card" src={`/market-images/_default-images/${marketData.image_default}`} alt="Market Image" />
                )}
                <h3 className="margin-b-16">{marketData.name}</h3>
                <p><strong>Location:</strong> {marketData.location}</p>
                <p><strong>Schedule:</strong> {marketData.schedule}</p>

                {marketData.year_round === false && marketData.season_start && marketData.season_end ? (
                    <p><strong>Season:</strong> {formatDate(marketData.season_start)} – {formatDate(marketData.season_end)}</p>
                ) : (
                    marketData.year_round === false && (!marketData.season_start || !marketData.season_end) ? (
                        <></>
                    ) : (
                        <p><strong>Open Year Round</strong></p>
                    )
                )}
                {userZipcode ? <p><strong>Distance:</strong> {parseFloat(zipCodeDistance(userZipcode, marketData.zipcode, 'M').toFixed(2)) === 0.00 ? 'Same Zipcode' : `${zipCodeDistance(userZipcode, marketData.zipcode, 'M').toFixed(2)} miles`}</p> : <></>}
            </div>
            <div>
                <button className="btn-market-card" onClick={handleLearnMore}>Learn More!</button>
            </div>
        </div>
    );
}

export default MarketCard;
