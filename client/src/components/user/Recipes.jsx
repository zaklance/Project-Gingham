import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'react-toastify';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Fuse from 'fuse.js';
import RecipeCard from './RecipeCard';

const Recipes = () => {
    const [recipes, setRecipes] = useState([]);
    const [recipeFavs, setRecipeFavs] = useState([]);
    const [isClicked, setIsClicked] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [ingredients, setIngredients] = useState([]);
    const [recipeIngredients, setRecipeIngredients] = useState([]);
    const [smallwares, setSmallwares] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [selectedSeasons, setSelectedSeasons] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedDiets, setSelectedDiets] = useState([]);
    const [selectedSmallwares, setSelectedSmallwares] = useState([]);
    const [selectedRecipeName, setSelectedRecipeName] = useState(null);
    const [selectedAuthor, setSelectedAuthor] = useState(null);

    const userId = parseInt(globalThis.localStorage.getItem('user_id'));
    const { handlePopup } = useOutletContext();
    const token = localStorage.getItem('user_jwt-token');
    const dropdownRef = useRef(null);


    useEffect(() => {
        fetch('/api/recipes', {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then(data => {
                setRecipes(data);
            })
                .catch(error => console.error('Error fetching recipes', error));
    }, []);

    useEffect(() => {
        fetch('/api/recipe-ingredients', {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then(data => {
                setRecipeIngredients(data);
            })
                .catch(error => console.error('Error fetching recipe ingredients', error));
    }, []);
    
    useEffect(() => {
        fetch('/api/smallwares', {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then(data => {
                setSmallwares(data);
            })
                .catch(error => console.error('Error fetching smallwares', error));
    }, []);

    useEffect(() => {
        fetch('/api/ingredients', {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then(data => {
                setIngredients(data);
            })
                .catch(error => console.error('Error fetching ingredients', error));
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
        .then(res => res.json())
        .then(data => {
            setRecipeFavs(data);
        })
    }, [userId]);

    useEffect(() => {
        if (recipes) {
            const updatedIsClicked = recipes.reduce((acc, recipe) => {
                acc[recipe.id] = recipeFavs.some(fav => fav.recipe_id === recipe.id);
                return acc;
            }, {});
            setIsClicked(updatedIsClicked);
        }
    }, [recipes, recipeFavs, userId]);

    const handleClick = async (recipeId) => {
        if (globalThis.localStorage.getItem('user_id') !== null) {
            if (isClicked[recipeId] == false) {
                const response = await fetch('/api/recipe-favorites', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: userId,
                        recipe_id: recipeId
                    })
                }).then((resp) => {
                    return resp.json()
                }).then(data => {
                    setRecipeFavs([...recipeFavs, data]);
                    toast.success('Added to favorites!', {
                        autoClose: 3000,
                    });
                    setIsClicked((prevState) => ({
                        ...prevState,
                        [recipeId]: !prevState[recipeId]
                    }));
                });
            } else {
                const findRecipeFavId = recipeFavs.filter(item => item.recipe_id == recipeId)
                for (const item of findRecipeFavId) {
                    fetch(`/api/recipe-favorites/${item.id}`, {
                        method: "DELETE",
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                    }).then(() => {
                        setRecipeFavs((favs) => favs.filter((fav) => fav.recipe_id !== recipeId));
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

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value.toLowerCase());
    };

    const handleIngredientSelect = (ingredient) => {
        if (!selectedIngredients.some(i => i.id === ingredient.id)) {
            setSelectedIngredients([...selectedIngredients, ingredient]);
        }
    };
    
    const combinedSearchItems = useMemo(() => {
        const ingredientItems = ingredients.map(i => ({ type: 'ingredient', ...i }));
        const nameItems = recipes.map(r => ({ type: 'recipe', id: r.id, name: r.title }));
        const uniqueAuthors = [...new Set(recipes.map(r => r.author).filter(Boolean))];
        const authorItems = uniqueAuthors.map(name => ({ type: 'author', name }));
        const seasonItems = [...new Set(recipes.flatMap(r => r.seasons || []))].map(sea => ({ type: 'season', name: sea }));
        const categoryItems = [...new Set(recipes.flatMap(r => r.categories || []))].map(cat => ({ type: 'category', name: cat }));
        const dietItems = [...new Set(recipes.flatMap(r => r.diet_categories || []))].map(diet => ({ type: 'diet', name: diet }));
        const smallwareItems = [...new Set(
            smallwares.flatMap(sw => [sw.smallware, sw.smallware_alt].filter(Boolean))
        )].map(name => ({ type: 'smallware', name }));
        return [...ingredientItems, ...nameItems, ...authorItems, ...seasonItems, ...categoryItems, ...dietItems, ...smallwareItems];
    }, [ingredients, recipes, smallwares]);

    const combinedFuse = useMemo(() => {
        return new Fuse(combinedSearchItems, {
            keys: ['name'],
            threshold: 0.3,
        });
    }, [combinedSearchItems]);

    const displayedRecipes = useMemo(() => {
        let filtered = [...recipes];

        if (selectedIngredients.length > 0) {
            const selectedIds = selectedIngredients.map(i => i.id);
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

        if (selectedSmallwares.length > 0) {
            const recipeIdToSmallwareNames = smallwares.reduce((acc, sw) => {
                const names = [sw.smallware];
                if (sw.smallware_alt) names.push(sw.smallware_alt);
                if (!acc[sw.recipe_id]) acc[sw.recipe_id] = new Set();
                names.forEach(name => acc[sw.recipe_id].add(name));
                return acc;
            }, {});

            const matchedIds = Object.entries(recipeIdToSmallwareNames)
                .filter(([_, nameSet]) =>
                    selectedSmallwares.every(sw => nameSet.has(sw))
                )
                .map(([id]) => parseInt(id));
            filtered = filtered.filter(r => matchedIds.includes(r.id));
        }

        if (selectedSeasons.length > 0) {
            filtered = filtered.filter(r => selectedSeasons.every(sea => (r.seasons || []).includes(sea)));
        }
        if (selectedCategories.length > 0) {
            filtered = filtered.filter(r => selectedCategories.every(cat => (r.categories || []).includes(cat)));
        }
        if (selectedDiets.length > 0) {
            filtered = filtered.filter(r => selectedDiets.every(diet => (r.diet_categories || []).includes(diet)));
        }
        if (selectedRecipeName) {
            filtered = filtered.filter(r => r.title.toLowerCase().includes(selectedRecipeName.toLowerCase()));
        }
        if (selectedAuthor) {
            filtered = filtered.filter(r => r.author.toLowerCase().includes(selectedAuthor.toLowerCase()));
        }

        return filtered;
    }, [recipes, selectedIngredients, selectedSeasons, selectedCategories, selectedDiets, selectedRecipeName, selectedSmallwares, selectedAuthor, recipeIngredients]);

    const showChips = () => {
        return (
            selectedIngredients.length > 0 ||
            selectedSeasons.length > 0 ||
            selectedCategories.length > 0 ||
            selectedDiets.length > 0 ||
            selectedSmallwares.length > 0 ||
            selectedAuthor !== null ||
            selectedRecipeName !== null
        );
    };

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


    return (
        <>
            <title>Gingham • Recipes</title>
            <h1>Recipes!</h1>
            <table className='table-search-recipe margin-t-16'>
                <tbody>
                    <tr>
                        <td className='cell-title btn-grey m-hidden'>Search:</td>
                        <td className='cell-text cell-recipe'>
                            <input
                                className="search-bar"
                                type="text"
                                placeholder="Search ingredients, recipes, seasons, categories, diets, smallwares, and authors..."
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
                                            } else if (item.type === 'season') {
                                                if (!selectedSeasons.includes(item.name)) {
                                                    setSelectedSeasons(prev => [...prev, item.name]);
                                                }
                                                setSearchTerm('');
                                            } else if (item.type === 'category') {
                                                if (!selectedCategories.includes(item.name)) {
                                                    setSelectedCategories(prev => [...prev, item.name]);
                                                }
                                                setSearchTerm('');
                                            } else if (item.type === 'diet') {
                                                if (!selectedDiets.includes(item.name)) {
                                                    setSelectedDiets(prev => [...prev, item.name]);
                                                }
                                                setSearchTerm('');
                                            } else if (item.type === 'recipe') {
                                                setSelectedRecipeName(item.name);
                                                setSearchTerm('')
                                            } else if (item.type === 'author') {
                                                setSelectedAuthor(item.name);
                                                setSearchTerm('')
                                            } else if (item.type === 'smallware') {
                                                if (!selectedSmallwares.includes(item.name)) {
                                                    setSelectedSmallwares(prev => [...prev, item.name]);
                                                }
                                                setSearchTerm('');
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
                                    {selectedRecipeName && (
                                        <Chip
                                            label={selectedRecipeName}
                                            style={{ backgroundColor: "#eee", fontSize: ".9em" }}
                                            size="small"
                                            onDelete={() => setSelectedRecipeName(null)}
                                        />
                                    )}
                                    {selectedAuthor && (
                                        <Chip
                                            label={selectedAuthor}
                                            style={{ backgroundColor: "#eee", fontSize: ".9em" }}
                                            size="small"
                                            onDelete={() => setSelectedAuthor(null)}
                                        />
                                    )}
                                    {selectedIngredients.map((ing, i) => (
                                        <Chip 
                                            key={`ing-${i}`}
                                            label={ing.name_plural}
                                            style={{ backgroundColor: "#eee", fontSize: ".9em" }}
                                            size="small"
                                            onDelete={() =>
                                            setSelectedIngredients(prev => prev.filter(item => item.id !== ing.id))
                                        } />
                                    ))}
                                    {selectedSeasons.map((sea, i) => (
                                        <Chip
                                            key={`sea-${i}`}
                                            label={sea}
                                            style={{ backgroundColor: "#eee", fontSize: ".9em" }}
                                            size="small"
                                            onDelete={() =>
                                            setSelectedSeasons(prev => prev.filter(item => item !== sea))
                                        } />
                                    ))}
                                    {selectedCategories.map((cat, i) => (
                                        <Chip
                                            key={`cat-${i}`}
                                            label={cat}
                                            style={{ backgroundColor: "#eee", fontSize: ".9em" }}
                                            size="small"
                                            onDelete={() =>
                                            setSelectedCategories(prev => prev.filter(item => item !== cat))
                                        } />
                                    ))}
                                    {selectedDiets.map((diet, i) => (
                                        <Chip 
                                            key={`diet-${i}`}
                                            label={diet}
                                            style={{ backgroundColor: "#eee", fontSize: ".9em" }}
                                            size="small"
                                            onDelete={() =>
                                            setSelectedDiets(prev => prev.filter(item => item !== diet))
                                        } />
                                    ))}
                                    {selectedSmallwares.map((sw, i) => (
                                        <Chip
                                            key={`sw-${i}`}
                                            label={sw}
                                            style={{ backgroundColor: "#eee", fontSize: ".9em" }}
                                            size="small"
                                            onDelete={() =>
                                                setSelectedSmallwares(prev => prev.filter(item => item !== sw))
                                            }
                                        />
                                    ))}
                                </Stack>
                            </td>
                        )}
                    </tr>
                </tbody>
            </table>
            <div className="market-cards-container">
                {displayedRecipes
                    .sort((a, b) => b.id - a.id)
                    .map(recipe => (
                        <RecipeCard
                            key={recipe.id}
                            recipe={recipe}
                            recipeFavs={recipeFavs}
                            handleClick={handleClick}
                            isClicked={isClicked}
                            setSelectedCategories={setSelectedCategories}
                            setSelectedDiets={setSelectedDiets}
                        />
                    )
                )}
            </div>
        </>
    );
};

export default Recipes;