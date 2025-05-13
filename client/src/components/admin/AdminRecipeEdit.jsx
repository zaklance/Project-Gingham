import React, { useEffect, useMemo, useRef, useState} from 'react';
import { toast } from 'react-toastify';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Fuse from 'fuse.js';
import { formatMinutes } from '../../utils/helpers';
import { recipes_default } from '../../utils/common';

function AdminRecipeEdit({ recipes, smallwares, ingredients }) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchSmallwares, setSearchSmallwares] = useState('');
    const [searchIngredients, setSearchIngredients] = useState([]);
    const [newIngName, setNewIngName] = useState([]);
    const [newIngNamePlural, setNewIngNamePlural] = useState([]);
    const [newSmallware, setNewSmallware] = useState('');
    const [newSmallwareAlt, setNewSmallwareAlt] = useState('');
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [selectedSmallwares, setSelectedSmallwares] = useState([]);
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [selectedRecipeIngredients, setSelectedRecipeIngredients] = useState([]);
    const [selectedInstructionGroups, setSelectedInstructionGroups] = useState([]);
    const [selectedInstructions, setSelectedInstructions] = useState([]);
    const [tempRecipeData, setTempRecipeData] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [image, setImage] = useState(null);
    const [categorySearch, setCategorySearch] = useState('');
    const [dietSearch, setDietSearch] = useState('');

    
    const dropdownRef = useRef(null);
    const smallwareDropdownRef = useRef(null);
    const ingredientDropdownRef = useRef(null);
    const categoryDropdownRef = useRef(null);
    const dietDropdownRef = useRef(null);
    const siteURL = import.meta.env.VITE_SITE_URL;

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

    const searchableData = useMemo(() => {
        if (recipes != null) {
            const recipeData = recipes.map(item => ({
                type: 'recipe',
                id: item.id,
                name: item.title,
                categories: item.categories || [],
                diet_categories: item.diet_categories || []
            }));

            return [...recipeData];
        }
    }, [recipes]);

    const fuse = useMemo(() => {
        return new Fuse(searchableData, {
            keys: [
                { name: 'title', weight: 0.6 },
            ],
            threshold: 0.3,
            ignoreLocation: true,
        });
    }, [searchableData]);

    const searchResults = searchTerm
        ? fuse.search(searchTerm).map(result => result.item)
        : [];

    const combinedSearchItems = useMemo(() => {
        if (recipes != null) {
            const nameItems = recipes.map(r => ({
                type: 'recipe',
                id: r.id,
                title: r.title,
                description: r.description,
                author: r.author,
                is_gingham_team: r.is_gingham_team,
                image: r.image,
                image_default: r.image_default,
                categories: r.categories,
                diet_categories: r.diet_categories,
                prep_time_minutes: r.prep_time_minutes,
                cook_time_minutes: r.cook_time_minutes,
                total_time_minutes: r.total_time_minutes,
                serve_count: r.serve_count,
                skill_level: r.skill_level
            }));
            return [...nameItems];
        }
    }, [recipes]);

    const combinedFuse = useMemo(() => {
        return new Fuse(combinedSearchItems, {
            keys: ['title', 'name_plural'],
            threshold: 0.3,
        });
    }, [combinedSearchItems]);

    const fetchSmallwares = async () => {
        if (!selectedRecipe) return
        fetch(`/api/smallwares?recipe_id=${selectedRecipe.id}`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => response.json())
        .then(data => {
            setSelectedSmallwares(data);
        })
        .catch(error => console.error('Error fetching smallwares', error));
    };

    const fetchRecipeIngredients = async () => {
        if (!selectedRecipe) return
        fetch(`/api/recipe-ingredients?recipe_id=${selectedRecipe.id}`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => response.json())
        .then(data => {
            setSelectedRecipeIngredients(data);
        })
        .catch(error => console.error('Error fetching recipe ingredients', error));
    }

    const fetchIngredients = async () => {
        if (!selectedRecipe) return
        fetch(`/api/ingredients?recipe_id=${selectedRecipe.id}`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => response.json())
        .then(data => {
            setSelectedIngredients(data);
        })
        .catch(error => console.error('Error fetching ingredients', error));
    };

    const fetchInstructions = async () => {
        if (!selectedRecipe) return
        fetch(`/api/instructions?recipe_id=${selectedRecipe.id}`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => response.json())
        .then(data => {
            setSelectedInstructions(data);
        })
        .catch(error => console.error('Error fetching instructions', error));
    }

    const fetchInstructionGroups = async () => {
        if (!selectedRecipe) return
        fetch(`/api/instruction-groups?recipe_id=${selectedRecipe.id}`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => response.json())
        .then(data => {
            setSelectedInstructionGroups(data);
        })
        .catch(error => console.error('Error fetching instruction groups', error));
    };

    useEffect(() => {
        fetchSmallwares();
        fetchIngredients();
        fetchRecipeIngredients();
        fetchInstructions();
        fetchInstructionGroups();
    }, [selectedRecipe]);

    const handleEditToggle = () => {
        if (!editMode) {
            setTempRecipeData({...selectedRecipe});
        } else {
            setTempRecipeData(null);
        }
        setEditMode(!editMode);
    };

    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;

        setTempRecipeData((prevData) => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value,
            updated: true
        }));
    };

    const handleFileChange = (event) => {
        if (event.target.files) {
            const file = event.target.files[0];
            const maxFileSize = 5 * 1024 * 1024;
            if (file.size > maxFileSize) {
                toast.warning('File size exceeds 5 MB. Please upload a smaller file', {
                    autoClose: 4000,
                });
                return;
            }
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

    const handleImageDelete = async () => {
        const token = localStorage.getItem('admin_jwt-token');
        if (!token) {
            handlePopup();
            return;
        }
        try {
            console.log('Deleting image:', selectedRecipe.image);

            const response = await fetch('/api/delete-image', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    filename: selectedRecipe.image,
                    recipe_id: selectedRecipe.id,
                    type: 'recipe',
                }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Image deleted successfully:', result);

                setSelectedRecipe((prevData) => ({
                    ...prevData,
                    image: null,
                }));

                setTempRecipeData((prevData) => ({
                    ...prevData,
                    image: null,
                }));

                toast.success('Image deleted successfully.', {
                    autoClose: 4000,
                });
            } else {
                const errorText = await response.text();
                console.error('Failed to delete image:', errorText);
                toast.success(`Failed to delete the image: ${JSON.parse(errorText).error}`, {
                    autoClose: 6000,
                });
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            toast.success('An unexpected error occurred while deleting the image.', {
                autoClose: 5000,
            });
        }
    };

    const smallwareFuse = useMemo(() => {
        if (smallwares) {
            return new Fuse(smallwares, {
                keys: ['smallware', 'smallware_alt'],
                threshold: 0.3,
                ignoreLocation: true,
            });
        }
        return null;
    }, [smallwares]);

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
            !tempRecipeData.categories.includes(newCategory) &&
            !recipes.some(recipe =>
                recipe.categories.map(cat => cat.toLowerCase()).includes(newCategory)
            )
        ) {
            setTempRecipeData(prev => ({
                ...prev,
                categories: [...prev.categories, newCategory],
                updated: true
            }));
            setCategorySearch('');
        }
    };

    const handleAddDiet = () => {
        const newDiet = dietSearch.trim().toLowerCase();
        if (
            newDiet &&
            !tempRecipeData.diet_categories.includes(newDiet) &&
            !recipes.some(recipe =>
                recipe.diet_categories.map(diet => diet.toLowerCase()).includes(newDiet)
            )
        ) {
            setTempRecipeData(prev => ({
                ...prev,
                diet_categories: [...prev.diet_categories, newDiet],
                updated: true
            }));
            setDietSearch('');
        }
    };

    const handleAddSmallware = async () => {
        const smallware = newSmallware.trim();
        const smallwareAlt = String(newSmallwareAlt || '').trim();

        setSelectedSmallwares(prev => [
            ...prev,
            {
                recipe_id: selectedRecipe.id,
                smallware: smallware,
                smallware_alt: smallwareAlt,
                new: true
            },
        ]);
        setNewSmallware('');
        setNewSmallwareAlt('');
    };

    const handleDeleteSmallware = (indexToDelete) => {
        setSelectedSmallwares(prev => {
            return prev.filter((item, index) => {
                if (index === indexToDelete) return !item.new;
                return true;
            }).map((item, index) => {
                if (index === indexToDelete) {
                    return { ...item, deleted: true };
                }
                return item;
            });
        });
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
                ingredients.push(ingredient);
            } catch (err) {
                toast.error(err.message || "Error adding ingredient.");
                return;
            }
        }

        const nextNumber = selectedRecipeIngredients.length + 1;
        setSelectedRecipeIngredients(prev => [
            ...prev,
            {
                ingredient_id: ingredient.id,
                ingredient_number: nextNumber,
                ingredient,
                plural: false,
                amount: '',
                description: '',
                new: true
            },
        ]);

        setNewIngName('');
        setNewIngNamePlural('');
    };

    const handleAddExistingIngredient = async (singular, plural) => {
        const existing = ingredients.find(
            ing => ing.name.toLowerCase() === singular.toLowerCase() || ing.name_plural.toLowerCase() === plural.toLowerCase()
        );

        const nextNumber = selectedRecipeIngredients.length + 1;
        setSelectedRecipeIngredients(prev => [
            ...prev,
            {
                ingredient_id: existing.id,
                ingredient_number: nextNumber,
                ingredient: existing,
                plural: false,
                amount: '',
                description: '',
                new: true
            },
        ]);

        setNewIngName('');
        setNewIngNamePlural('');
    };

    const moveIngredient = (visibleIndex, direction) => {
        const activeIndices = selectedRecipeIngredients
            .map((item, i) => (!item.deleted ? i : null))
            .filter(i => i !== null);

        const from = activeIndices[visibleIndex];
        const to = direction === 'up' ? activeIndices[visibleIndex - 1] : activeIndices[visibleIndex + 1];

        if (from === undefined || to === undefined) return;

        const updated = [...selectedRecipeIngredients];
        [updated[from], updated[to]] = [updated[to], updated[from]];

        let num = 1;
        updated.forEach((item, i) => {
            if (!item.deleted) {
                updated[i] = {
                    ...item,
                    ingredient_number: num++,
                    updated: true,
                };
            }
        });

        setSelectedRecipeIngredients(updated);
    };

    const handleDeleteRecipeIngredient = (idToRemove) => {
        const filtered = selectedRecipeIngredients.filter(item => {
            if (item.id === idToRemove) return !item.new;
            return true;
        });

        const reindexed = filtered.map((item, i) => {
            const original = selectedRecipeIngredients.find(orig => orig.id === item.id);
            if (original && original.ingredient_number !== i + 1) {
                return { ...item, ingredient_number: i + 1, updated: true };
            }
            return { ...item, ingredient_number: i + 1 };
        });

        setSelectedRecipeIngredients(reindexed);
    };

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

    const handleAddInstructionGroup = () => {
        const newGroupNumber = selectedInstructionGroups.length + 1;
        const newGroupId = Date.now();
        setSelectedInstructionGroups(prev => [...prev, { id: newGroupId, group_number: newGroupNumber, title: '', new: true, recipe_id: selectedRecipe.id }]);
    };

    const handleDeleteInstructionGroup = (groupIdToDelete) => {
        setSelectedInstructionGroups(prev => {
            const filtered = prev.filter(group => {
                if (group.id === groupIdToDelete) return !group.new;
                return true;
            });

            const updated = filtered.map((group, i) => {
                const original = prev.find(g => g.id === group.id);
                if (original && original.group_number !== i + 1) {
                    return { ...group, group_number: i + 1, updated: true };
                }
                return { ...group, group_number: i + 1 };
            });

            return updated;
        });

        setSelectedInstructions(prev =>
            prev.filter(instr => {
                if (instr.instruction_group_id === groupIdToDelete) {
                    return !instr.new;
                }
                return true;
            }).map(instr => {
                if (instr.instruction_group_id === groupIdToDelete) {
                    return { ...instr, deleted: true };
                }
                return instr;
            })
        );
    };

    const handleAddInstruction = (groupId) => {
        const groupInstructions = selectedInstructions.filter(i => i.instruction_group_id === groupId);
        const stepNumber = groupInstructions.length + 1;
        const newInstruction = {
            recipe_id: selectedRecipe.id,
            instruction_group_id: groupId,
            step_number: stepNumber,
            description: '',
            new: true
        };
        setSelectedInstructions(prev => [...prev, newInstruction]);
    };

    const handleDeleteInstruction = (groupId, stepToRemove) => {
        const updated = selectedInstructions.filter(instr => {
            if (instr.instruction_group_id === groupId && instr.step_number === stepToRemove) {
                return !instr.new;
            }
            return true;
        }).map(instr => {
            if (instr.instruction_group_id === groupId && instr.step_number === stepToRemove) {
                return { ...instr, deleted: true };
            }
            return instr;
        });

        const filtered = updated
            .filter(instr => instr.instruction_group_id === groupId && !instr.deleted)
            .sort((a, b) => a.step_number - b.step_number)
            .map((instr, i) => {
                const original = selectedInstructions.find(orig => orig.id === instr.id);
                if (original && original.step_number !== i + 1) {
                    return { ...instr, step_number: i + 1, updated: true };
                }
                return { ...instr, step_number: i + 1 };
            });

        const allUpdated = updated.map(instr => {
            if (instr.instruction_group_id !== groupId || instr.deleted) return instr;
            const match = filtered.find(f => f.id === instr.id);
            return match || instr;
        });

        setSelectedInstructions(allUpdated);
    };

    const moveInstruction = (groupId, index, direction) => {
        const groupInstructions = selectedInstructions
            .filter(instr => instr.instruction_group_id === groupId && !instr.deleted)
            .sort((a, b) => a.step_number - b.step_number)
            .map(instr => ({ ...instr }));

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= groupInstructions.length) return;

        const reordered = [...groupInstructions];
        [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

        reordered.forEach((instr, i) => {
            instr.step_number = i + 1;
        });

        const updatedAll = selectedInstructions.map(instr => {
            if (instr.instruction_group_id !== groupId || instr.deleted) return instr;

            const updatedInstr = reordered.find(r => r.id === instr.id);
            if (!updatedInstr) return instr;

            const stepChanged = instr.step_number !== updatedInstr.step_number;

            return stepChanged ? { ...updatedInstr, updated: true } : updatedInstr;
        });

        setSelectedInstructions(updatedAll);
    };

    const moveInstructionGroup = (index, direction) => {
        const activeGroups = selectedInstructionGroups.filter(group => !group.deleted);
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= activeGroups.length) return;

        const reordered = [...activeGroups];
        [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

        reordered.forEach((group, i) => {
            group.group_number = i + 1;
        });

        const updatedAll = selectedInstructionGroups.map(group => {
            if (group.deleted) return group;

            const updated = reordered.find(g => g.id === group.id);
            if (!updated) return group;

            const original = selectedInstructionGroups.find(orig => orig.id === group.id);
            if (original && original.group_number !== updated.group_number) {
                return { ...updated, updated: true };
            }

            return updated;
        });

        setSelectedInstructionGroups(updatedAll);
    };

    const api = {
        async patch(url, data) {
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            return response.json();
        },

        async delete(url) {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        },

        async post(url, data) {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            return response.json();
        },
    };

    const handleSaveEdits = async () => {
        try {
            const requests = [];

            // Patch recipe if changed
            if (tempRecipeData.updated) {
                requests.push(api.patch(`/api/recipes/${selectedRecipe.id}`, tempRecipeData));
            }

            // RecipeIngredients
            [...selectedRecipeIngredients]
                .sort((a, b) => a.ingredient_number - b.ingredient_number)
                .forEach(item => {
                    if (item.deleted) {
                        requests.push(api.delete(`/api/recipe-ingredients/${item.id}`));
                    } else if (item.new) {
                        requests.push(api.post(`/api/recipe-ingredients`, item));
                    } else if (item.updated) {
                        requests.push(api.patch(`/api/recipe-ingredients/${item.id}`, item));
                    }
                });

            // InstructionGroups
            const groupIdMap = {};
            for (const group of [...selectedInstructionGroups].sort((a, b) => a.group_number - b.group_number)) {
                if (group.deleted) {
                    await api.delete(`/api/instruction-groups/${group.id}`);
                } else if (group.new) {
                    const res = await api.post(`/api/instruction-groups`, group);
                    groupIdMap[group.id] = res.data.id;
                } else if (group.updated) {
                    await api.patch(`/api/instruction-groups/${group.id}`, group);
                }
            }

            // Instructions
            for (const instruction of [...selectedInstructions].sort((a, b) => a.step_number - b.step_number)) {
                const updatedInstruction = { ...instruction };

                if (groupIdMap[updatedInstruction.instruction_group_id]) {
                    updatedInstruction.instruction_group_id = groupIdMap[updatedInstruction.instruction_group_id];
                }

                if (updatedInstruction.deleted) {
                    await api.delete(`/api/instructions/${updatedInstruction.id}`);
                } else if (updatedInstruction.new) {
                    await api.post(`/api/instructions`, updatedInstruction);
                } else if (updatedInstruction.updated) {
                    await api.patch(`/api/instructions/${updatedInstruction.id}`, updatedInstruction);
                }
            }

            // Smallwares
            selectedSmallwares.forEach(item => {
                if (item.deleted) {
                    requests.push(api.delete(`/api/smallwares/${item.id}`));
                } else if (item.new) {
                    requests.push(api.post(`/api/smallwares`, item));
                } else if (item.updated) {
                    requests.push(api.patch(`/api/smallwares/${item.id}`, item));
                }
            });

            await Promise.all(requests);
            await Promise.all([
                fetchSmallwares(),
                fetchIngredients(),
                fetchRecipeIngredients(),
                fetchInstructions(),
                fetchInstructionGroups()
            ]);
            toast.success("Recipe saved!");
            setEditMode(false)
        } catch (error) {
            console.error("Error saving recipe:", error);
            toast.error("Failed to save recipe.");
        }
    };

    console.log(selectedRecipe)
    console.log(tempRecipeData?.image)
    console.log(tempRecipeData?.image_default)


    return (
        <>
            <title>Gingham • Admin Recipes • Edit</title>
            <h2 className='margin-t-16'>Edit Recipes</h2>
            {editMode ? (
                <div>
                    <div className='margin-t-16'>
                        <table className='table-search-recipe margin-t-16'>
                            <tbody>
                                <tr>
                                    <td className='cell-title btn-grey m-hidden'>Title:</td>
                                    <td className='cell-text cell-recipe' colSpan={3}>
                                        <input
                                            className="search-bar cell-32"
                                            name="title"
                                            type="text"
                                            placeholder="Recipe title..."
                                            value={tempRecipeData.title}
                                            onChange={handleInputChange}
                                        />
                                    </td>
                                    <td className='cell-title btn-grey m-hidden'>Skill Level:</td>
                                    <td>
                                        <select
                                            name="skill_level"
                                            className='select-recipe'
                                            value={tempRecipeData.skill_level}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Select</option>
                                            <option value={1}>1</option>
                                            <option value={2}>2</option>
                                            <option value={3}>3</option>
                                            <option value={4}>4</option>
                                            <option value={5}>5</option>
                                        </select>
                                    </td>
                                </tr>
                                <tr>
                                    <td className='cell-title btn-grey m-hidden'>Image:</td>
                                    <td className='cell-text cell-recipe' colSpan={3} rowSpan={2}>
                                        {tempRecipeData?.image !== null && (
                                            <img 
                                            style={{ maxWidth: '100%', height: 'auto' }}
                                            src={tempRecipeData?.image ? `${siteURL}${tempRecipeData.image}` : `/recipe-images/_default-images/${tempRecipeData.image_default}`}
                                            alt="Market Image"
                                            />
                                        )}
                                    </td>
                                    <td className='cell-text cell-recipe' colSpan={2}>
                                        <div className='flex-start flex-center-align'>
                                            <button className='btn btn-small btn-file btn-blue' onClick={handleImageDelete}>Delete Image</button>
                                            <label htmlFor='file-upload' className='btn btn-small btn-file btn-blue nowrap'>Choose File{image && <span id="file-name" className='text-white-background margin-l-8'>{image.name}</span>}</label>
                                            <input
                                                id="file-upload"
                                                type="file"
                                                name="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className='cell-title btn-grey m-hidden'>Default Image:</td>
                                    <td className='cell-text cell-recipe' colSpan={4}>
                                        <select
                                            name="image_default"
                                            className='select-recipe'
                                            value={tempRecipeData ? tempRecipeData.image_default : ''}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Select</option>
                                            {Object.entries(recipes_default).map(([key, value], index) => (
                                                <option key={index} value={value}>
                                                    {key}
                                                </option>
                                            ))}
                                        </select>
                                        <button 
                                            type="button"
                                            className='btn btn-small margin-t-8'
                                            onClick={() => {
                                                const keys = Object.keys(recipes_default);
                                                const randomKey = keys[Math.floor(Math.random() * keys.length)];
                                                handleInputChange({ target: { name: "image_default", value: recipes_default[randomKey] } });
                                            }}
                                        >
                                            Randomize
                                        </button>
                                    </td>
                                </tr>
                                <tr>
                                    <td className='cell-title btn-grey m-hidden'>Author:</td>
                                    <td className='cell-text cell-recipe' colSpan={2}>
                                        <input
                                            className="search-bar cell-32"
                                            name="author"
                                            type="text"
                                            placeholder="Author, if a Gingham creator add 'of the Gingham Team'..."
                                            value={tempRecipeData.author}
                                            onChange={handleInputChange}
                                        />
                                    </td>
                                    <td className='cell-title btn-grey m-hidden'>Is Gingham:</td>
                                    <td className='cell-text cell-recipe' colSpan={2}>
                                        <label>
                                            <FormGroup>
                                                <FormControlLabel
                                                    className='nowrap'
                                                    control={
                                                        <Switch
                                                            name="is_gingham_team"
                                                            checked={tempRecipeData.is_gingham_team}
                                                            onChange={handleInputChange}
                                                            color={'secondary'}
                                                        />
                                                    }
                                                    label="Is on Gingham Team?"
                                                />
                                            </FormGroup>
                                        </label>
                                    </td>
                                </tr>
                                <tr>
                                    <td className='cell-title btn-grey m-hidden'>Description:</td>
                                    <td className='cell-text cell-recipe' colSpan={5}>
                                        <textarea
                                            className="search-bar cell-80 textarea-recipe"
                                            name="description"
                                            type="text"
                                            placeholder="Recipe description (3-6 sentences)..."
                                            value={tempRecipeData.description}
                                            onChange={handleInputChange}
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <table className='table-search-recipe'>
                            <tbody>
                                <tr>
                                    <td className='cell-title btn-grey m-hidden'>Prep Time:</td>
                                    <td className='cell-recipe-time cell-recipe'>
                                        <input
                                            className="search-bar cell-32"
                                            name="prep_time_minutes"
                                            type="number"
                                            placeholder="Time in Minutes"
                                            value={tempRecipeData.prep_time_minutes}
                                            onChange={handleInputChange}
                                        />
                                    </td>
                                    <td className='cell-title btn-grey m-hidden'>Cook Time:</td>
                                    <td className='cell-recipe-time cell-recipe'>
                                        <input
                                            className="search-bar cell-32"
                                            name="cook_time_minutes"
                                            type="number"
                                            placeholder="Time in Minutes"
                                            value={tempRecipeData.cook_time_minutes}
                                            onChange={handleInputChange}
                                        />
                                    </td>
                                    <td className='cell-title btn-grey m-hidden'>Serve Count:</td>
                                    <td className='cell-recipe-time cell-recipe'>
                                        <input
                                            className="search-bar cell-32"
                                            name="serve_count"
                                            type="number"
                                            placeholder="How many people it serves..."
                                            value={tempRecipeData.serve_count}
                                            onChange={handleInputChange}
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
                                                            if (!tempRecipeData.categories.includes(item.name)) {
                                                                setTempRecipeData(prev => ({
                                                                    ...prev,
                                                                    categories: [...prev.categories, item.name]
                                                                }))
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
                                    {tempRecipeData.categories.length > 0 && (
                                        <td className='cell-text cell-chips'>
                                            <Stack direction="row" spacing={1}>
                                                {tempRecipeData.categories.map((cat, i) => (
                                                    <Chip
                                                        key={`cat-${i}`}
                                                        label={cat}
                                                        style={{ backgroundColor: "#eee", fontSize: ".9em" }}
                                                        size="small"
                                                        onDelete={() =>
                                                        setTempRecipeData(prev => ({
                                                            ...prev,
                                                            categories: [...prev.categories.filter(item => item !== cat)]
                                                        }))
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
                                                            if (!tempRecipeData.diet_categories.includes(item.name)) {
                                                                setTempRecipeData(prev => ({
                                                                    ...prev,
                                                                    diet_categories: [...prev.diet_categories, item.name]
                                                                }))
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
                                    {tempRecipeData.diet_categories.length > 0 && (
                                        <td className='cell-text cell-chips'>
                                            <Stack direction="row" spacing={1}>
                                                {tempRecipeData.diet_categories.map((diet, i) => (
                                                    <Chip 
                                                        key={`diet-${i}`}
                                                        label={diet}
                                                        style={{ backgroundColor: "#eee", fontSize: ".9em" }}
                                                        size="small"
                                                        onDelete={() =>
                                                        setTempRecipeData(prev => ({
                                                            ...prev,
                                                            diet_categories: [...prev.diet_categories.filter(item => item !== diet)]
                                                        }))
                                                    } />
                                                ))}
                                            </Stack>
                                        </td>
                                    )}
                                </tr>
                            </tbody>
                        </table>
                        <div className="box-bounding margin-t-16">
                            <h3 className='margin-b-8'>Smallwares</h3>
                            <table className='table-search-recipe margin-b-12'>
                                <tbody>
                                    <tr>
                                        <td className='cell-title btn-grey m-hidden'>Search:</td>
                                        <td className='cell-text cell-recipe'>
                                            <input
                                                className="search-bar cell-32"
                                                type="text"
                                                placeholder="Search..."
                                                value={searchSmallwares}
                                                onChange={(e) => setSearchSmallwares(e.target.value.toLowerCase())}
                                            />
                                            {searchSmallwares && (
                                                <ul className="dropdown-content" ref={smallwareDropdownRef}>
                                                    {smallwareFuse
                                                        .search(searchSmallwares)
                                                        .flatMap(({ item }) => {
                                                            const results = [];
                                                            if (item.smallware?.toLowerCase().includes(searchSmallwares)) {
                                                                results.push({
                                                                    id: item.id,
                                                                    name: item.smallware,
                                                                    label: 'Smallware',
                                                                });
                                                            }
                                                            if (item.smallware_alt?.toLowerCase().includes(searchSmallwares)) {
                                                                results.push({
                                                                    id: item.id,
                                                                    name: item.smallware_alt,
                                                                    label: 'Alt Smallware',
                                                                });
                                                            }
                                                            return results;
                                                        })
                                                        .slice(0, 10)
                                                        .map(({ id, name, label }) => (
                                                            <li className="search-results" key={`smallware-${id}-${name}`}>
                                                                <span className='text-500 margin-r-8'>{name}</span>
                                                                <button
                                                                    className="btn btn-dropdown btn-white margin-r-4"
                                                                    onClick={() => {setNewSmallware(name); setSearchSmallwares('');}}
                                                                >
                                                                    Main
                                                                </button>
                                                                <button
                                                                    className="btn btn-dropdown btn-white"
                                                                    onClick={() => { setNewSmallwareAlt(name); setSearchSmallwares(''); }}
                                                                >
                                                                    Alt
                                                                </button>
                                                            </li>
                                                        ))}
                                                </ul>
                                            )}
                                        </td>
                                        <td className='cell-title btn-grey m-hidden'>Main:</td>
                                        <td className='cell-text cell-recipe'>
                                            <input
                                                className="cell-32"
                                                type="text"
                                                placeholder="Smallware"
                                                value={newSmallware}
                                                onChange={(e) => setNewSmallware(e.target.value)}
                                            />
                                        </td>
                                        <td className='cell-title btn-grey m-hidden'>Alt:</td>
                                        <td className='cell-text cell-recipe'>
                                            <input
                                                className="cell-32"
                                                type="text"
                                                placeholder="Alt if there is one"
                                                value={newSmallwareAlt}
                                                onChange={(e) => setNewSmallwareAlt(e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <button className='btn btn-filter' onClick={handleAddSmallware}>+</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            {selectedSmallwares
                                .filter(item => !item.deleted)
                                .map((item, index) => (
                                    <div key={index} className='flex-start flex-center-align margin-b-4'>
                                        <button
                                            className='btn btn-delete text-700 btn-red margin-r-12'
                                            onClick={() => handleDeleteSmallware(index)}
                                            title="Remove smallware"
                                        >
                                            ×
                                        </button>
                                        <span className='text-700'>
                                            {item.smallware}<span className="text-300">{item.smallware_alt && ' or '}</span>{item.smallware_alt}
                                        </span>
                                    </div>
                                ))
                            }
                        </div>
                        <div className="box-bounding margin-t-24">
                            <h3 className='margin-b-8'>Ingredients</h3>
                            <p className='margin-t-8 margin-l-8'>Only brand names and proper nouns are capitalized for ingredients.</p>
                            <p className='margin-t-8 margin-l-8'>For measurements use decimals over fractions.</p>
                            <p className='margin-t-8 margin-l-8'>For numbers use the number, not the word.</p>
                            <p className='margin-t-8 margin-l-8 margin-b-12'>Tablespoon: tbsp; teaspoon: tsp.</p>
                            <table className='table-search-recipe margin-b-12'>
                                <tbody>
                                    <tr>
                                        <td className='cell-title btn-grey m-hidden'>Ingredients:</td>
                                        <td className='cell-text cell-recipe'>
                                            <input
                                                className="search-bar cell-32"
                                                type="text"
                                                placeholder="Search ingredients..."
                                                value={searchIngredients}
                                                onChange={(e) => setSearchIngredients(e.target.value.toLowerCase())}
                                            />
                                            {searchIngredients && (
                                                <ul className="dropdown-content" ref={ingredientDropdownRef}>
                                                    {ingredientFuse.search(searchIngredients).slice(0, 10).map(({ item }) => (
                                                        <li
                                                            className="search-results"
                                                            key={`ingredient-${item.id}`}
                                                            onClick={() => {
                                                                if (!selectedIngredients.some(i => i.id === item.id)) {
                                                                    setSelectedIngredients(prev => [...prev, item]);
                                                                }
                                                                setSearchIngredients('');
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
                            {selectedRecipeIngredients
                                .filter(item => !item.deleted)
                                .map((item, index) => (
                                    <div key={index} className='flex-start flex-center-align'>
                                        <button
                                            className='btn btn-delete icon-arrow-u margin-r-4'
                                            onClick={() => moveIngredient(index, 'up')}
                                            disabled={item.step_number === 1}
                                            title="Move up"
                                        >
                                            &emsp;
                                        </button>
                                        <button
                                            className='btn btn-delete icon-arrow-d margin-r-4'
                                            onClick={() => moveIngredient(index, 'down')}
                                            disabled={item.step_number === selectedRecipeIngredients.filter(i => !i.deleted).length - 1}
                                            title="Move down"
                                        >
                                            &emsp;
                                        </button>
                                        <button
                                            className='btn btn-delete text-700 btn-red margin-r-12'
                                            onClick={() => handleDeleteRecipeIngredient(item.id)}
                                            title="Remove ingredient"
                                        >
                                            ×
                                        </button>
                                        <label>
                                            <FormGroup>
                                                <FormControlLabel control={
                                                    <Switch
                                                        checked={item.plural}
                                                        onChange={(e) => {
                                                            const newItems = selectedRecipeIngredients.map(ingredient => 
                                                                ingredient.id === item.id 
                                                                    ? { ...ingredient, plural: e.target.checked } 
                                                                    : ingredient
                                                            );
                                                            setSelectedRecipeIngredients(newItems);
                                                        }}
                                                        color={'secondary'}
                                                    />
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
                                                const newItems = selectedRecipeIngredients.map(ingredient =>
                                                    ingredient.id === item.id 
                                                        ? { ...ingredient, amount: e.target.value }
                                                        : ingredient
                                                );
                                                setSelectedRecipeIngredients(newItems);
                                            }}
                                        />
                                        <span className="text-700 margin-r-8">
                                            {item.plural ? item.ingredient.name_plural : item.ingredient.name},
                                        </span>
                                        <input
                                            type="text"
                                            className='input-ingredients input-desc'
                                            placeholder="Description (optional)"
                                            value={item.description}
                                            onChange={(e) => {
                                                const newItems = selectedRecipeIngredients.map(ingredient =>
                                                    ingredient.id === item.id 
                                                        ? { ...ingredient, description: e.target.value }
                                                        : ingredient
                                                );
                                                setSelectedRecipeIngredients(newItems);
                                            }}
                                        />
                                    </div>
                                ))
                            }
                        </div>
                        <div className='box-bounding'>
                            <h3>Instructions</h3>
                            {sortedInstructionGroups
                                .filter(group => !group.deleted)
                                .map((group, groupIndex) => (
                                    <div key={group.id} className="box-bounding">
                                        <div className="flex-start flex-center-align margin-b-8">
                                            <strong className="margin-r-8">Group {group.group_number}</strong>
                                            <input
                                                type="text"
                                                className="input-ingredients margin-r-12"
                                                placeholder="Group title (optional)"
                                                value={group.title}
                                                onChange={(e) => {
                                                    const updatedGroups = [...selectedInstructionGroups];
                                                    updatedGroups[groupIndex].title = e.target.value;
                                                    setSelectedInstructionGroups(updatedGroups);
                                                }}
                                            />
                                            {selectedInstructionGroups.filter(g => !g.deleted).length > 1 && (
                                                <>
                                                    <button
                                                        className='btn btn-recipe-arrow icon-arrow-u margin-r-4'
                                                        onClick={() => moveInstructionGroup(groupIndex, 'up')}
                                                        disabled={groupIndex === 0}
                                                        title="Move up"
                                                    >
                                                        &emsp;
                                                    </button>
                                                    <button
                                                        className='btn btn-recipe-arrow icon-arrow-d margin-r-4'
                                                        onClick={() => moveInstructionGroup(groupIndex, 'down')}
                                                        disabled={groupIndex === selectedInstructionGroups.filter(g => !g.deleted).length - 1}
                                                        title="Move down"
                                                    >
                                                        &emsp;
                                                    </button>
                                                    <button
                                                        className="btn btn-delete btn-red margin-r-8"
                                                        onClick={() => handleDeleteInstructionGroup(group.id)}
                                                        title="Delete group"
                                                    >
                                                        × Delete Group
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                        {(instructionsByGroup[String(group.id)] || [])
                                            .filter(instr => instr.instruction_group_id === group.id && !instr.deleted)
                                            .sort((a, b) => a.step_number - b.step_number)
                                            .map((instr, instrIndex, array) => (
                                                <div key={`${group.id}-${instr.step_number}`} className="flex-start margin-b-4">
                                                    <button
                                                        className='btn btn-recipe-arrow icon-arrow-u margin-r-4'
                                                        onClick={() => moveInstruction(group.id, instrIndex, 'up')}
                                                        disabled={instrIndex === 0}
                                                        title="Move up"
                                                    >
                                                        &emsp;
                                                    </button>
                                                    <button
                                                        className='btn btn-recipe-arrow icon-arrow-d margin-r-4'
                                                        onClick={() => moveInstruction(group.id, instrIndex, 'down')}
                                                        disabled={instrIndex === array.length - 1}
                                                        title="Move down"
                                                    >
                                                        &emsp;
                                                    </button>
                                                    {array.length > 1 && (
                                                        <button
                                                            className="btn btn-recipe-arrow btn-red margin-r-12"
                                                            onClick={() => handleDeleteInstruction(group.id, instr.step_number)}
                                                            title="Delete instruction"
                                                        >
                                                            ×
                                                        </button>
                                                    )}
                                                    <span className="margin-r-8">{instr.step_number}.</span>
                                                    <textarea
                                                        type="text"
                                                        className="textarea-recipe-edit input-ingredients input-instruction flex-grow"
                                                        placeholder="Instruction"
                                                        value={instr.description}
                                                        onChange={(e) => {
                                                            const updated = [...selectedInstructions];
                                                            const idx = updated.findIndex(i => i.instruction_group_id === group.id && i.step_number === instr.step_number);
                                                            updated[idx].description = e.target.value;
                                                            setSelectedInstructions(updated);
                                                        }}
                                                    />
                                                </div>
                                            ))
                                        }
                                        <div className='flex-start margin-t-12'>
                                            <button
                                                className="btn btn-small margin-r-8"
                                                onClick={() => handleAddInstruction(group.id)}
                                            >
                                                + Add Instruction
                                            </button>
                                            {groupIndex === selectedInstructionGroups.length - 1 && (
                                                <button className='btn btn-small' onClick={handleAddInstructionGroup}>
                                                    + Add Group
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                        <div className='flex-start'>
                            <button className='btn btn-reset btn-red margin-t-12 margin-r-8' onClick={handleSaveEdits}>
                                Save Changes
                            </button>
                            <button className='btn btn-reset btn-red margin-t-12' onClick={handleEditToggle}>
                                Cancel Changes
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <>
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
                                                    key={`search-${item.type}-${item.id || item.title}`}
                                                    onClick={() => {
                                                        if (item.type === 'recipe') {
                                                            setSelectedRecipe(item);
                                                            setSearchTerm('')
                                                        }
                                                        setShowDropdown(false);
                                                    }}
                                                >
                                                    <span className='text-500'>{item.title}</span>
                                                    <span style={{ fontStyle: "italic", fontSize: "0.8em", marginLeft: 6 }}>({item.type})</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    {selectedRecipe && (
                        <>
                            <table className='table-search-recipe margin-t-16'>
                                <tbody>
                                    <tr>
                                        <td className='cell-title btn-grey m-hidden'>Title:</td>
                                        <td className='cell-text cell-recipe' colSpan={3}>
                                            {selectedRecipe.title}
                                        </td>
                                        <td className='cell-text cell-recipe' colSpan={2}>
                                            {selectedRecipe.author} {selectedRecipe.is_gingham_team && ("of the Gingham Team")}
                                        </td>
                                        <td className='cell-text cell-recipe' colSpan={2}>
                                            Skill Level: {selectedRecipe.skill_level}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title btn-grey m-hidden'>Description:</td>
                                        <td className='cell-text cell-recipe' colSpan={7}>
                                            {selectedRecipe.description}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title btn-grey m-hidden'>Categories:</td>
                                        <td className='cell-text cell-recipe' colSpan={2}>
                                            {selectedRecipe.categories && selectedRecipe.categories.length > 0 && (
                                                <Stack className='box-scroll' direction="row" spacing={1}>
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
                                                </Stack>
                                            )}
                                        </td>
                                        <td className='cell-title btn-grey m-hidden'>Diet Categories:</td>
                                        <td className='cell-text cell-recipe' colSpan={4}>
                                            {selectedRecipe.categories && selectedRecipe.categories.length > 0 && (
                                                <Stack className='box-scroll' direction="row" spacing={1}>
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
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className='cell-title btn-grey m-hidden'>Prep Time:</td>
                                        <td className='cell-text cell-recipe' colSpan={1}>
                                            {formatMinutes(selectedRecipe.prep_time_minutes)}
                                        </td>
                                        <td className='cell-title btn-grey m-hidden'>Cook Time:</td>
                                        <td className='cell-text cell-recipe' colSpan={1}>
                                            {formatMinutes(selectedRecipe.cook_time_minutes)}
                                        </td>
                                        <td className='cell-title btn-grey m-hidden'>Total Time:</td>
                                        <td className='cell-text cell-recipe' colSpan={1}>
                                            {formatMinutes(selectedRecipe.total_time_minutes)}
                                        </td>
                                        <td className='cell-title btn-grey m-hidden'>Serves:</td>
                                        <td className='cell-text cell-recipe' colSpan={1}>
                                            {selectedRecipe.serve_count}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <div className="box-recipe margin-t-16">
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
                                                            <li key={instruction.id} className='ol-bold'>{instruction.description}</li>
                                                        ))}
                                                    </ol>
                                                </div>
                                                {rest.length > 0 && (
                                                    <ol className='ul-numbers ol-last' start={firstTwo.length + 1}>
                                                        {rest.map(instruction => (
                                                            <li key={instruction.id + '-rest'} className='ol-bold'>{instruction.description}</li>
                                                        ))}
                                                    </ol>
                                                )}
                                            </div>
                                        );
                                    })}
                                </article>
                            </div>
                            <button className='btn btn-reset btn-red margin-t-12' onClick={handleEditToggle}>
                                Edit Recipe
                            </button>
                        </>
                    )}
                </>
            )}
        </>
    );
}

export default AdminRecipeEdit;