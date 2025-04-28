import React, { useState } from 'react';
import { Utensils, ChefHat, Send } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

// Initialize GoogleGenAI with the API key
const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

interface Recipe {
  name: string;
  image: string;
  steps: string[];
}

const foodItems = [
  'Chicken', 'Potato', 'Chilli', 'Pasta', 'Rice',
  'Fish', 'Oil', 'Carrot', 'Mushroom', 'Tomato',
  'Garlic', 'Onion', 'Cheese', 'Egg', 'Broccoli'
];

function App() {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string>('');
  const [ing, setIng] = useState<string>('');
  const [blankField, setBlankField] = useState<string>('');
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleIngredientClick = (item: string) => {
    if (!selectedIngredients.has(item)) {
      setSelectedIngredients(prev => new Set(prev).add(item));
      setSelectedItem(item);
      setIngredients(prev => prev ? `${prev} ${item}` : item);
    }
  };

  const generateRecipes = async (ingredients: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const prompt = `Generate exactly 3 unique recipes using some or all of these ingredients: ${ingredients}.
      For each recipe, provide:
      1. A creative name (maximum 50 characters)
      2. A relevant Unsplash image URL that exists (use only these URLs:
         - https://images.unsplash.com/photo-1504674900247-0877df9cc836 (Elegant plated dish)
         - https://images.unsplash.com/photo-1546069901-ba9599a7e63c (Colorful healthy bowl)
         - https://images.unsplash.com/photo-1555939594-58d7cb561ad1 (Pasta dish)
         - https://images.unsplash.com/photo-1473093295043-cdd812d0e601 (Rustic soup)
         - https://images.unsplash.com/photo-1512621776951-a57141f2eefd (Vegetarian plate)
         - https://images.unsplash.com/photo-1467003909585-2f8a72700288 (Grilled dish)
         - https://images.unsplash.com/photo-1484980972926-edee96e0960d (Breakfast plate)
         - https://images.unsplash.com/photo-1476224203421-9ac39bcb3327 (Noodle bowl)
         - https://images.unsplash.com/photo-1495521821757-a1efb6729352 (Seafood dish)
         - https://images.unsplash.com/photo-1432139509613-5c4255815697 (Pasta closeup)
      )
      3. Exactly 5 steps for preparation (each step should be clear and concise)
      
      Return ONLY a valid JSON array with exactly this structure:
      [
        {
          "name": "Recipe Name",
          "image": "https://images.unsplash.com/photo-XXXXX",
          "steps": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"]
        }
      ]`;

      const response = await genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });
      const text = response.text;
      console.log('Raw API Response:', text);
      
      if (typeof text === 'string') {
        console.log('API Response:', text);
        let cleanText = text.trim();

        // Remove ```json ... ```
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
        }

        const newRecipes = JSON.parse(cleanText);
        console.log('Parsed Recipes:', newRecipes);
        if (Array.isArray(newRecipes) && newRecipes.length > 0) {
          setRecipes(newRecipes);
        } else {
          console.error('Invalid recipe format received:', newRecipes);
          throw new Error('Invalid recipe format received');
        }
      } else {
        console.error('Response text is undefined');
        setError('Failed to generate recipes. Please try again.');
      }
    } catch (error) {
      console.error('Error generating recipes:', error);
      setError('Failed to generate recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!ingredients.trim()) {
      setError('Please select at least one ingredient');
      return;
    }
    setIng(ingredients);
    setBlankField(ingredients);
    await generateRecipes(ingredients);
    setIngredients('');
    setSelectedItem(null);
    setSelectedIngredients(new Set());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-orange-600 text-white py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2">
            <ChefHat size={32} />
            <h1 className="text-3xl font-bold">Delicious Recipes</h1>
          </div>
        </div>
      </header>

      {/* Food Items Buttons */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Utensils />
          Ingredients
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {foodItems.map((item) => (
            <button
              key={item}
              id={item.toLowerCase()}
              onClick={() => handleIngredientClick(item)}
              className={`p-3 rounded-lg transition-all ${
                selectedIngredients.has(item)
                  ? 'bg-orange-600 text-white'
                  : 'bg-white hover:bg-orange-100 shadow-md'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Ingredients Input Field */}
        <div className="mt-6 flex gap-3">
          <input
            type="text"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="Selected ingredients will appear here..."
            className="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className={`${
              loading ? 'bg-gray-400' : 'bg-black hover:bg-gray-800'
            } text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors`}
          >
            <Send size={20} />
            {loading ? 'Generating...' : 'Send'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Blank Text Field */}
        <div className="mt-6">
          <input
            type="text"
            value={blankField}
            onChange={(e) => setBlankField(e.target.value)}
            placeholder="Your selected ingredients will appear here..."
            className="w-full p-3 rounded-lg border-2 border-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-orange-500 text-center text-lg font-bold"
          />
        </div>
      </section>

      {/* Recipe Cards */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold mb-6">Generated Recipes</h2>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-xl text-gray-600">
              Generating delicious recipes...
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {recipes.map((recipe, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <img
                  src={recipe.image}
                  alt={recipe.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-4">{recipe.name}</h3>
                  <ol className="space-y-2">
                    {recipe.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="flex gap-2">
                        <span className="font-semibold">{stepIndex + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;