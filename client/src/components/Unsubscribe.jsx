import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

function Unsubscribe() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState("Loading...");
    const [field, setField] = useState("Loading...");

    const formatFieldName = (field) => {
      return `"${field.replace(/_/g, ' ')}"`;
    };

    const handleUnsubscribe = () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("Invalid unsubscribe link.");
        return;
      }

      fetch(`/api/unsubscribe`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })
        .then((res) => res.json())
        .then((data) => {
          setStatus("success");
          setField(formatFieldName(data.message))
        })
        .catch(() => setStatus("Something went wrong. Please try again later."));
    };


    return (
     <>
        <div className="box-bounding box-unsubscribe">
            <h1 className="title-med text-center">
                Welcome back to <span className="font-cera title-small">Gingham</span>!
            </h1>
            {status != "success" && (
                <div className="text-center">
                    <button
                        className="btn btn-confirm text-center"
                        onClick={handleUnsubscribe}
                        // disabled={isLoading || !confirmationToken}
                    >
                        Unsubscribe
                    </button>
                </div>
            )}
            {status == "success" && (
                <>
                    <p className="text-500 margin-b-8">You have been successfully unsubscribed from {field}. We hate to see you go, but honestly we can't be mad. Every email in your inbox adds at least 0.3 grams of C02 emissions, so props on reducing your footprint. Go get 'em tiger!</p>
                    <br/>
                    <p className="title-big text-center margin-b-16">¯\_(ツ)_/¯</p>
                </>
            )}
        </div>
     </>
    );
}

export default Unsubscribe;