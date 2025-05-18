import React, { useEffect, useMemo, useState }  from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import { toast } from 'react-toastify';
import { formatMinutes } from '../../utils/helpers';

function RecipeDetail() {
    const [recipe, setRecipe] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [recipeIngredients, setRecipeIngredients] = useState([]);
    const [smallwares, setSmallwares] = useState([]);
    const [instructionGroups, setInstructionGroups] = useState([]);
    const [instructions, setInstructions] = useState([]);
    const [recipeFavs, setRecipeFavs] = useState([]);
    const [isClicked, setIsClicked] = useState(false);

    const { id } = useParams();
    const { handlePopup } = useOutletContext();
    const userId = parseInt(globalThis.localStorage.getItem('user_id'));
    const token = localStorage.getItem('user_jwt-token');


    useEffect(() => {
        fetch(`/api/recipes/${id}`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            setRecipe(data);
        })
        .catch(error => console.error('Error fetching recipes', error));
    }, []);
    
    useEffect(() => {
        fetch(`/api/recipe-ingredients?recipe_id=${id}`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            setRecipeIngredients(data);
        })
        .catch(error => console.error('Error fetching recipe ingredients', error));
    }, []);

    useEffect(() => {
        fetch(`/api/ingredients?recipe_id=${id}`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            setIngredients(data);
        })
        .catch(error => console.error('Error fetching ingredients', error));
    }, []);

    useEffect(() => {
        fetch(`/api/smallwares?recipe_id=${id}`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            setSmallwares(data);
        })
        .catch(error => console.error('Error fetching smallwares', error));
    }, []);

    useEffect(() => {
        fetch(`/api/instructions?recipe_id=${id}`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            setInstructions(data);
        })
        .catch(error => console.error('Error fetching instructions', error));
    }, []);

    useEffect(() => {
        fetch(`/api/instruction-groups?recipe_id=${id}`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            setInstructionGroups(data);
        })
        .catch(error => console.error('Error fetching instruction groups', error));
    }, []);

    useEffect(() => {
        if (!userId) {
            return
        }
        fetch(`/api/recipe-favorites?user_id=${userId}`, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            setRecipeFavs(data);
        })
    }, [userId]);

    useEffect(() => {
        if (recipe && recipeFavs.some(fav => fav.recipe_id === recipe.id)) {
            setIsClicked(true);
        }
    }, [recipe, recipeFavs]);

    const handleClick = async () => {
        if (globalThis.localStorage.getItem('user_id') !== null) {
            setIsClicked((isClick) => !isClick);
            if (isClicked == false) {
                const response = await fetch('/api/recipe-favorites', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: userId,
                        recipe_id: id
                    })
                }).then((resp) => {
                    return resp.json()
                }).then(data => {
                    setRecipeFavs([...recipeFavs, data]);
                    toast.success('Added to favorites!', {
                        autoClose: 3000,
                    });
                });
            } else {
                const findRecipeFavId = recipeFavs.filter(item => item.recipe_id == recipe.id)
                for (const item of findRecipeFavId) {
                    fetch(`/api/recipe-favorites/${item.id}`, {
                        method: "DELETE",
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                    }).then(() => {
                        setRecipeFavs((favs) => favs.filter((fav) => fav.recipe_id !== recipe.id));
                        toast.success('Removed from favorites!', {
                            autoClose: 3000,
                        });
                    })
                }
            }
        } else {
            handlePopup();
        }
    };

    const sortedInstructionGroups = useMemo(() => {
        return instructionGroups
            .sort((a, b) => a.group_number - b.group_number);
    }, [instructionGroups, recipe]);

    const instructionsByGroup = useMemo(() => {
        const byGroup = {};
        instructions
            .sort((a, b) => a.step_number - b.step_number)
            .forEach(i => {
                const key = String(i.instruction_group_id);
                if (!byGroup[key]) {
                    byGroup[key] = [];
                }
                byGroup[key].push(i);
            });
        return byGroup;
    }, [instructions, recipe]);


    return (
        <>
            <div>
                <div className='flex-space-around m-flex-wrap flex-gap-16 margin-b-16'>
                    <div className='box-recipe-info flex-space-between flex-column'>
                        <div className='badge-container'>
                            <h2 className='margin-t-4 margin-r-8 margin-b-4'>{recipe.title}</h2>
                            <div className='badge-fav-recipe'>
                                <button
                                    className={`btn-fav-blog ${isClicked || recipeFavs.some(fav => fav.recipe_id === recipe.id) ? 'btn-fav-blog-on' : ''}`}
                                    onClick={handleClick}>&emsp;
                                </button>
                            </div>
                            {recipe.author && <p>by {recipe.author} {recipe.is_gingham_team && ("of the Gingham Team")}</p>}
                            {recipe.attribution && recipe.attribution_link ? (
                                <a className='link-underline-inverse' href={recipe.attribution_link}>{recipe.attribution}</a>
                            ) : recipe.attribution && (
                                <p>{recipe.attribution}</p>
                            )}
                        </div>
                        <div className='margin-t-8'>
                            {recipe.categories && recipe.categories.length > 0 && (
                                <Stack className='box-scroll' direction="row" spacing={1}>
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
                                        />
                                    ))}
                                </Stack>
                            )}
                            <div className="flex-start flex-gap-24 margin-t-4">
                                <span><span className='text-500'>Prep:</span><br/>{formatMinutes(recipe.prep_time_minutes)}</span>
                                <span><span className='text-500'>Cook:</span><br/>{formatMinutes(recipe.cook_time_minutes)}</span>
                                <span><span className='text-500'>Total:</span><br/>{formatMinutes(recipe.total_time_minutes)}</span>
                                <span><span className='text-500'>Serves:</span><br/>{recipe.serve_count}</span>
                                <span><span className='text-500'>Skill:</span><br/>{recipe.skill_level}</span>
                            </div>
                            <p className='margin-t-8'>{recipe.description}</p>
                        </div>
                    </div>
                    <div className='width-100'>
                        {recipe.image ? (
                            <img src={recipe.image} alt={recipe.title} className="img-recipe" />
                        ) : (
                            <img className="img-recipe" src={`/recipe-images/_default-images/${recipe.image_default}`} alt="Recipe Image" />
                        )}
                    </div>
                </div>
            </div>
            <div className="box-recipe margin-t-16">
                <h3 className="text-underline">Ingredients</h3>
                <article className='column-3'>
                    <ul className="ul-bullet ol-last">
                        {recipeIngredients.map(ri => {
                            const ingredient = ingredients.find(i => i.id === ri.ingredient_id);
                            if (!ingredient) return null;
                            const name = ri.plural ? ingredient.name_plural : ingredient.name;
                            return (
                                <li key={ri.id}>
                                    <span className="text-500">{ri.amount}</span> {name}{ri.description ? `, ${ri.description}` : ''}
                                </li>
                            );
                        })}
                    </ul>
                </article>
            </div>
            {smallwares && (
                <div className="box-recipe margin-t-16">
                    <h3 className="text-underline">Smallwares</h3>
                    <article className='column-2'>
                        <ul className="ul-bullet ol-last">
                            {smallwares?.map(s => {
                                return (
                                    <li key={s.id}>
                                        <span className="text-500">{s.smallware}{s.smallware_alt && <span className="text-300"> or </span>}{s.smallware_alt && s.smallware_alt}</span>{s.description && `, ${s.description}`}
                                    </li>
                                );
                            })}
                        </ul>
                    </article>
                </div>
            )}
            <div className="box-recipe margin-t-16">
                <h3 className="text-underline">Instructions</h3>
                <article className='column-3'>
                    {sortedInstructionGroups.map(group => {
                        const items = instructionsByGroup[String(group.id)] || [];
                        const firstTwo = items.slice(0, 2);
                        const rest = items.slice(2);
                        const isSingleOl = rest.length === 0;

                        return (
                            <div key={group.id}>
                                <div className='text-block-header'>
                                    {group.title && <h4>{group.title}</h4>}
                                    <ol className={`ul-numbers ${isSingleOl ? 'ol-last' : ''}`}>
                                        {firstTwo.map(instruction => (
                                            <li key={`instr-li-${instruction.id}`} className='ol-bold li-recipe-image'>
                                                <p className='margin-b-4'>{instruction.description}</p>
                                                {instruction.images && (
                                                    <>
                                                        {Object.keys(instruction.images || {})
                                                            .sort((a, b) => Number(a) - Number(b))
                                                            .map(key => {
                                                                const image = instruction.images[key];
                                                                const caption = instruction.captions?.[key] || '';
                                                                return (
                                                                    <div key={`sig-li-${key}`} className="no-break margin-b-4">
                                                                        <img
                                                                            src={image}
                                                                            alt={`Instruction image ${key}`}
                                                                            className="img-market-card"
                                                                        />
                                                                        {caption && (
                                                                            <p className="text-caption margin-l-2">{caption}</p>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })
                                                        }
                                                    </>
                                                )}
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                                {rest.length > 0 && (
                                    <ol className='ul-numbers ol-last' start={firstTwo.length + 1}>
                                        {rest.map(instruction => (
                                            <li key={`instr-li-${instruction.id}`} className='ol-bold li-recipe-image'>
                                                <p className='margin-b-4'>{instruction.description}</p>
                                                {instruction.images && (
                                                    <>
                                                        {Object.keys(instruction.images || {})
                                                            .sort((a, b) => Number(a) - Number(b))
                                                            .map(key => {
                                                                const image = instruction.images[key];
                                                                const caption = instruction.captions?.[key] || '';
                                                                return (
                                                                    <div key={`sig-li-${key}`} className="no-break margin-b-4">
                                                                        <img
                                                                            src={image}
                                                                            alt={`Instruction image ${key}`}
                                                                            className="img-market-card"
                                                                        />
                                                                        {caption && (
                                                                            <p className="text-caption margin-l-2">{caption}</p>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })
                                                        }
                                                    </>
                                                )}
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </div>
                        );
                    })}
                </article>
            </div>
        </>
    );
}

export default RecipeDetail;