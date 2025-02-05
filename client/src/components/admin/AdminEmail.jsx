import React, { useEffect, useRef, useState } from 'react';
import PulseLoader from 'react-spinners/PulseLoader';

const AdminEmail = () => {
    const [previewHtml, setPreviewHtml] = useState('');
    const [bodyType, setBodyType] = useState('plain')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [newSubject, setNewSubject] = useState('')
    const [singleEmail, setSingleEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false);
    const [adminUserData, setAdminUserData] = useState(null);
    const [newEmail, setNewEmail] = useState('');

    const textareasRef = useRef([]);

    const adminId = localStorage.getItem('admin_user_id');
    const token = localStorage.getItem('admin_jwt-token');

    const mjmlEmail = `<mjml>
        <mj-head>
            <mj-attributes>
            <mj-text font-size="16px" color="#ff806b" />
            <mj-divider border-color="#ff806b" />
            <mj-class name="footer" background-color="#ff806b" padding-top="8px" padding-bottom="8px" />
            <mj-navbar-link color="#ffffff" padding="0px 12px 0px 12px" />
            <mj-all font-family="helvetica" />
            </mj-attributes>
        </mj-head>
        <mj-body>
            <mj-section>
                <mj-column background-color="#fbf7eb">

                    <mj-image width="120px" src="https://www.gingham.nyc/public/gingham-logo-A_3.png"></mj-image>
                    
                    <mj-divider></mj-divider>
                    <mj-text>
                        Dear,
                    </mj-text>
                    <mj-text>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec at mauris luctus, 
                        euismod enim nec, dignissim nisi. Duis sit amet lobortis turpis, sed scelerisque 
                        lorem. Nulla cursus iaculis orci, eget efficitur mi euismod ut. Suspendisse ultrices 
                        arcu lacinia tellus facilisis blandit. Praesent fermentum tortor nec porta egestas. 
                        Nam vulputate mi orci, vel faucibus risus vehicula sed. Donec auctor vulputate 
                        tortor quis sagittis.
                    </mj-text>
                    <mj-text>
                        Vivamus facilisis sollicitudin diam et gravida. Ut velit lacus, commodo ac lectus a, 
                        pellentesque consectetur risus. Maecenas sapien nibh, iaculis ac neque a, suscipit rhoncus
                        justo. Donec sit amet ex lorem. Cras sagittis quam sit amet velit aliquet pharetra. Pellentesque 
                        lobortis tincidunt porttitor. Vestibulum volutpat augue nulla. Aenean semper, massa in pulvinar 
                        volutpat, lorem arcu faucibus leo, ac tempus enim elit quis massa. Morbi eleifend orci tempor 
                        lacus fermentum finibus.
                    </mj-text>
                    <mj-text>
                    </mj-text>
                    <mj-text>
                        —The Gingham Team
                    </mj-text>
                    <mj-text>
                    </mj-text>
                </mj-column>
            </mj-section>
        </mj-body>
    </mjml>
    `

    useEffect(() => {
            const fetchAdminUserData = async () => {
                try {
                    if (!token) {
                        console.error('Token missing, redirecting to login.');
                        // Redirect to login page or unauthorized page
                        return;
                    }
                    const response = await fetch(`/api/admin-users/${adminId}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setAdminUserData(data);
                    } else if (response.status === 403) {
                        console.error('Access forbidden: Admin role required');
                        // Redirect to unauthorized page or show an error
                    } else {
                        console.error(`Error fetching profile: ${response.status}`);
                    }
                } catch (error) {
                    console.error('Error fetching profile data:', error);
                }
            };
            fetchAdminUserData();
        }, [adminId]);
    
    const previewEmail = async () => {
        try {
            const response = await fetch('/api/preview-email', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subject: newSubject,
                    mjml: newEmail
                 }),
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            const html = await response.text();
            setPreviewHtml(html);
        } catch (error) {
            console.error('Error generating preview:', error);
        }
    };
    
    const sendEmail = async () => {
        if (isLoading) {
            return
        }
        setIsLoading(true)
        if (confirm(`Are you sure you want to send ${newSubject} to ${singleEmail}?`)) {
            try {
                const response = await fetch('/api/sendgrid-email-client', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from_email: adminUserData.email,
                        to_email: singleEmail,
                        subject: newSubject,
                        body_type: bodyType,
                        body: newEmail
                        }),
                });
                const result = await response.json()
                if (response.ok) {
                    setIsLoading(false)
                    alert('Message sent successfully!');
                    console.log(result)
                }
            } catch (error) {
                setIsLoading(false)
                alert('Error sending email, make sure your email is verified on sendgrid (contact Zak)', error);
            }
        } else {
            setIsLoading(false)
        }
    };

    useEffect(() => {
        textareasRef.current.forEach((textarea) => {
            if (textarea) {
                textarea.addEventListener('keydown', handleTabKey);
            }
        });

        return () => {
            textareasRef.current.forEach((textarea) => {
                if (textarea) {
                    textarea.removeEventListener('keydown', handleTabKey);
                }
            });
        };
    }, []);

    const handleTabKey = (e) => {
        // if (e.key === 'Tab' && e.shiftKey) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;

            e.target.value =
                e.target.value.substring(0, start) +
                '\t' +
                e.target.value.substring(end);

            e.target.selectionStart = e.target.selectionEnd = start + 1;
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPassword(true);
        setTimeout(() => {
            setShowPassword(false);
        }, 8000);
    };

    const handleBodyType = (event) => {
        setBodyType(event)
        if (event === 'plain') {
            setNewEmail('')
        } else {
            setNewEmail(mjmlEmail)
        }
    }


    return (
        <>
            <div>
                <h1 className='margin-b-16'>Your Email</h1>
                <h3 className='margin-b-8'>Send from {adminUserData?.email}</h3>
                <h3 className='margin-r-8 margin-b-16'>How-to guide: <a className='link-underline' href="https://documentation.mjml.io/#standard-body-components" target="_blank">mjml.io</a></h3>
                <div className='form-group'>
                    <label>Plain or HTML:</label>
                    <select
                        name="body_type"
                        value={bodyType}
                        onChange={(e) => handleBodyType(e.target.value)}
                    >
                        <option value={'plain'}>Plain</option>
                        <option value={'html'}>HTML/MJML</option>
                    </select>
                </div>
                <div className='form-group'>
                    <label>Sending Email:</label>
                    <p className='margin-l-8'>{adminUserData?.email}</p>
                </div>
                <div className='form-group'>
                    <label>Receiving Email:</label>
                    <input
                        type="text"
                        name="singleEmail"
                        placeholder='hello@gingham.nyc'
                        value={singleEmail || ''}
                        onChange={(e) => setSingleEmail(e.target.value)}
                        required
                    />
                </div>
                <div className='form-group'>
                    <label>Subject:</label>
                    <input
                        id="subject-input"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        placeholder="Witty Subject"
                    />
                </div>
                <div className='form-group'>
                    <label>Message:</label>
                    <textarea
                        id="html-input"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Type something..."
                        ref={(el) => (textareasRef.current[0] = el)}
                    />
                </div>
                <div className='flex-start'>
                    {bodyType == 'html' && <button className='btn btn-small margin-t-8 margin-l-12 margin-b-16' onClick={previewEmail}>Preview Email</button>}
                    {isLoading ? (
                        <PulseLoader
                            className='margin-l-24 margin-t-12'
                            color={'#ff806b'}
                            size={10}
                            aria-label="Loading Spinner"
                            data-testid="loader"
                        />
                    ) : (
                        <button className='btn btn-small margin-t-8 margin-l-16 margin-b-16' onClick={sendEmail}>Send Email</button>
                    )}
                </div>
                {bodyType === 'html' && (
                    <iframe
                        title="email-preview"
                        srcDoc={previewHtml}
                        style={{ width: '100%', height: '600px', border: '1px solid grey' }}
                    />
                )}
            </div>
        </>
    );
};

export default AdminEmail;