import React, { useEffect, useRef, useState } from 'react';

const AdminEmail = () => {
    const [previewHtml, setPreviewHtml] = useState('');
    const [emailAddress, setEmailAddress] = useState('')
    const [newSubject, setNewSubject] = useState('')
    const [newEmail, setNewEmail] = useState(`<mjml>
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
                        —The Gingham Team
                    </mj-text>
                    <mj-image width="400px" src="https://www.gingham.nyc/public/GINGHAM_VENDOR_FARMERSMARKET.png"></mj-image>
                    <mj-section padding="0px">
                        <mj-section mj-class="footer">
                            <mj-navbar>
                                <mj-navbar-link href="https://www.gingham.nyc/" >Home</mj-navbar-link>
                                <mj-navbar-link href="https://www.gingham.nyc/vendor" >Vendor Home</mj-navbar-link>
                                <mj-navbar-link href="https://www.gingham.nyc/contact" >Contact Us</mj-navbar-link>
                            </mj-navbar>
                        </mj-section>
                    </mj-section>
                </mj-column>
            </mj-section>
        </mj-body>
    </mjml>
    `);

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
        if (confirm(`Are you sure you want to send ${newSubject} to all users?`)) {
            try {
                const response = await fetch('http://127.0.0.1:5555/api/sendgrid-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        emailAddress: emailAddress,
                        subject: newSubject,
                        html: newEmail
                     }),
                });
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
                    <button className='btn btn-small margin-t-8 margin-l-12 margin-b-16' onClick={previewEmail}>Preview Email</button>
                    <button className='btn btn-small margin-t-8 margin-l-16 margin-b-16' onClick={sendEmail}>Send Email</button>
                </div>
                <iframe
                    title="email-preview"
                    srcDoc={previewHtml}
                    style={{ width: '100%', height: '600px', border: '1px solid grey' }}
                />
            </div>
        </>
    );
};

export default AdminEmail;