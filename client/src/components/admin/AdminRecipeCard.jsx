import React from 'react';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';

function AdminRecipeCard({ recipe, setSearchCategories, setSearchDiets, setSelectedRecipe }) {
    const siteURL = import.meta.env.VITE_SITE_URL;

    const handleOpenRecipe = (recipe) => {
        setSelectedRecipe(recipe);
    };


    return (
        <div className="recipe-card" key={recipe.id}>
            <div>
                {recipe.image ? (
                    <img className="img-recipe-card" src={`${siteURL}${recipe.image}`} alt="Recipe Image" />
                ) : (
                    <img className="img-recipe-card" src={`/recipe-images/LzYeux_120719_0033_1800px.jpg`} alt="Recipe Image" />
                )}
                <div className='text-center'>
                    <h4>{recipe.title}</h4>
                </div>
                {recipe.categories && recipe.categories.length > 0 && (
                    <Stack className='box-scroll-x padding-4' direction="row" spacing={1}>
                        {recipe.categories.map((cat, i) => (
                            <Chip
                                key={i}
                                style={{
                                    backgroundColor: "#eee", fontSize: ".9em"
                                }}
                                label={cat}
                                size="small"
                                onClick={() => setSearchCategories(prev => [...prev, cat])}
                            />
                        ))}
                        {recipe.diet_categories.map((diet, i) => (
                            <Chip
                                key={i}
                                style={{
                                    backgroundColor: "#eee", fontSize: ".9em"
                                }}
                                label={diet}
                                size="small"
                                onClick={() => setSearchDiets(prev => [...prev, diet])}
                            />
                        ))}
                    </Stack>
                )}
                <p className="description-preview">
                    {recipe.description}
                </p>
                <button className="btn-market-card" onClick={() => handleOpenRecipe(recipe)}>Select Recipe</button>
            </div>
        </div>
    );
}

export default AdminRecipeCard;
