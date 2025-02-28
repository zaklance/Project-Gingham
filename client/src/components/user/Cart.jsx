import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import objectHash from 'object-hash';
import { timeConverter, formatBasketDate } from '../../utils/helpers';

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
	
    let subtotal = 0;
    let transactionFees = 0;

    cartItems.forEach(item => {
        subtotal += item.price;
        transactionFees += item.fee_user || 0;
    });

    const totalPrice = subtotal + transactionFees;

    async function handleCheckout() {
        try {
            const userId = globalThis.localStorage.getItem('user_id');
            if (!userId) {
                console.error("User ID not found in localStorage.");
                throw new Error("User is not logged in.");
            }
    
            if (cartItems.length === 0) {
                throw new Error("Cart is empty.");
            }

            // Fetch the Stripe publishable key from /api/config
            console.log('Fetching Stripe publishable key...');
            const configResponse = await fetch('/api/config');
            if (!configResponse.ok) {
                throw new Error(`Failed to fetch Stripe config: ${configResponse.statusText}`);
            }
            const { publishableKey } = await configResponse.json();
            console.log('Received publishableKey:', publishableKey);
    
            // Create PaymentIntent
            console.log('Sending request to create PaymentIntent...');
                const paymentResponse = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ baskets: cartItems }),
            });
    
            if (!paymentResponse.ok) {
                const errorText = await paymentResponse.text();
                console.error('Backend responded with error:', errorText);
                throw new Error(`Failed to create PaymentIntent: ${paymentResponse.statusText}`);
            }
    
            const { clientSecret } = await paymentResponse.json();
    
            navigate('/user/payment', {
                state: { clientSecret, totalPrice, cartItems, amountInCart },
            });
        } catch (error) {
            console.error('Error during checkout:', error);
        }
    }
    
    useEffect(() => {
        console.log("Amount in cart:", amountInCart);
        console.log("Cart items:", cartItems);
    }, [amountInCart, cartItems]);

    console.log(cartItems)

    return (
        <div>
            <h2>Shopping Cart</h2>
            <div className='box-bounding'>
                {cartItems.length === 0 ? (
                    <div className='text-center'>
                        <h1 className='title-big'>Cart is Empty</h1>
                    </div>
                ) : (
                    <>
                        <div className='flex-space-between m-flex-wrap'>
                            <div className="cart">
                                <ul>
                                    {cartItems.map((item, index) => (
                                        <li className='cart-item' key={index}>
                                            <span><b>{item.vendor_name}</b> at <i>{item.location}</i>, {formatBasketDate(item.sale_date)} from {timeConverter(item.pickup_start)} - {timeConverter(item.pickup_end)}</span>
                                            <span><b>${item.price}</b></span>
                                            <button className='btn-cart' onClick={() => removeFromCart(item)}>Remove</button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="cart-sidebar flex-start m-flex-wrap">
                                <ul>
                                    <h3 className='margin-r-16'>Subtotal: ${subtotal.toFixed(2)}</h3>
                                    <h3 className='margin-r-16'>Transaction Fees: ${transactionFees.toFixed(2)}</h3>
                                    <h2 className='margin-r-16'>Total: ${totalPrice.toFixed(2)}</h2> 
                                    <button className='btn-edit' onClick={() => {
                                        globalThis.localStorage.getItem('user_id') == null ? handlePopup() : handleCheckout();
                                    }}>
                                        Checkout
                                    </button>
                                </ul>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Cart;