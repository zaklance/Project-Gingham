import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import VendorCard from './VendorCard';
import '../../assets/css/index.css';

function Vendors() {
    const [vendors, setVendors] = useState([]);
    const [products, setProducts] = useState([]);
    const [productList, setProductList] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [query, setQuery] = useState("");
    const [vendorFavs, setVendorFavs] = useState([]);
    const [isClicked, setIsClicked] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { handlePopup } = useOutletContext();

    const userId = parseInt(globalThis.localStorage.getItem('user_id'));

    const onUpdateQuery = (event) => {
        const value = event.target.value;
        setQuery(value);
        setShowDropdown(value.trim().length > 0); // Show dropdown if there's input
    };
    
    const filteredVendorsDropdown = vendors.filter(vendor =>
        vendor.name.toLowerCase().includes(query.toLowerCase()) &&
        vendor.name !== query &&
        (!selectedProduct || vendor.products.includes(Number(selectedProduct))) &&
        (!isClicked || vendorFavs.some(vendorFavs => vendorFavs.vendor_id === vendor.id))
    );

    const filteredVendorsResults = vendors.filter(vendor =>
        vendor.name.toLowerCase().includes(query.toLowerCase()) &&
        (!selectedProduct || vendor.products.includes(Number(selectedProduct))) &&
        (!isClicked || vendorFavs.some(vendorFavs => vendorFavs.vendor_id === vendor.id))
    );

    useEffect(() => {
        if (!vendors || !products?.length) return;
        const filteredProducts = products.filter(product =>
            vendors.some(vendor =>
                Array.isArray(vendor.products) &&
                vendor.products.includes(product.id)
            )
        );
        setProductList(filteredProducts);
    }, [vendors, products]);

    useEffect(() => {
        fetch("/api/products")
            .then(response => response.json())
            .then(data => {
                const sortedProducts = data.sort((a, b) => {
                    if (a.product === "Other") return 1;
                    if (b.product === "Other") return -1;
                    return a.product.localeCompare(b.product);
                });
                setProducts(sortedProducts);
            });
    }, []);

    useEffect(() => {
        if (location.state?.selectedProduct) { 
            setSelectedProduct(location.state.selectedProduct);
        }
        if (location.state?.isClicked !== undefined) {
            setIsClicked(location.state.isClicked);
        }

        fetch("/api/vendors")
            .then(response => response.json())
            .then(data => setVendors(data))
    }, [location.state]);

    useEffect(() => {
        if (location.state?.resetFilters) {
            setSelectedProduct(false);
            setIsClicked(false);
        }
        
        fetch("/api/vendors")
            .then(response => response.json())
            .then(data => setVendors(data))
    }, [location.state]);
    

    useEffect(() => {
        const token = localStorage.getItem('user_jwt-token');
        if (userId && !isNaN(userId)) {
            fetch(`/api/vendor-favorites?user_id=${userId}`, {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })
                .then(response => response.json())
                .then(data => {
                    setVendorFavs(data);
                })
                .catch(error => console.error('Error fetching vendor favorites', error));
        }
    }, [userId]);
    
    const handleProductChange = (event) => {
        setSelectedProduct(event.target.value);
    };

    const handleVendorClick = (vendorId) => {
        navigate(`/user/vendors/${vendorId}`, { state: { selectedProduct} });
    };

    const handleClick = (event) => {
        if (globalThis.localStorage.getItem('user_id') !== null) {
            setIsClicked((isClick) => !isClick);
        } else {
            handlePopup()
        }
    }

    const handleDropDownFilters = (event) => {
        setShowFilters(!showFilters)
    }

    // console.log(products)

    // useEffect(() => {
    //     const uniqueProducts = [...new Set(vendors.map(item => item.product))];
    //     setProductList(uniqueProducts.sort());
    // }, [vendors]);

    const handleClickOutside = (event) => {
        // Close dropdown if clicked outside
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setShowDropdown(false);
        }
    };

    useEffect(() => {
            const handleKeyDown = (event) => {
                if (event.key === 'Enter' && showDropdown) {
                    setShowDropdown(false);
                }
            };
    
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);
    
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
                document.removeEventListener("keydown", handleKeyDown);
            };
        }, [showDropdown]);

        
    return (
        <div className="markets-container">
            <div className='header margin-b-24'>
                <div className='flex-space-between'>
                    <h2>Find A Market Vendor Today</h2>
                </div>
                <table className='table-search margin-t-16'>
                    <tbody>
                        <tr>
                            {/* <td className='cell-title btn-grey m-hidden'>Search:</td> */}
                            <td className='cell-text'>
                                <input id='search' className="search-bar" type="text" placeholder="Search vendors..." value={query} onChange={onUpdateQuery} />
                                {showDropdown && (
                                    <div className="dropdown-content" ref={dropdownRef}>
                                        {filteredVendorsDropdown.slice(0, 10).map(item => (
                                            <div
                                                className="search-results"
                                                key={item.id}
                                                onClick={() => {
                                                    setQuery(item.name);
                                                    setShowDropdown(false);
                                                }}
                                            >
                                                {item.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </td>
                            {/* <td className='cell-text cell-filter m-hidden'>Filters: </td> */}
                            <td>
                                <button
                                    className={`btn-fav-filter ${isClicked ? 'btn-fav-filter-on' : ''}`}
                                    title="only show favorites"
                                    onClick={handleClick}>&emsp;
                                </button>
                            </td>
                            <td>
                                <select className='select-filter' value={selectedProduct} onChange={handleProductChange}>
                                    <option value="">All Products</option>
                                    {Array.isArray(productList) && productList.map((product) => (
                                        <option key={product.id} value={product.id}>
                                            {product.product}
                                        </option>
                                    ))}
                                </select>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="market-cards-container box-scroll-large">
                {filteredVendorsResults
                    .slice() // Create a shallow copy to avoid mutating the original array
                    .sort((a, b) => {
                        const nameA = (a?.name || '').toLowerCase();
                        const nameB = (b?.name || '').toLowerCase();
                        return nameA.localeCompare(nameB);
                    })
                    .map((vendorData) => (
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