import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const VendorDetail = () => {
    const { id } = useParams();
    const [vendor, setVendor] = useState(null);
    const [availableBaskets, setAvailableBaskets] = useState(5);
    const [randomImage, setRandomImage] = useState('');
    const [marketDetails, setMarketDetails] = useState({});
    const [locations, setLocations] = useState([]); // Initialize as empty array

    const images = [
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJdUQVqfYHV6YWtlJYuNouSOjUqHSEetAGSg&s',
        'https://www.opkansas.org/wp-content/uploads/2019/06/opfm-vendor-web2.jpg',
        'https://static.wixstatic.com/media/05bd2f_2b30b89b49eb4b2e95810360a9357bd2~mv2_d_7360_4912_s_4_2.jpeg/v1/fill/w_640,h_434,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/05bd2f_2b30b89b49eb4b2e95810360a9357bd2~mv2_d_7360_4912_s_4_2.jpeg',
        'https://www.merriam.org/files/sharedassets/public/v/1/1.-photos/parks/farmers-market-1.jpg?dimension=pageimage&w=480',
        'https://c8.alamy.com/comp/2R82FT1/st-jacobs-farmers-market-fruit-and-vegetable-vendors-ontario-canada-2R82FT1.jpg',
        'https://www.fairburn.com/sites/default/files/uploads/ParksAndRecreation/document_2.jpg',
        'https://www.lanecountyfarmersmarket.org/wp-content/uploads/2022/02/Vendor-Slider-3-scaled.jpg',
        'https://frontierefarmhouse.wordpress.com/wp-content/uploads/2019/09/66422240_2392773677468030_9162452177778638848_o.jpg?w=1024'
    ];

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/vendors/${id}`)
            .then(response => response.json())
            .then(data => {
                setVendor(data);
                setLocations(data.locations || []);
                const randomIndex = Math.floor(Math.random() * images.length);
                setRandomImage(images[randomIndex]);
            })
            .catch(error => console.error('Error fetching vendor data:', error));
    }, [id]);

    useEffect(() => {
        if (Array.isArray(locations) && locations.length > 0) { // Check if locations is an array
            const fetchMarketDetails = async () => {
                const promises = locations.map(async marketId => {
                    const response = await fetch(`http://127.0.0.1:5555/markets/${marketId}`);
                    if (response.ok) {
                        const marketData = await response.json();
                        return { id: marketId, name: marketData.name };
                    } else {
                        console.log(`Failed to fetch market ${marketId}`);
                        return { id: marketId, name: 'Unknown Market' };
                    }
                });

                Promise.all(promises)
                    .then(details => {
                        const marketDetailsMap = {};
                        details.forEach(detail => {
                            marketDetailsMap[detail.id] = detail.name;
                        });
                        setMarketDetails(marketDetailsMap);
                    })
                    .catch(error => {
                        console.error('Error fetching market details:', error);
                    });
            };

            fetchMarketDetails();
        }
    }, [locations]);

    const handleAddToCart = () => {
        if (availableBaskets > 0) {
            setAvailableBaskets(prevCount => prevCount - 1);
        } else {
            alert("Sorry, all baskets are sold out!");
        }
    };

    if (!vendor) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <div>
                <h2>{vendor.name}</h2>
                <img src={randomImage} alt="Vendor Image" style={{ width: '70%' }} />
                <h4>Based out of: {vendor.based_out_of}</h4>
                <br />
                <h4>Farmers Market Locations:</h4>
                {Array.isArray(locations) && locations.length > 0 ? (
                    locations.map((marketId, index) => (
                        <div key={index} style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
                            <Link to={`/markets/${marketId}`}> {marketDetails[marketId] || 'Loading...'} </Link>
                        </div>
                    ))
                ) : (
                    <p>No market locations at this time</p>
                )}
            </div>
            <div>
                <br />
                <h2>Buy a Market Basket for $4.99!</h2>
                <p>Pick up your basket at 2pm!</p>
                <h3><strong>$4.99</strong></h3>
                <img src="https://hgtvhome.sndimg.com/content/dam/images/hgtv/products/2021/4/1/4/RX_Food-52_multi-pocket-canvas-market-tote.jpg.rend.hgtvcom.616.616.85.suffix/1617303356725.jpeg"
                    alt="Basket Image" style={{ width: '300px' }} /><br />
                <button onClick={handleAddToCart}>Add to Cart</button>
                <p>Available Baskets: {availableBaskets}</p>
            </div>
        </div>
    );
};

export default VendorDetail;
