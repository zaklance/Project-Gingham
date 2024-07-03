import React from 'react';
import { Outlet, use } from 'react-router-dom';



function App() {
    return (
        <>
            <header>
                <NavBar />
            </header>
            <div className="wrapper" onCopy={handleCopy}>
                <Outlet />
            </div>
        </>
    );
};

export default App;