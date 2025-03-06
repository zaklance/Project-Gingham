import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Annotation } from 'mapkit-react';
import { formatDate } from '../../utils/helpers';

function MapAnnotation({ handleMarkerHoverOn, handleMarkerHoverOff, isHover, market, markerType, showMarker }) {


    return (
        <Annotation
            latitude={market.latitude}
            longitude={market.longitude}
            visible={showMarker}
            calloutElement={
                <div className="marker-details">
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
            // calloutOffsetY={-43}
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