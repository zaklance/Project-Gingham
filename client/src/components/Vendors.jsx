import React, { useState, useEffect } from 'react';
import VendorCard from './VendorCard';
import '../assets/css/index.css';

function Vendors() {
    const [vendor, setVendor] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    
    const products = ['art', 'baked goods', 'cheese', 'cider', 'ceramics', 'coffee/tea', 'fish', 'flowers', 'fruit', 'gifts', 'honey', 'international', 'juice', 'maple syrup', 'meats', 'nuts', 'pasta', 'pickles', 'spirits', 'vegetables'];

    useEffect(() => {
        fetch("http://127.0.0.1:5555/vendors")
        .then(response => response.json())
        .then(data => setVendor(data))
    }, []);
    
    const handleProductChange = (event) => {
        setSelectedProduct(event.target.value);
    };

    const filteredVendors = selectedProduct ? vendor.filter(vendor => vendor.product === selectedProduct) : vendor;

    return (
        <div className="markets-container">
            <br/>
            <div className='header'>
                <h3>FIND A MARKET VENDOR TODAY</h3>
                <select value={selectedProduct} onChange={handleProductChange}>
                    <option value="">All Products</option>
                    {products.map(product => (
                        <option key={product} value={product}>{product}</option>
                    ))}
                </select>
            </div>
            <div className="market-cards-container">
                {filteredVendors.map((vendorData) => (
                    <VendorCard key={vendorData.id} vendorData={vendorData} />
                ))}
            </div>
        </div>
    )
}

export default Vendors;