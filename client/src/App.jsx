import React from 'react';
import { Outlet, useLoaderData } from 'react-router-dom';

//CSS
import './assets/css/index.css';

//Components
import NavBar from './components/NavBar.jsx';

function App() {

    return (
        <>
            <div className="container">
                <header> <NavBar /> </header>
                <main> <Outlet context={[user]}/> </main>
            </div>
        </>
    )
}

export default App;