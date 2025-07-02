import React from 'react';
import { useNavigate } from 'react-router-dom';
import { timeConverter, formatDate } from '../../utils/helpers';


function MarketCard({ marketData, user, haversineDistance, resultCoordinates, userCoordinates, filterAddress }) {
    const navigate = useNavigate();

    const siteURL = import.meta.env.VITE_SITE_URL;

    const handleLearnMore = () => {
        navigate(`/user/markets/${marketData.id}`);
    };

    const countVendors = (market) => {
        const totalVendors = market.market_days?.reduce((total, marketDay) => 
            total + (marketDay.vendor_markets?.length || 0), 0
        ) || 0;

        return totalVendors > 0 ? totalVendors : "None";
    };


    return (
        <div className="market-card flex-space-between flex-column">
            <div>
                {marketData.image !== null ? (
                    <img className="img-market-card" src={`${siteURL}${marketData.image}`} alt="Market Image" />
                ) : (
                    <img className="img-market-card" src={`/market-images/_default-images/${marketData.image_default}`} alt="Market Image" />
                )}
                <div className='text-center'>
                    <h4 title={marketData.is_farmstand ? "Single-Vendor Farmstand" : "Multi-Vendor Farmers' Market"}>{marketData.name}</h4>
                    <p className='text-500 margin-b-16'>{marketData.city}, {marketData.state}</p>
                </div>
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
                                : 'your zip code'}
                    </p>
                ) : <></>}
                <p><strong>Vendors:</strong> {countVendors(marketData)} on <span className='font-cera-gingham text-size-1-2'>gingham</span></p>
            </div>
            <div>
                <button className="btn-market-card" onClick={handleLearnMore}>Learn More!</button>
            </div>
        </div>
    );
}

export default MarketCard;
