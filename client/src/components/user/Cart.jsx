import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';

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
	
    function handleCheckout() {
		// alert(`Checkout successful for ${name}`);
        setCartItems([]);
        // setName('');
        // setAddress('');
        setAmountInCart(0);
        navigate('/user/checkout');
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
                    <div className='flex-space-between'>
                        <div className="cart">
                            <ul>
                                {cartItems.map((item, index) => (
                                    <li className='cart-item' key={index}>
                                        <span><b>{item.vendorName}</b> at <i>{item.location}</i> — ${item.price}</span>
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
                                onClick={(globalThis.sessionStorage.getItem('user_id') == null) ? (
                                    handlePopup
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