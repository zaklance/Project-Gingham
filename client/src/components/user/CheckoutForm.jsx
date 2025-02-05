import { useState } from "react";
import { Link } from 'react-router-dom';
import { PaymentElement } from "@stripe/react-stripe-js";
import { useStripe, useElements } from "@stripe/react-stripe-js";
import { toast } from 'react-toastify';
import { timeConverter } from "../../utils/helpers";

export default function CheckoutForm({ totalPrice, cartItems, setCartItems, amountInCart, setAmountInCart }) {

    const stripe = useStripe();
    const elements = useElements();

    const [message, setMessage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        if (!stripe || !elements) return;
    
        setIsProcessing(true);
    
        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.href, 
            },
            redirect: "if_required",
        });
    
        if (error?.type === "card_error" || error?.type === "validation_error") {
            setMessage(error.message);
            setIsProcessing(false);
        } else if (paymentIntent?.status === "succeeded") {
            console.log("✅ Payment successful! Clearing cart...");
            
            localStorage.setItem("cartItems", JSON.stringify([]));
            localStorage.setItem("amountInCart", JSON.stringify(0));
            setCartItems([]);
            setAmountInCart(0);
    
            toast.success('Payment successful!', {
                autoClose: 4000,
            });
            // setMessage("Payment successful!");
            setPaymentSuccess(true);
        } else {
            // setMessage("An unexpected error occurred.");
            toast.error('An unexpected error occurred.', {
                autoClose: 4000,
            });
            setIsProcessing(false);
        }
    };

    return (
        <>
            <div className="flex-space-between flex-bottom-align">
                <h1 className="title-med">Payments</h1>
                <button className="btn btn-cart"><Link to="/user/your-cart">Back</Link></button>
            </div>
            <form id="payment-form" className="flex-space-between box-bounding" onSubmit={handleSubmit}>
                <div className="width-fit">
                    <ul>
                        {cartItems.map((item, index) => (
                            <li key={index} className="li-cart">
                                <table>
                                    <tbody>
                                        <tr>
                                            <td className="cell-title-cart">Market:</td>
                                            <td className="cell-text-cart">{item.location}</td>
                                        </tr>
                                        <tr>
                                            <td className="cell-title-cart">Vendor:</td>
                                            <td className="cell-text-cart">{item.vendor_name}</td>
                                        </tr>
                                        <tr>
                                            <td className="cell-title-cart nowrap">Pick-Up:</td>
                                            <td className="cell-text-cart">{timeConverter(item.pickup_start)} – {timeConverter(item.pickup_end)}</td>
                                        </tr>
                                        <tr>
                                            <td className="cell-title-cart">Price:</td>
                                            <td className="cell-text-cart">${item.price.toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </li>
                        ))}
                    </ul>
                    <h1>Total Price: ${totalPrice.toFixed(2)}</h1>
                </div>
                <div className="width-50">
                    <PaymentElement id="payment-element" options={{ layout: 'accordion' }} />
                    {!paymentSuccess ? (
                        <button className="btn btn-add" disabled={isProcessing || !stripe || !elements} id="submit">
                            <span id="button-text">
                                {isProcessing ? "Processing ..." : "Pay now"}
                            </span>
                        </button>
                    ) : (
                        <button className="btn btn-add" onClick={() => window.open('/user/receipt', '_blank')}>
                            View Receipt
                        </button>
                    )}
                </div>
            </form>
        </>
    );
}