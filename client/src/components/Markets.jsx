import react from 'react';
import MarketCard from './MarketCard';
import { Map, Marker } from 'mapkit-react';
<<<<<<< HEAD
=======
import '../assets/css/index.css';
// import REACT_MAP_KEY from '../../.env';
>>>>>>> 99736edc5fdef732f8d914edb0e2f8a7217c09be

function Markets() {
    const [ market, setMarket] = useState([]);
    
    useEffect(() => {
        fetch("http://localhost:3000/markets")
        .then(response => response.json())
        .then(data => setMarket(data))
    }, []);

    return (
        <div className="markets-container">
            <br/>
            <header>FIND A FARMERS MARKET TODAY</header>
<<<<<<< HEAD
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
=======
            <h4>Click on the image to learn more</h4>
                {/* <div id='map'>
                    <Map token=REACT_MAP_KEY>
                        <Marker latitude={46.52} longitude={6.57} />
                    </Map>
                </div > */}
            <br/>
            <div className="market-cards-container">
                {market.map((marketData) => (
                    <MarketCard key={marketData.id} marketData={marketData} />
                ))}
            </div>
        </div>
>>>>>>> 99736edc5fdef732f8d914edb0e2f8a7217c09be
    )
}

export default Markets;
