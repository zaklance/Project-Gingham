import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import objectHash from 'object-hash';
import { weekDay } from '../../utils/common';
import { timeConverter } from '../../utils/helpers';

function Cart() {
    const { handlePopup, cartItems, setCartItems, amountInCart, setAmountInCart } = useOutletContext();
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [cartTimer, setCartTimer] = useState(null);
    const [hash, setHash] = useState('');

    const navigate = useNavigate();

    const userId = parseInt(globalThis.localStorage.getItem('user_id'));
    const token = localStorage.getItem('user_jwt-token');

    function startCartTimer() {
        if (cartTimer) {
            clearTimeout(cartTimer);
        }

        const newCartTimer = setTimeout(() => {
            setCartItems([]);
            setAmountInCart(0);
        }, (60 * 60 * 1000));

        setCartTimer(newCartTimer);
    }

    useEffect(() => {
        if (cartItems.length > 0) {
            startCartTimer();
        }
    }, [cartItems]);

    function removeFromCart(itemToRemove) {
        const updatedCart = cartItems.filter(item => item.id !== itemToRemove.id);
        setCartItems(updatedCart);
        setAmountInCart(amountInCart - 1);
    }
	
    let totalPrice = 0;
    cartItems.forEach(item => {
      totalPrice += item.price;
    });

    async function handleCheckout() {
        try {
            // Get user ID from localStorage
            const userId = globalThis.localStorage.getItem('user_id');
            if (!userId) {
                console.error("User ID not found in localStorage.");
                throw new Error("User is not logged in.");
            }
    
            // Fetch the Stripe publishable key from /api/config
            console.log('Fetching Stripe publishable key...');
            const configResponse = await fetch('http://127.0.0.1:5555/api/config');
            if (!configResponse.ok) {
                throw new Error(`Failed to fetch Stripe config: ${configResponse.statusText}`);
            }
            const { publishableKey } = await configResponse.json();
            console.log('Received publishableKey:', publishableKey);
    
            // Create PaymentIntent
            console.log('Sending request to create PaymentIntent...');
            const paymentResponse = await fetch('http://127.0.0.1:5555/api/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ total_price: totalPrice }),
            });
    
            if (!paymentResponse.ok) {
                const errorText = await paymentResponse.text();
                console.error('Backend responded with error:', errorText);
                throw new Error(`Failed to create PaymentIntent: ${paymentResponse.statusText}`);
            }
    
            const { clientSecret } = await paymentResponse.json();
            console.log('Received clientSecret:', clientSecret);
    
            // Mark items as sold
            console.log('Marking items as sold...');
            await Promise.all(cartItems.map(async (cartItem) => {
                const response = await fetch(`http://127.0.0.1:5555/api/baskets/${cartItem.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        is_sold: true,
                        user_id: userId,
                    }),
                });
    
                if (!response.ok) {
                    throw new Error(`Failed to update cartItem with id: ${cartItem.id}`);
                }
            }));
    
            // Generate QR codes
            if (cartItems.length > 0) {
                console.log('Generating QR codes...');
                const qrPromises = cartItems.map(async (cartItem) => {
                    const hash = objectHash(`${cartItem.vendor_name} ${cartItem.location} ${cartItem.id} ${userId}`);
                    const response = await fetch('http://127.0.0.1:5555/api/qr-codes', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            qr_code: hash,
                            user_id: userId,
                            basket_id: cartItem.id,
                            vendor_id: cartItem.vendor_id,
                        }),
                    });
    
                    if (!response.ok) {
                        throw new Error(`Failed to create QR code for basket ID ${cartItem.id}: ${response.statusText}`);
                    }
                    return response.json();
                });
    
                const results = await Promise.all(qrPromises);
                console.log('All QR codes created successfully:', results);
            }
    
            // Clear the cart
            // setCartItems([]);
            // setAmountInCart(0);
    
            // Redirect to the payment page, passing clientSecret, totalPrice, and publishableKey
            console.log('Navigating to payment page...');
            navigate('/user/payment', {
                state: {
                    clientSecret,
                    totalPrice,
                    cartItems,
                },
            });
        } catch (error) {
            console.error('Error during checkout:', error);
        }
    }
    
    useEffect(() => {
        console.log("Amount in cart:", amountInCart);
        console.log("Cart items:", cartItems);
    }, [amountInCart, cartItems]);

    return (
        <div>
            <h2>Shopping Cart</h2>
            <div className='box-bounding'>
                {cartItems.length === 0 ? (
                    <div className='text-center'>
                        <h1 className='title-big'>Cart Empty</h1>
                    </div>
                ) : (
                    <>
                        <div className='flex-space-between m-flex-wrap'>
                            <div className="cart">
                                <ul>
                                    {cartItems.map((item, index) => (
                                        <li className='cart-item' key={index}>
                                            <span><b>{item.vendor_name}</b> at <i>{item.location}</i>, {weekDay[item.day_of_week]} from {timeConverter(item.pickup_start)} - {timeConverter(item.pickup_end)}</span>
                                            <span><b>${item.price}</b></span>
                                            <button className='btn-cart' onClick={() => removeFromCart(item)}>Remove</button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="cart-sidebar flex-start m-flex-wrap">
                                <h1 className='margin-r-16'>Total: ${totalPrice}</h1> 
                                <button className='btn-edit' onClick={() => {globalThis.localStorage.getItem('user_id') == null ? handlePopup() : handleCheckout();}}>
                                    Checkout
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Cart;