// src/index.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './assets/css/index.css';
import App from './App.jsx';
import Cart from './components/Cart.jsx';
import Checkout from './components/Checkout.jsx';
import CheckSession from './components/CheckSession.jsx';
import ErrorPage from './components/ErrorPage.jsx';
import Home from './components/Home.jsx';
import Login from './components/Login.jsx';
import Markets from './components/Markets.jsx';
import MarketDetail from './components/MarketDetail.jsx';
import NavBar from './components/NavBar.jsx';
import Profile from './components/Profile.jsx';
import Vendors from './components/Vendors.jsx';
import VendorDetail from './components/VendorDetail.jsx';
import Logout from './components/Logout.jsx';

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
                path: "login",
                element: <Login />
            }, 
            {
                path: "profile",
                element: <Login />
            }, 
            {
                path: "logout",
                element: <Logout />
            }, 
            {
                path: "markets",
                element: <Markets />
            },
            {
                path: "markets/:id",
                element: <MarketDetail />
            },
            {
                path: "vendors",
                element: <Vendors />
            },
            {
                path: "vendors/:id",
                element: <VendorDetail />
            },
            {
                path: "profile/:id", 
                element: <Profile />
            },
            {
                path: "cart", 
                element: <Cart />
            },
            {
                path: "checkout",
                element: <Checkout />
            }, 
            {
                path: "check_session",
                element: <CheckSession />
            }
        ]
    }
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render( <RouterProvider router={router} /> )