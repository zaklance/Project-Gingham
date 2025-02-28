import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Annotation } from 'mapkit-react';
import { formatDate } from '../../utils/helpers';

function MapAnnotation({ market, markerType, showMarker, setMarkerViews }) {
    const [isHover, setIsHover] = useState({});

    const handleMarkerHoverOn = (id) => {
        setIsHover((prev) => ({
            ...prev,
            [id]: true,
        }));
    };

    const handleMarkerHoverOff = (id) => {
        setIsHover((prev) => ({
            ...prev,
            [id]: false,
        }));
    };

    const handleMarkerClickOn = (id) => {
        setMarkerViews((prev) => {
            const updatedViews = Object.keys(prev).reduce((acc, key) => {
                acc[key] = false;
                return acc;
            }, {});

            updatedViews[id] = true;
            return updatedViews;
        });
    };

    const handleMarkerClickOff = (id) => {
        setMarkerViews((prev) => ({
            ...prev,
            [id]: false,
        }));
        // handleMarkerHoverOff(id)
    };

    return (
        <Annotation
            latitude={market.latitude}
            longitude={market.longitude}
            onSelect={() => handleMarkerClickOn(market.id)}
            visible={showMarker}
            calloutElement={
                <div 
                    className="marker-details"
                >
                    <div className='text-center'>
                        <div className="marker-name"><Link className='link-underline link-scale-96' to={`/user/markets/${market.id}`}>{market.name}</Link></div>
                        <div className="marker-day">{market.schedule}</div>
                        {market.year_round ? (
                            <div className="marker-day">Open Year-Round</div>
                        ) : (
                            <div>
                                {market.season_start ? (
                                    <div className="marker-day">{formatDate(market.season_start)} — {formatDate(market.season_end)}</div>
                                ) : (
                                    null
                                )}
                            </div>
                        )}
                    </div>
                </div> 
            }
            calloutEnabled
            // calloutOffsetY={-32}
        >
            <div 
                onMouseEnter={() => handleMarkerHoverOn(market.id)}
                onMouseLeave={() => handleMarkerHoverOff(market.id)}
            >
                <div className={!isHover[market.id] ? `map-circle${markerType}` : `map-circle${markerType}-on`}></div>
                <div className={!isHover[market.id] ? `map-inside-circle${markerType}` : `map-inside-circle${markerType}-on`}></div>
                <div className={!isHover[market.id] ? `map-triangle${markerType}` : `map-triangle${markerType}-on`}></div>
            </div>
        </Annotation>
    );
}

export default MapAnnotation;