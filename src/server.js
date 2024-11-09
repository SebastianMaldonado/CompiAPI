const express = require('express');
const app = express();
const port = 3000;

            const production = mTable[top][currentInput];
            console.log(production)
            trace[trace.length - 1].action = `Apply ${production}`;

            // Pop the non-terminal
            stack.pop();

            // Get the right side of the production and push to stack in reverse order
            const rightSide = production.split("->")[1];
            if (rightSide !== "&") { // Don't push epsilon
                for (let i = rightSide.length - 1; i >= 0; i--) {
                    stack.push(rightSide[i]);
                }
            }
        } else {
            // Error: No matching rule in M table for this non-terminal and terminal
            trace[trace.length - 1].action = `Error: Unexpected symbol "${currentInput}" for non-terminal "${top}"`;
            return { result: false, trace }; // Return failure with trace
        }
    }

    // If stack is empty but input isn't fully parsed, it's an error
    trace.push({
        stack: stack.join(""),
        input: input.slice(pointer),
        action: "Error: Stack is empty but input is not fully parsed."
    });
    return { result: false, trace }; // Return failure with trace
}
// Calling the function

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
        const {grammar, non_recursive, all_firsts, all_nexts, m_table} = syntax_analysis(text)

// Testing the outputs of the syntax analysis function 

console.log("...............")
console.log(all_firsts)
console.log(all_nexts)
console.log(m_table)

    
    

        // Return the result in a dictionary (JSON object)
        res.json({ success: true, result: {tabla_m: m_table},
                  siguientes: all_nexts, primeros: all_firsts,
                 text: text});
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }

    

});

app.post('/recognize', (req, res, next) => {
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
        const { string } = req.body; // Receive the text (JavaScript function)
        const {grammar, non_recursive, all_firsts, all_nexts, m_table} = syntax_analysis(text)

// Testing the outputs of the syntax analysis function 

console.log("...............")
console.log(all_firsts)
console.log(all_nexts)
console.log(m_table)

const {result, trace} = recognize_string(m_table, string)
console.log(result)
console.log(trace)
        

    
    

        // Return the result in a dictionary (JSON object)
        res.json({ success: true, result: {recognized: result, trace: trace},
                 text: text});
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }

    

});
      

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

