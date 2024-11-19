// src/components/CheckSession.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CheckSession() {
    const [sessionData, setSessionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://127.0.0.1:5555/check_user_session', {
            method: 'GET',
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Session expired or unauthorized');
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                setError(data.error);
                navigate('/');
            } else {
                setSessionData(data);
            }
        })
        .catch(error => {
            console.error('Session check failed:', error);
            setError('Session expired or unauthorized');
            navigate('/');
        })
        .finally(() => {
            setLoading(false);
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