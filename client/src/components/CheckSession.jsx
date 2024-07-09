// src/components/CheckSession.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CheckSession() {
    const [sessionData, setSessionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://127.0.0.1:5555/check_session', {
            method: 'GET',
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                setError(data.error);
                navigate('/login');
            } else {
                setSessionData(data);
            }
            setLoading(false);
        })
        .catch(error => {
            setError('Failed to check session');
            setLoading(false);
            navigate('/login');
        });
    }, [navigate]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h1>Session Data</h1>
            <pre>{JSON.stringify(sessionData, null, 2)}</pre>
        </div>
    );
}

export default CheckSession;