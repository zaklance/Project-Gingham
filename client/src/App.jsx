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
import initTelemetry from './utils/telemetry.js';
import { trace } from '@opentelemetry/api';
import { jwtDecode } from 'jwt-decode';
import BrowserTimezone from './components/BrowserTimezone.jsx';
import { ToastContainer, Slide } from 'react-toastify';
import { toast } from 'react-toastify';
import PaymentSuccess from './components/user/PaymentSuccess';

initTelemetry();

const tracer = trace.getTracer('react-app', '1.0.0');

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
            // console.log("Current Time:", currentTime);
        
            const updatedCart = cartItems.filter(cartItem => {
                // Merge sale_date with pickup_end time
                const pickupEndTime = new Date(`${cartItem.sale_date} ${cartItem.pickup_end}`);
                
                // Debug logs
                // console.log(`Checking item: ${cartItem.vendor_name}, Sale Date: ${cartItem.sale_date}, Pickup End: ${pickupEndTime}`);
                
                if (isNaN(pickupEndTime)) {
                    console.error("Invalid Date detected:", cartItem.pickup_end);
                    return true; // Keep item to avoid unintended removals
                }
        
                const timeDiff = (pickupEndTime - currentTime) / 60000; // Convert ms to minutes
                // console.log(`Time difference for ${cartItem.vendor_name}: ${timeDiff} minutes`);
        
                if (timeDiff <= 1) {
                    // console.log(`Removing item: ${cartItem.vendor_name}`);
                    toast.warning(`Removing the basket by ${cartItem.vendor_name}, the pickup time has ended.`, {
                        autoClose: 8000,
                    });
                    return false; // Remove expired item
                }
                return true; // Keep valid item
            });
        
            if (updatedCart.length !== cartItems.length) {
                // console.log("Cart updated! New Cart:", updatedCart);
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
                autoClose={4000}
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