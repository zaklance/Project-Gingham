import React, { useState } from 'react';

function Cart() {
  // Example state for cart items and checkout form fields
  const [cartItems, setCartItems] = useState([
    { id: 1, name: 'Item 1', price: 10 },
    { id: 2, name: 'Item 2', price: 15 },
  ]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  // Function to remove item from cart
  function removeFromCart(itemToRemove) {
    const updatedCart = cartItems.filter(item => item.id !== itemToRemove.id);
    setCartItems(updatedCart);
  }

  // Function to handle checkout
  function handleCheckout() {
    alert(`Checkout successful for ${name}. Cart items cleared.`);
    setCartItems([]);
    setName('');
    setAddress('');
  }

  return (
    <div className="cart">
      <h2>Shopping Cart</h2>
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <ul>
            {cartItems.map((item, index) => (
              <li key={index}>
                <span>{item.name}</span>
                <span>{item.price}</span>
                <button onClick={() => removeFromCart(item)}>Remove</button>
              </li>
            ))}
          </ul>
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
            <button onClick={handleCheckout}>Checkout</button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;
