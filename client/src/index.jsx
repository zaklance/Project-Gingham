import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './assets/css/index.css';

// main routes
import App from './App.jsx';
import Contact from './components/Contact.jsx'
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

// vendor routes
import VendorHome from './components/vendor/VendorHome.jsx';
import VendorLogin from './components/vendor/VendorLogin.jsx';
import VendorLogout from './components/vendor/VendorLogout.jsx';
import VendorDashboard from './components/vendor/VendorDashboard.jsx';
import VendorSales from './components/vendor/VendorSales.jsx';
import VendorProfile from './components/vendor/VendorProfile.jsx';

// admin routes
import AdminHome from './components/admin/AdminHome.jsx';
import AdminLogin from './components/admin/AdminLogin.jsx';
import AdminLogout from './components/admin/AdminLogout.jsx';
import AdminProfile from './components/admin/AdminProfile.jsx';
import AdminDashboard from './components/admin/AdminDashboard.jsx';

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
                    { path: "checkout", element: <Checkout /> },
                    { path: "check_session", element: <CheckSession /> }
                ]
            },
            {
                path: "vendor",
                children: [
                    { path: "home", element: <VendorHome /> },
                    { path: "login", element: <VendorLogin /> },
                    { path: "dashboard", element: <VendorDashboard /> },
                    { path: "sales", element: <VendorSales /> },
                    { path: "profile/:id", element: <VendorProfile /> },
                    { path: "logout", element: <VendorLogout /> }
                ]
            },
            {
                path: "admin",
                children: [
                    { path: "home", element: <AdminHome /> },
                    { path: "login", element: <AdminLogin /> },
                    { path: "dashboard", element: <AdminDashboard />},
                    { path: "profile/:id", element: <AdminProfile /> },
                    { path: "logout", element: <AdminLogout /> }
                ]
            }
        ]      
    }
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<RouterProvider router={router} />);