import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminRecipeAdd from './AdminRecipeAdd';
import AdminRecipeEdit from './AdminRecipeEdit';
import AdminRecipeDelete from './AdminRecipeDelete';
import AdminRecipeIngredient from './AdminRecipeIngredient';

const AdminRecipes = () => {
    const [recipes, setRecipes] = useState([]);
    const [smallwares, setSmallwares] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [recipeIngredients, setRecipeIngredients] = useState([]);
    const [activeTab, setActiveTab] = useState('add');
    
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab) setActiveTab(tab);
    }, []);

    useEffect(() => {
        fetch("/api/recipes")
            .then(response => response.json())
            .then(data => setRecipes(data))
            .catch(error => console.error('Error fetching recipes', error));
    }, []);

    useEffect(() => {
        fetch('/api/ingredients')
            .then(response => response.json())
            .then(data => setIngredients(data))
            .catch(error => console.error('Error fetching ingredients', error));
    }, []);

    useEffect(() => {
        fetch('/api/smallwares')
            .then(response => response.json())
            .then(data => setSmallwares(data))
            .catch(error => console.error('Error fetching smallwares', error));
    }, []);

    useEffect(() => {
        fetch('/api/recipe-ingredients')
            .then(response => response.json())
            .then(data => setRecipeIngredients(data))
            .catch(error => console.error('Error fetching recipe ingredients', error));
    }, []);


    return (
        <>
            <div className='flex-start flex-center-align flex-gap-24 m-flex-wrap'>
                <h1>Recipe Management</h1>
                <div className='tabs m-scroll'>
                    <Link to="/recipes?tab=add" onClick={() => setActiveTab('add')} className={`btn btn-reset btn-tab ${activeTab === 'add' && 'active-tab'}`}>
                        Add
                    </Link>
                    <Link to="/recipes?tab=edit" onClick={() => setActiveTab('edit')} className={`btn btn-reset btn-tab ${activeTab === 'edit' && 'active-tab'}`}>
                        Edit
                    </Link>
                    <Link to="/recipes?tab=delete" onClick={() => setActiveTab('delete')} className={`btn btn-reset btn-tab ${activeTab === 'delete' && 'active-tab'}`}>
                        Delete
                    </Link>
                    <Link to="/recipes?tab=ingredient" onClick={() => setActiveTab('ingredient')} className={`btn btn-reset btn-tab ${activeTab === 'ingredient' && 'active-tab'}`}>
                        Ingredients
                    </Link>
                </div>
            </div>
            {activeTab === 'add' && <AdminRecipeAdd smallwares={smallwares} recipes={recipes} ingredients={ingredients} />}
            {activeTab === 'edit' && <AdminRecipeEdit smallwares={smallwares} recipes={recipes} ingredients={ingredients} />}
            {activeTab === 'delete' && <AdminRecipeDelete smallwares={smallwares} recipes={recipes} ingredients={ingredients} recipeIngredients={recipeIngredients} />}
            {activeTab === 'ingredient' && <AdminRecipeIngredient ingredients={ingredients} setIngredients={setIngredients} />}
        </>
    );
};

export default AdminRecipes;