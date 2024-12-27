import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/css/index.css';
import { timeConverter, formatDate } from '../../utils/helpers';

function MarketCard({ marketData }) {
    const navigate = useNavigate();

    const handleLearnMore = () => {
        navigate(`/user/markets/${marketData.id}`);
    };

    const randomImage = [
        "market-default-1_1600px.png",
        "market-default-2_1600px.png",
        "market-default-3_1600px.png",
        "market-default-4_1600px.png"
    ]

    const marketImage = marketData.image
        ? `/market-images/${marketData.image}`
        : `/market-images/_default-images/${randomImage[Math.floor(Math.random() * randomImage.length)]}`;


    return (
        <div className="market-card flex-space-between flex-column">
            <div>
                <img src={marketImage} alt="Market Image" className="img-market-card" />
                <h3 className="margin-b-16">{marketData.name}</h3>
                <p><strong>Location:</strong> {marketData.location}</p>
                <p><strong>Schedule:</strong> {marketData.schedule}</p>

                {marketData.year_round === false && marketData.season_start && marketData.season_end ? (
                    <p><strong>Season:</strong> {formatDate(marketData.season_start)} – {formatDate(marketData.season_end)}</p>
                ) : (
                    marketData.year_round === false && (!marketData.season_start || !marketData.season_end) ? (
                        <p><strong>Season:</strong> Call Zak Wosewick</p>
                    ) : (
                        <p><strong>Open Year Round</strong></p>
                    )
                )}
            </div>
            <div>
                <button className="btn-market-card" onClick={handleLearnMore}>Learn More!</button>
            </div>
        </div>
    );
}

export default MarketCard;
