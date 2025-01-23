import { PaymentElement } from "@stripe/react-stripe-js";
import { useState } from "react";
import { useStripe, useElements } from "@stripe/react-stripe-js";

export default function CheckoutForm({ totalPrice, cartItems }) {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!stripe || !elements) {
      return;
    }
  
    setIsProcessing(true);
  
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/user/completion`,
      },
    });
  
    if (error?.type === "card_error" || error?.type === "validation_error") {
      setMessage(error.message);
      setIsProcessing(false);
    } else if (paymentIntent?.status === "succeeded") {
      setCartItems([]);
      setAmountInCart(0);
      setMessage("Payment successful!");
      setIsProcessing(false);
  
    } else {
      setMessage("An unexpected error occurred.");
      setIsProcessing(false);
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <h1>Cart Summary</h1>
      <ul>
        {cartItems.map((item, index) => (
          <li key={index} style={{ marginBottom: "10px" }}>
            <strong>Vendor:</strong> {item.vendor_name} <br />
            <strong>Price:</strong> ${item.price.toFixed(2)}
          </li>
        ))}
      </ul>
      <h2>Total Price: ${totalPrice.toFixed(2)}</h2>
      <PaymentElement id="payment-element" />
      <button disabled={isProcessing || !stripe || !elements} id="submit">
        <span id="button-text">
          {isProcessing ? "Processing ... " : "Pay now"}
        </span>
      </button>
      {message && <div id="payment-message">{message}</div>}
    </form>
  );
}