const express = require('express');
const app = express();
const port = 3000;

       // Calling the function
const { log } = require('console');
const fs = require('fs');

function syntax_analysis(string_grammar){
    function read_file(string_grammar) {
        const lines = string_grammar.split('\n'); // Splitting the file by new lines
        return lines;
    }

    function read_grammar(lines) {
        const productions = {};
        // Saves all the productions in an object where the key is the non-terminal (head of the production) and the value is a list of bodies of the productions
        lines.forEach(line => {
            const production = line.trim();
    
            if (production === '') {
                return;
            }
    
            const [head, rawBody] = production.split('->').map(s => s.trim());
            let body = rawBody;
    
            // Implement the conditions
            if (body === '&') {
                // Body is exactly '&', leave it as is
            } else {
                // Remove all '&' symbols from the body
                body = body.replace(/&/g, '').trim();
            }
    
            if (!productions[head]) {
                productions[head] = [];
            }
            productions[head].push(body);
        });
        return productions;
    }

    function detect_fix_left_recursion_and_left_factoring(productions) {
        const needed_productions = {};
        const non_terminals = new Set(Object.keys(productions));
    
        // Helper function to get the next available alphabetical letter for a new non-terminal
        function get_new_non_terminal() {
            for (let char = 65; char <= 90; char++) { // ASCII codes for A-Z
                const new_non_terminal = String.fromCharCode(char);
                if (!non_terminals.has(new_non_terminal)) {
                    non_terminals.add(new_non_terminal); // Mark as used
                    return new_non_terminal;
                }
            }
            throw new Error("Ran out of single-character non-terminals");
        }
    
        // Helper function to find the longest common prefix
        function find_common_prefix(productions) {
            if (productions.length < 2) return ''; // No common prefix possible with less than 2 elements.
        
            let longestPrefix = ''; // Stores the longest prefix found.
            for (let i = 0; i < productions.length - 1; i++) {
                for (let j = i + 1; j < productions.length; j++) {
                    let prefix = '';
                    let k = 0;
        
                    // Find common prefix between productions[i] and productions[j].
                    while (
                        k < productions[i].length &&
                        k < productions[j].length &&
                        productions[i][k] === productions[j][k]
                    ) {
                        prefix += productions[i][k];
                        k++;
                    }
        
                    // Update the longestPrefix if this is longer.
                    if (prefix.length > longestPrefix.length) {
                        longestPrefix = prefix;
                    }
                }
            }
        
            console.log(longestPrefix);
            return longestPrefix;
        }
    
        // Step 1: Detect and remove left recursion for each non-terminal
        for (const non_terminal in productions) {
            const recursive_productions = [];
            const non_recursive_productions = [];
    
            // Classify each production as recursive or non-recursive
            productions[non_terminal].forEach(production => {
                if (production.startsWith(non_terminal)) {
                    recursive_productions.push(production.slice(non_terminal.length).trim());
                } else {
                    non_recursive_productions.push(production);
                }
            });
    
            if (recursive_productions.length > 0) {
                const new_non_terminal = get_new_non_terminal();
                needed_productions[non_terminal] = [];
                needed_productions[new_non_terminal] = [];
    
                recursive_productions.forEach(alpha => {
                    needed_productions[new_non_terminal].push(`${alpha}${new_non_terminal}`);
                });
                needed_productions[new_non_terminal].push('&');
    
                non_recursive_productions.forEach(beta => {
                    needed_productions[non_terminal].push(`${beta}${new_non_terminal}`);
                });
            } else {
                needed_productions[non_terminal] = productions[non_terminal];
            }
    
            // Step 2: Apply left factoring on the updated productions for the non-terminal
            const factored_productions = needed_productions[non_terminal];
            let remaining_productions = [];
            const groups = {};
    
            factored_productions.forEach(prod => {
                // Find common prefix among productions
                const prefix = find_common_prefix(factored_productions);
                if (prefix && prod.startsWith(prefix)) {
                    if (!groups[prefix]) groups[prefix] = [];
                    groups[prefix].push(prod.slice(prefix.length).trim());
                } else {
                    remaining_productions.push(prod);
                }
            });
    
            // Process each group with common prefix
            for (const prefix in groups) {
                if (groups[prefix].length > 1) {
                    const new_non_terminal = get_new_non_terminal();
                    needed_productions[new_non_terminal] = groups[prefix].map(suffix => suffix || '&');
                    remaining_productions.push(`${prefix}${new_non_terminal}`);
                } else {
                    remaining_productions = remaining_productions.concat(groups[prefix].map(suffix => `${prefix}${suffix}`));
                }
            }
    
            // Update productions with factored results
            needed_productions[non_terminal] = remaining_productions;
        }
    
        return needed_productions;
    }

    function get_firsts_all_non_terminals(productions){
        function get_firsts(non_terminal, productions, non_terminals, memo = {}) {
            // Check if FIRST set is already computed
            if (memo[non_terminal]) return memo[non_terminal];
            
            const firsts = new Set();  // Use a set to avoid duplicate entries
            productions[non_terminal].forEach(production => {
                let allEpsilon = true; // Track if all symbols in the production can be epsilon
        
                for (let i = 0; i < production.length; i++) {
                    const symbol = production[i];
        
                    if (!non_terminals.includes(symbol)) {
                        // Rule 1: If symbol is a terminal, add it to FIRST and break
                        firsts.add(symbol);
                        allEpsilon = false;
                        break;
                    } else {
                        // Rule 3: Symbol is a non-terminal; recursively get its FIRST set
                        const nestedFirsts = get_firsts(symbol, productions, non_terminals, memo);
        
                        // Add all non-epsilon symbols from the nested FIRST set
                        nestedFirsts.forEach(item => {
                            if (item !== "&") firsts.add(item);
                        });
        
                        // Check if epsilon is in the FIRST set of the current symbol
                        if (!nestedFirsts.includes("&")) {
                            allEpsilon = false;
                            break;
                        }
                    }
                }
        
                // Rule 2: If all symbols in the production can produce epsilon, add epsilon
                if (allEpsilon) {
                    firsts.add("&");
                }
            });
        
            // Memoize and return the FIRST set
            memo[non_terminal] = firsts;
            return [...firsts];
        }
        const firsts_all_non_terminals = {};
        const non_terminals = Object.keys(productions);
        non_terminals.forEach(
            non_terminal => {
                firsts_all_non_terminals[non_terminal] = get_firsts(non_terminal, productions, non_terminals)
            }
        );
        return firsts_all_non_terminals 
    }

    function get_nexts_all_non_terminals(productions, firsts){
        function get_nexts(target_non_terminal, productions, firsts, non_terminals, visited = new Set()) {
            // Check if the non-terminal is already being processed in this recursive chain
            if (visited.has(target_non_terminal)) return []; // Prevent infinite recursion
        
            // Add the current non-terminal to the visited set
            visited.add(target_non_terminal);
        
            function find_next_char(target, str) {
                let index = str.indexOf(target);
        
                // Return -1 if target is not in the string
                if (index === -1) return -1;
        
                // Check if target is the last character
                if (index === str.length - 1) return '&';
        
                // Return the next character in the production
                return str[index + 1];
            }
        
            function produces_epsilon(production, firsts) {
                for (let i = 0; i < production.length; i++) {
                    const symbol = production[i];
            
                    if (firsts[symbol]) {
                        if (!firsts[symbol].includes('&')) {
                            return false; // If any symbol in `production` cannot produce ε, stop and return false
                        }
                    } else {
                        return false; // If the symbol is not in `firsts`, it cannot produce ε
                    }
                }
                return true; // All symbols in `production` can produce ε
            }
        
            const nexts = [];
            if (target_non_terminal === non_terminals[0]) nexts.push('$'); // Start symbol has `$` in FOLLOW
        
            // Iterate over each non-terminal and its productions
            for (const non_terminal of non_terminals) {
                productions[non_terminal].forEach(production => {
                    const next = find_next_char(target_non_terminal, production);
        
                    if (next !== -1) {
                        if (!non_terminals.includes(next)) {
                            // If `next` is a terminal and not ε, add it to `nexts`
                            if (next !== '&') {
                                nexts.push(next);
                            } else if (next === '&') {
                                // Handle `&` case: inherit `FOLLOW(non_terminal)` into `nexts`
                                const nested_nexts = get_nexts(non_terminal, productions, firsts, non_terminals, visited);
                                nexts.push(...nested_nexts);
                            }
                        } else {
                            // `next` is a non-terminal
                            const firsts_next = firsts[next];
                            if (firsts_next.includes('&')) {
                                // If `next` has ε in its FIRST set, add other symbols
                                const firsts_next_non_epsilon = firsts_next.filter(item => item !== '&');
                                nexts.push(...firsts_next_non_epsilon);
        
                                const remaining_production = production.slice(production.indexOf(target_non_terminal) + target_non_terminal.length).trim();
                                if (produces_epsilon(remaining_production, firsts)) {
                                    // Inherit FOLLOW set of `non_terminal` recursively
                                    const nested_nexts = get_nexts(non_terminal, productions, firsts, non_terminals, visited);
                                    nexts.push(...nested_nexts);
                                }
                            } else {
                                nexts.push(...firsts_next);
                            }
                        }
                    }
                });
            }
        
            // Remove the current non-terminal from visited before returning
            visited.delete(target_non_terminal);
        
            // Return unique items in the `nexts` array
            return [...new Set(nexts)];
        }
        const nexts_all_non_terminals = {};
        const non_terminals = Object.keys(productions);
        non_terminals.forEach(
            non_terminal => {
                nexts_all_non_terminals[non_terminal] = get_nexts(non_terminal, productions, firsts, non_terminals)
            }
        );
        return nexts_all_non_terminals 
    }

    function build_m_table(productions, nexts) {
        // Memoization cache for FIRST sets
        const memoizedFirstSets = {};
        const m_table = {};
        const rows = Object.keys(productions);
    
        // Dynamically determine the set of terminal symbols
        const all_productions_right = Object.values(productions).flat();
        const columns = [];
    
        all_productions_right.forEach(str => {
            for (const char of str) {
                // Collect characters that are not uppercase non-terminals or epsilon (&)
                if (!(char >= 'A' && char <= 'Z') && char !== '&') {
                    columns.push(char);
                }
            }
        });
        columns.push('$');  // Add end-of-input symbol to columns
    
        // Initialize M table with "error"
        for (const non_terminal of rows) {
            m_table[non_terminal] = {};
            for (const terminal of columns) {
                m_table[non_terminal][terminal] = "error";  // Initialize as error
            }
        }
    
        // Function to retrieve the FIRST set for a given non-terminal, with memoization
        function get_firsts(non_terminal, productions, non_terminals) {
            if (memoizedFirstSets[non_terminal]) {
                return memoizedFirstSets[non_terminal];
            }
            const firsts = [];
    
            // Iterate over productions for the given non-terminal
            productions[non_terminal].forEach(production => {
                const firstSymbol = production[0];
                if (non_terminals.includes(firstSymbol)) {
                    const nestedFirsts = get_firsts(firstSymbol, productions, non_terminals);
                    firsts.push(...nestedFirsts);
                } else {
                    firsts.push(firstSymbol);
                }
            });
    
            memoizedFirstSets[non_terminal] = firsts;
            return firsts;
        }
    
        // Function to calculate the FIRST set for a specific production
        function get_firsts_alpha(production, productions, non_terminals) {
            const firsts = [];
            let allEpsilon = true;
    
            for (const symbol of production) {
                if (!non_terminals.includes(symbol)) {
                    // If the symbol is a terminal, add it to FIRST set and stop
                    firsts.push(symbol);
                    allEpsilon = false;
                    break;
                } else {
                    // If the symbol is a non-terminal, get its FIRST set
                    const nested_firsts = get_firsts(symbol, productions, non_terminals);
                    firsts.push(...nested_firsts.filter(x => x !== "&"));  // Add non-epsilon firsts
    
                    // If epsilon is not in the FIRST set, stop processing
                    if (!nested_firsts.includes("&")) {
                        allEpsilon = false;
                        break;
                    }
                }
            }
    
            // If all symbols in the production can lead to epsilon, add epsilon
            if (allEpsilon) {
                firsts.push("&");
            }
    
            return firsts;
        }
    
        // Construct the M table based on productions
        for (const non_terminal in productions) {
            const right_productions = productions[non_terminal];
    
            right_productions.forEach(production => {
                // Calculate FIRST(α)
                const first_alpha = get_firsts_alpha(production, productions, rows);
    
                // Step 2: For each terminal a in FIRST(α), add A → α to M[A][a]
                first_alpha.forEach(terminal => {
                    if (terminal !== '&') {  // Only add if terminal is not epsilon
                        m_table[non_terminal][terminal] = `${non_terminal}->${production}`;
                    }
                });
    
                // Step 3: If ε is in FIRST(α), add A → α to M[A][b] for each b in FOLLOW(A)
                if (first_alpha.includes('&')) {
                    nexts[non_terminal].forEach(next => {
                        m_table[non_terminal][next] = `${non_terminal}->${production}`;
                    });
                }
            });
        }
    
        return m_table;
    }
    const lines = read_file(string_grammar);
    const grammar = read_grammar(lines);
    const non_recursive = detect_fix_left_recursion_and_left_factoring(grammar);
    const all_firsts = get_firsts_all_non_terminals(non_recursive);
    const all_nexts =  get_nexts_all_non_terminals(non_recursive, all_firsts);
    const m_table = build_m_table(non_recursive, all_nexts);

    return {grammar, non_recursive, all_firsts, all_nexts, m_table}
}

