import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/css/index.css';

function MarketCard({ marketData }) {
    const navigate = useNavigate();

    const weekDay = ["Mon", "Tues", "Wed", "Thur", "Fri", "Sat", "Sun"];

    function timeConverter(time24) {
        const date = new Date('1970-01-01T' + time24);

        const time12 = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        });
        return time12;
    }

    function formatDate(dateString) {
        if (!dateString || dateString.length !== 10) return "Invalid Date";
    
        const date = new Date(dateString + "T00:00:00");
    
        if (isNaN(date.getTime())) return "Invalid Date";
    
        const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
        const day = date.getDate();
    
        return `${monthName} ${day}`;
    }

    const handleLearnMore = () => {
        navigate(`/user/markets/${marketData.id}`);
    };

    return (
        <div className="market-card flex-space-between flex-column">
            <div>
                <img src={`/market-images/${marketData.image}`} alt="Market Image" className="img-market-card" />
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
