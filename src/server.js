const express = require('express');
const app = express();
const port = 3000;



// Middleware to parse incoming JSON data
app.use(express.json());

// API endpoint that receives text, executes the JS function, and returns a dictionary
app.post('/execute', (req, res, next) => {
    res.setHeader(
    "Access-Control-Allow-Origin",
    "https://your-frontend.com"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS,CONNECT,TRACE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Content-Type-Options, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Private-Network", true);
  //  Firefox caps this at 24 hours (86400 seconds). Chromium (starting in v76) caps at 2 hours (7200 seconds). The default value is 5 seconds.
  res.setHeader("Access-Control-Max-Age", 7200);
    
    try {
        const { text } = req.body; // Receive the text (JavaScript function)
        const grammar = read_grammar(text);
        console.log("Grammar input"); 
        console.log("Non left-recursive, left-factored grammar"); 
        non_recursive = detect_fix_left_recursion_and_left_factoring(grammar);
        console.log("Firsts of each non-terminal");
        all_firsts = get_firsts_all_non_terminals(non_recursive);
        console.log(all_firsts)
        console.log("Nexts of each non-terminal");
        all_nexts =  get_nexts_all_non_terminals(non_recursive, all_firsts)
        console.log(all_nexts);
        //m_table = get_firsts_alpha("T*F", non_recursive, Object.keys(non_recursive))
        m_table = build_m_table(non_recursive, all_nexts)
        console.log(m_table);
    
    

        // Return the result in a dictionary (JSON object)
        res.json({ success: true, result: {tabla_m: m_table},
                  siguientes: all_nexts, primeros: all_firsts,
                 text: text});
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }

    

});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

