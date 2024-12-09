import React, { useState, useEffect } from 'react';
import AdminVendorNotifications from './AdminVendorNotifications';

function AdminVendorProducts({ vendors }) {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState({});
    const [editMode, setEditMode] = useState(false);
    const [tempProductData, setTempProductData] = useState(null);
    const [newProduct, setNewProduct] = useState(null);
    const [notifications, setNotifications] = useState(null);
    

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
            })
            .catch(error => console.error('Error fetching products', error));
    }, []);

    const handleCreateProduct = async (event) => {
        event.preventDefault();

        const isDuplicate = products.some((item) => item.product === newProduct?.product);
        if (isDuplicate) {
            alert("New Product matches one already in the system.");
            return; // Exit the function early
        }

        try {
            const response = await fetch(`http://127.0.0.1:5555/api/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newProduct),
            });

            console.log('Request body:', JSON.stringify(newProduct));

            if (response.ok) {
                const newData = await response.json();
                setProducts((prev) => [...prev, newData])

                alert('Product successfully created');
                console.log('Product data created successfully:', newData);
            } else {
                console.error('Failed to create product');
                console.error('Response:', await response.text());
            }
        } catch (error) {
            console.error('Error creating product:', error);
        }
    };

    const handleProductUpdate = async () => {
        console.log(selectedProduct)
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/products/${selectedProduct.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tempProductData),
            });

            if (response.ok) {
                const updatedProduct = await response.json();
                setProducts((prev) =>
                    prev.map((item) => (item.id === selectedProduct.id ? updatedProduct : item))
                );
                setTempProductData(null);
                setSelectedProduct(updatedProduct);
                setEditMode(!editMode);
                alert('Product successfully updated');
                console.log('Product updated successfully:', updatedProduct);
            } else {
                console.error('Failed to update product:', await response.text());
            }
        } catch (error) {
            console.error('Error updating product:', error);
        }
    };

    const handleProductDelete = async () => {
        if (confirm(`Are you sure you want to delete this event?`)) {
            try {

                fetch(`http://127.0.0.1:5555/api/products/${selectedProduct.id}`, {
                    method: "DELETE",
                }).then(() => {
                    setProducts((prev) => prev.filter((item) => item.id !== selectedProduct.id))
                    alert('Product successfully deleted');
                })
            } catch (error) {
                console.error("Error deleting review", error)
            }
        }
    }

    const handleEditToggle = () => {
        if (!editMode) {
            setTempProductData({
                ...selectedProduct
            });
        } else {
            setTempProductData(null);
        }
        setEditMode(!editMode);
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        if (name === "product") {
            const matchedProduct = products.find((product) => product.product === value);
            setSelectedProduct((prevData) => ({
                ...prevData,
                product: value,
                id: matchedProduct ? matchedProduct.id : null
            }));
        } else {
            setSelectedProduct((prevData) => ({
                ...prevData,
                [name]: value,
            }));
        }
    };

    const handleTempInputChange = (event) => {
        const { name, value } = event.target;
        setTempProductData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleNewProductChange = (event) => {
        const { name, value } = event.target;
        setNewProduct((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    useEffect(() => {
        fetch("http://127.0.0.1:5555/api/admin-notifications")
            .then(response => response.json())
            .then(data => {
                setNotifications(data);
            })
            .catch(error => console.error('Error fetching products', error));
    }, []);


    return (
        <>
            {notifications?.length > 0 ? (
                <div className='box-bounding'>
                    <h2 className='margin-b-24'>Notifications</h2>
                    <AdminVendorNotifications notifications={notifications} setNotifications={setNotifications} />
                </div>
            ) : (
                <>
                </>
            )}
            <div className='box-bounding'>
                <h2 className='margin-b-24'>Add Products</h2>
                <div className='form-group'>
                    <label>Product:</label>
                    <input
                        type="text"
                        name="product"
                        value={newProduct ? newProduct.product : ''}
                        onChange={handleNewProductChange}
                    />
                </div>
                <button className='btn-edit' onClick={handleCreateProduct}>Create Product</button>
            </div>
            <div className='box-bounding'>
                <h2 className='margin-b-24 margin-t-24'>Edit & Delete Products</h2>
                <div className='form-group'>
                    <label>Product:</label>
                    <select
                        name="product"
                        value={selectedProduct.product || ''}
                        onChange={handleInputChange}
                    >
                        <option value="">Select</option>
                        {Array.isArray(products) && products.map((product) => (
                            <option key={product.id} value={product.product}>
                                {product.product}
                            </option>
                        ))}
                    </select>
                </div>
                <br/>
                {editMode ? (
                    <>
                        <div className='form-group'>
                            <label>Product:</label>
                            <input
                                type="text"
                                name="product"
                                value={tempProductData ? tempProductData.product : ''}
                                onChange={handleTempInputChange}
                            />
                        </div>
                        <button className='btn-edit' onClick={handleProductUpdate}>Save Changes</button>
                        <button className='btn-edit' onClick={handleEditToggle}>Cancel</button>
                    </>
                ) : (
                    <>
                        <table>
                            <tbody>
                                <tr>
                                    <td className='cell-title'>Product:</td>
                                    <td className='cell-text'>{selectedProduct ? `${selectedProduct.product}` : ''}</td>
                                </tr>
                            </tbody>
                        </table>
                        <button className='btn-edit' onClick={handleEditToggle}>Edit</button>
                        <button className='btn-edit' onClick={handleProductDelete}>Delete</button>
                    </>
                )}
            </div>
        </>
    )
}
export default AdminVendorProducts;