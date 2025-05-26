import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const AdminHelpTab = ({ fAQs, setFAQs, forUser, forVendor, forAdmin, userType }) => {
    const [newFAQ, setNewFAQ] = useState({});
    const [query, setQuery] = useState("");
    const [tempFAQData, setTempFAQData] = useState(null);
    const [editingFAQId, setEditingFAQId] = useState(null);


    const handleInputFAQChange = (event) => {
        setNewFAQ({
            ...newFAQ,
            [event.target.name]: event.target.value,
        });
    };

    const handleEditInputChange = (event) => {
        const { name, value } = event.target;
        setTempFAQData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFAQEditToggle = (id, question, answer) => {
        setEditingFAQId(id);
        setTempFAQData({ question, answer });
    };

    const handleSaveNewFAQ = async () => {
        try {
            const response = await fetch('/api/faqs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newFAQ),
            });
            if (response.ok) {
                const createdFAQ = await response.json();
                console.log('FAQ data updated successfully:', createdFAQ);
                toast.success('FAQ successfully created!', {
                    autoClose: 4000,
                });
                setFAQs((prev) => [...prev, createdFAQ]);
                setNewFAQ({})
            } else {
                console.log('Failed to save FAQ details');
                console.log('Response status:', response.status);
                console.log('Response text:', await response.text());
            }
        } catch (error) {
            console.error('Error saving event details:', error);
        }
    };

    const handleFAQUpdate = async (fAQId) => {
        try {
            const response = await fetch(`/api/faqs/${fAQId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tempFAQData),
            });

            if (response.ok) {
                const updatedFAQ = await response.json();
                setFAQs((prev) =>
                    prev.map((faq) => (faq.id === fAQId ? updatedFAQ : faq))
                );
                setEditingFAQId(null);
                console.log('FAQ updated successfully:', updatedFAQ);
            } else {
                console.error('Failed to update FAQ:', await response.text());
            }
        } catch (error) {
            console.error('Error updating FAQ:', error);
        }
    };

    const handleEventDelete = async (id) => {
        if (confirm(`Are you sure you want to delete this FAQ?`)) {
            try {

                fetch(`/api/faqs/${id}`, {
                    method: "DELETE",
                }).then(() => {
                    setFAQs((prev) => prev.filter((item) => item.id !== id))
                })
            } catch (error) {
                console.error("Error deleting FAQ", error)
            }
        }
    }

    useEffect(() => {
        setNewFAQ((prev) => ({
            ...prev,
            for_user: forUser,
            for_vendor: forVendor,
            for_admin: forAdmin,
        }));
    }, [forUser, forVendor, forAdmin]);


    return (
        <>
            <title>gingham • Admin Help • {userType}</title>
            <div className='box-bounding'>
                <h2>Add {userType} FAQs</h2>
                <div className='margin-t-24'>
                    <div className='form-group'>
                        <label>Question:</label>
                        <textarea
                            className='textarea-edit'
                            type="text"
                            name="question"
                            placeholder='How do I...'
                            value={newFAQ.question || ''}
                            onChange={handleInputFAQChange}
                        />
                    </div>
                    <div className='form-group'>
                        <label>Answer:</label>
                        <textarea
                            className='textarea-edit'
                            type="text"
                            name="answer"
                            placeholder='Answer here'
                            value={newFAQ.answer || ''}
                            onChange={handleInputFAQChange}
                        />
                    </div>
                    <input
                        type="hidden"
                        name="for_user"
                        value={Boolean(forUser)}
                    />
                    <input
                        type="hidden"
                        name="for_vendor"
                        value={Boolean(forVendor)}
                    />
                    <input
                        type="hidden"
                        name="for_admin"
                        value={Boolean(forAdmin)}
                    />
                    <button className='btn-edit' onClick={handleSaveNewFAQ}>Create FAQ</button>
                </div>
            </div>
            <div className='box-bounding'>
                <h2 className='margin-b-8'>Edit {userType} FAQs</h2>
                <div className='box-scroll'>
                    {fAQs.length > 0 ? (
                        fAQs.map((faq, index) => (
                            <div key={index} style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
                                {editingFAQId === faq.id ? (
                                    <>
                                        <div>
                                            <div className='form-group'>
                                                <label>Question:</label>
                                                <textarea
                                                    className='textarea-edit'
                                                    type="text"
                                                    name="question"
                                                    placeholder='How do I...'
                                                    value={tempFAQData ? tempFAQData.question : ''}
                                                    onChange={handleEditInputChange}
                                                />
                                            </div>
                                            <div className='form-group'>
                                                <label>Answer:</label>
                                                <textarea
                                                    className='textarea-edit'
                                                    type="text"
                                                    name="answer"
                                                    placeholder='Answer here'
                                                    value={tempFAQData ? tempFAQData.answer : ''}
                                                    onChange={handleEditInputChange}
                                                />
                                            </div>
                                            <button className='btn btn-small margin-t-24' onClick={() => handleFAQUpdate(faq.id)}>Save</button>
                                            <button className='btn btn-small btn-gap margin-l-8' onClick={() => setEditingFAQId(null)}>Cancel</button>

                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className='margin-b-16'>
                                            <h3 className='nowrap'>{faq.question ? faq.question : 'Loading...'}</h3>
                                            <p>{faq.answer}</p>
                                        </div>
                                        <button className='btn btn-small' onClick={() => handleFAQEditToggle(faq.id, faq.question, faq.answer)}>
                                            Edit
                                        </button>
                                        <button className='btn btn-small btn-x btn-gap margin-l-8' onClick={() => handleEventDelete(faq.id)}>
                                            Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        ))
                    ) : (
                        <>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default AdminHelpTab;