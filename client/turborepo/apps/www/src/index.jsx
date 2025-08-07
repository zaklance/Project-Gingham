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

// user routes
import Home from './components/Home.jsx';
import Cart from './components/Cart.jsx';
import Payment from './components/Payment.jsx';
import Completion from './components/Completion.jsx';
import CheckSession from './components/CheckSession.jsx';
import Login from './components/LoginPopup.jsx';
import SignUp from './components/SignUp.jsx';
import Markets from './components/Markets.jsx';
import MarketDetail from './components/MarketDetail.jsx';
import PickUp from './components/PickUp.jsx';
import Profile from './components/Profile.jsx';
import Vendors from './components/Vendors.jsx';
import VendorDetail from './components/VendorDetail.jsx';
import Recipes from './components/Recipes.jsx';
import RecipeDetail from './components/RecipeDetail.jsx';
import UserFAQs from './components/UserFAQs.jsx';
import Logout from './components/Logout.jsx';
import PaymentSuccess from './components/PaymentSuccess.jsx';


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
            { path: "/", element: <Home /> },
            { path: "about", element: <About /> },
            { path: "contact", element: <Contact /> },
            { path: "terms-conditions", element: <TermsAndConditions /> },
            { path: "privacy-policy", element: <PrivacyPolicy /> },
            { path: "unsubscribe", element: <Unsubscribe /> },
            { path: "maintenance", element: <Maintenance /> },
            { path: "payment-success", element: <PaymentSuccess /> },
            { path: "login", element: <Login /> },
            { path: "signup", element: <SignUp /> },
            { path: "profile/:id", element: <UserRoute><Profile /></UserRoute> },
            { path: "logout", element: <Logout /> },
            { path: "markets", element: <Markets /> },
            { path: "markets/:id", element: <MarketDetail /> },
            { path: "vendors", element: <Vendors /> },
            { path: "vendors/:id", element: <VendorDetail /> },
            { path: "recipes", element: <Recipes /> },
            { path: "recipes/:id", element: <RecipeDetail /> },
            { path: "cart", element: <Cart /> },
            { path: "pick-up", element: <UserAuthRoute><PickUp /></UserAuthRoute> },
            { path: "payment", element: <Payment /> },
            { path: "check-session", element: <CheckSession /> },
            { path: "completion", element: <Completion />},
            { path: "password-reset-request", element: <PasswordResetRequest user={'user'} /> },
            { path: "password-reset/:token", element: <PasswordReset user={'user'} /> },
            { path: "confirm-email/:token", element: <EmailVerification user={'user'} /> },
            { path: "help", element: <UserFAQs /> },
        ],
    },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<RouterProvider router={router} />);