import React from 'react';
import { useNavigate } from 'react-router-dom';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import { formatMinutes } from '@repo/ui/helpers.js';

function RecipeCard({ recipe, recipeFavs, handleClick, isClicked, setSelectedCategories, setSelectedDiets }) {
    const navigate = useNavigate();

    const siteURL = import.meta.env.VITE_SITE_URL;

    const handleOpenRecipe = (recipe) => {
        navigate(`/recipes/${recipe.id}`);
    };


    return (
        <div className="recipe-card" key={recipe.id}>
            <div>
                <div className='badge-container'>
                    {recipe?.image ? (
                        <img className="img-recipe-card" src={`${siteURL}${recipe.image}`} alt="Recipe Image" />
                    ) : (
                        <img className="img-recipe-card" src={`/recipe-images/_default-images/${recipe.image_default}`} alt="Recipe Image" />
                    )}
                    <button
                        className={`badge-fav-recipe-card btn-fav-blog margin-l-8 ${isClicked[recipe.id] || recipeFavs.some(fav => fav.recipe_id === recipe.id) ? 'btn-fav-blog-on margin-l-8' : ''}`}
                        title={isClicked[recipe.id] || recipeFavs.some(fav => fav.blog_id === recipe.id) ? 'remove blog from favorites' : 'save blog as favorite'}
                        onClick={(e) => handleClick(recipe.id)}>&emsp;
                    </button>
                </div>
                <div className='text-center'>
                    <h4>{recipe.title}</h4>
                    <h6 className='margin-t-4'>by {recipe.author}</h6>
                </div>
                {(recipe.categories && recipe.diet_categories) && (recipe.categories.length > 0 || recipe.diet_categories.length > 0) && (
                    <Stack className='box-scroll-x padding-4' direction="row" spacing={1}>
                        {recipe.seasons.map((sea, i) => (
                            <Chip
                                key={i}
                                style={{
                                    backgroundColor: "#eee", fontSize: ".9em"
                                }}
                                label={sea}
                                size="small"
                            />
                        ))}
                        {recipe.categories.map((cat, i) => (
                            <Chip
                                key={i}
                                style={{
                                    backgroundColor: "#eee", fontSize: ".9em"
                                }}
                                label={cat}
                                size="small"
                                onClick={() => setSelectedCategories(prev => [...prev, cat])}
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
                                onClick={() => setSelectedDiets(prev => [...prev, diet])}
                            />
                        ))}
                    </Stack>
                )}
                <p className="description-preview">
                    {recipe.description}
                </p>
                <button className="btn-market-card" onClick={() => handleOpenRecipe(recipe)}>Learn More!</button>
            </div>
        </div>
    );
}

export default RecipeCard;
