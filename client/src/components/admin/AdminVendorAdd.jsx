import React, { useEffect, useState } from 'react';

function AdminVendorEdit({ vendors }) {
    const [vendorData, setVendorData] = useState({});
    const [image, setImage] = useState(null)
    const [status, setStatus] = useState('initial')

    const products = [
        'Art', 'Baked Goods', 'Cheese', 'Cider', 'Ceramics', 'Coffee/Tea', 'Fish', 'Flowers', 'Fruit', 'Gifts', 'Honey',
        'International', 'Juice', 'Maple Syrup', 'Meats', 'Mushrooms', 'Nuts', 'Pasta', 'Pickles', 'Spirits', 'Vegetables'
    ];

    const states = [
        "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
        "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
        "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
        "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
        "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
    ];

    const handleSaveVendor = async () => {
        try {
            // Save market details first
            console.log('Vendor Data', vendorData)
            const response = await fetch(`http://127.0.0.1:5555/vendors`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(vendorData),
            });

            if (response.ok) {
                const updatedData = await response.json();
                alert("Vendor Created")
                console.log('Vendor data posted successfully:', updatedData);
                
                if (image) {
                    await handleImageUpload(updatedData.id);
                }
                window.location.reload();
            } else {
                console.log('Failed to save vendor details');
                console.log('Response status:', response.status);
                console.log('Response text:', await response.text());
            }
        } catch (error) {
            console.error('Error saving market details:', error);
        }
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setVendorData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleFileChange = (event) => {
        if (event.target.files) {
            setStatus('initial');
            setImage(event.target.files[0]);
        }
    }


    return (
        <>
            <div className='box-bounding'>
                <h2>Add Vendors</h2>
                <div className='margin-t-16'>
                    <div className='form-group'>
                        <label>Vendor Name:</label>
                        <input
                            type="text"
                            name="name"
                            value={vendorData ? vendorData.name : ''}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className='form-group'>
                        <label>City:</label>
                        <input
                            type="text"
                            name="city"
                            value={vendorData ? vendorData.city : ''}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className='form-group'>
                        <label>State:</label>
                        <select
                            name="state"
                            value={vendorData ? vendorData.state : ''}
                            onChange={handleInputChange}
                        >
                            <option value="">Select</option>
                            {states.map((state, index) => (
                                <option key={index} value={state}>
                                    {state}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className='form-group'>
                        <label>Product:</label>
                        <select
                            name="product"
                            value={vendorData ? vendorData.product : ''}
                            onChange={handleInputChange}
                        >
                            <option value="">Select</option>
                            {products.map((product, index) => (
                                <option key={index} value={product}>
                                    {product}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className='form-group'>
                        <label>Bio:</label>
                        <textarea
                            className='textarea-edit'
                            type="text"
                            name="bio"
                            value={vendorData ? vendorData.bio : ''}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className='form-group'>
                        <label>Vendor Image:</label>
                        <input
                            type="file"
                            name="file"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>
                    <button className='btn-edit' onClick={handleSaveVendor}>Save Changes</button>
                </div>
            </div>
        </>
    )
}

export default AdminVendorEdit;