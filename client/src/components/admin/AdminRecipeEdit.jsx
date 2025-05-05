import React, { useEffect, useMemo, useRef, useState} from 'react';
import { toast } from 'react-toastify';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Fuse from 'fuse.js';
import AdminRecipeCard from './AdminRecipeCard';

function AdminRecipeEdit({ recipes, ingredients, recipeIngredients, instructions, instructionGroups }) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedDiets, setSelectedDiets] = useState([]);
    const [selectedRecipeName, setSelectedRecipeName] = useState(null);

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
        if (!selectedIngredients.some(i => i.id === ingredient.id)) {
            setSelectedIngredients([...selectedIngredients, ingredient]);
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

        if (selectedCategories.length > 0) {
            filtered = filtered.filter(r => selectedCategories.every(cat => (r.categories || []).includes(cat)));
        }

        if (selectedDiets.length > 0) {
            filtered = filtered.filter(r => selectedDiets.every(diet => (r.diet_categories || []).includes(diet)));
        }

        if (selectedRecipeName) {
            filtered = filtered.filter(r => r.title.toLowerCase().includes(selectedRecipeName.toLowerCase()));
        }

        return filtered;
    }, [recipes, selectedIngredients, selectedCategories, selectedDiets, selectedRecipeName, recipeIngredients]);

    const showChips = () => {
        if (selectedIngredients.length > 0) return true
        if (selectedCategories.length > 0) return true
        if (selectedDiets.length > 0) return true
        if (selectedRecipeName !== null) return true
        return false
    }


    return (
        <>
            <title>Gingham • Admin Recipes • Edit</title>
            <div className='margin-t-16'>
                <h2>Edit Recipes</h2>
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
                                    </Stack>
                                </td>
                            )}
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="market-cards-container">
                {displayedRecipes.map(recipe => (
                    <AdminRecipeCard
                        key={recipe.id}
                        recipe={recipe}
                        setSelectedCategories={setSelectedCategories}
                        setSelectedDiets={setSelectedDiets}
                    />
                ))}
            </div>
        </>
    );
}

export default AdminRecipeEdit;