import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/likes';
import * as searchView from './views/SearchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import {elements, renderLoader, clearLoader} from './views/base';

/* Global state of the app
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes
 */
const state = {};
window.state = state;

/*
 * Search controller
 */
const controlSearch = async () => {
  // Get the query from the view
  const query = searchView.getInput();

  if (query) {
    // New search object and add to state
    state.search = new Search(query);

    // Prepare UI for results
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);
    try {
      //Search for recipes
      await state.search.getResults();
      // Render results on UI
      clearLoader();
      searchView.renderResults(state.search.result);
    } catch(err) {
      alert('Something wrong with the search ...');
      clearLoader();
    }
  }
}

elements.searchForm.addEventListener('submit', e => {
  e.preventDefault();
  controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
  const btn = e.target.closest('.btn-inline');
  if (btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
  }
});

/*
 * Recipe controller
 */
const controlRecipe = async () => {
  // Get ID from url
  const id = window.location.hash.replace('#','');
  console.log(id);

  if (id) {
    //prepare UI for changes
    recipeView.ClearRecipe();
    renderLoader(elements.recipe);

    //highlight selected search item
    if (state.search) searchView.highlightSelected(id);

    //create new recipe object
    state.recipe = new Recipe(id);

    try {
      //get recipe data and parse ingredients
      await state.recipe.getRecipe();
      state.recipe.parseIngredients();
      //calculate servings and time
      state.recipe.calcTime();
      state.recipe.calcServings();

      //render recipe
      clearLoader();
      recipeView.renderRecipe(state.recipe,
        state.likes.isLiked(id)
      );
    } catch(err) {
      alert('Error proccessing recipe!');
      console.log(err);
    }
  }
};

//window.addEventListener('hashchange', controlRecipe);
//window.addEventListener('load', controlRecipe);
['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/*
 * List controller
 */

const controlList = () => {
  // create a new list if there is none yet
  listView.clearList();
  if (!state.list) state.list = new List();
  // Add each ingredient to the list and UI
  state.recipe.ingredients.forEach(el => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
};

//Handle delete and update list items events
elements.shopping.addEventListener('click', e => {
  const id = e.target.closest('.shopping__item').dataset.itemid;
  //handle the delete btn
  if (e.target.matches('.shopping__delete, .shopping__delete *')) {
    // delete from state
    state.list.deleteItem(id);
    // delete from UI
    listView.deleteItem(id);
    //Handle the count update
  } else if(e.target.matches('.shopping__count-value')) {
    const val = parseFloat(e.target.value, 10)
    if (val >= 0) {
    state.list.updateCount(id, val);
    }
  }
});

/*
 * Like controller
 */
//TESTING

const controlLike = () => {
  if(!state.likes) state.likes = new Likes();
  const currentID = state.recipe.id;
  // User has NOT yet liked the current recipe
  if (!state.likes.isLiked(currentID)) {
    // add like to the state
    const newLike = state.likes.addLike(
      currentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );
    // toggle the like btn
    likesView.toggleLikeBtn(true);
    // add like to the UI list
    likesView.renderLike(newLike);
  // User HAS yet liked the current recipe
  } else {
    // remove like to the state
    state.likes.deleteLike(currentID);
    // toggle the like btn
    likesView.toggleLikeBtn(false);
    // remove like from the UI list
    likesView.deleteLike(currentID);
  }

  likesView.toggleLikeMenu(state.likes.getNumLikes());
};


// Restore liked recipes on page load
window.addEventListener('load', () => {
state.likes = new Likes();
  // restore likes
  state.likes.readStorage();
  //toggle menu button
likesView.toggleLikeMenu(state.likes.getNumLikes());
  // Render the exiting likes
  state.likes.likes.forEach(like => likesView.renderLike(like));
});

// Handling recipe btn clicks
elements.recipe.addEventListener('click', e => {
  if (e.target.matches('.btn-decrease, .btn-decrease *')) {
    // Decrease button is clicked
  if (state.recipe.servings > 1) {
    state.recipe.updateServings('dec')
    recipeView.updateServingsIngredients(state.recipe);
  }
  } else if (e.target.matches('.btn-increase, .btn-increase *')) {
    // Increase button is clicked
    state.recipe.updateServings('inc')
    recipeView.updateServingsIngredients(state.recipe);
  } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
    // Add ingredients to shopping list
    controlList();
  } else if (e.target.matches('.recipe__love, .recipe__love *')) {
    // LIke controller
    controlLike();
  }
});
