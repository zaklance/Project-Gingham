import React, { useEffect, useState } from 'react';

function AdminVendorNotifications({ notifications, setNotifications }) {
    // const [notifications, setNotifications] = useState([]);
    const [newProduct, setNewProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleApprove = async (notification, ) => {
        console.log(`Approval notification with ID: ${notification.id}`);
        const token = localStorage.getItem('jwt-token');

        if (!newProduct?.product || newProduct.product.trim() === "") {
            alert("Product name cannot be empty.");
            return; // Exit the function early
        }

        try {
            const productResponse = await fetch(`http://127.0.0.1:5555/api/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newProduct),
            });
            if (productResponse.ok) {{
                const newProductData = await productResponse.json();
                console.log(newProductData)
                
                const vendorResponse = await fetch(`http://127.0.0.1:5555/api/vendors/${notification.vendor_id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        product: newProductData.id
                    }),
                });
                if (vendorResponse.ok) {
                    alert('Vendor product updated successfully');
                } else {
                    console.error('Failed to update vendor');
                    const responseData = await vendorResponse.json();
                    alert(responseData.message || 'Something went wrong');
                }
            }
            } else {
                console.error('Failed to create product');
                const responseData = await productResponse.json();
                alert(responseData.message || 'Something went wrong');
            }

            const adminResponse = await fetch(`http://127.0.0.1:5555/api/admin-notifications/${notification.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (adminResponse.ok) {
                setNotifications((prevNotifications) =>
                    prevNotifications.filter((notif) => notif.id !== notification.id)
                );
                alert('Notification approved and product updated successfully');
            } else {
                console.error('Failed to delete notification');
                const responseData = await adminResponse.json();
                alert(responseData.message || 'Something went wrong');
            }
        } catch (error) {
            console.error('Error approving request', error);
        }
    };

    const handleReject = async (notificationId) => {
        const token = localStorage.getItem('jwt-token');
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/admin-notifications/${notificationId}`, {
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
