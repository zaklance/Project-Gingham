import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminVendorDelete({ vendors }) {
    const [query, setQuery] = useState("");
    const [vendorData, setVendorData] = useState(null);
    const [products, setProducts] = useState([])

    const navigate = useNavigate();

    const onUpdateQuery = event => setQuery(event.target.value);
    const filteredVendors = vendors.filter(vendor => vendor.name.toLowerCase().includes(query.toLowerCase()) && vendor.name !== query)
    const matchingVendor = vendors.find(vendor => vendor.name.toLowerCase() === query.toLowerCase());
    const matchingVendorId = matchingVendor ? matchingVendor.id : null;

    useEffect(() => {
            fetch("http://127.0.0.1:5555/api/products")
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
        if (!matchingVendorId) return
        const fetchVendorData = async () => {
            try {
                const token = localStorage.getItem('admin_jwt-token');
                // console.log('JWT Token:', token);
                const response = await fetch(`http://127.0.0.1:5555/api/vendors/${matchingVendorId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    // console.log('Fetched admin vendor data:', data);
                    setVendorData(data);
                } else {
                    console.error('Error fetching profile:', response.status);
                    if (response.status === 401) {
                        console.error('Unauthorized: Token may be missing or invalid');
                    }
                }
            } catch (error) {
                console.error('Error fetching vendor data:', error);
            }
        };
        fetchVendorData();
    }, [matchingVendorId]);

    const handleDelete = async () => {
        if (confirm(`Are you sure you want to delete ${matchingVendor.name} and all its associated days?`)) {
            const token = localStorage.getItem('admin_jwt-token');

            try {
                await fetch(`http://127.0.0.1:5555/api/vendors/${matchingVendorId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                alert(`Market "${matchingVendor.name}" was successfully deleted.`);
                window.location.href = "/admin/vendors?tab=delete";
            } catch (error) {
                console.error('Error deleting market or associated days:', error);
                alert('An error occurred while deleting the market and its associated days.');
            }
        } else {
            setQuery('');
        }
    };

    return (
        <>
            <div className='box-bounding'>
                <h2>Delete Vendors</h2>
                <table className='margin-t-16'>
                    <tbody>
                        <tr>
                            <td className='cell-title'>Search:</td>
                            <td className='cell-text'>
                                <input id='search' className="search-bar" type="text" placeholder="Search markets..." value={query} onChange={onUpdateQuery} />
                                <div className="dropdown-content">
                                    {
                                        query &&
                                        filteredVendors.slice(0, 10).map(item => <div className="search-results" key={item.id} onClick={(e) => setQuery(item.name)}>
                                            {item.name}
                                        </div>)
                                    }
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <table>
                    <tbody>
                        <tr>
                            <td className='cell-title'>Image:</td>
                            <td className='cell-text'>{vendorData ? <img className='img-market' style={{ maxWidth: '100%', height: 'auto' }} src={`/vendor-images/${vendorData.image}`} alt="Market Image" /> : ''}</td>
                        </tr>
                        <tr>
                            <td className='cell-title'>ID:</td>
                            <td className='cell-text'>{vendorData ? `${vendorData.id}` : ''}</td>
                        </tr>
                        <tr>
                            <td className='cell-title'>Name:</td>
                            <td className='cell-text'>{vendorData ? `${vendorData.name}` : ''}</td>
                        </tr>
                        <tr>
                            <td className='cell-title'>City:</td>
                            <td className='cell-text'>{vendorData ? vendorData.city : ''}</td>
                        </tr>
                        <tr>
                            <td className='cell-title'>State:</td>
                            <td className='cell-text'>{vendorData ? vendorData.state : ''}</td>
                        </tr>
                        <tr>
                            <td className='cell-title'>Product:</td>
                            <td className='cell-text'>{vendorData ? vendorData.product : ''}
                                {products
                                    .filter(p => vendorData?.products?.includes(p.id))
                                    .map(p => p.product)
                                    .join(', ') || ''}
                            </td>
                        </tr>
                        <tr>
                            <td className='cell-title'>Bio:</td>
                            <td className='cell-text'>{vendorData ? vendorData.bio : ''}</td>
                        </tr>
                    </tbody>
                </table>
                <button className='btn-edit' onClick={handleDelete}>Delete</button>
            </div>
        </>
    )
}
export default AdminVendorDelete;