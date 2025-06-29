// --- GeminiKnights Project Server ---
// Express backend for AI recipe generation and download

const express = require('express');
const app = express();

const { GoogleGenAI } = require("@google/genai");
const fs = require("node:fs");

// Initialize Gemini API client
const client = new GoogleGenAI({ apiKey: "REDACTED" });

// Example recipe structure for prompt
const exampleRecipe = {
  title: "Recipe Title",
  description: "Recipe description here.",
  servings: "servings here",
  ingredients: ["ingredient 1", "ingredient 2"],
  tools: ["tool 1", "tool 2"],
  instructions: ["step 1", "step 2"]
};

app.use(express.json()); // Parse JSON bodies

// --- API Endpoints ---

// Test endpoint
app.get('/api', (req, res) => {
    res.json({"users": ["1", "2", "3", "4"]});
});

// Simple add endpoint for demo
app.post('/api/add', (req, res) => {
    const { value } = req.body;
    console.log('Received from frontend:', value);
    res.json({ success: true, received: value });
});

// Download a single recipe as JSON
app.get('/api/recipe/:idx', (req, res) => {
    const idx = parseInt(req.params.idx, 10);
    // Validate recipe index
    if (!global.lastRecipes || !Array.isArray(global.lastRecipes) || isNaN(idx) || idx < 0 || idx >= global.lastRecipes.length) {
        return res.status(404).json({ error: 'Recipe not found' });
    }
    const recipe = global.lastRecipes[idx];
    res.setHeader('Content-Disposition', `attachment; filename=recipe-${idx+1}.json`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(recipe, null, 2));
});

// Download a single recipe as formatted text
app.get('/api/recipe/:idx/text', (req, res) => {
    const idx = parseInt(req.params.idx, 10);
    if (!global.lastRecipes || !Array.isArray(global.lastRecipes) || isNaN(idx) || idx < 0 || idx >= global.lastRecipes.length) {
        return res.status(404).send('Recipe not found');
    }
    const recipe = global.lastRecipes[idx];
    // Format the recipe as a printable text file
    let text = '';
    text += `${recipe.title || 'Recipe'}\n`;
    text += `${'-'.repeat(recipe.title ? recipe.title.length : 6)}\n`;
    if (recipe.description) text += `${recipe.description.replace(/<[^>]+>/g, '').trim()}\n\n`;
    if (recipe.time) text += `Time: ${recipe.time}\n`;
    if (recipe.servings) text += `Servings: ${recipe.servings}\n`;
    if (recipe.ingredients && recipe.ingredients.length) {
        text += `\nIngredients:\n`;
        recipe.ingredients.forEach((ing, i) => {
            text += `  ${i+1}. ${ing}\n`;
        });
    }
    if (recipe.tools && recipe.tools.length) {
        text += `\nTools:\n`;
        recipe.tools.forEach((tool, i) => {
            text += `  ${i+1}. ${tool}\n`;
        });
    }
    if (recipe.instructions && recipe.instructions.length) {
        text += `\nInstructions:\n`;
        recipe.instructions.forEach((step, i) => {
            text += `  ${i+1}. ${step}\n`;
        });
    }
    text += '\n';
    res.setHeader('Content-Disposition', `attachment; filename=recipe-${idx+1}.txt`);
    res.setHeader('Content-Type', 'text/plain');
    res.send(text);
});

// Main AI recipe generation endpoint
app.post('/api/generate', async (req, res) => {
    const { prompt, restrictions } = req.body;
    try {
        // Request Gemini to generate recipes
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Create an array of 3 unique recipes with these restrictions, where any ingredient listed is also a restriction: ${restrictions}. Prompt: ${prompt}. Each recipe should be a JSON object with the following fields: title, description, servings, ingredients (numbered list as array), tools (numbered list as array), instructions (numbered list as array). Return only a JSON array, no extra text. Example: ${JSON.stringify([exampleRecipe, exampleRecipe, exampleRecipe])}`,
        });
        let recipes = [];
        // Parse Gemini response as JSON
        try {
            recipes = JSON.parse(response.text);
        } catch (e) {
            // Try to extract JSON from text if model adds extra text
            const match = response.text.match(/\[.*\]/s);
            if (match) {
                recipes = JSON.parse(match[0]);
            } else {
                throw new Error("Could not parse recipes JSON");
            }
        }
        // For each recipe, add AI image and time if missing
        for (let i = 0; i < recipes.length; i++) {
            const title = recipes[i].title || `Recipe ${i+1}`;
            // Add time field if missing
            if (!recipes[i].time) {
                try {
                    const timeResponse = await client.models.generateContent({
                        model: "gemini-2.5-flash",
                        contents: `Estimate the total time required (in minutes) to make this recipe: ${title}. Only return a number or a short phrase like '45 minutes' or '1 hour 10 minutes'.`,
                    });
                    let timeText = timeResponse.text.trim();
                    timeText = timeText.replace(/[^\d\w :]+/g, '').replace(/^\s+|\s+$/g, '');
                    recipes[i].time = timeText || 'N/A';
                } catch (timeErr) {
                    recipes[i].time = 'N/A';
                }
            }
            // Add AI-generated image to description
            try {
                const imgResponse = await client.models.generateContent({
                    model: "gemini-2.0-flash-preview-image-generation",
                    contents: `Create a 3d rendered, professional, mouth-watering food photo for this recipe: ${title}. The recipe has the following dietary restrictions, where any ingredient listed is also a restriction:: ${restrictions}. ALL DIETARY RESTRICTIONS MUST BE MET IN THE IMAGE. Only return an image, no extra text.`,
                    config: {
                        responseModalities: ["text", "image"],
                    },
                });
                let imgTag = '';
                if (imgResponse.candidates && imgResponse.candidates[0] && imgResponse.candidates[0].content && imgResponse.candidates[0].content.parts) {
                    for (const part of imgResponse.candidates[0].content.parts) {
                        if (part.inlineData && part.inlineData.data) {
                            const imageData = part.inlineData.data;
                            const imgSrc = `data:image/png;base64,${imageData}`;
                            imgTag = `<img src='${imgSrc}' alt='${title}' style='max-width:100%;border-radius:12px;margin-bottom:10px;'/>`;
                            break;
                        }
                    }
                }
                if (imgTag) {
                    recipes[i].description = imgTag + (recipes[i].description || '');
                }
            } catch (imgErr) {
                // If image generation fails, just skip
                console.error(`Image generation failed for recipe ${i+1}:`, imgErr);
            }
        }
        // Return recipes to frontend and store for download
        res.json({ recipes });
        global.lastRecipes = recipes;
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to generate recipe" });
    }
});

// Start server
app.listen(5000, () => {
    console.log('Server is running on port 5000');
});

