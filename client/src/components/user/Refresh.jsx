import React, { useState } from "react";
import { useParams} from 'react-router-dom';

export default function Refresh() {
  const {connectedAccountId} = useParams();
  const [accountLinkCreatePending, setAccountLinkCreatePending] = useState(false);
  const [error, setError] = useState(false);

  React.useEffect(() => {
    if (connectedAccountId) {
      setAccountLinkCreatePending(true);
        fetch("/account_link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account: connectedAccountId,
        }),
      })
        .then((response) => response.json())
        .then((json) => {
          setAccountLinkCreatePending(false);

          const { url, error } = json;

          if (url) {
            window.location.href = url;
          }

          if (error) {
            setError(true);
          }
        });
    }
  }, [connectedAccountId])

  return (
    <div className="container">
      <div className="banner">
        <h2>Gingham</h2>
      </div>
      <div className="content">
        <h2>Add information to start accepting money</h2>
        <p>Gingham is the world's leading air travel platform: join our team of pilots to help people travel faster.</p>
        {error && <p className="error">Something went wrong!</p>}
      </div>
      <div className="dev-callout">
        {connectedAccountId && <p>Your connected account ID is: <code className="bold">{connectedAccountId}</code></p>}
        {accountLinkCreatePending && <p>Creating a new Account Link...</p>}
      </div>
    </div>
  );
}