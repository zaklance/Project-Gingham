import react from 'react';
import MarketCard from './MarketCard';
import { Map, Marker } from 'mapkit-react';

function Markets() {
    return (
        <>
            <header>FIND A FARMERS MARKET TODAY</header>
            <div id='map'>
                <h2>Please Work</h2>
                <Map token={import.meta.env.REACT_MAP_KEY} >
                    <Marker latitude={46.52} longitude={6.57} />
                </Map>
            </div >
            <script src="https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.core.js"
                crossOrigin='async'
                data-callback="initMapKit"
                data-libraries="services,full-map,geojson">
            </script>
        </>
    )
}

export default Markets;