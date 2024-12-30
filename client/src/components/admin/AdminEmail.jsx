import React, { useEffect, useRef, useState } from 'react';

const AdminEmail = () => {
    const [previewHtml, setPreviewHtml] = useState('');
    const [emailAddress, setEmailAddress] = useState('')
    const [newSubject, setNewSubject] = useState('')
    const [newEmail, setNewEmail] = useState(`<!DOCTYPE html>
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
                    p, h1, h2, h3, h4, h5, h6 {
                        color: #ff806b;
                    }
                    .img-hero {
                        width: 100%;
                        height: auto;
                    }
                    .center {
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <img class="img-logo" src="https://www.gingham.nyc/public/gingham-logo-A_3.png" alt="logo"/>
                    </div>
                    <hr class="divider"/>
                    <div class="content">
                        <p>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec at mauris luctus, 
                            euismod enim nec, dignissim nisi. Duis sit amet lobortis turpis, sed scelerisque 
                            lorem. Nulla cursus iaculis orci, eget efficitur mi euismod ut. Suspendisse ultrices 
                            arcu lacinia tellus facilisis blandit. Praesent fermentum tortor nec porta egestas. 
                            Nam vulputate mi orci, vel faucibus risus vehicula sed. Donec auctor vulputate 
                            tortor quis sagittis.
                        </p>
                        <p>
                            Vivamus facilisis sollicitudin diam et gravida. Ut velit lacus, commodo ac lectus a, 
                            pellentesque consectetur risus. Maecenas sapien nibh, iaculis ac neque a, suscipit rhoncus
                            justo. Donec sit amet ex lorem. Cras sagittis quam sit amet velit aliquet pharetra. Pellentesque 
                            lobortis tincidunt porttitor. Vestibulum volutpat augue nulla. Aenean semper, massa in pulvinar 
                            volutpat, lorem arcu faucibus leo, ac tempus enim elit quis massa. Morbi eleifend orci tempor 
                            lacus fermentum finibus.
                        </p>
                        <p>
                        —The Gingham Team
                        </p>
                        <img class="img-hero" src="https://www.gingham.nyc/public/GINGHAM_VENDOR_FARMERSMARKET.png" alt="farmers market"/>
                    </div>
                    <div class="footer">
                        <img class="img-logo-small" src="https://www.gingham.nyc/public/gingham-logo-A_3.png" alt="logo"/>
                        <p>&copy; 2024 GINGHAM.NYC. All Rights Reserved.</p>
                    </div>
                </div>
            </body>
            </html>
    `);

    const linkEmail = `<mj-section padding="0px">
                        <mj-section mj-class="footer">
                            <mj-navbar base-url="https://www.gingham.nyc>
                                <mj-navbar-link href="/" >Home</mj-navbar-link>
                                <mj-navbar-link href="/vendor" >Vendor Home</mj-navbar-link>
                                <mj-navbar-link href="/contact" >Contact Us</mj-navbar-link>
                            </mj-navbar>
                        </mj-section>
                    </mj-section>`

    const textareasRef = useRef([]);

    const previewEmail = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5555/api/preview-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emailAddress: emailAddress,
                    subject: newSubject,
                    mjmlTemplate: newEmail
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
        if (confirm(`Are you sure you want to send the ${newSubject} email?`)) {
            try {
                const response = await fetch('http://127.0.0.1:5555/api/send-html-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        emailAddress: emailAddress,
                        subject: newSubject,
                        htmlTemplate: newEmail
                     }),
                });
                // if (!response.ok) {
                //     throw new Error(`Error: ${response.statusText}`);
                // }
                const result = await response.json()
                if (response.ok) {
                    alert('Message sent successfully!');
                    console.log(result)
                } else {
                    alert('Error sending message:', result.error);
                }
            } catch (error) {
                console.error('Error generating preview:', error);
            }
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
    

    return (
        <>
            <div>
                <div className='flex-start flex-bottom-align margin-b-16'>
                    <h2 className='margin-r-8'>How-to guide:</h2>
                    <a className='link-underline' href="https://documentation.mjml.io/#standard-body-components" target="_blank"><h3>mjml.io</h3></a>
                </div>
                <div className='form-group'>
                    <label>Email Address:</label>
                    <input
                        id="subject-input"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        placeholder="email@domain.nyc"
                    />
                </div>
                <div className='form-group'>
                    <label>Subject:</label>
                    <input
                        id="subject-input"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        placeholder="Witty Newsletter Title"
                    />
                </div>
                <div className='form-group'>
                    <label>Message:</label>
                    <textarea
                        id="htmlinput"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Type something..."
                        ref={(el) => (textareasRef.current[0] = el)}
                    />
                </div>
                <div className='flex-start'>
                    {/* <button className='btn btn-small margin-t-8 margin-l-12 margin-b-16' onClick={previewEmail}>Preview Email</button> */}
                    <button className='btn btn-small margin-t-8 margin-l-16 margin-b-16' onClick={sendEmail}>Send Email</button>
                </div>
                <iframe
                    title="email-preview"
                    srcDoc={newEmail}
                    style={{ width: '100%', height: '600px', border: '1px solid grey' }}
                />
            </div>
        </>
    );
};

export default AdminEmail;