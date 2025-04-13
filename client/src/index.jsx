import React, { useCallback, useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate, useParams } from 'react-router-dom';
import './assets/css/index.css';

// main routes
import App from './App.jsx';
import About from './components/About.jsx';
import Home from './components/Home.jsx';
import Contact from './components/Contact.jsx';
import TermsAndConditions from './components/TermsAndConditions.jsx';
import PrivacyPolicy from './components/PrivacyPolicy.jsx';
import PasswordResetRequest from './components/PasswordResetRequest.jsx';
import PasswordReset from './components/PasswordReset.jsx';
import Unsubscribe from './components/Unsubscribe.jsx';
import Maintenance from './components/Maintenance.jsx';
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
import UserEmailVerification from './components/user/UserEmailVerification.jsx';
import Logout from './components/user/Logout.jsx';

// vendor routes
import VendorHome from './components/vendor/VendorHome.jsx';
import VendorLogout from './components/vendor/VendorLogout.jsx';
import VendorCreate from './components/vendor/VendorCreate.jsx';
import VendorDashboard from './components/vendor/VendorDashboard.jsx';
import VendorSales from './components/vendor/VendorSales.jsx';
import VendorScan from './components/vendor/VendorScan.jsx';
import VendorProfile from './components/vendor/VendorProfile.jsx';
import VendorStripeReturn from './components/vendor/VendorStripeReturn.jsx';
import VendorStripeRefresh from './components/vendor/VendorStripeRefresh.jsx';
import VendorHelpCenter from './components/vendor/VendorHelpCenter.jsx';
import VendorLoginPopup from './components/vendor/VendorLoginPopup.jsx';
import VendorEmailVerification from './components/vendor/VendorEmailVerification.jsx';
import VendorTeam from './components/vendor/VendorTeam.jsx';
import VendorJoinTeam from './components/vendor/VendorJoinTeam.jsx';

// admin routes
import AdminHome from './components/admin/AdminHome.jsx';
import AdminLogout from './components/admin/AdminLogout.jsx';
import AdminProfile from './components/admin/AdminProfile.jsx';
import AdminMarkets from './components/admin/AdminMarkets.jsx';
import AdminVendors from './components/admin/AdminVendors.jsx';
import AdminUsers from './components/admin/AdminUsers.jsx';
import AdminHelp from './components/admin/AdminHelp.jsx';
import AdminEmailBulk from './components/admin/AdminEmailBulk.jsx';
import AdminEmail from './components/admin/AdminEmail.jsx';
import AdminBlog from './components/admin/AdminBlog.jsx';
import AdminReport from './components/admin/AdminReport.jsx';
import AdminStats from './components/admin/AdminStats.jsx';
import AdminEmailVerification from './components/admin/AdminEmailVerification.jsx';
import AdminFAQs from './components/admin/AdminFAQs.jsx';

const UserRoute = ({ children }) => {
    const token = localStorage.getItem("user_jwt-token");
    const storedId = localStorage.getItem("user_id");
    const { id: routeId } = useParams();

    if (!token || !storedId) {
        return (
            <div className='wrapper-error text-error margin-t-24'>
                <h1 className='text-red'>Please login again: User not authenticated.</h1>
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
                <h1 className='text-red'>Please login again: User not authenticated.</h1>
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
                <h1 className='text-red'>Please login again: Vendor User not authenticated.</h1>
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
                <h1 className='text-red'>Please login again: Admin User not authenticated</h1>
            </div>
        );
    }

    return children;
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
            { path: "terms-service", element: <TermsAndConditions /> },
            { path: "privacy-policy", element: <PrivacyPolicy /> },
            { path: "unsubscribe", element: <Unsubscribe /> },
            { path: "maintenance", element: <Maintenance /> },
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
                    { path: "cart", element: <Cart /> },
                    { path: "pick-up", element: <UserAuthRoute><PickUp /></UserAuthRoute> },
                    { path: "help", element: <UserFAQs /> },
                    { path: "payment", element: <Payment /> },
                    { path: "check-session", element: <CheckSession /> },
                    { path: "completion", element: <Completion />},
                    { path: "password-reset-request", element: <PasswordResetRequest user={'user'} /> },
                    { path: "password-reset/:token", element: <PasswordReset user={'user'} path={'/'} /> },
                    { path: "confirm-email/:token", element: <UserEmailVerification user={'user'} path={'/'} /> },
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
                    { path: "return/:accountId", element: <VendorStripeReturn />},
                    { path: "refresh/:accountId", element: <VendorStripeRefresh />},
                    { path: "logout", element: <VendorLogout />},
                    { path: "password-reset-request", element: <PasswordResetRequest user={'vendor'} /> },
                    { path: "password-reset/:token", element: <PasswordReset user={'vendor'} path={'/vendor'} /> },
                    { path: "confirm-email/:token", element: <VendorEmailVerification user={'vendor'} path={'/vendor'} /> },
                    { path: "team/:id", element: <VendorAuthRoute><VendorTeam /></VendorAuthRoute> },
                    { path: "join-team/:token", element: <VendorJoinTeam /> }
                ]
            },
            { path: "admin", element: <AdminHome /> },
            {
                path: "admin",
                children: [
                    { path: "profile/:id",element:<AdminRoute><AdminProfile /></AdminRoute>},
                    { path: "markets", element: <AdminAuthRoute><AdminMarkets /></AdminAuthRoute>},
                    { path: "vendors", element: <AdminAuthRoute><AdminVendors /></AdminAuthRoute>},
                    { path: "users", element: <AdminAuthRoute><AdminUsers /></AdminAuthRoute>},
                    { path: "help", element: <AdminAuthRoute><AdminHelp /></AdminAuthRoute>},
                    { path: "blog", element: <AdminAuthRoute><AdminBlog /></AdminAuthRoute>},
                    { path: "report", element: <AdminAuthRoute><AdminReport /></AdminAuthRoute>},
                    { path: "email-bulk", element: <AdminAuthRoute><AdminEmailBulk /></AdminAuthRoute>},
                    { path: "email", element: <AdminAuthRoute><AdminEmail /></AdminAuthRoute>},
                    { path: "stats", element: <AdminAuthRoute><AdminStats /></AdminAuthRoute>},
                    { path: "faqs", element: <AdminAuthRoute><AdminFAQs /></AdminAuthRoute>},
                    { path: "logout", element: <AdminLogout /> },
                    { path: "password-reset-request", element: <PasswordResetRequest user={'admin'} /> },
                    { path: "password-reset/:token", element: <PasswordReset user={'admin'} path={'/admin'} /> },
                    { path: "confirm-email/:token", element: <AdminEmailVerification user={'admin'} path={'/admin'} /> },
                ],
            },
        ],
    },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<RouterProvider router={router} />);