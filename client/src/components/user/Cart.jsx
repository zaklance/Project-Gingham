import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { weekDay } from '../../utils/common';
import { timeConverter } from '../../utils/helpers';

function Cart() {
    const { handlePopup, cartItems, setCartItems, amountInCart, setAmountInCart } = useOutletContext();
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [cartTimer, setCartTimer] = useState(null);

    const navigate = useNavigate();

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
            await Promise.all(cartItems.map(async (cartItem) => {
                const response = await fetch(`http://127.0.0.1:5555/api/baskets/${cartItem.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        is_sold: true
                    })
                });

                if (!response.ok) {
                    throw new Error(`Failed to update cartItem with id: ${cartItem.id}`);
                }
            }));
            setCartItems([]);
            setAmountInCart(0);
            navigate('/user/checkout');
        } catch (error) {
            console.error('Error during checkout:', error);
        }
    }


    console.log(cartItems)
	
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
                    <div className='flex-space-between'>
                        <div className="cart">
                            <ul>
                                {cartItems.map((item, index) => (
                                    <li className='cart-item' key={index}>
                                        <span><b>{item.vendorName}</b> at <i>{item.location}</i>&ensp; {weekDay[item.day_of_week]} from {timeConverter(item.pickup_start)} - {timeConverter(item.pickup_end)}</span>
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
                            <button 
                                className='btn-cart' 
                                onClick={(globalThis.localStorage.getItem('user_id') == null) ? (
                                    handlePopup()
                                ) : (
                                    handleCheckout)}
                                >Checkout</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default Cart;