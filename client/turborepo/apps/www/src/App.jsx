import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import '@repo/ui/index.css';
import NavBar from '@repo/ui/NavBar.jsx';
import Footer from '@repo/ui/Footer.jsx';
import BrowserTimezone from '@repo/ui/BrowserTimezone.jsx';
import LoginPopup from './components/LoginPopup.jsx';
import { jwtDecode } from 'jwt-decode';
import { ToastContainer, Slide } from 'react-toastify';
import { toast } from 'react-toastify';

function App() {
    const [subdomain, setSubdomain] = useState('');
    const [isPopup, setIsPopup] = useState(false);
    const [amountInCart, setAmountInCart] = useState(() => {
        return parseInt(globalThis.localStorage.getItem('amountInCart') || 0);
    });
    const [cartItems, setCartItems] = useState(() => {
        const savedCartItems = globalThis.localStorage.getItem('cartItems');
        return savedCartItems ? JSON.parse(savedCartItems) : [];
    });

    const getSubdomain = () => {
        const hostnameParts = window.location.hostname.split('.');

        if (hostnameParts.length > 1) {
            setSubdomain(hostnameParts[0]);
        }
    };

    useEffect(() => {
        getSubdomain()
    }, []);

    const isNotUser = (subdomain == 'vendor' | subdomain == 'admin');
    const isVendorPage = subdomain == 'vendor';
    const isAdminPage = subdomain == 'admin';

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
    checkTokenExpiration("vendor", "vendor_user", "/")
    checkTokenExpiration("admin", "admin_user", "/")


    return (
        <>
            {isVendorPage && <div className='banner-vendor-portal'><h2 className='center text-light' style={{backgroundColor: "transparent"}}>Vendor Portal</h2></div>}
            {isAdminPage && <div className='banner-admin-portal'><h2 className='center text-light' style={{backgroundColor: "transparent"}}>Admin Portal</h2></div>}
            <div className="container">
                <header>
                    <NavBar amountInCart={amountInCart} isPopup={isPopup} setIsPopup={setIsPopup} handlePopup={handlePopup} />
                </header>
                <main>
                    <div className={`popup ${isPopup && 'popup-on'}`} style={{ top: window.scrollY }}>
                        {!isNotUser && <LoginPopup handlePopup={handlePopup} />}
                    </div>
                    <Outlet context={{ amountInCart, setAmountInCart, cartItems, setCartItems, isPopup, setIsPopup, handlePopup }} />
                    {(isVendorPage || isAdminPage) && <BrowserTimezone />}
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