import React, { useEffect, useState } from 'react';
import { states, vendors_default } from "@repo/ui/common.js";
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { toast } from 'react-toastify';
import PulseLoader from 'react-spinners/PulseLoader';

function AdminVendorEdit({ vendors }) {
    const [query, setQuery] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [vendorData, setVendorData] = useState(null);
    const [tempVendorData, setTempVendorData] = useState(null);
    const [newProduct, setNewProduct] = useState(null);
    const [newProductSubcat, setNewProductSubcat] = useState(null);
    const [image, setImage] = useState(null);
    const [status, setStatus] = useState('initial');
    const [products, setProducts] = useState([])
    const [uploading, setUploading] = useState(false);

    const onUpdateQuery = event => setQuery(event.target.value);
    const filteredVendors = vendors.filter(vendor => vendor.name.toLowerCase().includes(query.toLowerCase()) && vendor.name !== query)
    const matchingVendor = vendors.find(vendor => vendor.name.toLowerCase() === query.toLowerCase());
    const matchingVendorId = matchingVendor ? matchingVendor.id : null;

    const siteURL = import.meta.env.VITE_SITE_URL;

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

    useEffect(() => {
        if (!matchingVendorId) return
        const fetchVendorData = async () => {
            try {
                const token = localStorage.getItem('admin_jwt-token');
                // console.log('JWT Token:', token);
                const response = await fetch(`/api/vendors/${matchingVendorId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    // console.log('Fetched admin market data:', data);
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

    const handleImageUpload = async (vendorId) => {
        if (!image) return;
    
        const formData = new FormData();
        setUploading(true)
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
                const taskId = data.task_id;
                // Poll for task completion
                let taskStatus = 'PENDING';
                while (taskStatus !== 'SUCCESS') {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    const statusResponse = await fetch(`/api/task-status/${taskId}`);
                    const statusData = await statusResponse.json();
                    taskStatus = statusData.status;
                    console.log(`Checking task status: ${taskStatus}`);

                    if (taskStatus === 'FAILURE') {
                        toast.error('Image processing failed.', { autoClose: 4000 });
                        setStatus('fail');
                        setUploading(false)
                        return;
                    }
                }
                setTempVendorData((prevData) => ({
                    ...prevData,
                    image: `/api/uploads/user-images/${matchingVendorId}/${data.filename}`,
                }));
                setStatus('success');
                setUploading(false)
            } else {
                setStatus('fail');
                setUploading(false)
                console.error('Failed to upload image:', await response.text());
            }
        } catch (error) {
            setStatus('fail')
            setUploading(false)
            console.error('Error uploading image:', error);
        }
    };

    const handleDeleteImage = async () => {
        if (!vendorData || !vendorData.image) {
            toast.success('No image to delete.', {
                autoClose: 4000,
            });
            return;
        }
    
        try {
            const response = await fetch(`/api/delete-image`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_jwt-token')}`,
                },
                body: JSON.stringify({
                    filename: vendorData.image,
                    type: 'vendor',
                    vendor_id: matchingVendorId
                }),
            });
    
            if (response.ok) {
                const result = await response.json();
                console.log('Image deleted response:', result);
    
                setVendorData((prevData) => ({
                    ...prevData,
                    image: null, 
                }));
                setTempVendorData((prevData) => ({
                    ...prevData,
                    image: null, 
                }));
                toast.success('Image deleted successfully.', {
                    autoClose: 4000,
                });
                window.location.reload();
            } else {
                const errorText = await response.text();
                console.error('Failed to delete image:', errorText);
                toast.error('Failed to delete the image. Please try again.', {
                    autoClose: 4000,
                });
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            toast.error('An unexpected error occurred while deleting the image.', {
                autoClose: 4000,
            });
        }
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setTempVendorData({
            ...tempVendorData,
            [name]: value
        });
    };

    const handleEditToggle = () => {
        if (!editMode) {
            setTempVendorData({
                ...vendorData,
            });
        } else {
            setTempVendorData(null);
        }
        setEditMode(!editMode);
    };

    const handleSaveChanges = async () => {
        if (confirm(`Are you sure you want to edit ${vendorData.name}'s account?`)) {
            try {
                const response = await fetch(`/api/vendors/${matchingVendorId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(tempVendorData),
                });
        
                if (response.ok) {
                    const updatedData = await response.json();
                    if (image) {
                        await handleImageUpload(matchingVendorId);
                    }
                    setEditMode(false);
                    setVendorData(updatedData);
                    toast.success('Vendor details updated successfully.', {
                        autoClose: 4000,
                    });
                } else {
                    console.error('Failed to save vendor details:', await response.text());
                }
            } catch (error) {
                console.error('Error saving vendor details:', error);
            }
        }
    };

    const handleFileChange = (event) => {
        if (event.target.files) {
            setImage(event.target.files[0]);
            setStatus('initial');
        }
    };

    const handleDelete = (productId) => {
        setTempVendorData((prev) => ({
            ...prev,
            products: prev.products.filter((id) => id !== productId),
        }));
    };

    const handleDeleteProductSubcat = (product) => {
        setTempVendorData((prev) => ({
            ...prev,
            products_subcategories: prev.products_subcategories.filter((id) => id !== product),
        }));
    };

    const handleAddProduct = (newProductId) => {
        setTempVendorData((prev) => ({
            ...prev,
            products: (prev.products || []).includes(Number(newProductId))
                ? prev.products
                : [...(prev.products || []), Number(newProductId)],
        }));
    };

    const handleAddProductSubcat = (newProduct) => {
        const toTitleCase = (str) => {
            return str
                .toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        };
        const formattedProduct = toTitleCase(newProduct);
        setTempVendorData((prev) => ({
            ...prev,
            products_subcategories: (prev.products_subcategories || []).includes(formattedProduct)
                ? prev.products_subcategories
                : [...(prev.products_subcategories || []), formattedProduct],
        }));
        setNewProductSubcat('')
    };


    return (
        <>
            <title>gingham • Admin Vendors • Edit</title>
            <div className='box-bounding'>
                <h2>Edit Vendors</h2>
                <table className='margin-t-16'>
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
                        </tr>
                    </tbody>
                </table>
                <div>
                    {editMode ? (
                        <>
                            <div className='form-group'>
                                <label>Vendor Name:</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={tempVendorData ? tempVendorData.name : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label>Website</label>
                                <input 
                                    type="text"
                                    name="website"
                                    placeholder='Include https://'
                                    value={tempVendorData ? tempVendorData.website : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label>City:</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={tempVendorData ? tempVendorData.city : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label>State:</label>
                                <select
                                    name="state"
                                    value={tempVendorData ? tempVendorData.state : ''}
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
                                    {tempVendorData.products?.map((productId) => {
                                        const product = products.find((p) => p.id === productId);
                                        return (
                                            <Chip
                                                key={productId}
                                                style={{
                                                    backgroundColor: "#eee", fontSize: ".9em"}}
                                                label={product?.product || 'Unknown Product'}
                                                size="small"
                                                onDelete={() => handleDelete(productId)}
                                            />
                                        );
                                    })}
                                </Stack>
                            </div>
                            <div className='form-group'>
                                <label>Product Subcategories:</label>
                                <input
                                    type="text"
                                    name="product_subcat"
                                    placeholder='If you focus on specific things; ex: "Apples"'
                                    value={newProductSubcat ? newProductSubcat : ''}
                                    onChange={(e) => setNewProductSubcat(e.target.value)}
                                />
                                <button className='btn btn-small margin-l-8 margin-b-4' onClick={() => handleAddProductSubcat(newProductSubcat)}>Add</button>
                                <Stack className='padding-4' direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                                    {tempVendorData.products_subcategories?.map((product) => {
                                        return (
                                            <Chip
                                                key={product}
                                                style={{
                                                    backgroundColor: "#eee", fontSize: ".9em"
                                                }}
                                                label={product || 'Unknown Product'}
                                                size="small"
                                                onDelete={() => handleDeleteProductSubcat(product)}
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
                                    value={tempVendorData ? tempVendorData.bio : ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Default Image:</label>
                                <select className='select'
                                    name="image_default"
                                    value={tempVendorData ? tempVendorData.image_default : ''}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select</option>
                                    {Object.entries(vendors_default).map(([key, value], index) => (
                                        <option key={index} value={value}>
                                            {key}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className='form-group'>
                                <label>Vendor Image:</label>
                                {tempVendorData ? (
                                    <div>
                                        <img
                                            className='img-market'
                                            style={{ maxWidth: '100%', height: 'auto' }}
                                            src={tempVendorData.image ? `${siteURL}${tempVendorData.image}` : `/vendor-images/_default-images/${tempVendorData.image_default}`}
                                            alt="Vendor Image"
                                        />
                                    </div>
                                ) : ''}
                                <div className='flex-start flex-center-align'>
                                    <div className='margin-l-8'>
                                        <button className='btn btn-small btn-blue' onClick={handleDeleteImage} > Delete Image </button>
                                    </div>
                                    <label htmlFor='file-upload' className='btn btn-small btn-file btn-blue nowrap'>Choose File{image && <span id="file-name" className='text-white-background margin-l-8'>{image.name}</span>}</label>
                                </div>
                                <input
                                    id="file-upload"
                                    type="file"
                                    name="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                            {uploading ? (
                                <PulseLoader
                                    className='margin-t-16'
                                    color={'#ff806b'}
                                    size={10}
                                    aria-label="Loading Spinner"
                                    data-testid="loader"
                                />
                            ) : (
                                <button className='btn-edit' onClick={handleSaveChanges}>Save Changes</button>
                            )}
                            <button className='btn-edit' onClick={handleEditToggle}>Cancel</button>
                        </>
                    ) : (
                        <>
                            <table>
                                <tbody>
                                    <tr>
                                        <td className='cell-title'>Image:</td>
                                        <td className='cell-text'>
                                            {vendorData ? <img style={{ maxWidth: '100%', height: 'auto' }} src={vendorData.image ? `${siteURL}${vendorData.image}` : `/vendor-images/_default-images/${vendorData.image_default}`} alt="Vendor Image" /> : ''}
                                        </td>
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
                                        <td className='cell-title'>Website:</td>
                                        <td className='cell-text'>{vendorData ? vendorData.website : ''}</td>
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
                                        <td className='cell-text'>
                                            {products
                                                .filter(p => vendorData?.products?.includes(p.id))
                                                .map(p => p.product)
                                                .join(', ') || ''}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title'>Product Subcategories:</td>
                                        <td className='cell-text'>
                                            {vendorData?.products_subcategories
                                                ?.map(p => p)
                                                .join(', ') || ''}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title'>Bio:</td>
                                        <td className='cell-text'>{vendorData ? vendorData.bio : ''}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <button className='btn-edit' onClick={handleEditToggle}>Edit</button>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}

export default AdminVendorEdit;