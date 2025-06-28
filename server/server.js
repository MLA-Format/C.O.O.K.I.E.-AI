const express = require('express');
const app = express();

const { GoogleGenAI } = require("@google/genai");
const client = new GoogleGenAI({ apiKey: "AIzaSyDO_lRogMCv5QsylzYpVd1zc2sfhQSiNH0" });

const exampleRecipe = {
  title: "Recipe Title",
  difference: "Why this recipe is unique from the other recipes",
  description: "Recipe description here.",
  servings: "servings here",
  ingredients: ["ingredient 1", "ingredient 2"],
  tools: ["tool 1", "tool 2"],
  instructions: ["step 1", "step 2"]
};

app.use(express.json()); // Add this to parse JSON bodies

app.get('/api', (req, res) => {
    res.json({"users": ["1", "2", "3", "4"]});
});

app.post('/api/add', (req, res) => {
    const { value } = req.body;
    console.log('Received from frontend:', value);
    res.json({ success: true, received: value });
});

app.post('/api/generate', async (req, res) => {
    const { prompt, restrictions } = req.body;
    try {
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Create an array of 3 unique recipes with these restrictions: ${restrictions}. Prompt: ${prompt}. Each recipe should be a JSON object with the following fields: title, difference, description, servings, ingredients (numbered list as array), tools (numbered list as array), instructions (numbered list as array). Return only a JSON array, no extra text. Example: ${JSON.stringify([exampleRecipe, exampleRecipe, exampleRecipe])}`,
        });
        let recipes = [];
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
        res.json({ recipes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to generate recipe" });
    }
});

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});

