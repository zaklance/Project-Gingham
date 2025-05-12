import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import app
from faker import Faker
from random import random, choice, randint
from models import ( db, User, Market, MarketDay, Vendor, MarketReview, 
                    VendorReview, ReportedReview, MarketReviewRating, 
                    VendorReviewRating, MarketFavorite, VendorFavorite, 
                    VendorMarket, VendorUser, AdminUser, Basket, Event, 
                    Product, UserNotification, VendorNotification, 
                    AdminNotification, QRCode, FAQ, Blog, BlogFavorite,
                    Receipt, SettingsUser, SettingsVendor, SettingsAdmin,
                    UserIssue, Recipe, Ingredient, RecipeIngredient,
                    Instruction, InstructionGroup, Smallware
                    )
import json
from datetime import datetime, timedelta, timezone, time, date

fake = Faker()

def run():

    Recipe.query.delete()
    Ingredient.query.delete()
    RecipeIngredient.query.delete()
    Instruction.query.delete()
    InstructionGroup.query.delete()
    Smallware.query.delete()

    db.session.commit()

    recipes = [
        Recipe(
            id=1,
            title="ZL's Patented Falafel Burger",
            description="American twist on the classic falafel; a veggie burger with a falafel core. I've had many dinner parties in undergrad and grad school, and this dish was always a hit!",
            author="Zak Wosewick",
            is_gingham_team=True,
            image="",
            categories=["veggie burgers"],
            diet_categories=["vegetarian", "vegan"],
            prep_time_minutes=50,
            cook_time_minutes=15,
            total_time_minutes=65,
            serve_count=6,
            skill_level=2
        ),
        Recipe(
            id=2,
            title="Caprese Martini",
            description="The Caprese Martini is a bold and savory twist on a classic, inspired by the fresh flavors of the beloved Italian Caprese salad. This inventive cocktail infuses vodka with basil, tomato, and olive oil, then adds white vermouth and a touch of balsamic vinegar for balanced acidity. The result is an herbaceous, silky drink with notes of ripe tomato, grassy olive oil, and a hint of tangy sweetness. Garnished with cherry tomatoes, it’s both visually striking and refreshingly complex, a refreshing savory cocktail for the perfect summer day.",
            author="Zak Wosewick",
            is_gingham_team=True,
            image="",
            categories=["cocktails", "infused vodka"],
            diet_categories=[],
            prep_time_minutes=2160,
            cook_time_minutes=5,
            total_time_minutes=2165,
            serve_count=6,
            skill_level=1
        ),
    ]

    db.session.add_all(recipes)
    db.session.commit()

    ingredients = [
        Ingredient(
            id=1,
            name="chickpea",
            name_plural="chickpeas"
        ),
        Ingredient(
            id=2,
            name="egg",
            name_plural="eggs"
        ),
        Ingredient(
            id=3,
            name="chia seeds",
            name_plural="chia seeds"
        ),
        Ingredient(
            id=4,
            name="onion",
            name_plural="onions"
        ),
        Ingredient(
            id=5,
            name="salt",
            name_plural="salt"
        ),
        Ingredient(
            id=6,
            name="dried parsley",
            name_plural="dried parsley"
        ),
        Ingredient(
            id=7,
            name="cumin",
            name_plural="cumin"
        ),
        Ingredient(
            id=8,
            name="coriander",
            name_plural="coriander"
        ),
        Ingredient(
            id=9,
            name="cardamom",
            name_plural="cardamom"
        ),
        Ingredient(
            id=10,
            name="paprika",
            name_plural="paprika"
        ),
        Ingredient(
            id=11,
            name="cayenne",
            name_plural="cayenne"
        ),
        Ingredient(
            id=12,
            name="lemon",
            name_plural="lemons"
        ),
        Ingredient(
            id=13,
            name="frozen peas",
            name_plural="frozen peas"
        ),
        Ingredient(
            id=14,
            name="whole grain bread crumbs",
            name_plural="whole grain bread crumbs"
        ),
        Ingredient(
            id=15,
            name="avocado",
            name_plural="avocados"
        ),
        Ingredient(
            id=16,
            name="pretzel bun",
            name_plural="pretzel buns"
        ),
        Ingredient(
            id=17,
            name="vodka",
            name_plural="vodka"
        ),
        Ingredient(
            id=18,
            name="fresh basil",
            name_plural="fresh basil"
        ),
        Ingredient(
            id=19,
            name="tomato",
            name_plural="tomatoes"
        ),
        Ingredient(
            id=20,
            name="olive oil",
            name_plural="olive oil"
        ),
        Ingredient(
            id=21,
            name="Lustau Blanco",
            name_plural="Lustau Blanco"
        ),
        Ingredient(
            id=22,
            name="balsamic vinegar",
            name_plural="balsamic vinegar"
        ),
        Ingredient(
            id=23,
            name="basil, olive oil, and tomato, infused vodka",
            name_plural="basil, olive oil, and tomato, infused vodka"
        ),
        Ingredient(
            id=24,
            name="cherry tomato",
            name_plural="cherry tomatoes"
        )
    ]

    db.session.add_all(ingredients)
    db.session.commit()

    recipe_ingredients = [
        RecipeIngredient(
            recipe_id=1,
            ingredient_id=1,
            ingredient_number=1,
            amount="2.25 cups",
            plural=True,
            description="cooked chickpeas aka one can of salted chickpeas (canned works best with chia version)"
        ),
        RecipeIngredient(
            recipe_id=1,
            ingredient_id=2,
            ingredient_number=2,
            amount="Option A: 4 eggs",
            plural=True,
            description=""
        ),
        RecipeIngredient(
            recipe_id=1,
            ingredient_id=3,
            ingredient_number=3,
            amount="Option B: 10 tbsp",
            plural=True,
            description="mix the ground chia seeds with 150mL of water"
        ),
        RecipeIngredient(
            recipe_id=1,
            ingredient_id=4,
            ingredient_number=4,
            amount="1 medium",
            plural=False,
            description="diced (I prefer yellow, but whatevs)"
        ),
        RecipeIngredient(
            recipe_id=1,
            ingredient_id=5,
            ingredient_number=5,
            amount="0.5 tsp",
            plural=True,
            description="(I prefer sea salt, #yolo)"
        ),
        RecipeIngredient(
            recipe_id=1,
            ingredient_id=6,
            ingredient_number=6,
            amount="2 tbsp",
            plural=True,
            description=""
        ),
        RecipeIngredient(
            recipe_id=1,
            ingredient_id=7,
            ingredient_number=7,
            amount="2 tsp",
            plural=True,
            description=""
        ),
        RecipeIngredient(
            recipe_id=1,
            ingredient_id=8,
            ingredient_number=8,
            amount="2 tsp",
            plural=True,
            description="ground"
        ),
        RecipeIngredient(
            recipe_id=1,
            ingredient_id=9,
            ingredient_number=9,
            amount="0.5 - 2 tsp",
            plural=True,
            description="to taste (I have been using 1tsp recently)"
        ),
        RecipeIngredient(
            recipe_id=1,
            ingredient_id=10,
            ingredient_number=10,
            amount="2 tsp",
            plural=True,
            description="(smoked paprika is fire)"
        ),
        RecipeIngredient(
            recipe_id=1,
            ingredient_id=11,
            ingredient_number=11,
            amount="0.5 tsp",
            plural=True,
            description=""
        ),
        RecipeIngredient(
            recipe_id=1,
            ingredient_id=12,
            ingredient_number=12,
            amount="1",
            plural=False,
            description="zest & juice"
        ),
        RecipeIngredient(
            recipe_id=1,
            ingredient_id=13,
            ingredient_number=13,
            amount="1 cup",
            plural=True,
            description=""
        ),
        RecipeIngredient(
            recipe_id=1,
            ingredient_id=14,
            ingredient_number=14,
            amount="1 cup",
            plural=True,
            description=""
        ),
        RecipeIngredient(
            recipe_id=1,
            ingredient_id=15,
            ingredient_number=15,
            amount="1 large",
            plural=True,
            description="2 medium if you really love avocados"
        ),
        RecipeIngredient(
            recipe_id=1,
            ingredient_id=16,
            ingredient_number=16,
            amount="6",
            plural=True,
            description=""
        ),
        RecipeIngredient(
            recipe_id=2,
            ingredient_id=17,
            ingredient_number=1,
            amount="600mL",
            plural=True,
            description=""
        ),
        RecipeIngredient(
            recipe_id=2,
            ingredient_id=18,
            ingredient_number=2,
            amount="3 large laves",
            plural=True,
            description=""
        ),
        RecipeIngredient(
            recipe_id=2,
            ingredient_id=19,
            ingredient_number=3,
            amount="1 large",
            plural=False,
            description=""
        ),
        RecipeIngredient(
            recipe_id=2,
            ingredient_id=20,
            ingredient_number=4,
            amount="150mL",
            plural=True,
            description="extra virgin"
        ),
        RecipeIngredient(
            recipe_id=2,
            ingredient_id=23,
            ingredient_number=5,
            amount="2 oz",
            plural=True,
            description=""
        ),
        RecipeIngredient(
            recipe_id=2,
            ingredient_id=21,
            ingredient_number=6,
            amount="1.5 oz",
            plural=True,
            description=""
        ),
        RecipeIngredient(
            recipe_id=2,
            ingredient_id=22,
            ingredient_number=7,
            amount="2 dashes",
            plural=True,
            description=""
        ),
        RecipeIngredient(
            recipe_id=2,
            ingredient_id=24,
            ingredient_number=8,
            amount="2",
            plural=True,
            description="(to garnish)"
        )
    ]

    db.session.add_all(recipe_ingredients)
    db.session.commit()

    smallwares = [
        Smallware(
            recipe_id=1,
            smallware="food processor",
            smallware_alt="dough blender"
        ),
        Smallware(
            recipe_id=1,
            smallware="spice grinder",
            smallware_alt="pre-ground chia seeds"
        ),
        Smallware(
            recipe_id=1,
            smallware="mixing bowl"
        ),
        Smallware(
            recipe_id=1,
            smallware="medium pan",
        ),
        Smallware(
            recipe_id=2,
            smallware="bottle",
        ),
        Smallware(
            recipe_id=2,
            smallware="strainer",
            smallware_alt="cheesecloth",
        ),
        Smallware(
            recipe_id=2,
            smallware="freezer-safe container",
        ),
    ]

    db.session.add_all(smallwares)
    db.session.commit()

    instructions = [
        Instruction(
            recipe_id=1,
            instruction_group_id=1,
            step_number=1,
            description="A food processor works best, but I’ve done it by hand using a hand dough blender"
        ),
        Instruction(
            recipe_id=1,
            instruction_group_id=1,
            step_number=2,
            description="If using chai seeds, blend in spice grinder. Mix with water using 1:5 ratio of chia:water; let sit for a few min"
        ),
        Instruction(
            recipe_id=1,
            instruction_group_id=1,
            step_number=3,
            description="Add chickpeas, diced onion, egg/chia mix to food processor/bowl"
        ),
        Instruction(
            recipe_id=1,
            instruction_group_id=1,
            step_number=4,
            description="Blend until it’s decently mixed"
        ),
        Instruction(
            recipe_id=1,
            instruction_group_id=1,
            step_number=5,
            description="Zest your lemon and squeeze the juice, filtering out the seeds in the process"
        ),
        Instruction(
            recipe_id=1,
            instruction_group_id=1,
            step_number=6,
            description="Add the rest of the spices and the lemon zest (not the peas or bread crumbs)"
        ),
        Instruction(
            recipe_id=1,
            instruction_group_id=1,
            step_number=7,
            description="Blend to ideal consistency"
        ),
        Instruction(
            recipe_id=1,
            instruction_group_id=1,
            step_number=8,
            description="In a bowl or fridge-able container, add the falafel and peas, mix until evenly dispersed"
        ),
        Instruction(
            recipe_id=1,
            instruction_group_id=1,
            step_number=9,
            description="Finally, add the bread crumbs and mix well!!!"
        ),
        Instruction(
            recipe_id=1,
            instruction_group_id=1,
            step_number=10,
            description="Let sit in the fridge for 30min"
        ),
        Instruction(
            recipe_id=1,
            instruction_group_id=1,
            step_number=11,
            description="In a pan, heat up the burgers on a medium temp, I prefer using safflower or peanut oil. Cook until the burger reaches 160°F "
        ),
        Instruction(
            recipe_id=1,
            instruction_group_id=2,
            step_number=1,
            description="Pretzel Buns are ideal, but if you’re budgeting it, any bun will do. I’ve even wrapped a pita around it—it was actually really good that way!"
        ),
        Instruction(
            recipe_id=1,
            instruction_group_id=2,
            step_number=2,
            description="Garnishes: avocado—a must; ketchup; tomato slice, extra spice!"
        ),
        Instruction(
            recipe_id=1,
            instruction_group_id=2,
            step_number=3,
            description="Drinks: pairs well with a cold highlife, or a bitter IPA"
        ),
        Instruction(
            recipe_id=1,
            instruction_group_id=2,
            step_number=4,
            description="Email us at hello@gingham.nyc to let us know how it turned out, fun modifications made, or any criticism you might have, but most of all—enjoy!"
        ),
        Instruction(
            recipe_id=2,
            instruction_group_id=3,
            step_number=1,
            description="Slice tomatoes, smack the basil leaves with your hand, and add to a freezer-proof container. Freeze for 24 hours."
        ),
        Instruction(
            recipe_id=2,
            instruction_group_id=3,
            step_number=2,
            description="Strain vodka through cheesecloth of a fine mesh strainer."
        ),
        Instruction(
            recipe_id=2,
            instruction_group_id=3,
            step_number=3,
            description="Add olive oil and shake well. Freeze for another 12 hours."
        ),
        Instruction(
            recipe_id=2,
            instruction_group_id=3,
            step_number=4,
            description="The olive oil will seperate and freeze on top of the vodka. Remove the layer of oil, and pour into a bottle; keep refridgerated."
        ),
        Instruction(
            recipe_id=2,
            instruction_group_id=4,
            step_number=1,
            description="On ice in a mixing vessel, add the infused vodka, Lustau Blanco, and balsamic vinegar. Stir for 20-30 seconds until chilled."
        ),
        Instruction(
            recipe_id=2,
            instruction_group_id=4,
            step_number=2,
            description="Strain into a martini glass and garnish with 2 cherry tomatoes on a skewer."
        ),
    ]

    db.session.add_all(instructions)
    db.session.commit()

    instruction_groups = [
        InstructionGroup(
            recipe_id=1,
            group_number=1
        ),
        InstructionGroup(
            recipe_id=1,
            title="Plate & Garnish",
            group_number=2
        ),
        InstructionGroup(
            recipe_id=2,
            title="Infused Vodka",
            group_number=1
        ),
        InstructionGroup(
            recipe_id=2,
            title="Caprese Martini",
            group_number=2
        )
    ]

    db.session.add_all(instruction_groups)
    db.session.commit()
    
if __name__ == '__main__':
    with app.app_context():
        run()