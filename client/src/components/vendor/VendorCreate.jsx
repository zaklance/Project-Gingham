import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { states } from '../../utils/common';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import VendorTeamRequest from './VendorTeamRequest';

function VendorCreate () {
    const [vendorEditMode, setVendorEditMode] = useState(false);
    const [vendorUserData, setVendorUserData] = useState(null);
    const [vendorUserId, setVendorUserId] = useState(null);
    const [newVendor, setNewVendor] = useState(false);
    const [vendorData, setVendorData] = useState(null);
    const [image, setImage] = useState(null)
    const [status, setStatus] = useState('initial')
    const [vendorImageURL, setVendorImageURL] = useState(null);
    const [products, setProducts] = useState([])
    const [newProducts, setNewProducts] = useState(null);
    const [productRequest, setProductRequest] = useState('')

    const navigate = useNavigate();
    const location = useLocation();


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
        if (location.state?.selectedProduct) {
            setSelectedProduct(location.state.selectedProduct);
        }
    })

    useEffect(() => {
        const fetchVendorUserData = async () => {
            const id = localStorage.getItem('vendor_user_id');
            if (!id) {
                console.error("No vendor user ID found");
                return;
            }

            try {
                const token = localStorage.getItem('vendor_jwt-token');
                const response = await fetch(`http://127.0.0.1:5555/api/vendor-users/${id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                const text = await response.text();

                if (response.ok) {
                    const data = text ? JSON.parse(text) : null;
                    setVendorUserData(data);

                    if (data && data.isNew) {
                        setNewVendor(true);
                    }
                } else {
                    console.error('Error fetching profile:', response.status);
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
            }
        };

        fetchVendorUserData();
    }, []);

    useEffect(() => {
        if (vendorUserData?.id) {
            setVendorUserId(vendorUserData.id);
        }
    }, [vendorUserData]); 
    
    useEffect(() => {
        if (newVendor && !vendorData) {
            setVendorData({ name: '', city: '', state: '', bio: '', product: '', image: '' });
            setVendorEditMode(true); 
        } else if (vendorUserData) {
            setVendorData({ name: vendorUserData.name || '', city: vendorUserData.city || '', state: vendorUserData.state || '', bio: vendorUserData.bio || '', product: vendorUserData.product || '', image: vendorUserData.image || '' });
            setVendorEditMode(true);
        }
    }, [newVendor, vendorUserData]);

    const handleVendorInputChange = (event) => {
        setVendorData({ ...vendorData, [event.target.name]: event.target.value, });
    };
    
    const handleVendorEditToggle = () => {
        setVendorEditMode(!vendorEditMode);
    };

    const handleProductInputChange = (event) => {
        setProductRequest(event.target.value);
    };

    const handleFileChange = (event) => {
        if (event.target.files) { setStatus('initial'); setImage(event.target.files[0]); }
    };

    const handleCreateVendor = async () => {
        if (!vendorUserData || !vendorUserData.id) {
            console.log('No user data available or user ID is missing');
            return;
        }

        const newVendorData = { name: vendorData.name, city: vendorData.city, state: vendorData.state, bio: vendorData.bio, products: vendorData.products, image: vendorImageURL, };

        try {
            const vendorResponse = await fetch('http://127.0.0.1:5555/api/vendors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newVendorData),
            });
            
            if (!vendorResponse.ok) {
                console.log('Error creating vendor');
                return;
            }
            
            const createdVendor = await vendorResponse.json();
            const vendorId = createdVendor.id;
            if (!vendorId) {
                console.error("Created vendor does not have an ID.");
                return;
            }
    
            if (!vendorUserData || !vendorUserData.id) {
                console.log('No user data available or user ID is missing');
                return;
            }
            
            const userDataWithVendor = {
                ...vendorUserData,
                active_vendor: vendorId,
                vendor_id: vendorId,
                vendor_role: 0
            };

            console.log(vendorUserData)
            console.log(userDataWithVendor)

            const token = localStorage.getItem('vendor_jwt-token');
            if (!token) {
                alert('Authorization token is missing. Please log in.');
                return;
            }
    
            const userResponse = await fetch(`http://127.0.0.1:5555/api/vendor-users/${vendorUserData.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userDataWithVendor),
            });

            if (userResponse.ok) {
                const updatedUser = await userResponse.json();
                alert('Vendor created and user updated with vendor_id');

                setVendorEditMode(false);
                setNewVendor(false);
            } else {
                console.log('Error updating user with vendor_id');
            }
            if (Array.isArray(newProducts) && newProducts.includes(1) && productRequest.trim() !== '') {
                try {
                    const response = await fetch('http://127.0.0.1:5555/api/create-admin-notification', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            subject: 'product-request',
                            vendor_id: createdVendor.id,
                            vendor_user_id: vendorUserId,
                            link: '/admin/vendors?tab=products', 
                            message: `${vendorData.name} has requested a new Product category: ${productRequest}.`,
                        }),
                    });
                    if (response.ok) {
                        const responseData = await response.json();
                        alert(`Your product request has been sent to the admins for approval. If approved, your product will be automatically changed!`);
                        // window.location.reload();
                        // navigate('/vendor/dashboard');
                    } else {
                        const errorData = await response.json();
                        alert(`Error sending request: ${errorData.message || 'Unknown error'}`);
                    }
                } catch (error) {
                    console.error('Error sending request:', error);
                    alert('An error occurred while sending the request. Please try again later.');
                }
            }
            navigate('/vendor/dashboard');
            window.location.reload();
        } catch (error) {
            console.error('Error creating vendor and updating user:', error);
        }

    };

    const handleDelete = (productId) => {
        setVendorData((prev) => ({
            ...prev,
            products: prev.products.filter((id) => id !== productId),
        }));
    };

    const handleAddProduct = (newProductsId) => {
        setVendorData((prev) => ({
            ...prev,
            products: (prev.products || []).includes(Number(newProductsId))
                ? prev.products
                : [...(prev.products || []), Number(newProductsId)],
        }));
    };
    

    return (
        <div>
            <div className='tab-content margin-b-24'>
                <h2>Create a Vendor Profile</h2>
            </div>
            <div className="form-group">
                <label>Vendor Name:</label>
                <input
                    type="text"
                    name="name" 
                    value={vendorData?.name || ''} 
                    onChange={handleVendorInputChange} 
                />
            </div>
            <div className='form-group'>
                <label>Product:</label>
                <select
                    name="product"
                    value={newProducts ? newProducts : ''}
                    onChange={(e) => setNewProducts(e.target.value)}
                >
                    <option value="">Select</option>
                    {Array.isArray(products) && products.map((product) => (
                        <option key={product.id} value={product.id}>
                            {product.product}
                        </option>
                    ))}
                </select>
                <button className='btn btn-small margin-l-8 margin-b-4' onClick={() => handleAddProduct(newProducts)}>Add</button>
                <Stack className='padding-4' direction="row" spacing={1}>
                    {vendorData?.products?.map((productId) => {
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
            {Number(newProducts) === 1 && (
                <div className="form-group">
                    <label>Other Product:</label>
                    <input
                        type="text"
                        name="new_product"
                        placeholder='Your Product Here'
                        value={productRequest || ''}
                        onChange={handleProductInputChange}
                    />
                </div>
            )}
            <div className="form-group">
                <label>Bio:</label>
                <textarea 
                    className='textarea-edit' 
                    type="text" 
                    name="bio" 
                    value={vendorData?.bio || ''} 
                    placeholder='Super excellent bio goes here!'
                    onChange={handleVendorInputChange} 
                />
            </div>
            <div className="form-group">
                <label>Based out of:</label>
                <input 
                    type="text" 
                    name="city" 
                    value={vendorData?.city || ''} 
                    onChange={handleVendorInputChange} 
                />
                <br className='m-br'/>
                <select className="select-state" name="state" value={vendorData?.state || ''} onChange={handleVendorInputChange}>
                    <option value="">Select</option>
                    {states.map((state, index) => (
                        <option key={index} value={state}>
                            {state}
                        </option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label>Vendor Image:</label>
                <input type="file" name="file" accept="image/*" onChange={handleFileChange} />
            </div>
                <button className="btn-edit" onClick={handleCreateVendor}>Create Vendor</button>
                <button className="btn-edit" onClick={() => setNewVendor(false)}>Cancel</button>
            <div>
            <div className="tab-content margin-t-24 margin-b-16">
                <h2>Already a Vendor?</h2>
            </div>
            <VendorTeamRequest vendorUserId={vendorUserId} vendorUserData={vendorUserData} />
        </div>
    </div>
    )
}

export default VendorCreate;
