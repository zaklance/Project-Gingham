import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminRecipeAdd from './AdminRecipeAdd';
import AdminRecipeEdit from './AdminRecipeEdit';
import AdminRecipeDelete from './AdminRecipeDelete';

const AdminRecipes = () => {
    const [recipes, setRecipes] = useState([]);
    const [smallwares, setSmallwares] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [recipeIngredients, setRecipeIngredients] = useState([]);
    const [instructionGroups, setInstructionGroups] = useState([]);
    const [instructions, setInstructions] = useState([]);
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

    useEffect(() => {
        fetch('/api/instructions')
            .then(response => response.json())
            .then(data => setInstructions(data))
            .catch(error => console.error('Error fetching instructions', error));
    }, []);

    useEffect(() => {
        fetch('/api/instruction-groups')
            .then(response => response.json())
            .then(data => setInstructionGroups(data))
            .catch(error => console.error('Error fetching instruction groups', error));
    }, []);


    return (
        <>
            <div className='flex-start flex-center-align flex-gap-24 m-flex-wrap'>
                <h1>Recipe Management</h1>
                <div className='tabs margin-t-20 m-scroll'>
                    <Link to="/admin/recipes?tab=add" onClick={() => setActiveTab('add')} className={activeTab === 'add' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                        Add
                    </Link>
                    <Link to="/admin/recipes?tab=edit" onClick={() => setActiveTab('edit')} className={activeTab === 'edit' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                        Edit
                    </Link>
                    <Link to="/admin/recipes?tab=delete" onClick={() => setActiveTab('delete')} className={activeTab === 'delete' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                        Delete
                    </Link>
                </div>
            </div>
            {activeTab === 'add' && <AdminRecipeAdd smallwares={smallwares} recipes={recipes} ingredients={ingredients} />}
            {activeTab === 'edit' && <AdminRecipeEdit smallwares={smallwares} recipes={recipes} ingredients={ingredients} />}
            {activeTab === 'delete' && <AdminRecipeDelete recipes={recipes} ingredients={ingredients} recipeIngredients={recipeIngredients} />}
        </>
    );
};

export default AdminRecipes;