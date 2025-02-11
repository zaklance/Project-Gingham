import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

function AdminVendorNotifications({ notifications, setNotifications }) {
    // const [notifications, setNotifications] = useState([]);
    const [newProduct, setNewProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleApprove = async (notification, ) => {
        console.log(`Approval notification with ID: ${notification.id}`);
        const token = localStorage.getItem('admin_jwt-token');

        if (!newProduct?.product || newProduct.product.trim() === "") {
            toast.warning('Product name cannot be empty.', {
                autoClose: 4000,
            });
            return;
        }

        try {
            const productResponse = await fetch(`/api/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newProduct),
            });
            if (productResponse.ok) {
                const newProductData = await productResponse.json();

                const vendorResponse = await fetch(`/api/vendors/${notification.vendor_id}`);
                if (!vendorResponse.ok) {
                    throw new Error('Failed to fetch vendor data');
                }
                const vendorData = await vendorResponse.json();

                const updatedProducts = [
                    ...vendorData.products.filter(productId => productId !== 1),
                    newProductData.id
                ];

                console.log(updatedProducts)
                
                const updateVendorResponse = await fetch(`/api/vendors/${notification.vendor_id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        products: updatedProducts
                    }),
                });
                if (updateVendorResponse.ok) {
                    toast.success('Vendor product updated successfully.', {
                        autoClose: 4000,
                    });
                } else {
                    console.error('Failed to update vendor');
                    const responseData = await updateVendorResponse.json();
                    toast.error(responseData.message || 'Something went wrong', {
                        autoClose: 4000,
                    });
                }
            } else {
                console.error('Failed to create product');
                const responseData = await productResponse.json();
                toast.error(responseData.message || 'Something went wrong', {
                    autoClose: 4000,
                });
            }

            const adminResponse = await fetch(`/api/admin-notifications/${notification.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (adminResponse.ok) {
                setNotifications((prev) =>
                    prev.filter((item) => item.id !== notification.id)
                );
                toast.success('Notification approved and product updated successfully', {
                    autoClose: 4000,
                });
            } else {
                console.error('Failed to delete notification');
                const responseData = await adminResponse.json();
                toast.error(responseData.message || 'Something went wrong', {
                    autoClose: 4000,
                });
            }
        } catch (error) {
            console.error('Error approving request', error);
        }
    };

    const handleReject = async (notificationId) => {
        const token = localStorage.getItem('jwt-token');
        try {
            const response = await fetch(`/api/admin-notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setNotifications((prevNotifications) =>
                    prevNotifications.filter((notif) => notif.id !== notificationId)
                );
            } else {
                console.error('Failed to reject request');
            }
        } catch (error) {
            console.error('Error rejecting request', error);
        }
    };

    const handleNewProductChange = (event) => {
        const { name, value } = event.target;
        setNewProduct((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };


    return (
        <div>
            <div className='tab-content margin-b-24'>
                <ul>
                    {notifications.map((notification) => (
                        <li key={notification.id}>
                            <p><strong>{notification.message}</strong></p>
                            <input
                                className='cell-text-small margin-r-8'
                                type="text"
                                name="product"
                                placeholder='Enter Product'
                                value={newProduct ? newProduct.product : ''}
                                onChange={handleNewProductChange}
                            />
                            <button className='btn-edit' onClick={() => handleApprove(notification)}>
                                Approve
                            </button>
                            <button className='btn-edit' onClick={() => handleReject(notification.id)}>
                                Reject
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
};

export default AdminVendorNotifications;
