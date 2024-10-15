// App.jsx
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import './assets/css/index.css';
import NavBar from './components/NavBar.jsx';
import Home from './components/Home.jsx'
import LoginPopup from './components/user/LoginPopup.jsx';
import Footer from './components/Footer.jsx';
import VendorLogin from './components/vendor/VendorLogin.jsx';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [isPopup, setIsPopup] = useState(false);
    const isNotUser = location.pathname.startsWith('/vendor') || location.pathname.startsWith('/admin');
    const [amountInCart, setAmountInCart] = useState(() => {
        return parseInt(globalThis.sessionStorage.getItem('amountInCart') || 0);
    });

    const [cartItems, setCartItems] = useState(() => {
        const savedCartItems = globalThis.sessionStorage.getItem('cartItems');
        return savedCartItems ? JSON.parse(savedCartItems) : [];
    });

    useEffect(() => {
        globalThis.sessionStorage.setItem('amountInCart', amountInCart);
    }, [amountInCart]);

    useEffect(() => {
        globalThis.sessionStorage.setItem('cartItems', JSON.stringify(cartItems));
    }, [cartItems]);

    const handlePopup = () => {
        setIsPopup(!isPopup);
    }

    const checkAuth = () => {
        return globalThis.sessionStorage.getItem('jwt-token') !== null;
    }

    useEffect(() => {
        setIsLoggedIn(checkAuth());
    }, []);

    return (
        <>
            {isNotUser ? (<div className='banner-portal'><h2 className='center text-light' style={{backgroundColor: "transparent"}}>Vendor Portal</h2></div>) : (<></>)}
            <div className="container">
                <header>
                    <NavBar amountInCart={amountInCart} isPopup={isPopup} setIsPopup={setIsPopup} handlePopup={handlePopup} />
                </header>
                <main>
                    <div className={`popup ${isPopup ? 'popup-on' : ''}`} style={{ top: window.scrollY }}>
                        <LoginPopup handlePopup={handlePopup} />
                    </div>
                    {/* {isLoggedIn ? ( */}
                        <Outlet context={{ amountInCart, setAmountInCart, cartItems, setCartItems, isPopup, setIsPopup, handlePopup }} />
                    {/* ) : ( */}
                        {/* <Home context={{ isPopup, setIsPopup, handlePopup }} /> */}
                    {/* )} */}
                </main>
            </div>
            <Footer />
        </>
    );
}

export default App;