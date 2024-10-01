import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './assets/css/index.css';
import App from './App.jsx';
import Cart from './components/user/Cart.jsx';
import Checkout from './components/user/Checkout.jsx';
import CheckSession from './components/user/CheckSession.jsx';
import ErrorPage from './components/user/ErrorPage.jsx';
import Home from './components/user/Home.jsx';
import Login from './components/user/LoginPopup.jsx';
import Markets from './components/user/Markets.jsx';
import MarketDetail from './components/user/MarketDetail.jsx';
import Profile from './components/user/Profile.jsx';
import Vendors from './components/user/Vendors.jsx';
import VendorDetail from './components/user/VendorDetail.jsx';
import Logout from './components/user/Logout.jsx';

const router = createBrowserRouter([
    {
        path: "/", 
        element: <App />,
        errorElement: <ErrorPage />,
        children: [
            {
                path: "/",
                element: <Home />
            },
            {
                path: "user/login",
                element: <Login />
            }, 
            {
                path: "user/profile/:id", 
                element: <Profile />
            },
            {
                path: "user/logout",
                element: <Logout />
            }, 
            {
                path: "user/markets",
                element: <Markets />
            },
            {
                path: "user/markets/:id",
                element: <MarketDetail />
            },
            {
                path: "user/vendors",
                element: <Vendors />
            },
            {
                path: "user/vendors/:id",
                element: <VendorDetail />
            },
            {
                path: "user/cart", 
                element: <Cart />
            },
            {
                path: "user/checkout",
                element: <Checkout />
            }, 
            {
                path: "user/check_session",
                element: <CheckSession />
            }
        ]
    }
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<RouterProvider router={router} />);