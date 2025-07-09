import React, { useCallback, useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate, useParams } from 'react-router-dom';
import '@repo/ui/index.css';

// main routes
import App from './App.jsx';
import About from '@repo/ui/About.jsx';
import Contact from '@repo/ui/Contact.jsx';
import TermsAndConditions from '@repo/ui/TermsAndConditions.jsx';
import PrivacyPolicy from '@repo/ui/PrivacyPolicy.jsx';
import EmailVerification from '@repo/ui/EmailVerification.jsx';
import PasswordResetRequest from '@repo/ui/PasswordResetRequest.jsx';
import PasswordReset from '@repo/ui/PasswordReset.jsx';
import Unsubscribe from '@repo/ui/Unsubscribe.jsx';
import Maintenance from '@repo/ui/Maintenance.jsx';
import ErrorPage from '@repo/ui/ErrorPage.jsx';

// vendor routes
import VendorHome from './components/VendorHome.jsx';
import VendorLogout from './components/VendorLogout.jsx';
import VendorCreate from './components/VendorCreate.jsx';
import VendorDashboard from './components/VendorDashboard.jsx';
import VendorSales from './components/VendorSales.jsx';
import VendorScan from './components/VendorScan.jsx';
import VendorProfile from './components/VendorProfile.jsx';
import VendorStripeReturn from './components/VendorStripeReturn.jsx';
import VendorStripeRefresh from './components/VendorStripeRefresh.jsx';
import VendorHelpCenter from './components/VendorHelpCenter.jsx';
import VendorLoginPopup from './components/VendorLoginPopup.jsx';
import VendorJoinTeam from './components/VendorJoinTeam.jsx';

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
            { path: "", element: <VendorHome /> },
            { path: "about", element: <About /> },
            { path: "contact", element: <Contact /> },
            { path: "terms-conditions", element: <TermsAndConditions /> },
            { path: "privacy-policy", element: <PrivacyPolicy /> },
            { path: "unsubscribe", element: <Unsubscribe /> },
            { path: "maintenance", element: <Maintenance /> },
            { path: "dashboard", element: <VendorAuthRoute><VendorDashboard /></VendorAuthRoute> },
            { path: "sales", element: <VendorAuthRoute><VendorSales /></VendorAuthRoute> },
            { path: "scan", element: <VendorAuthRoute><VendorScan /></VendorAuthRoute> },
            { path: "signup", element: <VendorLoginPopup /> },
            { path: "profile/:id", element: <VendorRoute><VendorProfile /></VendorRoute> },
            { path: "vendor-create", element: <VendorAuthRoute><VendorCreate /></VendorAuthRoute> },
            { path: "return/:accountId", element: <VendorStripeReturn /> },
            { path: "refresh/:accountId", element: <VendorStripeRefresh /> },
            { path: "logout", element: <VendorLogout /> },
            { path: "password-reset-request", element: <PasswordResetRequest user={'vendor'} /> },
            { path: "password-reset/:token", element: <PasswordReset user={'vendor'} /> },
            { path: "confirm-email/:token", element: <EmailVerification user={'vendor'} /> },
            { path: "join-team/:token", element: <VendorJoinTeam /> },
            { path: "about", element: <About /> },
            { path: "help", element: <VendorHelpCenter /> },
            { path: "contact", element: <Contact /> },
            { path: "terms-conditions", element: <TermsAndConditions /> },
            { path: "privacy-policy", element: <PrivacyPolicy /> },
        ],
    },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<RouterProvider router={router} />);