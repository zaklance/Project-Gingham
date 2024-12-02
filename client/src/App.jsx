// App.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import './assets/css/index.css';
import NavBar from './components/NavBar.jsx';
import Home from './components/Home.jsx'
import LoginPopup from './components/user/LoginPopup.jsx';
import Footer from './components/Footer.jsx';
import VendorLoginPopup from './components/vendor/VendorLoginPopup.jsx';
import AdminLoginPopup from './components/admin/AdminLoginPopup.jsx';

function App() {
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [isPopup, setIsPopup] = useState(false);
    const isNotUser = location.pathname.startsWith('/vendor') || location.pathname.startsWith('/admin');
    const isVendorPage = location.pathname.startsWith('/vendor');
    const isAdminPage = location.pathname.startsWith('/admin');
    const [amountInCart, setAmountInCart] = useState(() => {
        return parseInt(globalThis.localStorage.getItem('amountInCart') || 0);
    });

    const [cartItems, setCartItems] = useState(() => {
        const savedCartItems = globalThis.localStorage.getItem('cartItems');
        return savedCartItems ? JSON.parse(savedCartItems) : [];
    });

    useEffect(() => {
        globalThis.localStorage.setItem('amountInCart', amountInCart);
    }, [amountInCart]);

    useEffect(() => {
        globalThis.localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }, [cartItems]);

    const handlePopup = () => {
        setIsPopup(!isPopup);
    }

    const checkAuth = () => {
        return globalThis.localStorage.getItem('jwt-token') !== null;
    }

    useEffect(() => {
        setIsLoggedIn(checkAuth());
    }, []);

    return (
        <>
            {isVendorPage ? (<div className='banner-vendor-portal'><h2 className='center text-light' style={{backgroundColor: "transparent"}}>Vendor Portal</h2></div>) : (<></>)}
            {isAdminPage ? (<div className='banner-admin-portal'><h2 className='center text-light' style={{backgroundColor: "transparent"}}>Admin Portal</h2></div>) : (<></>)}
            <div className="container">
                <header>
                    <NavBar amountInCart={amountInCart} isPopup={isPopup} setIsPopup={setIsPopup} handlePopup={handlePopup} />
                </header>
                <main>
                    <div className={`popup ${isPopup ? 'popup-on' : ''}`} style={{ top: window.scrollY }}>
                        {!isNotUser && (<LoginPopup handlePopup={handlePopup} />)}
                        {isVendorPage && (<VendorLoginPopup handlePopup={handlePopup} />)}
                        {isAdminPage && (<AdminLoginPopup handlePopup={handlePopup} />)}
                    </div>
                    <Outlet context={{ amountInCart, setAmountInCart, cartItems, setCartItems, isPopup, setIsPopup, handlePopup }} />
                </main>
            </div>
            <Footer />
        </>
    );
}

export default App;