import React from 'react';
import { useNavigate } from 'react-router-dom';
import { timeConverter, formatDate } from '../../utils/helpers';


function MarketCard({ marketData, user, haversineDistance, resultCoordinates, userCoordinates, filterAddress }) {
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
                {(user?.coordinates || resultCoordinates || userCoordinates) && marketData?.coordinates ? (
                    <p>
                        <strong>Distance:</strong> {(
                            haversineDistance(
                                filterAddress 
                                    ? resultCoordinates 
                                    : userCoordinates 
                                    ? userCoordinates 
                                    : user?.coordinates,
                                marketData.coordinates
                            ) || 0
                        ).toFixed(2)} miles from {filterAddress
                            ? 'entered address'
                            : userCoordinates
                                ? 'your location'
                                : 'your home address'}
                    </p>
                ) : <></>}
            </div>
            <div>
                <button className="btn-market-card" onClick={handleLearnMore}>Learn More!</button>
            </div>
        </div>
    );
}

export default MarketCard;
