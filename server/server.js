const express = require('express');
const app = express();

app.use(express.json()); // Add this to parse JSON bodies

app.get('/api', (req, res) => {
    res.json({"users": ["1", "2", "3", "4"]});
});

app.post('/api/add', (req, res) => {
    const { value } = req.body;
    console.log('Received from frontend:', value);
    res.json({ success: true, received: value });
});

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});