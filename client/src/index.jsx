import React, { useCallback, useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate, useParams } from 'react-router-dom';
import './assets/css/index.css';

// main routes
import App from './App.jsx';
import About from './components/About.jsx';
import Home from './components/Home.jsx';
import Contact from './components/Contact.jsx';
import ErrorPage from './components/ErrorPage.jsx';

// user routes
import Cart from './components/user/Cart.jsx';
import Payment from './components/user/Payment.jsx'
import Completion from './components/user/Completion.jsx'
import CheckSession from './components/user/CheckSession.jsx';
import Login from './components/user/LoginPopup.jsx';
import Markets from './components/user/Markets.jsx';
import MarketDetail from './components/user/MarketDetail.jsx';
import PickUp from './components/user/PickUp.jsx';
import Profile from './components/user/Profile.jsx';
import Vendors from './components/user/Vendors.jsx';
import VendorDetail from './components/user/VendorDetail.jsx';
import UserFAQs from './components/user/UserFAQs.jsx';
import Logout from './components/user/Logout.jsx';
import UserResetRequest from './components/user/UserResetRequest.jsx';
import UserPasswordReset from './components/user/UserPasswordReset.jsx';
import UserEmailVerification from './components/user/UserEmailVerification.jsx';

// vendor routes
import VendorHome from './components/vendor/VendorHome.jsx';
import VendorLogout from './components/vendor/VendorLogout.jsx';
import VendorCreate from './components/vendor/VendorCreate.jsx';
import VendorDashboard from './components/vendor/VendorDashboard.jsx';
import VendorSales from './components/vendor/VendorSales.jsx';
import VendorScan from './components/vendor/VendorScan.jsx';
import VendorProfile from './components/vendor/VendorProfile.jsx';
import VendorHelpCenter from './components/vendor/VendorHelpCenter.jsx';
import VendorLoginPopup from './components/vendor/VendorLoginPopup.jsx';
import VendorResetRequest from './components/vendor/VendorResetRequest.jsx';
import VendorPasswordReset from './components/vendor/VendorPasswordReset.jsx';
import VendorUserEmailVerification from './components/vendor/VendorUserEmailVerification.jsx'

// admin routes
import AdminHome from './components/admin/AdminHome.jsx';
import AdminLogout from './components/admin/AdminLogout.jsx';
import AdminProfile from './components/admin/AdminProfile.jsx';
import AdminMarkets from './components/admin/AdminMarkets.jsx';
import AdminVendors from './components/admin/AdminVendors.jsx';
import AdminUsers from './components/admin/AdminUsers.jsx';
import AdminHelp from './components/admin/AdminHelp.jsx';
import AdminEmail from './components/admin/AdminEmail.jsx';
import AdminBlog from './components/admin/AdminBlog.jsx';
import AdminReport from './components/admin/AdminReport.jsx';
import AdminFAQs from './components/admin/AdminFAQs.jsx';
import AdminResetRequest from './components/admin/AdminResetRequest.jsx';
import AdminPasswordReset from './components/admin/AdminPasswordReset.jsx';
import AdminEmailVerification from './components/admin/AdminEmailVerification.jsx'

import { loadStripe } from '@stripe/stripe-js';
// import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_JS_KEY);

const UserRoute = ({ children }) => {
    const token = localStorage.getItem("user_jwt-token");
    const storedId = localStorage.getItem("user_id");
    const { id: routeId } = useParams();

    if (!token || !storedId) {
        return (
            <div className='wrapper-error text-error margin-t-24'>
                <h1 className='text-red'>Protected route: User not authenticated.</h1>
            </div>
        );
    }

    if (storedId !== routeId) {
        return (
            <div className='wrapper-error text-error margin-t-24'>
                <h1 className='text-red'>Access denied: You can only access your own account.</h1>
            </div>
        );
    }

    return children;
};

const VendorRoute = ({ children }) => {
    const token = localStorage.getItem("vendor_jwt-token");
    const storedId = localStorage.getItem("vendor_user_id");
    const { id: routeId } = useParams();

    if ( !token || !storedId) {
        return <Navigate to="/vendor" />;
    }

    if (storedId !== routeId) {
        return (
            <div className='wrapper-error text-error margin-t-24'>
                <h1 className='text-red'>Access denied: You can only access your own account.</h1>
            </div>
        );
    }

    return children;
};

const AdminRoute = ({ children }) => {
    const token = localStorage.getItem("admin_jwt-token");
    const storedId = localStorage.getItem("admin_user_id");
    const { id: routeId } = useParams();

    if (!token || !storedId) {
        return <Navigate to="/admin" />;
    }

    if (storedId !== routeId) {
        return (
            <div className='wrapper-error text-error margin-t-24'>
                <h1 className='text-red'>Access denied: You can only access your own account.</h1>
            </div>
        );
    }

    return children;
};

const UserAuthRoute = ({ children }) => {
    const token = localStorage.getItem("user_jwt-token");
    const id = localStorage.getItem("user_id");

    if (!token || !id) {
        return (
            <div className='wrapper-error text-error margin-t-24'>
                <h1 className='text-red'>Protected route: User not authenticated.</h1>
            </div>
        );
    }

    return children;
};

const VendorAuthRoute = ({ children }) => {
    const token = localStorage.getItem("vendor_jwt-token");
    const id = localStorage.getItem("vendor_user_id");

    if (!token || !id) {
        return (
            <div className='wrapper-error text-error margin-t-24'>
                <h1 className='text-red'>Protected route: Vendor User not authenticated.</h1>
            </div>
        );
    }

    return children;
};

