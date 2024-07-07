import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const VendorDetail = () => {
    const { id } = useParams();
    const [vendor, setVendor] = useState(null);
    const [availableBaskets, setAvailableBaskets] = useState(5);

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/vendors/${id}`)
            .then(response => response.json())
            .then(data => setVendor(data))
            .catch(error => console.error('Error fetching vendor data:', error));
    }, [id]);

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
                <img src={vendor.image} alt="Vendor Image" style={{width: '100%'}} />
                <p>{vendor.description}</p>
                <h4>Location: {vendor.location}</h4>
                <h4>Hours: {vendor.hours}</h4>
            </div>
            <div>
                <h2>Buy a Market Basket for $4.99!</h2>
                <p>Pick up your basket at 2pm!</p>
                <h3><strong>$4.99</strong></h3>
                <img src="https://hgtvhome.sndimg.com/content/dam/images/hgtv/products/2021/4/1/4/RX_Food-52_multi-pocket-canvas-market-tote.jpg.rend.hgtvcom.616.616.85.suffix/1617303356725.jpeg"
                    alt="Basket Image" style={{width: '300px'}} /><br/>
                <button onClick={handleAddToCart}> Add to Cart</button>
                <p>Available Baskets: {availableBaskets}</p>
            </div>
        </div>
    );
};

export default VendorDetail;
