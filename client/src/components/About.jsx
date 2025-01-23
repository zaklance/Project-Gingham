import React from 'react';

function About() {
    return(
        <div>
            <br/>
            <h2>Return and Exchange Policy</h2>
            <div className="box-bounding">
                <p>At Gingham, all sales are final, and we do not accept returns, refunds, or exchanges for any purchases.</p>
                <br/>
                <p><strong>Exceptions:</strong> Refunds or adjustments may be made only if the Vendor or Farmers Market changes 
                operating hours or cancels due to unforeseen circumstances such as inclement weather.</p>
                <br/>
                <p>If you believe your situation qualifies for an exception, <strong>please contact our support team at 
                <a href={`mailto:sales@gingham.nyc`} target="_blank" rel="noopener noreferrer"> sales@gingham.nyc</a>.</strong></p>
                <br/>
                <p>Thank you for your understanding and support of local farmers and vendors.</p>
            </div>
        </div>
    )

}

export default About;

