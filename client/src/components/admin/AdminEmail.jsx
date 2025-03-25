import React, { useEffect, useRef, useState } from 'react';
import PulseLoader from 'react-spinners/PulseLoader';
import { toast } from 'react-toastify';

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

    const htmlEmail = `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Contact Form Submission</title>
            <style>
                .email-container {
                    font-family: helvetica, sans-serif;
                    line-height: 1.6;
                    color: #3b4752;
                    background-color: #fbf7eb;
                    padding: 20px;
                    border-radius: 24px;
                }
                .header {
                    color: white;
                    text-align: center;
                    border-radius: 16px;
                }
                .content {
                    padding: 20px;
                    color: #3b4752;
                }
                .footer {
                    font-size: 12px;
                    text-align: center;
                    margin-top: 20px;
                    margin-bottom: -10px;
                    color: #777;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .button {
                    display: inline-block;
                    background-color: #ff806b;
                    color: #ffffff !important;
                    text-decoration: none !important;
                    padding: 8px 12px;
                    border-radius: 5px;
                    margin-top: 10px;
                }
                .img-logo {
                    height: 120px;
                    width: 120px;
                }
                .img-logo-small {
                    height: 32px;
                    width: 32px;
                }
                .divider {
                    border: 0;
                    border-top: 4px solid #ff806b;
                }
                p, h1, h2, h3, h4, h5, h6, article {
                    color: #ff806b;
                }
                .img-hero, .img-blog {
                    width: 100%;
                    height: auto;
                }
                article {
                  margin-bottom: 1em;
                  widows: 2;
                }
                .first-letter::first-letter {
                  -webkit-initial-letter: 2;
                  initial-letter: 2;
                  font-family: inherit;
                  padding-right: 4px;
                }
                .center {
                    text-align: center;
                }
                .flex-center {
                    display: flex;
                    justify-content: center;
                }
                .flex-gap-8 {
                    gap: 8px;
                }
                .flex-gap-16 {
                    gap: 16px;
                }
                .margin-4-0 {
                    margin: 4px;
                }
                .margin-12-0 {
                    margin: 12px;
                }
                .link-underline {
                    color: #ff806b;
                    text-decoration: none;
                }
                .link-underline:hover {
                    text-decoration: underline;
                    text-underline-offset: .15em;
                    background-color: transparent;
                    transition: all 0.3s;
                }
                .box-callout {
                    border: 4px solid #ff806b;
                    border-radius: 20px;
                    padding: 12px 24px;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <img class="img-logo" src="https://www.gingham.nyc/site-images/gingham-logo-A_3.png" alt="logo"/>
                </div>
                <hr class="divider"/>
                <div>
                    <p>Hi {user_data.name},</p>
                    <p>One of your favorite markets, <strong><a class="link-underline" href={full_link}>{market_data.name}</a></strong>, has a new event, check it out: </p>
                    <div class="content flex-center">
                        <div class="box-callout">
                            <h3>{event.title}</h3>
                            <h5>{event.start_date} — {event.end_date}</h5>
                            <p>{event.message}</p>
                        </div>
                    </div>
                    <p>— The Gingham Team</p>
                </div>
                <div class="footer flex-center">
                    <img class="img-logo-small" src="https://www.gingham.nyc/site-images/gingham-logo-A_2.png" alt="logo"/>
                    <p>&copy; 2024 GINGHAM.NYC. All Rights Reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `

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

                    <mj-image width="120px" src="https://www.gingham.nyc/site-images/gingham-logo-A_3.png"></mj-image>
                    
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
                    toast.success('Message sent successfully!', {
                        autoClose: 4000,
                    });
                    // console.log(result)
                }
            } catch (error) {
                setIsLoading(false)
                toast.error('Error sending email, make sure your email is verified on sendgrid (contact Zak)', error, {
                    autoClose: 4000,
                });
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

    const handleBodyType = (event) => {
        setBodyType(event)
        if (event === 'plain') {
            setNewEmail('')
        } else if (event === 'html') {
            setNewEmail(htmlEmail)
        } else {
            setNewEmail(mjmlEmail)
        }
    }


    return (
        <>
            <div>
                <h1 className='margin-b-16'>Your Email</h1>
                <div className='box-bounding'>
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
                            <option value={'html'}>HTML</option>
                            <option value={'mjml'}>MJML</option>
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
                        {bodyType === 'mjml' && <button className='btn btn-small margin-t-8 margin-l-12 margin-b-16' onClick={previewEmail}>Preview Email</button>}
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
                            className='box-iframe'
                            title="email-preview"
                            srcDoc={newEmail}
                            style={{ width: '100%', height: '600px', border: '1px solid grey' }}
                        />
                    )}
                    {bodyType === 'mjml' && (
                        <iframe
                            className='box-iframe'
                            title="email-preview"
                            srcDoc={previewHtml}
                            style={{ width: '100%', height: '600px', border: '1px solid grey' }}
                        />
                    )}
                </div>
            </div>
        </>
    );
};

export default AdminEmail;