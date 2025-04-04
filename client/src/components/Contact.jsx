import React, { useState } from 'react';
import { toast } from 'react-toastify';

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
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            const result = await response.json()
            if (response.ok) {
                toast.success('Message sent successfully!', {
                    autoClose: 4000,
                });
            } else {
                toast.error('Error sending message:', result.error, {
                    autoClose: 5000,
                });
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('An error occured while sending the message.', {
                autoClose: 4000,
            });
        }
    };

    return(
        <div className=''>
            <title>Gingham • Contact</title>
            <div>
                <h2 className='margin-t-16 margin-b-16'>Contact Us!</h2>
                <p>Is there something you love, dislike, or have a question for us? Feel Free to send us an message using the form below:</p>
                <div>
                    <p>Prefer to email us directly? Click here: &ensp;<strong>
                        <a href={`mailto:hello@mufo.nyc`} target="_blank" rel="noopener noreferrer">
                            Email Us
                        </a>
                    </strong></p>
                    
                </div>
                <div className='margin-t-16 flex-center'>
                    <form onSubmit={handleSubmit} className='form'>
                        <div className='form-group form-contact'>
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
                        <div className='form-group form-contact'>
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
                        <div className='form-group form-contact'>
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
                        <div className='form-group form-contact'>
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
            </div>
        </div>
    );
}

export default Contact;