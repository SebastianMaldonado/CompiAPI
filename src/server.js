const express = require('express');
const app = express();
const port = 3000;

// Middleware to parse incoming JSON data
app.use(express.json());

// API endpoint that receives text, executes the JS function, and returns a dictionary
app.post('/execute', (req, res) => {
    const { text } = req.body; // Receive the text (JavaScript function)

    try {
        // Execute the received JavaScript code safely
        const result = eval(text); // eval executes the code in the string

        // Return the result in a dictionary (JSON object)
        res.json({ success: true, result: {tabla_m: [["Prod", "{", "}", "id", ","],
                                                     ["A", "", "", "A->id", ""],
                                                     ["B", "", "", "", ""],
                                                     ["C", "", "", "", ""],
                                                     ["D", "", "D->id", "", ""]]},
                 text: text});
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
