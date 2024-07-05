import react from 'react';
import MarketCard from './MarketCard';
import { Map, Marker } from 'mapkit-react';
import REACT_MAP_KEY from '../../.env'

function Markets() {
    return (
        <>
            <header>FIND A FARMERS MARKET TODAY</header>
            <div id='map'>
                <Map token=REACT_MAP_KEY>
                    <Marker latitude={46.52} longitude={6.57} />
                </Map>
            </div >
        </>
    )
}

export default Markets;