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
            </div>
            <table className='table-v-top'>
                <tbody>
                    {marketData.year_round === false && marketData.season_start && marketData.season_end ? (
                        <tr>
                            <td className='text-600'>Season:</td>
                            <td>{formatDate(marketData.season_start)} – {formatDate(marketData.season_end)}</td>
                        </tr>
                    ) : (
                        marketData.year_round === false && (!marketData.season_start || !marketData.season_end) ? (
                            <></>
                        ) : (
                            <tr>
                                <td className='text-600' colSpan={2}>Open Year Round</td>
                            </tr>
                        )
                    )}
                    <tr>
                        <td className='text-600'>Schedule:</td>
                        <td>{marketData.schedule}</td>
                    </tr>
                    <tr>
                        <td className='text-600'>Location:</td>
                        <td>{marketData.location}</td>
                    </tr>
                    <tr>
                        <td className='text-600'>Distance:</td>
                        <td>{(
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
                                : 'your zip code'}</td>
                    </tr>
                    <tr>
                        <td className='text-600'>Vendors:</td>
                        <td>{countVendors(marketData)} on <span className='font-cera-gingham text-size-1-2'>gingham</span></td>
                    </tr>
                </tbody>
            </table>
            <div>
                <button className="btn-market-card" onClick={handleLearnMore}>Learn More!</button>
            </div>
        </div>
    );
}

export default MarketCard;