function recognize_string(mTable, inputString) {
    const startSymbol = Object.keys(mTable)[0];

    // Initialize stack with $ at the bottom and the start symbol on top
    const stack = ["$", startSymbol];
    const input = inputString + "$"; // Append $ to input to mark end of input
    let pointer = 0; // Pointer to track the position in the input string

    const trace = []; // Array to store the stack and input states at each step

    while (stack.length > 0) {
        const top = stack[stack.length - 1]; // Peek the top of the stack
        const currentInput = input[pointer]; // Current input symbol

        // Store the current state of the stack and input
        trace.push({
            stack: stack.join(""),
            input: input.slice(pointer),
            action: ""
        });

        // If top of stack is a terminal or $, check for match
        if (top === currentInput) {
            if (top === "$") {
                trace[trace.length - 1].action = "String is accepted by the grammar.";
                return { result: true, trace }; // Return success with trace
            }
            // Terminal matches, so pop stack and advance input pointer
            stack.pop();
            pointer++;
            trace[trace.length - 1].action = `Match ${currentInput}`;
        } else if (mTable[top] && mTable[top][currentInput]) {
            // If top is a non-terminal and we have a rule in M table
            const production = mTable[top][currentInput];
            // Check if production is defined
            if (production == "error") {
                trace[trace.length - 1].action = `Error: No production rule found for "${top}" with input "${currentInput}"`;
                return { result: false, trace }; // Return failure with trace
            }
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
                 text: non_recursive});
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
    
        data = req.body;
        const text = data.text; // Receive the text (JavaScript function)
        const string = data.string; // Receive the text (JavaScript function)
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
        res.json({ success: true, result: {recognized: result, trace: trace}, string: string,
                 text: text});

    

});
      

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

