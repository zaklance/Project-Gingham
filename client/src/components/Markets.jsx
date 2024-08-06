import React, { useState, useEffect } from 'react';
import MarketCard from './MarketCard';
import '../assets/css/index.css';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
// import { Map, Marker } from 'mapkit-react';



function Markets() {
    const [markets, setMarkets] = useState([]);
    
    useEffect(() => {
        fetch("http://127.0.0.1:5555/markets")
            .then(response => response.json())
            .then(markets => setMarkets(markets))
            .catch(error => console.error('Error fetching markets', error));
    }, []);

    const unionSquare = { lat:40.736358642578125, lng:-73.99076080322266 }
    const market175 = { lat: 40.84607450953993, lng: -73.93808039940272 }
    const market57 = { lat: 40.769140743893075, lng: -73.98836576430834 }
    const market79 = { lat: 40.782040858828, lng: -73.9759752811397 }
    const market82 = { lat: 40.77397099020891, lng: -73.95064361322936 }
    const market94 = { lat: 40.78180268440337, lng: -73.94555998335593 }
    const abington = { lat: 40.737268845844085, lng: -74.00531736212757 }
    const astor = { lat: 40.729830818573944, lng: -73.99109568735417 }
    const bowling = { lat: 40.704724320402526, lng: -74.01342009247573 }
    const brosis = { lat: 40.824268847996954, lng: -73.94880767347686 }
    const chelsea = { lat: 40.74610601822501, lng: -74.00012495281699 }
    const childrens = { lat: 40.80245205041825, lng: -73.94675905810875 }
    const columbia = { lat: 40.80711550674964, lng: -73.9643334908912 }
    const dag = { lat: 40.752106980482026, lng: -73.96813449641382 }
    const fort = { lat: 40.842308310821956, lng: -73.94211665674466 }
    const fulton = { lat: 40.70614940342313, lng: -74.00349962702734 }
    const gov = { lat: 40.71266393582476, lng: -73.98847487671178 }
    const grass = { lat: 40.82373611412579, lng: -73.9435495760123 }
    const greenOculus = { lat: 40.71142490993184, lng: -74.01076962766949 }
    const harlem = { lat: 40.79815888129796, lng: -73.95254032492262 }
    const harvestEH = { lat: 40.79001677902627, lng: -73.94559282721028 }
    const harvestH = { lat: 40.81542139191092, lng: -73.93994201397497 }
    const harvestL = { lat: 40.80272354850676, lng: -73.94895981440956 }
    const harvestMH = { lat: 40.784947665352576, lng: -73.94660106093569 }
    const inwood = { lat: 40.86911825882977, lng: -73.92025906885881 }
    const les = { lat: 40.715117290409026, lng: -73.98348650666313 }
    const morning = { lat: 40.801382884379336, lng: -73.95970142371496 }
    const mount = { lat: 40.78944510836953, lng: -73.95271330705022 }
    const nypAudoban = { lat: 40.839630140355446, lng: -73.93889062898364 }
    const nypBroadway = { lat: 40.86600006214813, lng: -73.9263264427691 }
    const projectEats = { lat: 40.718268229915765, lng: -73.98822774526953 }
    const ps11 = { lat: 40.74443551076143, lng: -74.00056543152783 }
    const ps57 = { lat: 40.797300330819134, lng: -73.94074817230118 }
    const stuytown = { lat: 40.73200566470982, lng: -73.97761240821589 }
    const tompkins = { lat: 40.72606737678102, lng: -73.98333751481684 }
    const tribeca = { lat: 40.71690089948348, lng: -74.01090464424209 }
    const tucker = { lat: 40.77367979894632, lng: -73.9819555713842 }
    const twoB = { lat: 40.86600289682479, lng: -73.92633729986045 }
    const uptown = { lat: 40.811760800653175, lng: -73.95159181329969 }

    return (
        <>
        <div className="markets-container">
            <div id='map'>
                <APIProvider apiKey={import.meta.env.VITE_GOOGLE_KEY} onLoad={() => console.log('Maps API has loaded.')}>
                        <Map defaultCenter={unionSquare} defaultZoom={13} map-id="MARKET_MAP">
                            <Marker position={unionSquare} />
                            <Marker position={market175} />
                            <Marker position={market57} />
                            <Marker position={market79} />
                            <Marker position={market82} />
                            <Marker position={market94} />
                            <Marker position={abington} />
                            <Marker position={astor} />
                            <Marker position={bowling} />
                            <Marker position={brosis} />
                            <Marker position={chelsea} />
                            <Marker position={childrens} />
                            <Marker position={columbia} />
                            <Marker position={dag} />
                            <Marker position={fort} />
                            <Marker position={fulton} />
                            <Marker position={gov} />
                            <Marker position={grass} />
                            <Marker position={greenOculus} />
                            <Marker position={harlem} />
                            <Marker position={harvestEH} />
                            <Marker position={harvestH} />
                            <Marker position={harvestL} />
                            <Marker position={harvestMH} />
                            <Marker position={inwood} />
                            <Marker position={les} />
                            <Marker position={morning} />
                            <Marker position={mount} />
                            <Marker position={nypAudoban} />
                            <Marker position={nypBroadway} />
                            <Marker position={projectEats} />
                            <Marker position={ps11} />
                            <Marker position={ps57} />
                            <Marker position={stuytown} />
                            <Marker position={tompkins} />
                            <Marker position={tribeca} />
                            <Marker position={tucker} />
                            <Marker position={twoB} />
                            <Marker position={uptown} />
                    </Map>
                </APIProvider>
                {/* <gmp-map defaultCenter={unionSquare} zoom={13} map-id="DEMO_MAP_ID">
                        <gmp-advanced-marker position={unionSquare} title="Union Square"></gmp-advanced-marker>
                </gmp-map> */}
            </div>
            <br />
            <div className="market-cards-container">
                {markets.map((marketData) => (
                    <MarketCard key={marketData.id} marketData={marketData} />
                ))}
            </div>
        </div>
        </>
    );
}

export default Markets;