import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const AdminEmailVerification = () => {
    const { token: confirmationToken } = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [isNewUser, setIsNewUser] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [userId, setUserId] = useState(null);
    const [newEmail, setNewEmail] = useState(null);

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
                setIsNewUser(result.isNewUser);
    
                if (!result.isNewUser && result.user_id) {
                    console.log(`Existing user detected: ID ${result.user_id}, Email: ${result.email}`);
    
                    // Run PATCH request only if user ID exists
                    await updateUserEmail(result.user_id, result.email);
                }
            } else {
                setErrorMessage(result.error || "Failed to confirm email.");
            }
        } catch (error) {
            setErrorMessage("An unexpected error occurred. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    const updateUserEmail = async (userId, newEmail) => {
        if (!userId || !newEmail) {
            console.error("Missing user ID or new email. Skipping email update.");
            return;
        }
    
        try {
            const token = localStorage.getItem("admin_jwt-token"); // Ensure authentication
            const response = await fetch(`/api/admin-users/${userId}`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: newEmail }),
            });
    
            if (response.ok) {
                console.log("Email updated successfully.");
            } else {
                console.error("Failed to update email.");
                console.log("Response status:", response.status);
                console.log("Response text:", await response.text());
            }
        } catch (error) {
            console.error("Error updating email:", error);
        }
    };

    return (
        <div className="email-verification-container">
            {!isConfirmed ? (
                <div className="box-bounding text-center">
                    <h1 className="title-med text-center">
                        <span className="font-gingham-large title-small">Gin<span className="kern-8">g</span><span className="kern-2">h</span>am</span>
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
            ) : isNewUser ? (
                <div className="box-bounding text-center">
                    <h1 className="title-med text-center">
                        Welcome to <span className="font-gingham title-small">Gin<span className="kern-8">g</span><span className="kern-2">h</span>am</span>!
                    </h1>
                    <p className="text-500 margin-b-8">Thank you for registering! Your email has been successfully confirmed. Welcome to the platform!</p>
                    <button className="btn btn-confirm" onClick={() => navigate("/user/logout")}>
                        Go Back
                    </button>
                </div>
            ) : (
                <div className="box-bounding text-center">
                    <h1 className="title-med text-center">Welcome back!</h1>
                    <p className="text-500 margin-b-8">Your email has been successfully confirmed. You can now log in.</p>
                    <button className="btn btn-confirm" onClick={() => navigate("/user/logout")}>
                        Go Back
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminEmailVerification;