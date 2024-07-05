import React from 'react';

const profileData = {
    name: "Daniel Radcliffe",
    email: "Harry@Potter.com",
    address: "123 N 5th Street, Brooklyn, NY",
    favorites: {
        vendors: ["Vendor A", "Vendor C"],
        markets: ["Market B", "Market D"]
    }
};

function Profile() {
    return (
        <div style={{ padding: "20px" }}>
            <h1>Welcome to Your Profile</h1>
            <div style={{ marginTop: "20px", border: "1px solid #ccc", padding: "20px", borderRadius: "8px" }}>
                <h2>Profile Information</h2>
                <p><strong>Name:</strong> {profileData.name}</p>
                <p><strong>Email:</strong> {profileData.email}</p>
                <p><strong>Address:</strong> {profileData.address}</p>
            </div>
            <div style={{ marginTop: "20px", border: "1px solid #ccc", padding: "20px", borderRadius: "8px" }}>
                <h2>Favorites</h2>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ flex: "1", marginRight: "10px" }}>
                        <h3>Vendors</h3>
                        {profileData.favorites.vendors.map((vendor, index) => (
                            <div key={index} style={{ borderBottom: "1px solid #ccc", padding: "8px 0" }}>
                                {vendor}
                            </div>
                        ))}
                    </div>
                    <div style={{ flex: "1", marginLeft: "10px" }}>
                        <h3>Markets</h3>
                        {profileData.favorites.markets.map((market, index) => (
                            <div key={index} style={{ borderBottom: "1px solid #ccc", padding: "8px 0" }}>
                                {market}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;