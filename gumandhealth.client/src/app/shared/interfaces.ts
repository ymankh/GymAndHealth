export interface Category {
  id: number;
  name: string;
  description: string;
  imagePath: string;
  recipes: Recipe[];
}

export interface Recipe {
  id: number;
  name: string;
  image: string;
  description: string;
  recipeCategoryId: number;
  caloriesCount: number;
  ingredients: string;
  recipe1: string;
  recipeCategory?: Category;
}
