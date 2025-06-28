const express = require('express');
const app = express();

const { GoogleGenAI } = require("@google/genai");
const client = new GoogleGenAI({ apiKey: "AIzaSyDO_lRogMCv5QsylzYpVd1zc2sfhQSiNH0" });

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
            contents: `Create a recipe with these restrictions: ${restrictions}. Prompt: ${prompt}`,
        });
        console.log(response.text);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to generate recipe" });
    }
});

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});