import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminBlogAdmin from './AdminBlogAdmin';
import AdminBlogUser from './AdminBlogUser';
import AdminBlogVendor from './AdminBlogVendor';
import PulseLoader from 'react-spinners/PulseLoader';
import { toast } from 'react-toastify';


const AdminBlog = () => {
    const [blogs, setBlogs] = useState([]);
    const [activeTab, setActiveTab] = useState('user');
    const [activeTabMode, setActiveTabMode] = useState('add');
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);
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
        if (images.length === 0) {
            setUploadError("Please select at least one image.");
            return;
        }

        const formData = new FormData();
        images.forEach((image) => {
            formData.append("files", image);
        });

        setUploading(true);

        try {
            const response = await fetch("/api/upload-blog-images", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Images uploaded successfully:", data);
                fetchImages();
                setImages([]);
            } else {
                const errorData = await response.json();
                console.log(errorData.error || "Failed to upload images.");
                toast.error(`Image failed to upload successfully: ${errorData.error}`, { autoClose: 4000 });
            }
        } catch (error) {
            console.log("Error uploading images. Please try again. Only jpeg, svg, and heic files are allowed.");
            console.error("Upload error:", error);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteImage = async (date_folder, img) => {
        const token = localStorage.getItem('admin_jwt-token');
        if (!token) {
            toast.warning('User is not authenticated. Please log in again.', {
                autoClose: 4000,
            });
            return;
        }

        try {
            console.log('Deleting image with filename:', img);

            const response = await fetch(`/api/delete-image`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    filename: img,
                    date_folder: date_folder,
                    type: 'blog',
                }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Image deleted response:', result);
                toast.success('Image deleted successfully.', {
                    autoClose: 4000,
                });
                fetchImages();
            } else {
                const errorText = await response.text();
                console.error('Failed to delete image:', errorText);
                toast.error(`Failed to delete the image: ${JSON.parse(errorText).error}`, {
                    autoClose: 4000,
                });
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            toast.warning('An unexpected error occurred while deleting the image.', {
                autoClose: 4000,
            });
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
                    <div className='margin-t-20'>
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
                    <div className='margin-t-20'>
                        <Link onClick={() => setActiveTabMode('add')} className={activeTabMode === 'add' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                            add
                        </Link>
                        <Link onClick={() => setActiveTabMode('edit')} className={activeTabMode === 'edit' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                            edit
                        </Link>
                    </div>
                </div>
                {activeTab === 'user' && <AdminBlogUser blogs={blogs} setBlogs={setBlogs} activeTabMode={activeTabMode} />}
                {activeTab === 'vendor' && <AdminBlogVendor blogs={blogs} setBlogs={setBlogs} activeTabMode={activeTabMode} />}
                {activeTab === 'admin' && <AdminBlogAdmin blogs={blogs} setBlogs={setBlogs} activeTabMode={activeTabMode} />}
                <div className='flex-start flex-gap-12 flex-center-align margin-t-32'>
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
                        {uploading ? (
                            <PulseLoader
                                className='margin-t-16'
                                color={'#ff806b'}
                                size={10}
                                aria-label="Loading Spinner"
                                data-testid="loader"
                            />
                        ) : (
                            <button className='btn btn-file' onClick={handleImageUpload}>Save Images</button>
                        )}
                    </div>
                </div>
                {uploadedFolders && Object.keys(uploadedFolders).length > 0 && (
                    <div className='margin-t-12 margin-b-32'>
                        <details className='details-images box-scroll'>
                            <summary>Uploaded Images</summary>
                            {Object.keys(uploadedFolders).map((dateFolder) => (
                                <details
                                    key={dateFolder}
                                    className='details-images'
                                    open={openFolder === dateFolder}
                                >
                                    <summary onClick={(e) => {
                                        e.preventDefault();
                                        handleToggle(dateFolder);
                                    }}>
                                        {dateFolder}
                                    </summary>
                                    <div className='grid-3'>
                                        {uploadedFolders[dateFolder]?.map((img, index) => (
                                            <div key={index} className='img-blog-array'>
                                                <img src={img} alt={`Uploaded ${index}`} className='img-blog' />
                                                <div className='flex-space-between'>
                                                    <p className='text-break-all text-size-088'>
                                                        <button
                                                            className={copied[index] ? "btn icon-copy-success" : "btn icon-copy"}
                                                            type="button"
                                                            onClick={() => handleCopy(img, index)}
                                                            title="copy"
                                                        >
                                                            &emsp;
                                                        </button>
                                                        <button
                                                            className="btn icon-delete-img"
                                                            type="button"
                                                            onClick={() => handleDeleteImage(dateFolder, img)}
                                                            title="delete"
                                                        >
                                                            &emsp;
                                                        </button> <span className='text-500'>src=</span>{img}
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
            </div>
        </>
    );
};

export default AdminBlog;