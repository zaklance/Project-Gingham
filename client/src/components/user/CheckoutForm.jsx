import { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { PaymentElement } from "@stripe/react-stripe-js";
import { useStripe, useElements } from "@stripe/react-stripe-js";
import { toast } from 'react-toastify';
import { timeConverter, formatBasketDate } from "../../utils/helpers";
import objectHash from 'object-hash';
import PDFReceipt from "./PDFReceipt";
import { useNavigate } from 'react-router-dom';


function CheckoutForm({ totalPrice, cartItems, setCartItems, amountInCart, setAmountInCart }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [receiptId, setReceiptId] = useState(null);
    const [error, setError] = useState(null);
    const [savedCartItems, setSavedCartItems] = useState([]);
    const navigate = useNavigate();

    const stripe = useStripe();
    const elements = useElements();

    const userId = parseInt(globalThis.localStorage.getItem('user_id'));
    const token = localStorage.getItem('user_jwt-token');

    const generateICSFile = (cartItems) => {
        // console.log("Generating ICS file for cart items:", cartItems);
    
        let icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Gingham//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n`;
    
        cartItems.forEach(item => {
            if (!item.vendor_name || !item.pickup_start || !item.pickup_end || !item.location) {
                console.warn(`Skipping event for basket ${item.id} due to missing data.`, item);
                return;
            }
        
            const [year, month, day] = item.sale_date.split("-").map(Number);
            const saleDate = new Date(year, month - 1, day);
        
            const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
            const parseTime = (timeString) => {
                const [hours, minutes] = timeString.split(":").map(Number);
                const date = new Date(saleDate);
                date.setHours(hours, minutes, 0, 0);
                return date;
            };
    
            const localStartDate = parseTime(item.pickup_start);
            const localEndDate = parseTime(item.pickup_end);
        
            if (isNaN(localStartDate) || isNaN(localEndDate)) {
                console.warn(`Skipping event for basket ${item.id} due to invalid date.`);
                return;
            }
    
            const formatICSDate = (date) => {
                return `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}T${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}00`;
            };
    
            const startDate = formatICSDate(localStartDate);
            const endDate = formatICSDate(localEndDate);    
    
            // Generate Apple Maps link if coordinates exist
            const appleMapsLink = `Open in Apple Maps:\\nhttps://maps.apple.com/?q=${item.coordinates.lat}+${item.coordinates.lng}`;
            const googleMapsLink = `Open in Google Maps:\\nhttps://maps.google.com/?q=${item.coordinates.lat}+${item.coordinates.lng}`;
    
            icsContent += `BEGIN:VEVENT\n`;
            icsContent += `UID:${item.id}@gingham-nyc\n`;
            icsContent += `SUMMARY:Pick up your order from ${item.vendor_name}\n`;
            icsContent += `DESCRIPTION:Pick up your order from ${item.vendor_name} at ${item.market_name} at ${item.location} \\n\\n${appleMapsLink}\\n\\n${googleMapsLink}\n`;
            icsContent += `LOCATION:${item.market_name}\n`;
            icsContent += `DTSTART;TZID=${userTimeZone}:${startDate}\n`;
            icsContent += `DTEND;TZID=${userTimeZone}:${endDate}\n`;
            icsContent += `STATUS:CONFIRMED\n`;
            icsContent += `END:VEVENT\n`;
        });
    
        icsContent += `END:VCALENDAR`;
    
        // console.log("ICS content successfully generated:\n", icsContent);
    
        try {
            const blob = new Blob([icsContent], { type: 'text/calendar' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'gingham_pickup_schedule.ics';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
    
            console.log("ICS file download triggered successfully.");
        } catch (error) {
            console.error("Error generating ICS file:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/payment-success`,
                },
                redirect: 'if_required',
            });

            if (stripeError) {
                console.error('Payment failed:', stripeError);
                setError(stripeError.message);
                setIsProcessing(false);
                return;
            }

            // If we get here, the payment was successful
            if (paymentIntent && paymentIntent.status === 'succeeded') {
                // Create receipt in backend
                const receiptResponse = await fetch('/api/receipts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user_id: userId,
                        baskets: cartItems,
                        payment_intent_id: paymentIntent.id
                    }),
                });

                const receiptResult = await receiptResponse.json();

                if (!receiptResponse.ok) {
                    console.error('Receipt creation failed:', receiptResult);
                    setError(receiptResult.error || 'Failed to create receipt');
                    setIsProcessing(false);
                    return;
                }

                // Set receipt ID for PDF component
                setReceiptId(receiptResult.id);

                // Save cart items before clearing them
                setSavedCartItems(cartItems);

                // Process transfers
                const response = await fetch('/api/process-transfers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        payment_intent_id: paymentIntent.id,
                        baskets: cartItems.map(item => ({
                            id: item.id,
                            price: item.price,
                            vendor_id: item.vendor_id,
                            fee_vendor: item.fee_vendor,
                            basket_id: item.id
                        })),
                    }),
                });

                const result = await response.json();

                if (!response.ok) {
                    console.error('Transfer processing failed:', result);
                    setError(result.error?.message || 'Failed to process transfers');
                    setIsProcessing(false);
                    return;
                }

                if (result.error) {
                    console.error('Transfer error:', result.error);
                    setError(result.error.message);
                    setIsProcessing(false);
                    return;
                }

                // Clear cart on success
                await fetch('/api/cart/clear', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        basket_ids: cartItems.map(item => item.id),
                        user_id: userId
                    }),
                });

                // Clear local cart state
                setCartItems([]);
                setAmountInCart(0);

                // Set payment success state to show receipt and calendar buttons
                setPaymentSuccess(true);
                setIsProcessing(false);
            } else {
                setError('Payment was not successful. Please try again.');
                setIsProcessing(false);
            }
        } catch (err) {
            console.error('Checkout error:', err);
            setError('An unexpected error occurred. Please try again.');
            setIsProcessing(false);
        }
    };

    return (
        <>
            <title>gingham • Checkout</title>
            <div className="flex-space-between flex-bottom-align">
                <h1 className="title-med">Payments</h1>
                <button className="btn btn-cart"><Link to="/user/cart">Back</Link></button>
            </div>
            <form id="payment-form" className="flex-space-between box-bounding m-flex-wrap" onSubmit={handleSubmit}>
                <div className="width-fit">
                    <ul>
                        {cartItems.map((item, index) => (
                            <li key={index} className="li-cart">
                                <table>
                                    <tbody>
                                        <tr>
                                            <td className="cell-title-cart">Market:</td>
                                            <td className="cell-text-cart">{item.market_name}</td>
                                        </tr>
                                        <tr>
                                            <td className="cell-title-cart">Location:</td>
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
                <div className="d-width-50">
                    {!paymentSuccess && (
                        <PaymentElement id="payment-element" options={{ layout: 'accordion' }} />
                    )}
                    {!paymentSuccess ? (
                        <button className="btn btn-checkout" disabled={isProcessing || !stripe || !elements} id="submit">
                            <span id="button-text">
                                {isProcessing ? "Processing ..." : "Pay now"}
                            </span>
                        </button>
                    ) : (
                        <div className="text-center">
                            <h2 className="text-green margin-b-16">Payment Successful!</h2>
                            <p className="margin-b-24">Thank you for your purchase. Your order has been confirmed.</p>
                            <div className="margin-t-16 flex-start flex-gap-16">
                                <PDFReceipt receiptId={receiptId} isPaymentCompleted={paymentSuccess} page={"checkout"} />
                                <button 
                                    type="button"
                                    className="btn btn-checkout" 
                                    onClick={() => generateICSFile(savedCartItems)}
                                >
                                    Add to Calendar
                                </button>
                            </div>
                            <div className="margin-t-16">
                                <Link to="/user/markets" className="btn btn-cart margin-r-12">
                                    Continue Shopping
                                </Link>
                                <Link to={`/user/profile/${userId}`} className="btn btn-cart">
                                    View Profile
                                </Link>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="margin-t-16">
                            <p style={{ color: "#ff4b5a" }}>{error}</p>
                        </div>
                    )}
                </div>
            </form>
        </>
    );
}

export default CheckoutForm;
