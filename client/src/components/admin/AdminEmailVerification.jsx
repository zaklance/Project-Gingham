import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const AdminEmailVerification = () => {
    const { token: confirmationToken } = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        if (!confirmationToken) {
            setErrorMessage("No confirmation token provided.");
        }
    }, [confirmationToken]);

    const handleConfirmation = async () => {
        if (!confirmationToken) {
            setErrorMessage("Confirmation token is missing.");
            return;
        }
    
        setIsLoading(true);
        setErrorMessage("");
    
        try {
            const response = await fetch(
                `/api/admin/confirm-email/${confirmationToken}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
    
            const result = await response.json();
    
            if (response.ok) {
                setIsConfirmed(true);
            } else {
                setErrorMessage(result.error || "Failed to confirm email.");
            }
        } catch (error) {
            setErrorMessage("An unexpected error occurred. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="email-verification-container">
            <title>gingham • Admin Email Verification</title>
            {!isConfirmed ? (
                <div className="box-bounding text-center">
                    <h1 className="font-cera-large title-med text-center margin-b-16">
                        gingham
                    </h1>
                    <p className="text-500 margin-b-8">Please confirm your email!</p>
                    {errorMessage && <p className="text-error-small text-red width-fit margin-auto">{errorMessage}</p>}
                    <button
                        className="btn btn-confirm"
                        onClick={handleConfirmation}
                        disabled={isLoading || !confirmationToken}
                    >
                        {isLoading ? "Confirming..." : "Confirm Email"}
                    </button>
                </div>
            ) : (
                <div className="box-bounding text-center">
                    <h1 className="title-med text-center">Welcome back!</h1>
                    <p className="text-500 margin-b-8">Your email has been successfully confirmed. You can now log in.</p>
                    <button className="btn btn-confirm" onClick={() => navigate("/admin/logout")}>
                        Go Back
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminEmailVerification;