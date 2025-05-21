import React, { useEffect, useMemo, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import PulseLoader from 'react-spinners/PulseLoader';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Fuse from 'fuse.js';

function AdminRecipeAdd({ recipes, smallwares, ingredients }) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchSmallwares, setSearchSmallwares] = useState('');
    const [searchIngredients, setSearchIngredients] = useState('');
    const [searchCategory, setSearchCategory] = useState('');
    const [searchDiet, setSearchDiet] = useState('');
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedDiets, setSelectedDiets] = useState([]);
    const [unselectedSeasons, setUnselectedSeasons] = useState(['spring', 'summer', 'fall', 'winter']);
    const [selectedSeasons, setSelectedSeasons] = useState([]);
    const [newRecipe, setNewRecipe] = useState([]);
    const [newIsGinghamTeam, setNewIsGinghamTeam] = useState(false);
    const [newSmallware, setNewSmallware] = useState('');
    const [newSmallwareAlt, setNewSmallwareAlt] = useState('');
    const [newIngName, setNewIngName] = useState([]);
    const [newIngNamePlural, setNewIngNamePlural] = useState([]);
    const [newSmallwares, setNewSmallwares] = useState([]);
    const [newRecipeIngredients, setNewRecipeIngredients] = useState([]);
    const [newInstructionGroups, setNewInstructionGroups] = useState([{ id: Date.now(), group_number: 1, title: '' }]);
    const [newInstructions, setNewInstructions] = useState([]);
    const [image, setImage] = useState(null);
    const [pendingInstructionImages, setPendingInstructionImages] = useState({});
    const [status, setStatus] = useState('initial');
    const [isPosting, setIsPosting] = useState(false);


    const smallwareDropdownRef = useRef(null);
    const ingredientDropdownRef = useRef(null);
    const categoryDropdownRef = useRef(null);
    const dietDropdownRef = useRef(null);

    const seasonOrder = ['spring', 'summer', 'fall', 'winter'];

    const handleClickOutsideDropdown = (event) => {
        if (smallwareDropdownRef.current && !smallwareDropdownRef.current.contains(event.target)) {
            setSearchSmallwares('');
        }
        if (ingredientDropdownRef.current && !ingredientDropdownRef.current.contains(event.target)) {
            setSearchIngredients('');
        }
        if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
            setSearchCategory('');
        }
        if (dietDropdownRef.current && !dietDropdownRef.current.contains(event.target)) {
            setSearchDiet('');
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

    const handleSwitchChange = () => {
        setNewIsGinghamTeam(!newIsGinghamTeam);
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
        const newCategory = searchCategory.trim().toLowerCase();
        if (
            newCategory &&
            !selectedCategories.includes(newCategory) &&
            !recipes.some(recipe =>
                recipe.categories.map(cat => cat.toLowerCase()).includes(newCategory)
            )
        ) {
            setSelectedCategories([...selectedCategories, newCategory]);
            setSearchCategory('');
        }
    };

    const handleAddDiet = () => {
        const newDiet = searchDiet.trim().toLowerCase();
        if (
            newDiet &&
            !selectedDiets.includes(newDiet) &&
            !recipes.some(recipe =>
                recipe.diet_categories.map(diet => diet.toLowerCase()).includes(newDiet)
            )
        ) {
            setSelectedDiets([...selectedDiets, newDiet]);
            setSearchDiet('');
        }
    };

    const handleAddSeason = (season) => {
        const lower = season.toLowerCase();

        setUnselectedSeasons(prev =>
            prev.filter(s => s.toLowerCase() !== lower)
        );

        setSelectedSeasons(prev => {
            const newSeasons = [...prev, lower];
            return newSeasons.sort((a, b) =>
                seasonOrder.indexOf(a.toLowerCase()) - seasonOrder.indexOf(b.toLowerCase())
            );
        });
    };

    const handleDeleteSeason = (season) => {
        const lower = season.toLowerCase();

        setSelectedSeasons(prev =>
            prev.filter(s => s.toLowerCase() !== lower)
        );

        setUnselectedSeasons(prev => {
            const newSeasons = [...prev, lower];
            return newSeasons.sort((a, b) =>
                seasonOrder.indexOf(a.toLowerCase()) - seasonOrder.indexOf(b.toLowerCase())
            );
        });
    };

    const handleAddSmallware = async () => {
        if (!newSmallware) return;
        const smallware = newSmallware.trim();
        const smallwareAlt = newSmallwareAlt ? newSmallwareAlt.trim() : null;
        
        setNewSmallwares(prev => [
            ...prev,
            {
                smallware: smallware,
                smallware_alt: smallwareAlt
            },
        ]);
        setNewSmallware('');
        setNewSmallwareAlt('');
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

        const nextNumber = newRecipeIngredients.length + 1;
        setNewRecipeIngredients(prev => [
            ...prev,
            {
                ingredient_id: ingredient.id,
                ingredient_number: nextNumber,
                ingredient,
                plural: false,
                amount: '',
                description: ''
            },
        ]);

        setNewIngName('');
        setNewIngNamePlural('');
    };

    const handleAddExistingIngredient = async (singular, plural) => {
        const existing = ingredients.find(
            ing => ing.name.toLowerCase() === singular.toLowerCase() || ing.name_plural.toLowerCase() === plural.toLowerCase()
        );

        const nextNumber = newRecipeIngredients.length + 1;
        setNewRecipeIngredients(prev => [
            ...prev,
            {
                ingredient_id: existing.id,
                ingredient_number: nextNumber,
                ingredient: existing,
                plural: false,
                amount: '',
                description: ''
            },
        ]);

        setNewIngName('');
        setNewIngNamePlural('');
    };

    const moveIngredient = (index, direction) => {
        const newItems = [...newRecipeIngredients];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newItems.length) return;

        [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];

        const tempNum = newItems[index].ingredient_number;
        newItems[index].ingredient_number = newItems[targetIndex].ingredient_number;
        newItems[targetIndex].ingredient_number = tempNum;

        setNewRecipeIngredients(newItems);
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
        const tempKey = `instr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newInstruction = {
            instruction_group_id: groupId,
            step_number: stepNumber,
            description: '',
            tempKey,
            images: {},
            captions: {}
        };
        setNewInstructions(prev => [...prev, newInstruction]);
    };

    const handleDeleteInstruction = (groupId, stepToRemove) => {
      const groupInstructions = newInstructions
        .filter(i => i.instruction_group_id === groupId)
        .sort((a, b) => a.step_number - b.step_number);

      const instructionToRemove = groupInstructions.find(instr => instr.step_number === stepToRemove);

      if (instructionToRemove && instructionToRemove.tempKey) {
        setPendingInstructionImages(prev => {
          const updatedPending = { ...prev };
          delete updatedPending[instructionToRemove.tempKey];
          return updatedPending;
        });
      }

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

    const moveInstruction = (groupId, index, direction) => {
        const groupInstructions = newInstructions
            .filter(instr => instr.instruction_group_id === groupId)
            .sort((a, b) => a.step_number - b.step_number);

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= groupInstructions.length) return;

        const reordered = [...groupInstructions];
        [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

        reordered.forEach((instr, i) => {
            instr.step_number = i + 1;
        });

        const updatedAll = [
            ...newInstructions.filter(instr => instr.instruction_group_id !== groupId),
            ...reordered
        ];

        setNewInstructions(updatedAll);
    };

    const moveInstructionGroup = (index, direction) => {
        const newGroups = [...newInstructionGroups];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newGroups.length) return;

        [newGroups[index], newGroups[targetIndex]] = [newGroups[targetIndex], newGroups[index]];

        newGroups.forEach((group, i) => {
            group.group_number = i + 1;
        });

        setNewInstructionGroups(newGroups);
    };

    const handleInstructionImageUpload = async (instructionId, imageFile, caption, index) => {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('type', 'instruction');
        formData.append('instruction_id', instructionId);
        formData.append('caption', caption || '');
        formData.append('image_index', index);

        try {
            const response = await fetch('/api/upload/instruction-images', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                return data.filename;
            } else {
                throw new Error('Failed to upload instruction image');
            }
        } catch (error) {
            console.error('Error uploading instruction image:', error);
            toast.error('Failed to upload instruction image');
            return null;
        }
    };

    const handleSelectInstructionImage = (instructionKey, file) => {
        const maxFileSize = 10 * 1024 * 1024; // 10 MB limit
        if (file.size > maxFileSize) {
            toast.warning('File size exceeds 10 MB. Please upload a smaller file', {
                autoClose: 4000,
            });
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        
        setPendingInstructionImages(prev => {
            const existingImages = prev[instructionKey] || [];
            return {
                ...prev,
                [instructionKey]: [
                    ...existingImages,
                    {
                        file,
                        previewUrl,
                        caption: '',
                        index: existingImages.length + 1
                    }
                ]
            };
        });
    };

    const handleDeleteInstructionImage = (instructionKey, imageIndex) => {
        setPendingInstructionImages(prev => {
            const updatedImages = prev[instructionKey].filter((_, idx) => idx !== imageIndex);
            
            const reindexedImages = updatedImages.map((img, idx) => ({
                ...img,
                index: idx + 1
            }));
            
            return {
                ...prev,
                [instructionKey]: reindexedImages
            };
        });
    };

    const saveInstructionImages = async (createdRecipe, instructionsWithImageData) => {
        for (const group of createdRecipe.instruction_groups || []) {
            for (const instruction of group.instructions || []) {
                const originalInstruction = instructionsWithImageData.find(
                    instr => instr.instruction_group_id.toString() === group.original_group_id.toString() && 
                    instr.step_number === instruction.step_number
                );

                if (originalInstruction?.pendingImages?.length > 0) {
                    const imagesDict = {};
                    const captionsDict = {};

                    for (const [idx, imgData] of originalInstruction.pendingImages.entries()) {
                        const imageKey = (idx + 1).toString();
                        const filename = await handleInstructionImageUpload(
                            instruction.id, 
                            imgData.file, 
                            imgData.caption,
                            imageKey
                        );

                        if (filename) {
                            imagesDict[imageKey] = filename;
                            if (imgData.caption) {
                                captionsDict[imageKey] = imgData.caption;
                            }
                        }
                    }

                    if (Object.keys(imagesDict).length > 0) {
                        await fetch(`/api/instructions/${instruction.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                images: imagesDict,
                                captions: captionsDict,
                                replace_all_images: true,
                                replace_all_captions: true
                            }),
                        });
                    }
                }
            }
        }
    };

    const handleFileChange = (event) => {
        if (event.target.files) {
            const file = event.target.files[0];
            const maxFileSize = 10 * 1024 * 1024; // 10 MB limit
            if (file.size > maxFileSize) {
                toast.warning('File size exceeds 10 MB. Please upload a smaller file', {
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

    const handleImageDelete = async () => {
        setImage(null);
        toast.success('Image deleted successfully.', {
            autoClose: 4000,
        });
    }

    const handleCreateRecipe = async () => {
        setIsPosting(true);
        const requiredFields = ['title', 'description', 'author', 'prep_time_minutes', 'cook_time_minutes', 'serve_count'];
        for (const field of requiredFields) {
            if (!newRecipe[field] || newRecipe[field].toString().trim() === '') {
                toast.error(`Missing required field: ${field.replace('_', ' ')}`);
                setIsPosting(false);
                return;
            }
        }

        try {
            const instructionsWithImageData = newInstructions.map(instruction => {
                const images = pendingInstructionImages[instruction.tempKey] || [];
                return {
                    ...instruction,
                    pendingImages: images.map(img => ({
                        file: img.file,
                        caption: img.caption,
                        index: img.index
                    }))
                };
            });

            const nonEmptyInstructionGroups = newInstructionGroups
                .map(group => {
                    const groupInstructions = instructionsWithImageData
                        .filter(instr => instr.instruction_group_id === group.id)
                        .map(({ pendingImages, tempKey, ...rest }) => rest);
                    
                    if (groupInstructions.length === 0) return null;
                    return {
                        ...group,
                        instructions: groupInstructions
                    };
                })
                .filter(Boolean);

            const fullRecipePayload = {
                ...newRecipe,
                is_gingham_team: newIsGinghamTeam,
                prep_time_minutes: parseInt(newRecipe.prep_time_minutes),
                cook_time_minutes: parseInt(newRecipe.cook_time_minutes),
                total_time_minutes: parseInt(newRecipe.cook_time_minutes) + parseInt(newRecipe.prep_time_minutes),
                serve_count: parseInt(newRecipe.serve_count),
                categories: selectedCategories,
                diet_categories: selectedDiets,
                seasons: selectedSeasons,
                recipe_ingredients: newRecipeIngredients,
                smallwares: newSmallwares,
                instruction_groups: nonEmptyInstructionGroups
            };

            const recipeRes = await fetch("/api/recipes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(fullRecipePayload),
            });

            if (!recipeRes.ok) {
                setIsPosting(false);    
                throw new Error("Failed to create recipe");
            }

            const createdRecipe = await recipeRes.json();

            if (image) {
                await handleImageUpload(createdRecipe.id);
            }

            await saveInstructionImages(createdRecipe, instructionsWithImageData);

            setNewRecipe({
                title: '',
                skill_level: '',
                description: '',
                author: '',
                attribution: '',
                attribution_link: '',
                prep_time_minutes: '',
                cook_time_minutes: '',
                serve_count: '',
            });
            setSelectedCategories([]);
            setSelectedDiets([]);
            setSelectedSeasons([]);
            setUnselectedSeasons(seasonOrder);
            setNewRecipeIngredients([]);
            setNewSmallwares([]);
            setNewInstructionGroups([{ id: Date.now(), group_number: 1, title: '' }]);
            setNewInstructions([]);
            setPendingInstructionImages({});
            setNewIsGinghamTeam(false);            

            toast.success("Recipe created successfully!");
            setIsPosting(false);
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Something went wrong while creating the recipe.");
            setIsPosting(false);
        }
    };

    
    return (
        <>
            <title>Gingham • Admin Recipes • Add</title>
            <h2 className='margin-t-16'>Add Recipes</h2>
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
                                    value={newRecipe.title}
                                    onChange={handleRecipeInputChange}
                                />
                            </td>
                            <td className='cell-title btn-grey m-hidden'>Skill Level:</td>
                            <td>
                                <select
                                    name="skill_level"
                                    className='select-recipe'
                                    value={newRecipe.skill_level}
                                    onChange={handleRecipeInputChange}
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
                            <td className='cell-text cell-recipe' colSpan={5}>
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
                            <td className='cell-title btn-grey m-hidden'>Description:</td>
                            <td className='cell-text cell-recipe' colSpan={5}>
                                <textarea
                                    className="search-bar cell-80 textarea-recipe"
                                    name="description"
                                    type="text"
                                    placeholder="Recipe description (3-6 sentences)..."
                                    value={newRecipe.description}
                                    onChange={handleRecipeInputChange}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className='cell-title btn-grey m-hidden'>Author:</td>
                            <td className='cell-text cell-recipe' colSpan={2}>
                                <input
                                    className="search-bar cell-32"
                                    name="author"
                                    type="text"
                                    placeholder="Author..."
                                    value={newRecipe.author}
                                    onChange={handleRecipeInputChange}
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
                                                    checked={newRecipe.is_gingham_team}
                                                    onChange={() => handleSwitchChange()}
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
                            <td className='cell-title btn-grey m-hidden'>Author Attribution:</td>
                            <td className='cell-text cell-recipe' colSpan={2}>
                                <input
                                    className="search-bar cell-32"
                                    name="attribution"
                                    type="text"
                                    placeholder="Attribution if not from Gingham Team..."
                                    value={newRecipe.attribution}
                                    onChange={handleRecipeInputChange}
                                />
                            </td>
                            <td className='cell-title btn-grey m-hidden'>Attribution Link:</td>
                            <td className='cell-text cell-recipe' colSpan={2}>
                                <input
                                    className="search-bar cell-32"
                                    name="attribution_link"
                                    type="text"
                                    placeholder="Link if provided by author..."
                                    value={newRecipe.attribution_link}
                                    onChange={handleRecipeInputChange}
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
                                    value={searchCategory}
                                    onChange={(e) => setSearchCategory(e.target.value.toLowerCase())}
                                />
                                {searchCategory && (
                                    <ul className="dropdown-content" ref={categoryDropdownRef}>
                                        {categoryFuse.search(searchCategory).slice(0, 10).map(({ item }) => (
                                            <li
                                                className="search-results"
                                                key={`category-${item.name}`}
                                                onClick={() => {
                                                    if (!selectedCategories.includes(item.name)) {
                                                        setSelectedCategories(prev => [...prev, item.name]);
                                                    }
                                                    setSearchCategory('');
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
                                    value={searchDiet}
                                    onChange={(e) => setSearchDiet(e.target.value.toLowerCase())}
                                />
                                {searchDiet && (
                                    <ul className="dropdown-content" ref={dietDropdownRef}>
                                        {dietFuse.search(searchDiet).slice(0, 10).map(({ item }) => (
                                            <li
                                                className="search-results"
                                                key={`diet-${item.name}`}
                                                onClick={() => {
                                                    if (!selectedDiets.includes(item.name)) {
                                                        setSelectedDiets(prev => [...prev, item.name]);
                                                    }
                                                    setSearchDiet('');
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
                            <td className='cell-title btn-grey m-hidden'>Seasons:</td>
                            <td className='cell-text cell-recipe'>
                                <Stack direction="row" spacing={1}>
                                    {unselectedSeasons.map((season, i) => (
                                        <Chip 
                                            key={`unseason-${i}`}
                                            label={season}
                                            style={{ backgroundColor: "#eee", fontSize: ".9em" }}
                                            size="small"
                                            onClick={() => handleAddSeason(season)}
                                        />
                                    ))}
                                </Stack>
                            </td>
                            <td className='cell-title btn-grey m-hidden'>Selected:</td>
                            {selectedSeasons.length > 0 && (
                                <td className='cell-text cell-chips'>
                                    <Stack direction="row" spacing={1}>
                                        {selectedSeasons.map((season, i) => (
                                            <Chip 
                                                key={`season-${i}`}
                                                label={season}
                                                style={{ backgroundColor: "#eee", fontSize: ".9em" }}
                                                size="small"
                                                onDelete={() => handleDeleteSeason(season)}
                                            />
                                        ))}
                                    </Stack>
                                </td>
                            )}
                        </tr>
                    </tbody>
                </table>
                <div className="box-bounding margin-t-16">
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
                    {newRecipeIngredients.map((item, index) => (
                        <div key={index} className='flex-start flex-center-align'>
                            <button
                                className='btn btn-delete icon-arrow-u margin-r-4'
                                onClick={() => moveIngredient(index, 'up')}
                                disabled={index === 0}
                                title="Move up"
                            >
                                &emsp;
                            </button>
                            <button
                                className='btn btn-delete icon-arrow-d margin-r-4'
                                onClick={() => moveIngredient(index, 'down')}
                                disabled={index === newRecipeIngredients.length - 1}
                                title="Move down"
                            >
                                &emsp;
                            </button>
                            <button
                                className='btn btn-delete text-700 btn-red margin-r-12'
                                onClick={() => {
                                    const updated = newRecipeIngredients.filter((_, i) => i !== index);
                                    const reindexed = updated.map((item, i) => ({ ...item, ingredient_number: i + 1 }));
                                    setNewRecipeIngredients(reindexed);
                                }}
                                title="Remove ingredient"
                            >
                                ×
                            </button>
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
                                className='input-ingredients input-desc'
                                placeholder="Description (optional)"
                                value={item.description}
                                onChange={(e) => {
                                    const newItems = [...newRecipeIngredients];
                                    newItems[index].description = e.target.value;
                                    setNewRecipeIngredients(newItems);
                                }}
                            />
                        </div>
                    ))}
                </div>
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
                    {newSmallwares.map((item, index) => (
                        <div key={index} className='flex-start flex-center-align margin-b-4'>
                            <button
                                className='btn btn-delete text-700 btn-red margin-r-12'
                                onClick={() => {
                                    const updated = newSmallwares.filter((_, i) => i !== index);
                                    setNewSmallwares(updated);
                                }}
                                title="Remove smallware"
                            >
                                ×
                            </button>
                            <span className='text-700'>
                                {item.smallware}<span className="text-300">{item.smallware_alt && ' or '}</span>{item.smallware_alt}
                            </span>
                        </div>
                    ))}
                </div>
                <div className='box-bounding'>
                    <h3 className='margin-b-8'>Instructions</h3>
                    {newInstructionGroups.map((group, groupIndex) => (
                        <div key={group.id} className="box-bounding">
                            <div className="flex-start flex-center-align margin-b-8">
                                <strong className="margin-r-8">Group {group.group_number}</strong>
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
                                    disabled={groupIndex === newInstructionGroups.length - 1}
                                    title="Move down"
                                >
                                    &emsp;
                                </button>
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
                            </div>
                            {newInstructions
                                .filter(instr => instr.instruction_group_id === group.id)
                                .sort((a, b) => a.step_number - b.step_number)
                                .map((instr, instrIndex, array) => (
                                    <div key={`${group.id}-${instr.step_number}`}>
                                        <div className="flex-start margin-b-4">
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
                                                <>
                                                    <button
                                                        className='btn btn-recipe-arrow icon-arrow-u margin-r-4 margin-l-8'
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
                                                    <button
                                                        className="btn btn-delete btn-red"
                                                        onClick={() => handleDeleteInstruction(group.id, instr.step_number)}
                                                        title="Delete instruction"
                                                    >
                                                        ×
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                        <div className='flex-start flex-gap-8'>
                                            {pendingInstructionImages[instr.tempKey]?.map((imgObj, imgIndex) => (
                                                <div key={`preview-${imgIndex}`} className="flex-start flex-column margin-t-4">
                                                    <img
                                                        src={imgObj.previewUrl}
                                                        alt="Instruction preview"
                                                        className="img-market-card"
                                                    />
                                                    <div className="margin-t-4">
                                                        <input
                                                            type="text"
                                                            className='input-caption'
                                                            placeholder="Caption (optional)"
                                                            value={imgObj.caption}
                                                            onChange={(e) => {
                                                                const updated = { ...pendingInstructionImages };
                                                                updated[instr.tempKey][imgIndex].caption = e.target.value;
                                                                setPendingInstructionImages(updated);
                                                            }}
                                                        />
                                                        <button
                                                            className="btn btn-delete btn-red"
                                                            onClick={() => handleDeleteInstructionImage(instr.tempKey, imgIndex)}
                                                            title="Delete image"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="margin-t-4 margin-b-12">
                                            <label className="btn btn-small">
                                                + Add Image
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    multiple
                                                    onChange={(e) => {
                                                        if (e.target.files.length > 0) {
                                                            const files = Array.from(e.target.files);
                                                            files.forEach(file => {
                                                                handleSelectInstructionImage(instr.tempKey, file);
                                                            });
                                                            e.target.value = null;
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
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
                                {groupIndex === newInstructionGroups.length - 1 && (
                                    <button className='btn btn-small' onClick={handleAddInstructionGroup}>
                                        + Add Group
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                {isPosting ? (
                    <PulseLoader
                        className='margin-t-16'
                        color={'#ff806b'}
                        size={10}
                        aria-label="Loading Spinner"
                        data-testid="loader"
                    />
                ) : (
                    <button className='btn btn-reset margin-t-12' onClick={handleCreateRecipe}>
                        Create Recipe
                    </button>
                )}
            </div>
        </>
    );
}

export default AdminRecipeAdd;