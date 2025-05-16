import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Fuse from 'fuse.js';
import AdminRecipeCard from './AdminRecipeCard';
import { formatMinutes } from '../../utils/helpers';

function AdminRecipeDelete({ recipes, smallwares, ingredients, recipeIngredients }) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchIngredients, setSearchIngredients] = useState([]);
    const [searchCategories, setSearchCategories] = useState([]);
    const [searchDiets, setSearchDiets] = useState([]);
    const [searchRecipeName, setSearchRecipeName] = useState(null);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [selectedSmallwares, setSelectedSmallwares] = useState([]);
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [selectedRecipeIngredients, setSelectedRecipeIngredients] = useState([]);
    const [selectedInstructionGroups, setSelectedInstructionGroups] = useState([]);
    const [selectedInstructions, setSelectedInstructions] = useState([]);
    

    const dropdownRef = useRef(null);

    const handleClickOutsideDropdown = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setShowDropdown(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutsideDropdown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutsideDropdown);
        };
    }, [showDropdown]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value.toLowerCase());
    };

    const handleIngredientSelect = (ingredient) => {
        if (!searchIngredients.some(i => i.id === ingredient.id)) {
            setSearchIngredients([...searchIngredients, ingredient]);
        }
    };

    const showRIRIIIG = () => {
        if (recipes == null) return false
        if (ingredients == null) return false
        if (recipeIngredients == null) return false
        return true
    }

    const searchableData = useMemo(() => {
        if (showRIRIIIG()) {
            const ingredientData = ingredients.map(item => ({
                type: 'ingredient',
                id: item.id,
                name: item.name,
                name_plural: item.name_plural
            }));

            const recipeData = recipes.map(item => ({
                type: 'recipe',
                id: item.id,
                name: item.title,
                categories: item.categories || [],
                diet_categories: item.diet_categories || []
            }));

            return [...ingredientData, ...recipeData];
        }
    }, [ingredients, recipes]);

    const fuse = useMemo(() => {
        return new Fuse(searchableData, {
            keys: [
                { name: 'name', weight: 0.6 },
                { name: 'name_plural', weight: 0.4 },
                { name: 'categories', weight: 0.3 },
                { name: 'diet_categories', weight: 0.3 },
            ],
            threshold: 0.3,
            ignoreLocation: true,
        });
    }, [searchableData]);

    const searchResults = searchTerm
        ? fuse.search(searchTerm).map(result => result.item)
        : [];

    const combinedSearchItems = useMemo(() => {
        if (showRIRIIIG()) {
            const ingredientItems = ingredients.map(i => ({ type: 'ingredient', ...i }));
            const nameItems = recipes.map(r => ({ type: 'recipe', id: r.id, name: r.title }));
            const categoryItems = [...new Set(recipes.flatMap(r => r.categories || []))].map(cat => ({ type: 'category', name: cat }));
            const dietItems = [...new Set(recipes.flatMap(r => r.diet_categories || []))].map(diet => ({ type: 'diet', name: diet }));
            return [...ingredientItems, ...nameItems, ...categoryItems, ...dietItems];
        }
    }, [ingredients, recipes]);

    const combinedFuse = useMemo(() => {
        return new Fuse(combinedSearchItems, {
            keys: ['name', 'name_plural'],
            threshold: 0.3,
        });
    }, [combinedSearchItems]);

    const displayedRecipes = useMemo(() => {
        let filtered = [...recipes];

        if (searchIngredients.length > 0) {
            const selectedIds = searchIngredients.map(i => i.id);
            const recipeToIngredients = recipeIngredients.reduce((acc, ri) => {
                if (!acc[ri.recipe_id]) acc[ri.recipe_id] = new Set();
                acc[ri.recipe_id].add(ri.ingredient_id);
                return acc;
            }, {});
            const matchedIds = Object.entries(recipeToIngredients)
                .filter(([_, ingSet]) => selectedIds.every(id => ingSet.has(id)))
                .map(([id]) => parseInt(id));
            filtered = filtered.filter(r => matchedIds.includes(r.id));
        }

        if (searchCategories.length > 0) {
            filtered = filtered.filter(r => searchCategories.every(cat => (r.categories || []).includes(cat)));
        }

        if (searchDiets.length > 0) {
            filtered = filtered.filter(r => searchDiets.every(diet => (r.diet_categories || []).includes(diet)));
        }

        if (searchRecipeName) {
            filtered = filtered.filter(r => r.title.toLowerCase().includes(searchRecipeName.toLowerCase()));
        }

        return filtered;
    }, [recipes, searchIngredients, searchCategories, searchDiets, searchRecipeName, recipeIngredients]);

    const showChips = () => {
        if (searchIngredients.length > 0) return true
        if (searchCategories.length > 0) return true
        if (searchDiets.length > 0) return true
        if (searchRecipeName !== null) return true
        return false
    }

    useEffect(() => {
        if (!selectedRecipe) return
        fetch(`/api/recipe-ingredients?recipe_id=${selectedRecipe.id}`, {
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
                setSelectedRecipeIngredients(data);
            })
                .catch(error => console.error('Error fetching recipe ingredients', error));
    }, [selectedRecipe]);

    useEffect(() => {
        if (!selectedRecipe) return
        fetch(`/api/smallwares?recipe_id=${selectedRecipe.id}`, {
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
                setSelectedSmallwares(data);
            })
                .catch(error => console.error('Error fetching smallwares', error));
    }, [selectedRecipe]);

    useEffect(() => {
        if (!selectedRecipe) return
        fetch(`/api/ingredients?recipe_id=${selectedRecipe.id}`, {
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
                setSelectedIngredients(data);
            })
                .catch(error => console.error('Error fetching ingredients', error));
    }, [selectedRecipe]);

    useEffect(() => {
        if (!selectedRecipe) return
        fetch(`/api/instructions?recipe_id=${selectedRecipe.id}`, {
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
                setSelectedInstructions(data);
            })
                .catch(error => console.error('Error fetching instructions', error));
    }, [selectedRecipe]);

    useEffect(() => {
        if (!selectedRecipe) return
        fetch(`/api/instruction-groups?recipe_id=${selectedRecipe.id}`, {
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
                setSelectedInstructionGroups(data);
            })
                .catch(error => console.error('Error fetching instruction groups', error));
    }, [selectedRecipe]);

    const sortedInstructionGroups = useMemo(() => {
        return selectedInstructionGroups
            .sort((a, b) => a.group_number - b.group_number);
    }, [selectedInstructionGroups, selectedRecipe]);

    const instructionsByGroup = useMemo(() => {
        const byGroup = {};
        selectedInstructions
            .sort((a, b) => a.step_number - b.step_number)
            .forEach(i => {
                const key = String(i.instruction_group_id);
                if (!byGroup[key]) {
                    byGroup[key] = [];
                }
                byGroup[key].push(i);
            });
        return byGroup;
    }, [selectedInstructions, selectedRecipe]);

    const handleDeleteRecipe = async (event) => {
        if (confirm(`Are you sure you want to delete ${selectedRecipe.title} and its associated instructions, instruction-groups, and recipe-ingredients?`)) {
            try {
                await fetch(`/api/recipes/${selectedRecipe.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                alert(`Recipe "${selectedRecipe.title}" was successfully deleted.`);
                window.location.href = "/admin/recipes?tab=delete";
            } catch (error) {
                console.error('Error deleting recipe:', error);
                toast.error('An error occurred while deleting the recipe and its associated instructions, instruction-groups, and recipe-ingredients.', {
                    autoClose: 6000,
                });
            }
        } else {
            setQuery('');
        }
    };


    return (
        <>
            <title>Gingham • Admin Recipes • Delete</title>
            <h2 className='margin-t-16'>Delete Recipes</h2>
            <div className='margin-t-16'>
                <table className='table-search-recipe margin-t-16'>
                    <tbody>
                        <tr>
                            <td className='cell-title btn-grey m-hidden'>Search:</td>
                            <td className='cell-text cell-recipe'>
                                <input
                                    className="search-bar"
                                    type="text"
                                    placeholder="Search ingredients, categories, and recipes..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                />
                                <ul className="dropdown-content" ref={dropdownRef}>
                                    {searchTerm && combinedFuse.search(searchTerm).slice(0, 10).map(({ item }) => (
                                        <li
                                            className="search-results"
                                            key={`search-${item.type}-${item.id || item.name}`}
                                            onClick={() => {
                                                if (item.type === 'ingredient') {
                                                    handleIngredientSelect(item);
                                                    setSearchTerm('');
                                                } else if (item.type === 'category') {
                                                    if (!searchCategories.includes(item.name)) {
                                                        setSearchCategories(prev => [...prev, item.name]);
                                                    }
                                                    setSearchTerm('');
                                                } else if (item.type === 'diet') {
                                                    if (!searchDiets.includes(item.name)) {
                                                        setSearchDiets(prev => [...prev, item.name]);
                                                    }
                                                    setSearchTerm('');
                                                } else if (item.type === 'recipe') {
                                                    setSearchRecipeName(item.name);
                                                    setSearchTerm('')
                                                }
                                                setShowDropdown(false);
                                            }}
                                        >
                                            <span className='text-500'>{item.name_plural || item.name}</span>
                                            <span style={{ fontStyle: "italic", fontSize: "0.8em", marginLeft: 6 }}>({item.type})</span>
                                        </li>
                                    ))}
                                </ul>
                            </td>
                            {showChips() && (
                                <td className='cell-text cell-chips'>
                                    <Stack direction="row" spacing={1}>
                                        {searchRecipeName && (
                                            <Chip
                                                label={searchRecipeName}
                                                style={{ backgroundColor: "#eee", fontSize: ".9em" }}
                                                size="small"
                                                onDelete={() => setSearchRecipeName(null)}
                                            />
                                        )}
                                        {searchIngredients.map((ing, i) => (
                                            <Chip 
                                                key={`ing-${i}`}
                                                label={ing.name_plural}
                                                style={{ backgroundColor: "#eee", fontSize: ".9em" }}
                                                size="small"
                                                onDelete={() =>
                                                setSearchIngredients(prev => prev.filter(item => item.id !== ing.id))
                                            } />
                                        ))}
                                        {searchCategories.map((cat, i) => (
                                            <Chip
                                                key={`cat-${i}`}
                                                label={cat}
                                                style={{ backgroundColor: "#eee", fontSize: ".9em" }}
                                                size="small"
                                                onDelete={() =>
                                                setSearchCategories(prev => prev.filter(item => item !== cat))
                                            } />
                                        ))}
                                        {searchDiets.map((diet, i) => (
                                            <Chip 
                                                key={`diet-${i}`}
                                                label={diet}
                                                style={{ backgroundColor: "#eee", fontSize: ".9em" }}
                                                size="small"
                                                onDelete={() =>
                                                setSearchDiets(prev => prev.filter(item => item !== diet))
                                            } />
                                        ))}
                                    </Stack>
                                </td>
                            )}
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="market-cards-container box-scroll-recipe">
                {displayedRecipes
                    .sort((a, b) => b.id - a.id)
                    .map(recipe => (
                        <AdminRecipeCard
                            key={recipe.id}
                            recipe={recipe}
                            setSearchCategories={setSearchCategories}
                            setSearchDiets={setSearchDiets}
                            setSelectedRecipe={setSelectedRecipe}
                        />
                    )
                )}
            </div>
            {selectedRecipe && (
                <>
                    <div className='flex-space-around m-flex-wrap flex-gap-16 margin-t-16 margin-b-16'>
                        <div className='box-recipe-info flex-space-between flex-column'>
                            <div className='badge-container'>
                                <h2 className='margin-t-4 margin-r-8 margin-b-4'>{selectedRecipe.title}</h2>
                                {selectedRecipe.author && <p>by {selectedRecipe.author} {selectedRecipe.is_gingham_team && ("of the Gingham Team")}</p>}
                                {selectedRecipe.attribution && selectedRecipe.attribution_link ? (
                                    <a className='link-underline-inverse' href={selectedRecipe.attribution_link}>{selectedRecipe.attribution}</a>
                                ) : selectedRecipe.attribution && (
                                        <p>{selectedRecipe.attribution}</p>
                                )}
                            </div>
                            <div className='margin-t-8'>
                                {selectedRecipe.categories && selectedRecipe.categories.length > 0 && (
                                    <Stack className='box-scroll' direction="row" spacing={1}>
                                        {selectedRecipe.seasons.map((sea, i) => (
                                            <Chip
                                                key={i}
                                                style={{
                                                    backgroundColor: "#eee", fontSize: ".9em"
                                                }}
                                                label={sea}
                                                size="small"
                                            />
                                        ))}
                                        {selectedRecipe.categories.map((cat, i) => (
                                            <Chip
                                                key={i}
                                                style={{
                                                    backgroundColor: "#eee", fontSize: ".9em"
                                                }}
                                                label={cat}
                                                size="small"
                                            />
                                        ))}
                                        {selectedRecipe.diet_categories.map((diet, i) => (
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
                                    <span><span className='text-500'>Prep:</span><br />{formatMinutes(selectedRecipe.prep_time_minutes)}</span>
                                    <span><span className='text-500'>Cook:</span><br />{formatMinutes(selectedRecipe.cook_time_minutes)}</span>
                                    <span><span className='text-500'>Total:</span><br />{formatMinutes(selectedRecipe.total_time_minutes)}</span>
                                    <span><span className='text-500'>Serves:</span><br />{selectedRecipe.serve_count}</span>
                                </div>
                                <p className='margin-t-8'>{selectedRecipe.description}</p>
                            </div>
                        </div>
                        <div className='width-100'>
                            {selectedRecipe.image ? (
                                <img src={selectedRecipe.image} alt={selectedRecipe.title} className="img-recipe" />
                            ) : (
                                    <img className="img-recipe" src={`/recipe-images/_default-images/${selectedRecipe.image_default}`} alt="Recipe Image" />
                            )}
                        </div>
                    </div>
                    {selectedSmallwares && (
                        <div className="box-recipe">
                            <h3 className='text-underline'>Smallwares</h3>
                                <article className='column-2'>
                                <ul className='ul-bullet'>
                                    {selectedSmallwares.map((item, index) => (
                                        <li key={index}>
                                            <span className='text-700'>
                                                {item.smallware}<span className="text-300">{item.smallware_alt && ' or '}</span>{item.smallware_alt}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        </div>
                    )}
                    <div className="box-recipe margin-t-16">
                        <h3 className="text-underline">Ingredients</h3>
                        <article className='column-3'>
                            <ul className="ul-bullet ol-last">
                                {selectedRecipeIngredients.map(ri => {
                                    const ingredient = selectedIngredients.find(i => i.id === ri.ingredient_id);
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
                                                    <>
                                                        <li key={instruction.id} className='ol-bold'>{instruction.description}</li>
                                                        {instruction.images && (
                                                            <>
                                                                {Object.keys(instruction.images || {})
                                                                    .sort((a, b) => Number(a) - Number(b))
                                                                    .map(key => {
                                                                        const image = instruction.images[key];
                                                                        const caption = instruction.captions?.[key] || '';
                                                                        return (
                                                                            <div key={key} className="margin-b-8">
                                                                                <img
                                                                                    src={image}
                                                                                    alt={`Instruction image ${key}`}
                                                                                    className="img-market-card margin-l-20"
                                                                                />
                                                                                {caption && (
                                                                                    <p className="text-caption margin-l-20">{caption}</p>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })
                                                                }
                                                            </>
                                                        )}
                                                    </>
                                                    
                                                ))}
                                            </ol>
                                        </div>
                                        {rest.length > 0 && (
                                            <ol className='ul-numbers ol-last' start={firstTwo.length + 1}>
                                                {rest.map(instruction => (
                                                    <>
                                                        <li key={instruction.id + '-rest'} className='ol-bold'>{instruction.description}</li>
                                                        {instruction.images && (
                                                            <>
                                                                {Object.keys(instruction.images || {})
                                                                    .sort((a, b) => Number(a) - Number(b))
                                                                    .map(key => {
                                                                        const image = instruction.images[key];
                                                                        const caption = instruction.captions?.[key] || '';
                                                                        return (
                                                                            <div key={key} className="margin-b-8">
                                                                                <img
                                                                                    src={image}
                                                                                    alt={`Instruction image ${key}`}
                                                                                    className="img-market-card margin-l-20"
                                                                                />
                                                                                {caption && (
                                                                                    <p className="text-caption margin-l-20">{caption}</p>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })
                                                                }
                                                            </>
                                                        )}
                                                    </>
                                                ))}
                                            </ol>
                                        )}
                                    </div>
                                );
                            })}
                        </article>
                    </div>
                    <button className='btn btn-reset btn-red margin-t-12' onClick={handleDeleteRecipe}>
                        Delete Recipe
                    </button>
                </>
            )}
        </>
    );
}

export default AdminRecipeDelete;