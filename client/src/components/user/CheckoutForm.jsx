import { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { PaymentElement } from "@stripe/react-stripe-js";
import { useStripe, useElements } from "@stripe/react-stripe-js";
import { toast } from 'react-toastify';
import { timeConverter } from "../../utils/helpers";
import objectHash from 'object-hash';
import ReceiptPDF from "./ReceiptPDF";

function CheckoutForm({ totalPrice, cartItems, setCartItems, amountInCart, setAmountInCart }) {
    const stripe = useStripe();
    const elements = useElements();

    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [receiptId, setReceiptId] = useState(null);

    const userId = parseInt(globalThis.localStorage.getItem('user_id'));
    const token = localStorage.getItem('user_jwt-token');

    const formatDate = (timeString) => {
        if (!timeString) {
            console.error("Invalid time:", timeString);
            return null;
        }
    
        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const currentDate = today.toISOString().split('T')[0]; // "YYYY-MM-DD"
    
        // Combine with provided time (HH:mm) to form full datetime
        const dateTimeString = `${currentDate}T${timeString}:00`; // Add seconds
    
        const dateObject = new Date(dateTimeString);
    
        if (isNaN(dateObject.getTime())) {
            console.error("Invalid date conversion:", timeString);
            return null;
        }
    
        return dateObject.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const generateICSFile = (cartItems) => {
        console.log("Generating ICS file for cart items:", cartItems);
        
        let icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Gingham//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n`;
    
        cartItems.forEach(item => {
            if (!item.vendor_name || !item.pickup_start || !item.pickup_end) {
                console.warn(`Skipping event for basket ${item.id} due to missing data.`, item);
                return;
            }
    
            const startDate = formatDate(item.pickup_start);
            const endDate = formatDate(item.pickup_end);
    
            if (!startDate || !endDate) {
                console.warn(`Skipping event for basket ${item.id} due to invalid date format.`);
                return;
            }
    
            icsContent += `BEGIN:VEVENT\n`;
            icsContent += `UID:${item.id}@gingham.com\n`;
            icsContent += `SUMMARY:Pick up your order from ${item.vendor_name}\n`;
            icsContent += `DESCRIPTION:Pick up your order from ${item.vendor_name} at ${item.location}\n`;
            icsContent += `LOCATION:${item.location}\n`;
            icsContent += `DTSTART:${startDate}\n`;
            icsContent += `DTEND:${endDate}\n`;
            icsContent += `STATUS:CONFIRMED\n`;
            icsContent += `END:VEVENT\n`;
        });
    
        icsContent += `END:VCALENDAR`;
    
        console.log("ICS content successfully generated:\n", icsContent);
    
        try {
            const blob = new Blob([icsContent], { type: 'text/calendar' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'pickup_schedule.ics';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
    
            console.log("ICS file download triggered successfully.");
        } catch (error) {
            console.error("Error generating ICS file:", error);
            toast.error('An unexpected error occurred while generating the calendar file.', { autoClose: 4000 });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        if (!stripe || !elements) return;
    
        setIsProcessing(true);
    
        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: window.location.href },
            redirect: "if_required",
        });
    
        if (error?.type === "card_error" || error?.type === "validation_error") {
            setIsProcessing(false);
        } else if (paymentIntent?.status === "succeeded") {
            console.log("Payment successful! Marking items as sold...");
    
            try {
                await Promise.all(cartItems.map(async (cartItem) => {
                    const response = await fetch(`/api/baskets/${cartItem.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ is_sold: true, user_id: userId }),
                    });
    
                    if (!response.ok) {
                        throw new Error(`Failed to update cartItem with id: ${cartItem.id}`);
                    }
                }));
    
                console.log("Items marked as sold!");
    
                // Generate QR codes
                if (cartItems.length > 0) {
                    console.log("Generating QR codes...");
    
                    const qrPromises = cartItems.map(async (cartItem) => {
                        const hash = objectHash(`${cartItem.vendor_name} ${cartItem.location} ${cartItem.id} ${userId}`);
                        const response = await fetch('/api/qr-codes', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                qr_code: hash,
                                user_id: userId,
                                basket_id: cartItem.id,
                                vendor_id: cartItem.vendor_id,
                            }),
                        });
    
                        if (!response.ok) {
                            throw new Error(`Failed to create QR code for basket ID ${cartItem.id}: ${response.statusText}`);
                        }
                        return response.json();
                    });
    
                    await Promise.all(qrPromises);
                    console.log("All QR codes created successfully!");
                }


                console.log("Creating receipt...");
                const receiptResponse = await fetch('/api/receipts', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user_id: userId,
                        baskets: cartItems.map(item => ({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            quantity: item.quantity,
                            market_id: item.market_id,
                            market_location: item.location,
                            vendor_id: item.vendor_id,
                            vendor_name: item.vendor_name,
                            pickup_start: item.pickup_start,
                            pickup_end: item.pickup_end,
                            sale_date: item.sale_date,
                        }))
                    }),
                });
    
                if (!receiptResponse.ok) {
                    throw new Error(`Failed to create receipt: ${receiptResponse.statusText}`);
                }
    
                const receiptData = await receiptResponse.json();
                console.log("Receipt created successfully!", receiptData);
                
                setReceiptId(receiptData.id);
    
                // Clear cart
                localStorage.setItem("cartItems", JSON.stringify([]));
                localStorage.setItem("amountInCart", JSON.stringify(0));
                setCartItems([]);
                setAmountInCart(0);
                toast.success('Payment successful!', { autoClose: 4000 });
                setPaymentSuccess(true);
            } catch (error) {
                console.error("Error processing post-payment actions:", error);
            }
        } else {
            toast.error('An unexpected error occurred.', { autoClose: 4000 });
            setIsProcessing(false);
        }
    };


    return (
        <>
            <div className="flex-space-between flex-bottom-align">
                <h1 className="title-med">Payments</h1>
                <button className="btn btn-cart"><Link to="/user/cart">Back</Link></button>
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
                        <div className="margin-t-16">
                            <ReceiptPDF receiptId={receiptId} page={"checkout"} />
                            <button 
                                className="btn btn-add margin-t-8" 
                                onClick={() => generateICSFile(cartItems)}
                            >
                                Add to Calendar
                            </button>
                        </div>
                    )}
                </div>
            </form>
        </>
    );
}

export default CheckoutForm;
