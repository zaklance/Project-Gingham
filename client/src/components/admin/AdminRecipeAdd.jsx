import React, { useEffect, useMemo, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Fuse from 'fuse.js';

function AdminRecipeAdd({ recipes, ingredients, recipeIngredients, instructions, instructionGroups }) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [ingredientSearch, setIngredientSearch] = useState('');
    const [categorySearch, setCategorySearch] = useState('');
    const [dietSearch, setDietSearch] = useState('');
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedDiets, setSelectedDiets] = useState([]);
    const [newRecipe, setNewRecipe] = useState([]);
    const [newIngName, setNewIngName] = useState([]);
    const [newIngNamePlural, setNewIngNamePlural] = useState([]);
    const [newRecipeIngredients, setNewRecipeIngredients] = useState([]);
    const [newInstructionGroups, setNewInstructionGroups] = useState([{ id: Date.now(), group_number: 1, title: '' }]);
    const [newInstructions, setNewInstructions] = useState([]);
    const [image, setImage] = useState(null)
    const [status, setStatus] = useState('initial')

    const ingredientDropdownRef = useRef(null);
    const categoryDropdownRef = useRef(null);
    const dietDropdownRef = useRef(null);

    const handleClickOutsideDropdown = (event) => {
        if (ingredientDropdownRef.current && !ingredientDropdownRef.current.contains(event.target)) {
            setIngredientSearch('');
        }
        if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
            setCategorySearch('');
        }
        if (dietDropdownRef.current && !dietDropdownRef.current.contains(event.target)) {
            setDietSearch('');
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutsideDropdown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutsideDropdown);
        };
    }, [showDropdown]);

    const handleRecipeInputChange = (event) => {
        const { name, value } = event.target;
        setNewRecipe((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const ingredientFuse = useMemo(() => {
        if (ingredients) {
            return new Fuse(ingredients, {
                keys: ['name', 'name_plural'],
                threshold: 0.3,
                ignoreLocation: true,
            });
        }
        return null;
    }, [ingredients]);

    const categoryFuse = useMemo(() => {
        if (recipes) {
            const categories = [...new Set(recipes.flatMap(r => r.categories || []))].map(cat => ({ name: cat }));
            return new Fuse(categories, {
                keys: ['name'],
                threshold: 0.3,
            });
        }
        return null;
    }, [recipes]);

    const dietFuse = useMemo(() => {
        if (recipes) {
            const diets = [...new Set(recipes.flatMap(r => r.diet_categories || []))].map(diet => ({ name: diet }));
            return new Fuse(diets, {
                keys: ['name'],
                threshold: 0.3,
            });
        }
        return null;
    }, [recipes]);

    const handleAddCategory = () => {
        const newCategory = categorySearch.trim().toLowerCase();
        if (
            newCategory &&
            !selectedCategories.includes(newCategory) &&
            !recipes.some(recipe =>
                recipe.categories.map(cat => cat.toLowerCase()).includes(newCategory)
            )
        ) {
            setSelectedCategories([...selectedCategories, newCategory]);
            setCategorySearch('');
        }
    };

    const handleAddDiet = () => {
        const newDiet = dietSearch.trim().toLowerCase();
        if (
            newDiet &&
            !selectedDiets.includes(newDiet) &&
            !recipes.some(recipe =>
                recipe.diet_categories.map(diet => diet.toLowerCase()).includes(newDiet)
            )
        ) {
            setSelectedDiets([...selectedDiets, newDiet]);
            setDietSearch('');
        }
    };

    const handleAddIngredient = async () => {
        const singular = newIngName.trim();
        const plural = newIngNamePlural.trim();

        if (!singular || !plural) {
            toast.error("Please enter both singular and plural names.");
            return;
        }

        const existing = ingredients.find(
            ing => ing.name.toLowerCase() === singular.toLowerCase() || ing.name_plural.toLowerCase() === plural.toLowerCase()
        );

        let ingredient;
        if (existing) {
            ingredient = existing;
        } else {
            try {
                const res = await fetch("/api/ingredients", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: singular, name_plural: plural }),
                });
                if (!res.ok) throw new Error("Failed to add ingredient.");
                ingredient = await res.json();
                // Update local ingredient list
                ingredients.push(ingredient);
            } catch (err) {
                toast.error(err.message || "Error adding ingredient.");
                return;
            }
        }

        setNewRecipeIngredients(prev => [
            ...prev,
            {
                ingredient_id: ingredient.id,
                ingredient,
                plural: false,
                amount: '',
                description: '',
            },
        ]);

        setNewIngName('');
        setNewIngNamePlural('');
    };

    const handleAddExistingIngredient = async (singular, plural) => {
        const existing = ingredients.find(
            ing => ing.name.toLowerCase() === singular.toLowerCase() || ing.name_plural.toLowerCase() === plural.toLowerCase()
        );

        setNewRecipeIngredients(prev => [
            ...prev,
            {
                ingredient_id: existing.id,
                ingredient: existing,
                plural: false,
                amount: '',
                description: '',
            },
        ]);

        setNewIngName('');
        setNewIngNamePlural('');
    };

    const handleAddInstructionGroup = () => {
        const newGroupNumber = newInstructionGroups.length + 1;
        const newGroupId = Date.now();
        setNewInstructionGroups(prev => [...prev, { id: newGroupId, group_number: newGroupNumber, title: '' }]);
    };

    const handleDeleteInstructionGroup = (groupIdToDelete) => {
        setNewInstructionGroups(prev => {
            if (prev.length <= 1) return prev;
            const filtered = prev.filter(g => g.id !== groupIdToDelete);
            return filtered.map((g, i) => ({ ...g, group_number: i + 1 }));
        });
        setNewInstructions(prev => 
            prev.filter(instr => instr.instruction_group_id !== groupIdToDelete)
        );
    };

    const handleAddInstruction = (groupId) => {
        const groupInstructions = newInstructions.filter(i => i.instruction_group_id === groupId);
        const stepNumber = groupInstructions.length + 1;
        const newInstruction = {
            instruction_group_id: groupId,
            step_number: stepNumber,
            description: ''
        };
        setNewInstructions(prev => [...prev, newInstruction]);
    };

    const handleDeleteInstruction = (groupId, stepToRemove) => {
        const updated = newInstructions
            .filter(i => !(i.instruction_group_id === groupId && i.step_number === stepToRemove))
            .map(i => {
                if (i.instruction_group_id === groupId && i.step_number > stepToRemove) {
                    return { ...i, step_number: i.step_number - 1 };
                }
                return i;
            });
        setNewInstructions(updated);
    };

    const handleFileChange = (event) => {
        if (event.target.files) {
            const file = event.target.files[0];
            const maxFileSize = 5 * 1024 * 1024; // 5 MB limit

            if (file.size > maxFileSize) {
                toast.warning('File size exceeds 5 MB. Please upload a smaller file', {
                    autoClose: 4000,
                });
                return;
            }

            setStatus('initial');
            setImage(file);
        }
    };

    const handleImageUpload = async (recipeId) => {
        const formData = new FormData();
        formData.append('file', image);
        formData.append('type', 'recipe');
        formData.append('recipe_id', recipeId);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Image uploaded successfully:', data);
            } else {
                console.error('Failed to upload image');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
        }
    };

    const handleCreateRecipe = async () => {
        const requiredFields = ['title', 'description', 'author', 'prep_time_minutes', 'cook_time_minutes', 'serve_count'];
        for (const field of requiredFields) {
            if (!newRecipe[field] || newRecipe[field].toString().trim() === '') {
                toast.error(`Missing required field: ${field.replace('_', ' ')}`);
                return;
            }
        }

        try {
            const nonEmptyInstructionGroups = newInstructionGroups
                .map(group => {
                    const groupInstructions = newInstructions.filter(instr => instr.instruction_group_id === group.id);
                    if (groupInstructions.length === 0) return null;
                    return {
                        ...group,
                        instructions: groupInstructions,
                    };
                })
                .filter(Boolean);

            const fullRecipePayload = {
                ...newRecipe,
                prep_time_minutes: parseInt(newRecipe.prep_time_minutes),
                cook_time_minutes: parseInt(newRecipe.cook_time_minutes),
                total_time_minutes: parseInt(newRecipe.cook_time_minutes) + parseInt(newRecipe.prep_time_minutes),
                serve_count: parseInt(newRecipe.serve_count),
                categories: selectedCategories,
                diet_categories: selectedDiets,
                recipe_ingredients: newRecipeIngredients,
                instruction_groups: nonEmptyInstructionGroups,
            };

            const recipeRes = await fetch("/api/recipes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(fullRecipePayload),
            });

            if (!recipeRes.ok) throw new Error("Failed to create recipe");
            setNewRecipe({
                title: '',
                description: '',
                author: '',
                prep_time_minutes: '',
                cook_time_minutes: '',
                serve_count: '',
            });
            setSelectedCategories([])
            setSelectedDiets([])
            setNewRecipeIngredients([]);
            setNewInstructionGroups([{ id: Date.now(), group_number: 1, title: '' }]);
            setNewInstructions([])
            const createdRecipe = await recipeRes.json();
            if (image) {
                await handleImageUpload(createdRecipe.id);
            }

            toast.success("Recipe created successfully!");
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Something went wrong while creating the recipe.");
        }
    };

    
    return (
        <>
            <title>Gingham • Admin Recipes • Add</title>
            <div className='margin-t-16'>
                <h2>Add Recipes</h2>
                <p className='margin-t-8 margin-l-4'>Only brand names are capitalized</p>
                <table className='table-search-recipe margin-t-16'>
                    <tbody>
                        <tr>
                            <td className='cell-title btn-grey m-hidden'>Title:</td>
                            <td className='cell-text cell-recipe' colSpan={5}>
                                <input
                                    className="search-bar cell-32"
                                    name="title"
                                    type="text"
                                    placeholder="Recipe title..."
                                    value={newRecipe.title}
                                    onChange={handleRecipeInputChange}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className='cell-title btn-grey m-hidden'>Image:</td>
                            <td className='cell-text cell-recipe' colSpan={5}>
                                <div className='form-group'>
                                    <div className='flex-start flex-center-align'>
                                        <label htmlFor='file-upload' className='btn btn-small btn-file nowrap'>Choose File <span className='text-white-background'>{image?.name}</span></label>
                                        <input
                                            id="file-upload"
                                            type="file"
                                            name="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td className='cell-title btn-grey m-hidden'>Description:</td>
                            <td className='cell-text cell-recipe' colSpan={5}>
                                <textarea
                                    className="search-bar cell-80 textarea-recipe"
                                    name="description"
                                    type="text"
                                    placeholder="Recipe description (3-6 senctences)..."
                                    value={newRecipe.description}
                                    onChange={handleRecipeInputChange}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className='cell-title btn-grey m-hidden'>Author:</td>
                            <td className='cell-text cell-recipe' colSpan={5}>
                                <input
                                    className="search-bar cell-32"
                                    name="author"
                                    type="text"
                                    placeholder="Author, if a Gingham creator add 'of the Gingham Team'..."
                                    value={newRecipe.author}
                                    onChange={handleRecipeInputChange}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className='cell-title btn-grey m-hidden'>Prep Time:</td>
                            <td className='cell-recipe-time cell-recipe'>
                                <input
                                    className="search-bar cell-32"
                                    name="prep_time_minutes"
                                    type="number"
                                    placeholder="Time in Minutes"
                                    value={newRecipe.prep_time_minutes}
                                    onChange={handleRecipeInputChange}
                                />
                            </td>
                            <td className='cell-title btn-grey m-hidden'>Cook Time:</td>
                            <td className='cell-recipe-time cell-recipe'>
                                <input
                                    className="search-bar cell-32"
                                    name="cook_time_minutes"
                                    type="number"
                                    placeholder="Time in Minutes"
                                    value={newRecipe.cook_time_minutes}
                                    onChange={handleRecipeInputChange}
                                />
                            </td>
                            <td className='cell-title btn-grey m-hidden'>Serve Count:</td>
                            <td className='cell-recipe-time cell-recipe'>
                                <input
                                    className="search-bar cell-32"
                                    name="serve_count"
                                    type="number"
                                    placeholder="How many people it serves..."
                                    value={newRecipe.serve_count}
                                    onChange={handleRecipeInputChange}
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
                <table className='table-search-recipe'>
                    <tbody>
                        <tr>
                            <td className='cell-title btn-grey m-hidden'>Categories:</td>
                            <td className='cell-text cell-recipe'>
                                <input
                                    className="search-bar cell-32"
                                    type="text"
                                    placeholder="Search categories..."
                                    value={categorySearch}
                                    onChange={(e) => setCategorySearch(e.target.value.toLowerCase())}
                                />
                                {categorySearch && (
                                    <ul className="dropdown-content" ref={categoryDropdownRef}>
                                        {categoryFuse.search(categorySearch).slice(0, 10).map(({ item }) => (
                                            <li
                                                className="search-results"
                                                key={`category-${item.name}`}
                                                onClick={() => {
                                                    if (!selectedCategories.includes(item.name)) {
                                                        setSelectedCategories(prev => [...prev, item.name]);
                                                    }
                                                    setCategorySearch('');
                                                }}
                                            >
                                                {item.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </td>
                            <td>
                                <button className='btn btn-filter' onMouseDown={handleAddCategory}>+</button>
                            </td>
                            {selectedCategories.length > 0 && (
                                <td className='cell-text cell-chips'>
                                    <Stack direction="row" spacing={1}>
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
                                    </Stack>
                                </td>
                            )}
                        </tr>
                    </tbody>
                </table>
                <table className='table-search-recipe'>
                    <tbody>
                        <tr>
                            <td className='cell-title btn-grey m-hidden'>Diets:</td>
                            <td className='cell-text cell-recipe'>
                                <input
                                    className="search-bar cell-32"
                                    type="text"
                                    placeholder="Search diets..."
                                    value={dietSearch}
                                    onChange={(e) => setDietSearch(e.target.value.toLowerCase())}
                                />
                                {dietSearch && (
                                    <ul className="dropdown-content" ref={dietDropdownRef}>
                                        {dietFuse.search(dietSearch).slice(0, 10).map(({ item }) => (
                                            <li
                                                className="search-results"
                                                key={`diet-${item.name}`}
                                                onClick={() => {
                                                    if (!selectedDiets.includes(item.name)) {
                                                        setSelectedDiets(prev => [...prev, item.name]);
                                                    }
                                                    setDietSearch('');
                                                }}
                                            >
                                                {item.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </td>
                            <td>
                                <button className='btn btn-filter' onMouseDown={handleAddDiet}>+</button>
                            </td>
                            {selectedDiets.length > 0 && (
                                <td className='cell-text cell-chips'>
                                    <Stack direction="row" spacing={1}>
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
                <table className='table-search-recipe'>
                    <tbody>
                        <tr>
                            <td className='cell-title btn-grey m-hidden'>Ingredients:</td>
                            <td className='cell-text cell-recipe'>
                                <input
                                    className="search-bar cell-32"
                                    type="text"
                                    placeholder="Search ingredients..."
                                    value={ingredientSearch}
                                    onChange={(e) => setIngredientSearch(e.target.value.toLowerCase())}
                                />
                                {ingredientSearch && (
                                    <ul className="dropdown-content" ref={ingredientDropdownRef}>
                                        {ingredientFuse.search(ingredientSearch).slice(0, 10).map(({ item }) => (
                                            <li
                                                className="search-results"
                                                key={`ingredient-${item.id}`}
                                                onClick={() => {
                                                    if (!selectedIngredients.some(i => i.id === item.id)) {
                                                        setSelectedIngredients(prev => [...prev, item]);
                                                    }
                                                    setIngredientSearch('');
                                                    handleAddExistingIngredient(item.name, item.name_plural);
                                                }}
                                            >
                                                {item.name_plural}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </td>
                            <td className='cell-title btn-grey m-hidden'>New:</td>
                            <td className='cell-text cell-recipe'>
                                <input
                                    className="cell-32"
                                    type="text"
                                    placeholder="Singular spelling"
                                    value={newIngName}
                                    onChange={(e) => setNewIngName(e.target.value)}
                                />
                            </td>
                            <td className='cell-text cell-recipe'>
                                <input
                                    className="cell-32"
                                    type="text"
                                    placeholder="Plural spelling"
                                    value={newIngNamePlural}
                                    onChange={(e) => setNewIngNamePlural(e.target.value)}
                                />
                            </td>
                            <td>
                                <button className='btn btn-filter' onClick={handleAddIngredient}>+</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div className="box-bounding margin-t-16">
                    <h3 className='margin-b-8'>Ingredients</h3>
                    <p className='margin-t-8 margin-l-8'>For measurements use decimals over fractions.</p>
                    <p className='margin-t-8 margin-l-8'>For numbers use the number, not the word.</p>
                    <p className='margin-t-8 margin-l-8'>Tablespoon: tbsp; teaspoon: tsp.</p>
                    {newRecipeIngredients.map((item, index) => (
                        <div key={index} className='flex-start flex-center-align'>
                            <label>
                                <FormGroup>
                                    <FormControlLabel control={
                                        <Switch checked={item.plural}
                                        onChange={(e) => {
                                            const newItems = [...newRecipeIngredients];
                                            newItems[index].plural = e.target.checked;
                                            setNewRecipeIngredients(newItems); }}
                                            color={'secondary'} />
                                            }
                                        label="Use Plural"
                                        />
                                </FormGroup>
                            </label>
                            <input
                                type="text"
                                className='input-ingredients input-amount margin-r-8'
                                placeholder="Amount"
                                value={item.amount}
                                onChange={(e) => {
                                    const newItems = [...newRecipeIngredients];
                                    newItems[index].amount = e.target.value;
                                    setNewRecipeIngredients(newItems);
                                }}
                            />
                            <span className="text-700 margin-r-8">
                                {item.plural ? item.ingredient.name_plural : item.ingredient.name},
                            </span>
                            <input
                                type="text"
                                className='input-ingredients input-desc margin-r-4'
                                placeholder="Description (optional)"
                                value={item.description}
                                onChange={(e) => {
                                    const newItems = [...newRecipeIngredients];
                                    newItems[index].description = e.target.value;
                                    setNewRecipeIngredients(newItems);
                                }}
                            />
                            <button
                                className='btn btn-delete text-700 btn-red'
                                onClick={() => {
                                    setNewRecipeIngredients(prev => prev.filter((_, i) => i !== index));
                                }}
                                title="Remove ingredient"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
                <div className='box-bounding'>
                    <h3 className='margin-b-8'>Instructions</h3>
                    {newInstructionGroups.map((group, groupIndex) => (
                        <div key={group.id} className="box-bounding">
                            <div className="flex-start flex-center-align margin-b-8">
                                <strong className="margin-r-8">Group {group.group_number}</strong>
                                <input
                                    type="text"
                                    className="input-ingredients margin-r-12"
                                    placeholder="Group title (optional)"
                                    value={group.title}
                                    onChange={(e) => {
                                        const updatedGroups = [...newInstructionGroups];
                                        updatedGroups[groupIndex].title = e.target.value;
                                        setNewInstructionGroups(updatedGroups);
                                    }}
                                />
                                {newInstructionGroups.length > 1 && (
                                    <button
                                        className="btn btn-delete btn-red margin-r-8"
                                        onClick={() => handleDeleteInstructionGroup(group.id)}
                                        title="Delete group"
                                    >
                                        × Delete Group
                                    </button>
                                )}
                                <button
                                    className="btn btn-small"
                                    onClick={() => handleAddInstruction(group.id)}
                                >
                                    + Add Instruction
                                </button>
                            </div>
                            {newInstructions
                                .filter(instr => instr.instruction_group_id === group.id)
                                .sort((a, b) => a.step_number - b.step_number)
                                .map((instr, instrIndex, array) => (
                                    <div key={`${group.id}-${instr.step_number}`} className="flex-start margin-b-4">
                                        <span className="margin-r-8">{instr.step_number}.</span>
                                        <input
                                            type="text"
                                            className="input-ingredients input-instruction flex-grow"
                                            placeholder="Instruction"
                                            value={instr.description}
                                            onChange={(e) => {
                                                const updated = [...newInstructions];
                                                const idx = updated.findIndex(i => i.instruction_group_id === group.id && i.step_number === instr.step_number);
                                                updated[idx].description = e.target.value;
                                                setNewInstructions(updated);
                                            }}
                                        />
                                        {array.length > 1 && (
                                            <button
                                                className="btn btn-delete btn-red margin-l-8"
                                                onClick={() => handleDeleteInstruction(group.id, instr.step_number)}
                                                title="Delete instruction"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                            {groupIndex === newInstructionGroups.length - 1 && (
                                <button className='btn btn-small margin-t-12' onClick={handleAddInstructionGroup}>
                                    + Add Group
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <button className='btn btn-reset margin-t-12' onClick={handleCreateRecipe}>
                    Create Recipe
                </button>
            </div>
        </>
    );
}

export default AdminRecipeAdd;