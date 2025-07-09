import React from 'react';
import { Link } from 'react-router-dom';

function PaymentSuccess() {
    return (
        <>
            <title>gingham • Payment Successful</title>
            <div className="text-center box-bounding">
                <h1 className="title-big text-green">Payment Successful!</h1>
                <p className="margin-t-12">Thank you for your purchase. Your order has been confirmed.</p>
                <div className="margin-t-24">
                    <Link to="/markets" className="btn btn-checkout margin-r-12">
                        Continue Shopping
                    </Link>
                    <Link to={`/profile/${localStorage.getItem('user_id')}`} className="btn btn-cart">
                        View Profile
                    </Link>
                </div>
            </div>
        </>
    );
}

export default PaymentSuccess; 