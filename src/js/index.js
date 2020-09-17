import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import * as searchView from './views/SearchView';
import * as recipeView from './views/recipeView';
import {elements, renderLoader, clearLoader} from './views/base';

/* Global state of the app
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes
 */
const state = {};


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
      //calculate sercings and time
      state.recipe.calcTime();
      state.recipe.calcServings();

      //render recipe
      clearLoader();
      recipeView.renderRecipe(state.recipe);
    } catch(err) {
      alert('Error proccessing recipe!');
      console.log(err);
    }
  }
};

//window.addEventListener('hashchange', controlRecipe);
//window.addEventListener('load', controlRecipe);
['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

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
  }
});

window.l = new List();
