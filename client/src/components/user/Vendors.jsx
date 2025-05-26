import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import Fuse from 'fuse.js';
import VendorCard from './VendorCard';
import VendorSignUpCard from './VendorSignUpCard';

function Vendors() {
    const [vendors, setVendors] = useState([]);
    const [products, setProducts] = useState([]);
    const [productList, setProductList] = useState([]);
    const [productSubcat, setProductSubcat] = useState({});
    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedProductSubcat, setSelectedProductSubCat] = useState("");
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

    const fuse = useMemo(() => {
        return new Fuse(vendors, {
            keys: ['name'],
            threshold: 0.2,
        });
    }, [vendors]);

    const onUpdateQuery = (event) => {
        const value = event.target.value;
        setQuery(value);
        setShowDropdown(value.trim().length > 0);
    };

    const filteredProductsSubcat = useMemo(() => {
        const allSubcategories = vendors.flatMap(vendor => {
            const subcategories = vendor.products_subcategories;
            return Array.isArray(subcategories) ? subcategories : [];
        });
        const uniqueSortedSubcategories = [...new Set(allSubcategories)].sort((a, b) =>
            a.localeCompare(b)
        );
        return uniqueSortedSubcategories;
    }, [vendors]);

    useEffect(() => {
        setProductSubcat(filteredProductsSubcat);
    }, [filteredProductsSubcat]);

    const handleProductSubcatChange = (event) => {
        setSelectedProductSubCat(event.target.value);
    };
    
    const fuseDropdownResults = query.trim().length > 0
        ? fuse.search(query).map(result => result.item)
        : [];

    const filteredVendorsDropdown = fuseDropdownResults.filter(vendor =>
        vendor.name !== query &&
        (!selectedProduct || vendor.products.includes(Number(selectedProduct))) &&
        (!isClicked || vendorFavs.some(fav => fav.vendor_id === vendor.id))
    );

    const fuseResults = query.trim().length > 0
        ? fuse.search(query).map(result => result.item)
        : vendors;

    const filteredVendorsResults = fuseResults.filter(vendor =>
        (!selectedProduct || vendor.products.includes(Number(selectedProduct))) &&
        (!selectedProductSubcat ||
            (Array.isArray(vendor.products_subcategories) &&
             vendor.products_subcategories.includes(selectedProductSubcat))
        ) &&
        (!isClicked || vendorFavs.some(fav => fav.vendor_id === vendor.id))
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

    const closePopup = () => {
        if (showFilters) {
            setShowFilters(false);
        }
    };

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
            <title>gingham • Vendors</title>
            <div className='header margin-b-24'>
                <div className='flex-space-between'>
                    <h2>Find A Market Vendor Today</h2>
                </div>
                <table className='table-search-vendor margin-t-16'>
                    <tbody>
                        <tr>
                            <td className='cell-title btn-grey m-hidden'>Search:</td>
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
                            <td>
                                <button
                                    className={`btn-fav-filter ${isClicked ? 'btn-fav-filter-on' : ''}`}
                                    title="only show favorites"
                                    onClick={handleClick}>&emsp;
                                </button>
                            </td>
                            <td className='badge-container'>
                                <button className='btn btn-filter' onClick={handleDropDownFilters}>&#9776;</button>
                                {showFilters && (
                                    <div className='dropdown-content box-filters-vendors'>
                                        <div className='flex-space-between flex-column'>
                                            <select className='select-filter' value={selectedProduct} onChange={handleProductChange}>
                                                <option value="">All Products</option>
                                                {Array.isArray(productList) && productList.map((product) => (
                                                    <option key={product.id} value={product.id}>
                                                        {product.product}
                                                    </option>
                                                ))}
                                            </select>
                                            <select 
                                                className='select-filter'
                                                value={selectedProductSubcat} 
                                                onChange={handleProductSubcatChange}>
                                                <option value="">All Subcategories</option>
                                                {Array.isArray(productSubcat) && productSubcat.map((product) => (
                                                    <option key={product} value={product}>
                                                        {product}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                                {showFilters && (
                                    <div className="popup-overlay-clear" onClick={closePopup}></div>
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="market-cards-container box-scroll-large">
                {!userId && <VendorSignUpCard />}
                {filteredVendorsResults
                    .slice()
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