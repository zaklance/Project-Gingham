import React, { useState } from 'react';

function Contact() {
    const [formData, setFormData] = useState({
        name: '', 
        email: '',
        subject: '', 
        message: ''
    });


    const handleChange = (event) => {
        setFormData({ ...formData, [event.target.name]: event.target.value});
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const response = await fetch('http://127.0.0.1:5555/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            const result = await response.json()
            if (response.ok) {
                alert('Message sent successfully!');
            } else {
                alert('Error sending message:', result.error);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occured while sending the message.');
        }
    };

    return(
        <div className='login-bar'>
            <div className='vendor-wrapper'>
                <h1 className='title'>Contact Us!</h1>
                <p>Have a question for us? Feel Free to send us an inquiry using the form below:</p>
                    <form onSubmit={handleSubmit} className='form'>
                    <div className='form-group'>
                        <label>Name:</label>
                        <input 
                            type="text" 
                            name="name" 
                            value={formData.name} 
                            placeholder="enter your name"
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <div className='form-group'>
                        <label>Email:</label>
                        <input 
                            type="email" 
                            name="email" 
                            value={formData.email} 
                            placeholder="enter your email"
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <div className='form-group'>
                        <label>Subject:</label>
                        <input 
                            type="text" 
                            name="subject" 
                            value={formData.subject} 
                            placeholder="enter the subject"
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <div className='form-group'>
                        <label>Message:</label>
                        <textarea 
                            name="message" 
                            value={formData.message} 
                            placeholder="enter your message"
                            onChange={handleChange} 
                            rows="20"
                            cols="60"
                            required 
                        />
                    </div>
                    <button className='btn-login' type="submit">Send Message</button>
                </form>
            </div>
            <div className='vendor-wrapper'>
                <p>Prefer to email us directly? Click the link below:</p>
                <strong>
                    <a
                        href={`mailto:hello@mufo.nyc`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Email Us 
                    </a>
                </strong>
            </div>
        </div>
    );
}

export default Contact;