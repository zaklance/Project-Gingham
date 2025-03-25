import React from "react";
import { useParams} from 'react-router-dom';

export default function Return() {
  const {connectedAccountId} = useParams();

  return (
    <div className="container">
      <div className="content">
        <h2>Details submitted</h2>
        <p>That's everything we need for now</p>
      </div>
      <div className="info-callout">
        <p>
        This is a sample app for Stripe-hosted Connect onboarding. <a href="https://docs.stripe.com/connect/onboarding/quickstart?connect-onboarding-surface=hosted" target="_blank" rel="noopener noreferrer">View docs</a>
        </p>
      </div>
    </div>
  );
}