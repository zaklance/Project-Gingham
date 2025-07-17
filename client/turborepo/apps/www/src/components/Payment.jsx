import React from "react";
import { useLocation, useOutletContext } from 'react-router-dom';
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "./CheckoutForm";
import { loadStripe } from "@stripe/stripe-js";

function Payment() {
    const location = useLocation();
    const { clientSecret, totalPrice, cartItems, amountInCart } = location.state || {};
    const { setCartItems, setAmountInCart } = useOutletContext();
    const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_JS_KEY)
    const appearance = {
        theme: 'flat',
        variables: {
            colorPrimary: '#007BFF',
            colorBackground: '#eee',
            colorText: '#3b4752',
            colorDanger: '#ff4b5a',
            fontFamily: 'Lexend Deca, sans-serif',
            spacingUnit: '2px',
            borderRadius: '8px',
        }
    }

    return (
        <>
            <title>gingham • Payment</title>
            {clientSecret && stripePromise ? (
                <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
                    <CheckoutForm 
                        totalPrice={totalPrice} 
                        cartItems={cartItems} 
                        amountInCart={amountInCart} 
                        setCartItems={setCartItems} 
                        setAmountInCart={setAmountInCart} 
                    />
                </Elements>
            ) : (
                <p>Loading payment information...</p>
            )}
        </>
    );
}

export default Payment;