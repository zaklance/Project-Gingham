import React, { useState, useEffect } from 'react';
import VendorCard from './VendorCard';
import '../../assets/css/index.css';

function Vendors() {
    const [vendor, setVendor] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    
    const products = [
        'Art', 'Baked Goods', 'Cheese', 'Cider', 'Ceramics', 'Coffee/Tea', 'Fish', 'Flowers', 'Fruit', 'Gifts', 'Honey',
        'International', 'Juice', 'Maple Syrup', 'Meats', 'Mushrooms', 'Nuts', 'Pasta', 'Pickles', 'Spirits', 'Vegetables'
    ];

    useEffect(() => {
        fetch("http://127.0.0.1:5555/vendors")
        .then(response => response.json())
        .then(data => setVendor(data))
    }, []);
    
    const handleProductChange = (event) => {
        setSelectedProduct(event.target.value);
    };

    const filteredVendors = selectedProduct ? vendor.filter(vendor => vendor.product == selectedProduct) : vendor;

    return (
        <div className="markets-container">
            <br/>
            <div className='header'>
                <div className='flex-space-between'>
                    <h2 className='float-left'>FIND A MARKET VENDOR TODAY</h2>
                    <select className='float-right' value={selectedProduct} onChange={handleProductChange}>
                    <option value="">All Products</option>
                    {products.map(product => (
                        <option key={product} value={product}>{product}</option>
                    ))}
                    </select>
                </div>
            </div>
            <br className='no-float'/>
            <div className="market-cards-container">
                {filteredVendors.map((vendorData) => (
                    <VendorCard key={vendorData.id} vendorData={vendorData} />
                ))}
            </div>
        </div>
    )
}

export default Vendors;