// Cart.jsx
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

function Cart() {
    const { cartItems, setCartItems, amountInCart, setAmountInCart } = useOutletContext();
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');

    function removeFromCart(itemToRemove) {
        const updatedCart = cartItems.filter(item => item.id !== itemToRemove.id);
        setCartItems(updatedCart);
        setAmountInCart(amountInCart - 1);

    }
	
    function handleCheckout() {
		alert(`Checkout successful for ${name}. Cart items cleared.`);
        setCartItems([]);
        setName('');
        setAddress('');
        setAmountInCart(0);
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
        <div className="cart">
            <h2>Shopping Cart</h2>
            {cartItems.length === 0 ? (
                <p>Your cart is empty.</p>
            ) : (
                <>
                    <ul>
                        {cartItems.map((item, index) => (
                            <li className='cart-item' key={index}>
                                <span><b>{item.vendorName}</b> at {item.location} {item.price}</span>
                                <button className='btn-cart' onClick={() => removeFromCart(item)}>Remove</button>
                            </li>
                        ))}
                    </ul>
                    <div>
					<h3>Total: {totalPrice}</h3> 
                    </div>
                    <div className="checkout-form">
                        <h3>Checkout</h3>
                        <input
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
                            />
                        <button className='btn-cart' onClick={handleCheckout}>Checkout</button>
                    </div>
                </>
            )}
        </div>
    );
}

export default Cart;