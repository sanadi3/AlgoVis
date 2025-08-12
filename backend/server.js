// setting up REST API

// importing
const express = require('express'); // Express.js framework to build web server
const cors = require('cors'); // enable Cross-Origin Resource Sharing. Allows the front-end (running on a different port) to make requests to the backend

const { Graph } = require('./algorithms/graph'); // import graph class

const app = express(); // initialize Express application
const PORT = process.env.PORT || 3001; // uses environment variable port, or default to 3001

// Middleware
app.use(cors()); //enable cors
app.use(express.json()); // parse JSON requests and make the data available on req.body

// endpoint to monitor server running
app.get('/health', (req, res) => {
    res.json({status: 'OK', timestamp: new Date().toISOString() }); // response with JSON object indicating server status and time
});

// Helper function to create a new graph
// takes raw node and edge data from the frontend and converts it to graph class structure
function createGraph(nodes, edges, directed = false){
    // new instance of Graph class

    const graph = new Graph(directed);

    // add all the nodes to the graph
    // iterate over the array of nodes
    nodes.forEach(node => {
        // graph.addVertex adds a new vertex with an id and an object containing the name & position.
        graph.addVertex(node.id, {
            name: node.name,
            x: node.x,
            y: node.y
        });
    });

    // add all the edges
    edges.forEach(edge => {
        // 'graph.addEdge creates a connection
        // it takes the IDs of the 'from' and 'to' nodes, and the 'weight' of the edge.
        graph.addEdge(edge.from.id, edge.to.id, edge.weight);

    });
    return graph;
}

// API Routes
// the main endpoints where the frontend sends requests to run different graph algos.
// they all use the HTTP 'POST' method because they receive data ('nodes' and 'edges') in the request body.

