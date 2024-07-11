// App.jsx
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import './assets/css/index.css';
import NavBar from './components/NavBar.jsx';

function App() {
    const [amountInCart, setAmountInCart] = useState(() => {
        return parseInt(localStorage.getItem('amountInCart') || 0);
    });

    const [cartItems, setCartItems] = useState(() => {
        const savedCartItems = localStorage.getItem('cartItems');
        return savedCartItems ? JSON.parse(savedCartItems) : [];
    });

    useEffect(() => {
        localStorage.setItem('amountInCart', amountInCart);
    }, [amountInCart]);

    useEffect(() => {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }, [cartItems]);

    return (
        <div className="container">
            <header>
                <NavBar />
            </header>
            <main>
                <Outlet context={{ amountInCart, setAmountInCart, cartItems, setCartItems }} />
            </main>
        </div>
    );
}

export default App;