const AdminAuthRoute = ({ children }) => {
    const token = localStorage.getItem("admin_jwt-token");
    const id = localStorage.getItem("admin_user_id");

    if (!token || !id) {
        return (
            <div className='wrapper-error text-error margin-t-24'>
                <h1 className='text-red'>Protected route: Admin User not authenticated.</h1>
            </div>
        );
    }

    return children;
};

// const CheckoutForm = () => {
//     const fetchClientSecret = useCallback(() => {
//         return fetch("http://127.0.0.1:5555/api/create-payment-intent", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({ totalPrice: 100 }), // Example total price
//         })
//             .then((res) => {
//                 if (!res.ok) {
//                     return res.json().then((err) => {
//                         throw new Error(err.error || "Failed to fetch client secret");
//                     });
//                 }
//                 return res.json();
//             })
//             .then((data) => {
//                 if (!data.clientSecret) {
//                     throw new Error("Client secret is undefined");
//                 }
//                 return data.clientSecret;
//             })
//             .catch((error) => {
//                 console.error("Error fetching client secret:", error.message);
//                 throw error; // Rethrow to propagate the error
//             });
//     }, []);

    // const options = { fetchClientSecret };

    // return (
    //     <div id="checkout">
    //         <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
    //             <EmbeddedCheckout />
    //         </EmbeddedCheckoutProvider>
    //     </div>
    // );
// };

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
        return <Navigate to="/checkout" />;
    }

    if (status === 'complete') {
        return (
            <section id="success">
                <p>
                    We appreciate your business! A confirmation email will be sent to {customerEmail}.
                    If you have any questions, please email <a href="mailto:orders@example.com">orders@example.com</a>.
                </p>
            </section>
        );
    }

    return null;
};

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        errorElement: <ErrorPage />,
        children: [
            { path: "/", element: <Home /> },
            { path: "about", element: <About /> },
            { path: "contact", element: <Contact /> },
            {
                path: "user",
                children: [
                    { path: "login", element: <Login /> },
                    { path: "profile/:id", element: <UserRoute><Profile /></UserRoute> },
                    { path: "logout", element: <Logout /> },
                    { path: "markets", element: <Markets /> },
                    { path: "markets/:id", element: <MarketDetail /> },
                    { path: "vendors", element: <Vendors /> },
                    { path: "vendors/:id", element: <VendorDetail /> },
                    { path: "your-cart", element: <Cart /> },
                    { path: "pick-up", element: <UserAuthRoute><PickUp /></UserAuthRoute> },
                    { path: "help", element: <UserFAQs /> },
                    { path: "payment", element: <Payment /> },
                    { path: "check-session", element: <CheckSession /> },
                    { path: "completion", element: <Completion />},
                    { path: "return", element: <Return />},
                    { path: "reset-request", element: <UserResetRequest /> },
                    { path: "password-reset/:token", element: <UserPasswordReset /> },
                    { path: "confirm-email/:token", element: <UserEmailVerification /> },
                ],
            },
            { path: "vendor", element: <VendorHome /> },
            {
                path: "vendor",
                children: [
                    { path: "dashboard", element: <VendorAuthRoute><VendorDashboard /></VendorAuthRoute> },
                    { path: "sales", element: <VendorAuthRoute><VendorSales /></VendorAuthRoute> },
                    { path: "scan", element: <VendorAuthRoute><VendorScan /></VendorAuthRoute> },
                    { path: "signup", element: <VendorLoginPopup /> },
                    { path: "profile/:id", element: <VendorRoute><VendorProfile /></VendorRoute> },
                    { path: "help", element: <VendorHelpCenter /> },
                    { path: "contact", element: <Contact /> },
                    { path: "vendor-create", element: <VendorAuthRoute><VendorCreate /></VendorAuthRoute> },
                    { path: "logout", element: <VendorLogout />},
                    { path: "reset-request", element: <VendorResetRequest /> },
                    { path: "password-reset/:token", element: <VendorPasswordReset /> },
                    { path: "confirm-email/:token", element: <VendorUserEmailVerification /> },
                ],
            },
            { path: "admin", element: <AdminHome /> },
            {
                path: "admin",
                children: [
                    { path: "markets", element: <AdminAuthRoute><AdminMarkets /></AdminAuthRoute>},
                    { path: "vendors", element: <AdminAuthRoute><AdminVendors /></AdminAuthRoute>},
                    { path: "users", element: <AdminAuthRoute><AdminUsers /></AdminAuthRoute>},
                    { path: "help", element: <AdminAuthRoute><AdminHelp /></AdminAuthRoute>},
                    { path: "email", element: <AdminAuthRoute><AdminEmail /></AdminAuthRoute>},
                    { path: "blog", element: <AdminAuthRoute><AdminBlog /></AdminAuthRoute>},
                    { path: "report", element: <AdminAuthRoute><AdminReport /></AdminAuthRoute>},
                    { path: "profile/:id",element:<AdminRoute><AdminProfile /></AdminRoute>},
                    { path: "faqs", element: <AdminRoute><AdminFAQs /></AdminRoute>},
                    { path: "logout", element: <AdminLogout /> },
                    { path: "reset-request", element: <AdminResetRequest /> },
                    { path: "password-reset/:token", element: <AdminPasswordReset /> },
                    { path: "confirm-email/:token", element: <AdminEmailVerification /> },
                ],
            },
        ],
    },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<RouterProvider router={router} />);