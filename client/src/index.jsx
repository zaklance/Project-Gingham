import React, { useCallback, useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './assets/css/index.css';

// main routes
import App from './App.jsx';
import Contact from './components/Contact.jsx';
import Home from './components/Home.jsx';
import ErrorPage from './components/ErrorPage.jsx';

// user routes
import Cart from './components/user/Cart.jsx';
import Checkout from './components/user/Checkout.jsx';
import CheckSession from './components/user/CheckSession.jsx';
import Login from './components/user/LoginPopup.jsx';
import Markets from './components/user/Markets.jsx';
import MarketDetail from './components/user/MarketDetail.jsx';
import Profile from './components/user/Profile.jsx';
import Vendors from './components/user/Vendors.jsx';
import VendorDetail from './components/user/VendorDetail.jsx';
import Logout from './components/user/Logout.jsx';
import UserResetRequest from './components/user/UserResetRequest.jsx';
import UserPasswordReset from './components/user/UserPasswordReset.jsx';

// vendor routes
import VendorHome from './components/vendor/VendorHome.jsx';
import VendorLogout from './components/vendor/VendorLogout.jsx';
import VendorCreate from './components/vendor/VendorCreate.jsx';
import VendorDashboard from './components/vendor/VendorDashboard.jsx';
import VendorNotification from './components/vendor/VendorNotification.jsx';
import VendorLoginPopup from './components/vendor/VendorLoginPopup.jsx';
import VendorSales from './components/vendor/VendorSales.jsx';
import VendorProfile from './components/vendor/VendorProfile.jsx';
import VendorResetRequest from './components/vendor/VendorResetRequest.jsx';
import VendorPasswordReset from './components/vendor/VendorPasswordReset.jsx';

// admin routes
import AdminHome from './components/admin/AdminHome.jsx';
import AdminLogout from './components/admin/AdminLogout.jsx';
import AdminProfile from './components/admin/AdminProfile.jsx';
import AdminMarkets from './components/admin/AdminMarkets.jsx';
import AdminVendors from './components/admin/AdminVendors.jsx';
import AdminUsers from './components/admin/AdminUsers.jsx';
import AdminResetRequest from './components/admin/AdminResetRequest.jsx';
import AdminPasswordReset from './components/admin/AdminPasswordReset.jsx';

import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { Navigate } from 'react-router-dom';


const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_JS_KEY)

const CheckoutForm = () => {
    const fetchClientSecret = useCallback(() => {
        // Create a Checkout Session
        return fetch("http://127.0.0.1:5555/api/create-checkout-session", {
            method: "POST",
        })
            .then((res) => res.json())
            .then((data) => data.clientSecret);
    }, []);

    const options = { fetchClientSecret };

    return (
        <div id="checkout">
            <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={options}
            >
                <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
        </div>
    )
}

const Return = () => {
    const [status, setStatus] = useState(null);
    const [customerEmail, setCustomerEmail] = useState('');

    useEffect(() => {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const sessionId = urlParams.get('session_id');

        fetch(`/session-status?session_id=${sessionId}`)
            .then((res) => res.json())
            .then((data) => {
                setStatus(data.status);
                setCustomerEmail(data.customer_email);
            });
    }, []);

    if (status === 'open') {
        return (
            <Navigate to="/checkout" />
        )
    }

    if (status === 'complete') {
        return (
            <section id="success">
                <p>
                    We appreciate your business! A confirmation email will be sent to {customerEmail}.

                    If you have any questions, please email <a href="mailto:orders@example.com">orders@example.com</a>.
                </p>
            </section>
        )
    }

    return null;
}


const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        errorElement: <ErrorPage />,
        children: [
            { path: "/", element: <Home /> },
            { path: "contact", element: <Contact />},
            {
                path: "user",
                children: [
                    { path: "login", element: <Login /> },
                    { path: "profile/:id", element: <Profile /> },
                    { path: "logout", element: <Logout /> },
                    { path: "markets", element: <Markets /> },
                    { path: "markets/:id", element: <MarketDetail /> },
                    { path: "vendors", element: <Vendors /> },
                    { path: "vendors/:id", element: <VendorDetail /> },
                    { path: "your-cart", element: <Cart /> },
                    { path: "checkout", element: <CheckoutForm /> },
                    { path: "check-session", element: <CheckSession /> },
                    { path: "return", element: <Return />},
                    { path: "reset-request", element: <UserResetRequest /> },
                    { path: "password-reset/:token", element: <UserPasswordReset /> },
                    { path: "return", element: <Return /> }
                ]
            },
            {
                path: "vendor",
                children: [
                    { path: "home", element: <VendorHome /> },
                    { path: "dashboard", element: <VendorDashboard /> },
                    { path: "/vendor-dashboard/:vendorId", element: <VendorDashboard />},
                    { path: "sales", element: <VendorSales /> },
                    { path: "signup", element: <VendorLoginPopup />},
                    { path: "profile/:id", element: <VendorProfile /> },
                    { path: "vendor-create/:id", element: <VendorCreate />},
                    { path: "logout", element: <VendorLogout /> },
                    { path: "password-reset", element: <VendorPasswordReset />},
                    { path: "reset-request", element: <VendorResetRequest />}
                ]
            },
            {
                path: "admin",
                children: [
                    { path: "home", element: <AdminHome /> },
                    { path: "markets", element: <AdminMarkets />},
                    { path: "vendors", element: <AdminVendors />},
                    { path: "users", element: <AdminUsers />},
                    { path: "profile/:id", element: <AdminProfile /> },
                    { path: "logout", element: <AdminLogout /> },
                    { path: "password-reset", element: <AdminPasswordReset />},
                    { path: "reset-request", element: <AdminResetRequest />}
                ]
            }
        ]      
    }
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<RouterProvider router={router} />);