// run dijkstra's
app.post('/api/algorithms/dijkstra', (req, res) =>{
    try{
        // destructure the data from the request
        const { nodes, edges, startId, endId, directed } = req.body;

        // create a graph from the data
        const graph = createGraph(nodes, edges, directed);

        // call dijkstra
        // shortest path from a starting node to all other nodes.
        const result = graph.dijkstra(startId, endId);

        // send a successful json
        res.json({
            success: true,
            result: {
                distances: result.distances,
                path: result.path,
                previous: result.previous
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// bellman-ford
// shortest path from a single node to all other nodes. unlike dijstras, can handle negative edge weights
app.post('/api/algorithms/bellman-ford', (req, res) => {
    try{
        const { nodes, edges, startId, directed } = req.body;
        const graph = createGraph(nodes, edges, directed);

        // call method
        const result = graph.bellmanFord(startId);

        // result includes distances
        res.json({
            success: true,
            result: {
                distances: result.distances,
                previous: result.previous
            }
        });
    } catch (error) {
        res.status(400).json({
            success:false,
            error: error.message
        });
    }
});

// floyd-warshall
// finds the shortest paths between all pairs of vertices in a graph
app.post('/api/algorithms/floyd-warshall', (req, res) => {
    try {
        const { nodes, edges, directed } = req.body;
        const graph = createGraph(nodes, edges, directed);

        // Call the `floydWarshall` method.
        const result = graph.floydWarshall();

        // The result is a matrix of `distances` and a matrix of `next` vertices for path reconstruction.
        res.json({
            success: true,
            result: {
                distances: result.distances,
                next: result.next
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// --- Run Topological Sort ---
// An algorithm for sorting a directed acyclic graph (DAG) in a linear order, where for every directed edge from vertex A to vertex B, A comes before B in the ordering.
app.post('/api/algorithms/topological-sort', (req, res) => {
    try {
        const { nodes, edges } = req.body;
        // Topological sort only works on directed graphs, so we force `directed` to be true.
        const graph = createGraph(nodes, edges, true);

        // Call the `topologicalSort` method.
        const result = graph.topologicalSort();

        // The result is a single array representing the sorted order of the nodes.
        res.json({
            success: true,
            result: {
                order: result
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// graph operations
// random graphs
app.post('/api/graph/generate', (req, res) => {
    try {
        // Destructure parameters for graph generation from the request body, with default values.
        const { nodeCount = 8, edgeCount = 12, maxWeight = 10, directed = false } = req.body;

        const nodes = [];
        const edges = [];

        // Generate `nodeCount` number of nodes.
        for (let i = 0; i < nodeCount; i++) {
            nodes.push({
                id: i, // Assign a unique ID.
                name: String.fromCharCode(65 + i), // Assign a letter as a name (A, B, C, ...).
                x: Math.random() * 800 + 100, // Random X coordinate for visualization.
                y: Math.random() * 400 + 100 // Random Y coordinate for visualization.
            });
        }

        // Generate `edgeCount` number of edges.
        const addedEdges = new Set(); // Use a Set to keep track of added edges to prevent duplicates.
        let attempts = 0; // Counter to prevent infinite loops if it's impossible to add the desired number of edges (e.g., if `edgeCount` is too high for the `nodeCount`).

        while (edges.length < edgeCount && attempts < edgeCount * 3) {
            const fromIdx = Math.floor(Math.random() * nodeCount); // Pick a random 'from' node.
            const toIdx = Math.floor(Math.random() * nodeCount); // Pick a random 'to' node.

            if (fromIdx !== toIdx) { // An edge can't connect a node to itself.
                // Create a unique key for the edge to check for duplicates. For undirected graphs, the order doesn't matter (0-1 is the same as 1-0).
                const edgeKey = directed ? `${fromIdx}-${toIdx}` :
                    fromIdx < toIdx ? `${fromIdx}-${toIdx}` : `${toIdx}-${fromIdx}`;

                if (!addedEdges.has(edgeKey)) {
                    addedEdges.add(edgeKey);
                    edges.push({
                        from: nodes[fromIdx],
                        to: nodes[toIdx],
                        weight: Math.floor(Math.random() * maxWeight) + 1 // Assign a random weight.
                    });
                }
            }
            attempts++;
        }

        // Send back the generated nodes and edges.
        res.json({
            success: true,
            graph: { nodes, edges }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// --- Validate graph connectivity ---
// This endpoint checks if a graph is connected, meaning there is a path from every vertex to every other vertex.
app.post('/api/graph/validate', (req, res) => {
    try {
        const { nodes, edges, directed } = req.body;
        const graph = createGraph(nodes, edges, directed);

        // Handle the edge case of an empty graph.
        if (nodes.length === 0) {
            res.json({
                success: true,
                validation: {
                    isEmpty: true,
                    isConnected: false,
                    componentCount: 0
                }
            });
            return;
        }

        // Use Breadth-First Search (BFS) to check for connectivity.
        // We start a traversal from the first node and see how many nodes we can reach.
        const visited = new Set(); // A `Set` is used for efficient lookup of visited nodes.
        const queue = [nodes[0].id]; // Start with the first node's ID in a queue for BFS.
        visited.add(nodes[0].id);

        while (queue.length > 0) {
            const current = queue.shift(); // Get the next node from the queue.
            const vertex = graph.vertices.get(current); // Get the vertex object from our graph structure.

            // For each neighbor of the current vertex...
            for (const { vertex: neighbor } of vertex.adjacentList) {
                // If the neighbor hasn't been visited yet...
                if (!visited.has(neighbor)) {
                    visited.add(neighbor); // Mark it as visited.
                    queue.push(neighbor); // Add it to the queue to be processed later.
                }
            }
        }

        // If the number of visited nodes equals the total number of nodes, the graph is connected.
        const isConnected = visited.size === nodes.length;

        res.json({
            success: true,
            validation: {
                isEmpty: false,
                isConnected,
                componentCount: isConnected ? 1 : 'Multiple components detected' // A connected graph has one component.
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// --- Run Breadth-First Search (BFS) ---
// BFS is a graph traversal algorithm that explores all the neighbor nodes at the present depth prior to moving on to the nodes at the next depth level.
app.post('/api/algorithms/bfs', (req, res) => {
    try {
        const { nodes, edges, startId, directed } = req.body;
        const graph = createGraph(nodes, edges, directed);

        const result = graph.bfs(startId);

        res.json({
            success: true,
            result: {
                traversal: result.traversal, // The order in which nodes were visited.
                parent: result.parent // The parent of each node in the BFS tree.
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// --- Run Depth-First Search (DFS) ---
// DFS is a graph traversal algorithm that explores as far as possible along each branch before backtracking.
app.post('/api/algorithms/dfs', (req, res) => {
    try {
        const { nodes, edges, startId, directed } = req.body;
        const graph = createGraph(nodes, edges, directed);

        const result = graph.dfs(startId);

        res.json({
            success: true,
            result: {
                traversal: result.traversal, // The order in which nodes were visited.
                parent: result.parent // The parent of each node in the DFS tree.
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// --- Run Prim's algorithm ---
// Prim's algorithm is a greedy algorithm that finds a Minimum Spanning Tree (MST) for a connected, weighted, undirected graph.
app.post('/api/algorithms/prim', (req, res) => {
    try {
        const { nodes, edges } = req.body;
        const graph = createGraph(nodes, edges, false); // MST algorithms require an undirected graph.

        const result = graph.prim();

        res.json({
            success: true,
            result: {
                mst: result.mst, // The set of edges that form the MST.
                totalWeight: result.weight // The total weight of all edges in the MST.
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// --- Run Kruskal's algorithm ---
// Kruskal's algorithm is another greedy algorithm for finding an MST. It works by adding the smallest-weight edges one by one, as long as they don't form a cycle.
app.post('/api/algorithms/kruskal', (req, res) => {
    try {
        const { nodes, edges } = req.body;
        const graph = createGraph(nodes, edges, false); // MST algorithms require an undirected graph.

        const result = graph.kruskal();

        res.json({
            success: true,
            result: {
                mst: result.mst,
                totalWeight: result.weight
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Graph Algorithm Server running on port ${PORT}`); // Log a message to the console when the server starts.
});

