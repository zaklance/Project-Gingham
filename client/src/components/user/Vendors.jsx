import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import VendorCard from './VendorCard';
import '../../assets/css/index.css';

function Vendors() {
    const [vendor, setVendor] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    
    const products = [
        'Art', 'Baked Goods', 'Cheese', 'Cider', 'Ceramics', 'Coffee/Tea', 'Fish', 'Flowers', 'Fruit', 'Gifts', 'Honey',
        'International', 'Juice', 'Maple Syrup', 'Meats', 'Mushrooms', 'Nuts', 'Pasta', 'Pickles', 'Spirits', 'Vegetables'
    ];

    useEffect(() => {
        if (location.state?.selectedProduct) { 
            setSelectedProduct(location.state.selectedProduct);
        }

        fetch("http://127.0.0.1:5555/api/vendors")
            .then(response => response.json())
            .then(data => setVendor(data))
    }, [location.state]);
    
    const handleProductChange = (event) => {
        setSelectedProduct(event.target.value);
    };

    const handleVendorClick = (vendorId) => {
        navigate(`/user/vendors/${vendorId}`, { state: { selectedProduct} });
    };

    const filteredVendors = selectedProduct ? vendor.filter(vendor => vendor.product == selectedProduct) : vendor;

    return (
        <div className="markets-container">
            <br/>
            <div className='header'>
                <div className='flex-space-between'>
                    <h2>FIND A MARKET VENDOR TODAY</h2>
                    <select value={selectedProduct} onChange={handleProductChange}>
                        <option value="">All Products</option>
                        {products.map(product => (
                            <option key={product} value={product}>{product}</option>
                        ))}
                    </select>
                </div>
            </div>
            <br/>
            <div className="market-cards-container">
                {filteredVendors.map((vendorData) => (
                    <VendorCard 
                        key={vendorData.id} 
                        vendorData={vendorData} 
                        products={products} 
                        selectedProduct={selectedProduct}
                        onClick={() => handleVendorClick(vendorData.id)} 
                    />
                ))}
            </div>
        </div>
    )
}

export default Vendors;