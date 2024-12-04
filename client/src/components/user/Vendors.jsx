import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import VendorCard from './VendorCard';
import '../../assets/css/index.css';

function Vendors() {
    const [vendors, setVendors] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [query, setQuery] = useState("");
    const [vendorFavs, setVendorFavs] = useState([]);
    const [isClicked, setIsClicked] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    console.log(vendorFavs)

    const userId = parseInt(globalThis.localStorage.getItem('user_id'));
    
    const products = [
        'Art', 'Baked Goods', 'Cheese', 'Cider', 'Ceramics', 'Coffee/Tea', 'Fish', 'Flowers', 'Fruit', 'Gifts', 'Honey',
        'International', 'Juice', 'Maple Syrup', 'Meats', 'Mushrooms', 'Nuts', 'Pasta', 'Pickles', 'Spirits', 'Vegetables'
    ];

    const onUpdateQuery = event => setQuery(event.target.value);
    const filteredVendors = vendors.filter(vendor =>
        vendor.name.toLowerCase().includes(query.toLowerCase()) &&
        vendor.name !== query &&
        (!selectedProduct || vendor.product === selectedProduct) && // Include selectedProduct condition if it exists
        (!isClicked || vendorFavs.some(vendorFavs => vendorFavs.vendor_id === vendor.id)) // Filter by favVendors only when isClicked is true
    );
    const matchingVendor = vendors.find(vendor => vendor.name.toLowerCase() === query.toLowerCase());
    const matchingVendorId = matchingVendor ? matchingVendor.id : null;

    useEffect(() => {
        if (location.state?.selectedProduct) { 
            setSelectedProduct(location.state.selectedProduct);
        }

        fetch("http://127.0.0.1:5555/api/vendors")
            .then(response => response.json())
            .then(data => setVendors(data))
    }, [location.state]);

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/api/vendor-favorites?user_id=${userId}`)
            .then(response => response.json())
            .then(data => { setVendorFavs(data) })
            .catch(error => console.error('Error fetching vendor favorites', error));
    }, []);
    
    const handleProductChange = (event) => {
        setSelectedProduct(event.target.value);
    };

    const handleVendorClick = (vendorId) => {
        navigate(`/user/vendors/${vendorId}`, { state: { selectedProduct} });
    };

    const handleClick = (event) => {
        setIsClicked((isClick) => !isClick);
    }


    return (
        <div className="markets-container">
            <div className='header margin-b-24'>
                <div className='flex-space-between'>
                    <h2>Find A Market Vendor Today</h2>
                </div>
                <table className='table-search margin-t-16'>
                    <tbody>
                        <tr>
                            <td className='cell-title'>Search:</td>
                            <td className='cell-text'>
                                <input id='search' className="search-bar" type="text" placeholder="Search vendors..." value={query} onChange={onUpdateQuery} />
                                <div className="dropdown-content">
                                    {
                                        query &&
                                        filteredVendors.slice(0, 10).map(item => <div className="search-results" key={item.id} onClick={(e) => setQuery(item.name)}>
                                            {item.name}
                                        </div>)
                                    }
                                </div>
                            </td>
                            <td className='cell-text cell-filter'>Filters: </td>
                            <td>
                                <button
                                    className={`btn-fav-filter ${isClicked ? 'btn-fav-filter-on' : ''}`}
                                    onClick={handleClick}>&#9829;
                                </button>
                            </td>
                            <td>
                                <select className='select-filter' value={selectedProduct} onChange={handleProductChange}>
                                    <option value="">All Products</option>
                                    {products.map(product => (
                                        <option key={product} value={product}>{product}</option>
                                    ))}
                                </select>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="market-cards-container box-scroll-large">
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