import { useLocation } from 'react-router-dom';
import { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "./CheckoutForm";
import { loadStripe } from "@stripe/stripe-js";

function Payment() {
    const location = useLocation();
    const { clientSecret, totalPrice, cartItems } = location.state || {};
    const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_JS_KEY)


    return (
        <>
            {clientSecret && stripePromise ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm totalPrice={totalPrice} cartItems={cartItems}/>
                </Elements>
            ) : (
                <p>Loading payment information...</p>
            )}
        </>
    );
}

export default Payment;