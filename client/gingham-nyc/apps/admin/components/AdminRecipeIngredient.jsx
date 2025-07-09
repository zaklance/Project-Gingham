import React, { useMemo, useRef, useState } from "react";
import Fuse from 'fuse.js';
import { toast } from 'react-toastify';

function AdminRecipeIngredient({ ingredients, setIngredients }) {
    const [searchIngredients, setSearchIngredients] = useState('');
    const [selectedIngredient, setSelectedIngredient] = useState({});

    const ingredientDropdownRef = useRef(null);

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

    const handleEditIngredient = (e) => {
        const { name, value } = e.target;
        setSelectedIngredient(prev => ({
            ...prev,
            [name === 'singular' ? 'name' : 'name_plural']: value,
        }));
    };

    const handleIngredientUpdate = async () => {
        try {
            const response = await fetch(`/api/ingredients/${selectedIngredient.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: selectedIngredient.name,
                    name_plural: selectedIngredient.name_plural
                    }),
            });

            if (response.ok) {
                const updatedProduct = await response.json();
                toast.success('Product successfully updated!', {
                    autoClose: 4000,
                });
                console.log('Product updated successfully:', updatedProduct);
                setSearchIngredients('');
                setSelectedIngredient({
                    id: null,
                    name: '',
                    name_plural: ''
                });
                setIngredients((prev) =>
                    prev.map((item) => (item.id === selectedIngredient.id ? updatedProduct : item))
                );
            } else {
                console.error('Failed to update product:', await response.text());
            }
        } catch (error) {
            console.error('Error updating product:', error);
        }
    };


    return (
        <>
            <div className="box-bounding margin-t-24">
                <h3 className='margin-b-8'>Update Ingredients</h3>
                <p className='margin-t-8 margin-l-8 margin-b-12'>Only brand names and proper nouns are capitalized for ingredients.</p>
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
                                                    setSelectedIngredient(item)
                                                    setSearchIngredients('');
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
                                    name="singular"
                                    placeholder="Singular spelling"
                                    value={selectedIngredient.name}
                                    onChange={handleEditIngredient}
                                />
                            </td>
                            <td className='cell-text cell-recipe'>
                                <input
                                    className="cell-32"
                                    type="text"
                                    name="plural"
                                    placeholder="Plural spelling"
                                    value={selectedIngredient.name_plural}
                                    onChange={handleEditIngredient}
                                />
                            </td>
                            <td>
                                <button className='btn btn-filter' onClick={handleIngredientUpdate}>&#8635;</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </>
    );
}

export default AdminRecipeIngredient;