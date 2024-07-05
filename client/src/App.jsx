import React from 'react';
import { Outlet } from 'react-router-dom';

//CSS
import './assets/css/index.css';

//Components
import NavBar from './components/NavBar.jsx';

function App() {
    return (
        <>
            <div className="container">
                <header> <NavBar /> </header>
                <main> <Outlet /> </main>
            </div>
        </>
    );
}

export default App;