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
import { jwtDecode } from 'jwt-decode';
import BrowserTimezone from './components/BrowserTimezone.jsx';
import { ToastContainer, Slide } from 'react-toastify';

function App() {
    const location = useLocation();
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

    useEffect(() => {
        const checkExpiredItems = () => {
            const currentTime = new Date();
            const updatedCart = cartItems.filter(cartItem => {
                const saleDateTime = new Date(cartItem.sale_date);
                const pickupEndTime = new Date(cartItem.pickup_end);
                return currentTime <= saleDateTime || currentTime <= pickupEndTime;
            });

            if (updatedCart.length !== cartItems.length) {
                setCartItems(updatedCart);
                setAmountInCart(updatedCart.length);
                globalThis.localStorage.setItem('cartItems', JSON.stringify(updatedCart));
                globalThis.localStorage.setItem('amountInCart', JSON.stringify(updatedCart.length));
            }
        };

        checkExpiredItems();
        // Check every minute
        const interval = setInterval(checkExpiredItems, 60000);

        return () => clearInterval(interval);
    }, [cartItems]);

    const handlePopup = () => {
        setIsPopup(!isPopup);
    }
    
    function checkTokenExpiration(userToken, id, path) {
        const token = localStorage.getItem(`${userToken}_jwt-token`);
        if (!token) {
            // No token, user is already logged out
            return false;
        }
        try {
            const decoded = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            if (decoded.exp < currentTime) {
                // Token has expired, log the user out
                localStorage.removeItem(`${id}_id`);
                localStorage.removeItem(`${userToken}_jwt-token`);
                // Redirect to login page or perform other logout actions
                window.location.href = path;
                // handlePopup()
                return true;
            }
        } catch (error) {
            console.error("Error decoding token:", error);
            // Handle error, maybe log the user out for security
            localStorage.removeItem(`${id}_id`);
            localStorage.removeItem(`${userToken}_jwt-token`);
            return true;
        }
        return false; // Token is valid
    }

    checkTokenExpiration("user", "user", "/")
    checkTokenExpiration("vendor", "vendor_user", "/vendor/")
    checkTokenExpiration("admin", "admin_user", "/admin/")


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
                    {isVendorPage || isAdminPage ? <BrowserTimezone /> : null}
                </main>
            </div>
            <Footer />
            <ToastContainer
                position="top-right"
                autoClose={1000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick={false}
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
                transition={Slide}
            />
        </>
    );
}

export default App;