import React from 'react';
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

// admin routes
import AdminHome from './components/AdminHome.jsx';
import AdminLogout from './components/AdminLogout.jsx';
import AdminProfile from './components/AdminProfile.jsx';
import AdminMarkets from './components/AdminMarkets.jsx';
import AdminVendors from './components/AdminVendors.jsx';
import AdminRecipes from './components/AdminRecipes.jsx';
import AdminUsers from './components/AdminUsers.jsx';
import AdminHelp from './components/AdminHelp.jsx';
import AdminEmailBulk from './components/AdminEmailBulk.jsx';
import AdminEmail from './components/AdminEmail.jsx';
import AdminBlog from './components/AdminBlog.jsx';
import AdminReport from './components/AdminReport.jsx';
import AdminStats from './components/AdminStats.jsx';
import AdminFAQs from './components/AdminFAQs.jsx';

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
        return <Navigate to="/" />;
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
        return <Navigate to="/" />;
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
            { path: "", element: <AdminHome /> },
            { path: "about", element: <About /> },
            { path: "contact", element: <Contact /> },
            { path: "terms-conditions", element: <TermsAndConditions /> },
            { path: "privacy-policy", element: <PrivacyPolicy /> },
            { path: "unsubscribe", element: <Unsubscribe /> },
            { path: "maintenance", element: <Maintenance /> },
            { path: "profile/:id", element:<AdminRoute><AdminProfile /></AdminRoute> },
            { path: "markets", element: <AdminAuthRoute><AdminMarkets /></AdminAuthRoute> },
            { path: "vendors", element: <AdminAuthRoute><AdminVendors /></AdminAuthRoute> },
            { path: "recipes", element: <AdminAuthRoute><AdminRecipes /></AdminAuthRoute> },
            { path: "users", element: <AdminAuthRoute><AdminUsers /></AdminAuthRoute> },
            { path: "blog", element: <AdminAuthRoute><AdminBlog /></AdminAuthRoute> },
            { path: "report", element: <AdminAuthRoute><AdminReport /></AdminAuthRoute> },
            { path: "email-bulk", element: <AdminAuthRoute><AdminEmailBulk /></AdminAuthRoute> },
            { path: "email", element: <AdminAuthRoute><AdminEmail /></AdminAuthRoute> },
            { path: "stats", element: <AdminAuthRoute><AdminStats /></AdminAuthRoute> },
            { path: "faqs", element: <AdminAuthRoute><AdminFAQs /></AdminAuthRoute> },
            { path: "logout", element: <AdminLogout /> },
            { path: "password-reset-request", element: <PasswordResetRequest user={'admin'} /> },
            { path: "password-reset/:token", element: <PasswordReset user={'admin'} /> },
            { path: "confirm-email/:token", element: <EmailVerification user={'admin'} /> },
            { path: "about", element: <About /> },
            { path: "help", element: <AdminAuthRoute><AdminHelp /></AdminAuthRoute> },
            { path: "terms-conditions", element: <TermsAndConditions /> },
            { path: "privacy-policy", element: <PrivacyPolicy /> },
        ],
    },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<RouterProvider router={router} />);