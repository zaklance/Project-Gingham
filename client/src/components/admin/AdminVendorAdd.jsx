import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { states } from '../../utils/common';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';


function AdminVendorEdit({ vendors }) {
    const [vendorData, setVendorData] = useState({});
    const [image, setImage] = useState(null)
    const [newProduct, setNewProduct] = useState(null);
    const [status, setStatus] = useState('initial')
    const [products, setProducts] = useState([])

    const location = useLocation();
    

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
    })

    const handleImageUpload = async (vendorId) => {
        if (!image) return;
    
        const formData = new FormData();
        formData.append('file', image);
        formData.append('type', 'vendor');
        formData.append('vendor_id', vendorId);
    
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
    
            if (response.ok) {
                const data = await response.json();
                console.log('Image uploaded successfully:', data);
            } else {
                console.error('Failed to upload image');
                console.log('Response status:', response.status);
                console.log('Response text:', await response.text());
            }
        } catch (error) {
            console.error('Error uploading image:', error);
        }
    };

    const handleSaveVendor = async () => {
        try {
            console.log('Vendor Data:', vendorData);
    
            const response = await fetch(`/api/vendors`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(vendorData),
            });
    
            if (response.ok) {
                const updatedData = await response.json();
                alert("Vendor Created");
                console.log('Vendor data posted successfully:', updatedData);
    
                if (image) {
                    await handleImageUpload(updatedData.id);
                }
                window.location.href = "/admin/vendors?tab=add";
            } else {
                console.error('Failed to save vendor details');
                console.log('Response status:', response.status);
                console.log('Response text:', await response.text());
            }
        } catch (error) {
            console.error('Error saving vendor details:', error);
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

    const handleDelete = (productId) => {
        setVendorData((prev) => ({
            ...prev,
            products: prev.products.filter((id) => id !== productId),
        }));
    };

    const handleAddProduct = (newProductId) => {
        setVendorData((prev) => ({
            ...prev,
            products: (prev.products || []).includes(Number(newProductId))
                ? prev.products
                : [...(prev.products || []), Number(newProductId)],
        }));
    };


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
                            value={vendorData.name || ''}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className='form-group'>
                        <label>City:</label>
                        <input
                            type="text"
                            name="city"
                            value={vendorData.city || ''}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className='form-group'>
                        <label>State:</label>
                        <select
                            name="state"
                            value={vendorData.state || ''}
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
                            value={newProduct ? newProduct : ''}
                            onChange={(e) => setNewProduct(e.target.value)}
                        >
                            <option value="">Select</option>
                            {Array.isArray(products) && products.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.product}
                                </option>
                            ))}
                        </select>
                        <button className='btn btn-small margin-l-8 margin-b-4' onClick={() => handleAddProduct(newProduct)}>Add</button>
                        <Stack className='padding-4' direction="row" spacing={1}>
                            {vendorData.products?.map((productId) => {
                                const product = products.find((p) => p.id === productId);
                                return (
                                    <Chip
                                        key={productId}
                                        style={{
                                            backgroundColor: "#eee", fontSize: ".9em"
                                        }}
                                        label={product?.product || 'Unknown Product'}
                                        size="small"
                                        onDelete={() => handleDelete(productId)}
                                    />
                                );
                            })}
                        </Stack>
                    </div>
                    <div className='form-group'>
                        <label>Bio:</label>
                        <textarea
                            className='textarea-edit'
                            type="text"
                            name="bio"
                            value={vendorData.bio || ''}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className='form-group'>
                        <label>Vendor Image:</label>
                        <div className='flex-start flex-center-align'>
                            <label htmlFor='file-upload' className='btn btn-small btn-file nowrap'>Choose File <span className='text-white-background'>{image?.name}</span></label>
                            <input
                                id="file-upload"
                                type="file"
                                name="file"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>
                    <button className='btn-edit' onClick={handleSaveVendor}>Save Changes</button>
                </div>
            </div>
        </>
    )
}

export default AdminVendorEdit;