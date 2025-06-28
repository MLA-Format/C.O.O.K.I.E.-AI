// Filename - demoapp/app.js

const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

app.use(cors()); // Allow cross-origin requests from React
app.use(express.json()); // Parse JSON bodies

// Serve React build static files in production
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../client/build")));
    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "../client/build", "index.html"));
    });
}

app.post("/post", (req, res) => {
    console.log("Connected to React");
    res.json({ message: "Received from React!" });
});
app.get('/',(req,res)=>{
    res.send(`<h1>Hello World</h1>`)
})

const PORT = process.env.PORT || 8080;

app.listen(PORT,
    () => console.log(`Server started on port ${PORT}`)
);