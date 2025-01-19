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
	
    async function handleCheckout() {
        try {
            const userId = globalThis.localStorage.getItem('user_id');
            if (!userId) { 
                throw new Error("User is not logged in.");
            }

            await Promise.all(cartItems.map(async (cartItem) => {
                const response = await fetch(`http://127.0.0.1:5555/api/baskets/${cartItem.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        is_sold: true,
                        user_id: userId,
                    })
                });

                if (!response.ok) {
                    throw new Error(`Failed to update cartItem with id: ${cartItem.id}`);
                }
            }));
            if (cartItems.length > 0) {
                const promises = cartItems.map(async (cartItem) => {
                    const hash = objectHash(`${cartItem.vendor_name} ${cartItem.location} ${cartItem.id} ${userId}`);
                    const response = await fetch('http://127.0.0.1:5555/api/qr-codes', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            qr_code: hash,
                            user_id: userId,
                            basket_id: cartItem.id,
                            vendor_id: cartItem.vendor_id
                        }),
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to create QR code for basket ID ${cartItem.id}: ${response.statusText}`);
                    }
                    return response.json();
                });
                try {
                    const results = await Promise.all(promises);
                    console.log('All QR codes created successfully:', results);
                } catch (error) {
                    console.error('Error creating QR codes:', error);
                }
                setCartItems([]);
                setAmountInCart(0);
                navigate('/user/checkout');
            }
        } catch (error) {
        console.error('Error during checkout:', error);
        }
    }
	
	useEffect(() => {
		console.log("Amount in cart:", amountInCart);
		console.log("Cart items:", cartItems);
	}, [amountInCart, cartItems]);
	

	let totalPrice = 0;

	cartItems.forEach(item => {
	  totalPrice += item.price;
	})
    

    return (
        <div>
            <h2>Shopping Cart</h2>
            {cartItems.length === 0 ? (
                <p className=''>Your cart is empty.</p>
            ) : (
                <>
                    <div className='flex-space-between m-flex-wrap'>
                        <div className="cart">
                            <ul>
                                {cartItems.map((item, index) => (
                                    <li className='cart-item' key={index}>
                                        <span><b>{item.vendor_name}</b> at <i>{item.location}</i>&ensp; {weekDay[item.day_of_week]} from {timeConverter(item.pickup_start)} - {timeConverter(item.pickup_end)}</span>
                                        <span><b>${item.price}</b></span>
                                        <button className='btn-cart' onClick={() => removeFromCart(item)}>Remove</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="cart-sidebar">
                            <h3>Checkout</h3>
                            <h3>Total: ${totalPrice}</h3> 
                            {/* <input
                                type="text"
                                placeholder="Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                />
                            <input
                                type="text"
                                placeholder="Address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                /> */}
                            <button className='btn-cart' onClick={() => {globalThis.localStorage.getItem('user_id') == null ? handlePopup() : handleCheckout();}}>
                                Checkout
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default Cart;