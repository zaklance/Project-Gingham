import React, { useEffect, useState } from 'react';
import { useParams, Link, useOutletContext, useNavigate } from 'react-router-dom';
import buyabag from '../../assets/images/GINGHAM_BUYABAG.png';

function VendorDetail() {
    const { id } = useParams();
    
    const [vendor, setVendor] = useState(null);
    const [availableBaskets, setAvailableBaskets] = useState(5);
    const [isEditing, setIsEditing] = useState(false);
    const [vendorData, setVendorData] = useState({
        name: '',
        based_out_of: '',
        image: '',
    });
    const [locations, setLocations] = useState([]);
    const [marketDetails, setMarketDetails] = useState({});
    const [selectedMarket, setSelectedMarket] = useState('');
    const [isVendorUser, setIsVendorUser] = useState(false);

    const { amountInCart, setAmountInCart, cartItems, setCartItems } = useOutletContext();
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/vendors/${id}`)
            .then(response => response.json())
            .then(data => {
                setVendor(data);
                setVendorData({ 
                    name: data.name,
                    based_out_of: data.based_out_of,
                    image: data.image
                });
                setIsVendorUser(data.user_id === parseInt(globalThis.sessionStorage.getItem('user_id')));
                const parsedLocations = JSON.parse(data.locations);
                setLocations(parsedLocations);
                if (parsedLocations.length > 0) {
                    setSelectedMarket(parsedLocations[0]);
                }
            })
            .catch(error => console.error('Error fetching vendor data:', error));
    }, [id]);

    // Toggle between edit and view mode
    const toggleEditMode = () => {
        setIsEditing(!isEditing);
    };

    // Handle form field changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setVendorData({
            ...vendorData,
            [name]: value,
        });
    };

    // Submit updated vendor data
    const handleSave = () => {
        fetch(`http://127.0.0.1:5555/vendors/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(vendorData),
        })
            .then(response => response.json())
            .then(data => {
                setVendor(data);
                setIsEditing(false);
            })
            .catch(error => console.error('Error updating vendor:', error));
    };

    if (!vendor) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <button onClick={() => navigate('/vendors')} className='back-button'>
                Back to Vendors
            </button>

            {isEditing ? (
                <div>
                    <input
                        type="text"
                        name="name"
                        value={vendorData.name}
                        onChange={handleInputChange}
                        placeholder="Vendor Name"
                    />
                    <textarea
                        name="based_out_of"
                        value={vendorData.based_out_of}
                        onChange={handleInputChange}
                        placeholder="Based out of"
                    />
                    <input
                        type="text"
                        name="image"
                        value={vendorData.image}
                        onChange={handleInputChange}
                        placeholder="Image URL"
                    />
                    <button onClick={handleSave}>Save</button>
                    <button onClick={toggleEditMode}>Cancel</button>
                </div>
            ) : (
                <div>
                    <div style={{ display: 'flex' }}>
                        <div style={{ width: '60%' }}>
                            <h2>{vendor.name}</h2>
                            <img src={vendor.image} alt="Vendor Image" style={{ width: '95%' }} />
                        </div>
                        <div className='side-basket'>
                            <h2>Buy a Market Basket!</h2>
                            <img src={buyabag} alt="Basket Image" style={{ width: '200px' }} /><br />
                            <div className='basket-details'>
                                <h4>$4.99</h4>
                                <p>Available Baskets: {availableBaskets}</p>
                                <p>Choose a Market:</p>
                                <select value={selectedMarket} onChange={(e) => setSelectedMarket(e.target.value)}>
                                    {locations.map((marketId, index) => (
                                        <option key={index} value={marketId}>
                                            {marketDetails[marketId] || 'Loading...'}
                                        </option>
                                    ))}
                                </select>
                                <button onClick={() => setAvailableBaskets(availableBaskets - 1)}>Add to Cart</button>
                            </div>
                        </div>
                    </div>

                    <h4>Based out of: {vendor.based_out_of}</h4>

                    {/* Only show the edit button if the current user is the vendor */}
                    {isVendorUser && (
                        <button onClick={toggleEditMode}>Edit Vendor Details</button>
                    )}
                </div>
            )}
        </div>
    );
}

export default VendorDetail;
