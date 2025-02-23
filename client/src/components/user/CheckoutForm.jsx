import { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { PaymentElement } from "@stripe/react-stripe-js";
import { useStripe, useElements } from "@stripe/react-stripe-js";
import { toast } from 'react-toastify';
import { timeConverter, formatBasketDate } from "../../utils/helpers";
import objectHash from 'object-hash';
import ReceiptPDF from "./ReceiptPDF";


function CheckoutForm({ totalPrice, cartItems, setCartItems, amountInCart, setAmountInCart }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [receiptId, setReceiptId] = useState(null);

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
        
            // Fix: Parse sale_date as a local date, not UTC
            const [year, month, day] = item.sale_date.split("-").map(Number);
            const saleDate = new Date(year, month - 1, day);
        
            const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            console.log(`User Time Zone:`, userTimeZone);
    
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
            icsContent += `UID:${item.id}@gingham.com\n`;
            icsContent += `SUMMARY:Pick up your order from ${item.vendor_name}\n`;
            icsContent += `DESCRIPTION:Pick up your order from ${item.vendor_name} at ${item.market_name} at ${item.location} \\n\\n${appleMapsLink}\\n\\n${googleMapsLink}\n`;
            icsContent += `LOCATION:https://maps.apple.com/?q=${item.coordinates.lat}+${item.coordinates.lng}\n`;
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
    
        if (!stripe || !elements) return;
    
        setIsProcessing(true);
        
        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: window.location.href, },
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
                        payment_intent_id: paymentIntent.id,
                        baskets: cartItems.map(item => ({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            quantity: item.quantity,
                            market_id: item.market_id,
                            market_day_id: item.market_day_id,
                            market_location: item.location,
                            vendor_id: item.vendor_id,
                            vendor_name: item.vendor_name,
                            pickup_start: item.pickup_start,
                            pickup_end: item.pickup_end,
                            sale_date: item.sale_date,
                            fee_user: item.fee_user
                        }))
                    }),
                });
    
                if (!receiptResponse.ok) {
                    setIsProcessing(false)
                    setCartItems([]);
                    setAmountInCart(0);
                    toast.error(`Failed to create receipt: ${receiptResponse.statusText}`, { autoClose: 6000 });

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
                toast.success('Payment successful!', { autoClose: 5000 });
                setPaymentSuccess(true);
            } catch (error) {
                console.error("Error processing post-payment actions:", error);
            }
        } else {
            console.log(error)
            // toast.error(`An unexpected error occurred: ${error.message}`, { autoClose: 6000 });
            setIsProcessing(false);
        }
    };

    return (
        <>
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
                    <PaymentElement id="payment-element" options={{ layout: 'accordion' }} />
                    {!paymentSuccess ? (
                        <button className="btn btn-checkout" disabled={isProcessing || !stripe || !elements} id="submit">
                            <span id="button-text">
                                {isProcessing ? "Processing ..." : "Pay now"}
                            </span>
                        </button>
                    ) : (
                        <div className="margin-t-16 flex-start flex-gap-16">
                            <ReceiptPDF receiptId={receiptId} isPaymentCompleted={paymentSuccess} page={"checkout"} />
                            <button 
                                type="button"
                                className="btn btn-checkout" 
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
