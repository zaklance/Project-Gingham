import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const UserEmailVerification = () => {
	const { token: confirmationToken } = useParams();
	const [isLoading, setIsLoading] = useState(false);
	const [isConfirmed, setIsConfirmed] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");

	const navigate = useNavigate();

	useEffect(() => {
		// Check if the token exists
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
				`http://127.0.0.1:5555/api/user/confirm-email/${confirmationToken}`,
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
				navigate('/');
				window.location.reload();
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
			<h1 className="title-med text-center">Welcome to Gingham!</h1>
			{!isConfirmed ? (
				<div className="box-bounding text-center">
					<p className="text-500 margin-b-8">
						Thank you for signing up. Please confirm your email to complete your
						registration.
					</p>
					{errorMessage && <p className="text-error-small text-red width-fit margin-auto">{errorMessage}</p>}
					<button
						className="btn btn-add"
						onClick={handleConfirmation}
						disabled={isLoading || !confirmationToken}
					>
						{isLoading ? "Confirming..." : "Confirm Email"}
					</button>
				</div>
			) : (
				<p>Your email has been successfully confirmed! You can now log in.</p>
			)}
		</div>
	);
};

export default UserEmailVerification;