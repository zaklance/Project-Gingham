import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminBlogAdmin from './AdminBlogAdmin';
import AdminBlogUser from './AdminBlogUser';
import AdminBlogVendor from './AdminBlogVendor';

const AdminBlog = () => {
    const [blogs, setBlogs] = useState([]);
    const [activeTab, setActiveTab] = useState('user');
    const [activeTabMode, setActiveTabMode] = useState('add');
    const [images, setImages] = useState([]);
    const [uploadedFolders, setUploadedFolders] = useState({});
    const [copied, setCopied] = useState({});
    const [openFolder, setOpenFolder] = useState({});

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab) setActiveTab(tab);
    }, []);

    useEffect(() => {
        fetch("/api/blogs")
            .then(response => response.json())
            .then(data => {
                const sortedData = data.sort((a, b) => new Date(b.post_date) - new Date(a.post_date));
                setBlogs(sortedData);
            })
            .catch(error => console.error('Error fetching blogs', error));
    }, []);

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        setImages(files);
    };

    const handleImageUpload = async () => {
        const formData = new FormData();
        images.forEach((image) => {
            formData.append('files', image);
        });
        formData.append('type', 'blog');

        try {
            const response = await fetch('/api/upload-files', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Images uploaded successfully:', data);
                fetchImages();
                window.location.reload()
            } else {
                console.error('Failed to upload images');
            }
        } catch (error) {
            console.error('Error uploading images:', error);
        }
    };

    const fetchImages = async () => {
        try {
            const response = await fetch('/api/blog-images');
            if (response.ok) {
                const data = await response.json();

                const sortedFolders = Object.keys(data.folders || {}).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

                const sortedUploadedFolders = sortedFolders.reduce((acc, key) => {
                    acc[key] = data.folders[key];
                    return acc;
                }, {});
                setUploadedFolders(sortedUploadedFolders);
            } else {
                console.error('Failed to fetch images');
                setUploadedFolders({});
            }
        } catch (error) {
            console.error('Error fetching images:', error);
            setUploadedFolders({});
        }
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const handleCopy = (text, index) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                setCopied((prev) => ({ ...prev, [index]: true }));
                setTimeout(() => setCopied((prev) => ({ ...prev, [index]: false })), 2000);
            })
            .catch((err) => console.error('Failed to copy:', err));
    };

    const handleToggle = (name) => {
        setOpenFolder((prev) => (prev === name ? null : name));
    };
    

    return (
        <>
            <div>
                <div className='flex-start flex-top-align flex-gap-24 m-flex-wrap'>
                    <h1 className='margin-b-16'>Blogs!</h1>
                    <div className='tabs margin-t-20'>
                        <Link to="/admin/blog?tab=user" onClick={() => setActiveTab('user')} className={activeTab === 'user' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                            User
                        </Link>
                        <Link to="/admin/blog?tab=vendor" onClick={() => setActiveTab('vendor')} className={activeTab === 'vendor' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                            Vendor
                        </Link>
                        <Link to="/admin/blog?tab=admin" onClick={() => setActiveTab('admin')} className={activeTab === 'admin' ? 'active-tab btn btn-reset btn-tab' : 'btn btn-reset btn-tab'}>
                            Admin
                        </Link>
                    </div>
                    <h1>|</h1>
                    <div className='tabs margin-t-20'>
                        <Link onClick={() => setActiveTabMode('add')} className={activeTabMode === 'add' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                            add
                        </Link>
                        <Link onClick={() => setActiveTabMode('edit')} className={activeTabMode === 'edit' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                            edit
                        </Link>
                    </div>
                </div>
                <div className='flex-start flex-gap-12 flex-center-align'>
                    <h2>Image Uploads:</h2>
                    <div>
                        <div>
                            <div className='flex-start flex-center-align margin-t-8'>
                                <label htmlFor='file-upload' className='btn btn-small btn-file nowrap margin-b-8'>Choose Files</label>
                                <input
                                    id="file-upload"
                                    type="file"
                                    name="files"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <button className='btn btn-file' onClick={handleImageUpload}>Save Images</button>
                    </div>
                </div>
                {uploadedFolders && Object.keys(uploadedFolders).length > 0 && (
                    <div className='margin-t-12 margin-b-32'>
                        <details className='details-images box-scroll'>
                            <summary>Uploaded Images</summary>
                            {Object.keys(uploadedFolders).map((folder) => (
                                <details 
                                    key={folder}
                                    className='details-images'
                                    open={openFolder === folder}
                                >
                                    <summary onClick={(e) => {
                                        e.preventDefault();
                                        handleToggle(folder);
                                    }}>
                                        {folder}
                                    </summary>
                                    <div className='grid-3'>
                                        {uploadedFolders[folder]?.map((img, index) => (
                                            <div key={index} className='img-blog-array'>
                                                <img src={img} alt={`Uploaded ${index}`} className='img-blog' />
                                                <div className='flex-space-between'>
                                                    <p className='text-break-all text-size-088'>
                                                        <button className={copied[index] ? "btn icon-copy-success" : "btn icon-copy"} 
                                                            onClick={() => handleCopy(img, index)}>&emsp;
                                                        </button> 
                                                        https://www.gingham.nyc/public{img}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            ))}
                        </details>
                    </div>
                )}
                {activeTab === 'user' && <AdminBlogUser blogs={blogs} setBlogs={setBlogs} activeTabMode={activeTabMode} />}
                {activeTab === 'vendor' && <AdminBlogVendor blogs={blogs} setBlogs={setBlogs} activeTabMode={activeTabMode} />}
                {activeTab === 'admin' && <AdminBlogAdmin blogs={blogs} setBlogs={setBlogs} activeTabMode={activeTabMode} />}
            </div>
        </>
    );
};

export default AdminBlog;