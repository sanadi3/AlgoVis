class Graph {
    constructor(directed = false){
        // this.vertices is a Map to store all the nodes
        // key-value pairs with the key storing a node's ID
        // value containing the vertex's properties and its 'adjacentList'
        this.vertices = new Map();

        // this.edges is an array which stores the list of each edge
        // used mainly in Bellman-ford and Kruskal's
        this.edges = [];

        this.directed = directed;
    }

    addVertex(id, data = {}){
        // check if the vertex already exists
        if (!this.vertices.has(id)) {
            this.vertices.set(id, {
                id,
                ...data, // extra data like coordinates
                adjacentList: []
            });
        }
    }

    addEdge(from, to, weight = 1){
        // if they dont already exist create the vertices
        this.addVertex(from);
        this.addVertex(to);

        const fromVertex = this.vertices.get(from);
        const toVertex = this.vertices.get(to);

        fromVertex.adjacentList.push({ vertex: to, weight });

        // if the graph is not directed simulate by adding in both directions
        if (!this.directed) {
            toVertex.adjacentList.push({ vertex: from, weight});
        }
    }

    // -- Algorithms --

    dijkstra(startId, endId = null){
        // distances array stores the shortest known distance from the start node to everyy other node
        const distances = {};

        // prev to store the predecessor of each node
        const previous = {};

        // visited to keep track of processed nodes
        const visited = new Set();

        // Priority Queue to efficiently select the unvisited node with the smallest node
        const pq = new PriorityQueue();

        for (const[id] of this.vertices){

            // start node distance is 0 while others are infinity
            distances[id] = id === startId ? 0 : Infinity;
            //
            previous[id] = null;
            // queue with current known distance
            pq.enqueue(id, distances[id]);
        }

        // continues as long as no nodes left to visited
        while (!pq.isEmpty()) {
            // dequeue the closest node
            const current = pq.dequeue();
            // already seen the node, skip
            if (visited.has(current.element)) continue;
            // else add it
            visited.add(current.element);

            // if an end point was provided and it was reached then skip
            if (current.element === endId) break;

            const vertex = this.vertices.get(current.element);

            // for each neighbor of the node
            for (const { vertex: neighbor, weight } of vertex.adjacentList) {
                // calculate the distance to neighbor
                const alt = distances[current.element] + weight;

                // if its shorter than the currently known distance add it
                if (alt < distances[neighbor]) {
                    // update shortest
                    distances[neighbor] = alt;
                    previous[neighbor] = current.element;
                    pq.enqueue(neighbor, alt);
                }
            }
        }
        return {
            distances,
            previous,
            path: endId ? this.reconstructPath(previous, endId) : null
        };
    }

    // bellman-ford. similar to dijkstras but can handle negative edge-weights
    // slower, can detect negative weight cycles
    bellmanFord(startID) {
        const distances = {};
        const previous = {};

        for (const[id] of this.vertices){
            distances[id] = id === startID ? 0 : Infinity;
            previous[id] = null;
        }
        const vertexCount = this.vertices.size;
        // relax all edges v-1 times
        for(let i = 0; i<vertexCount - 1; i++){
            for(const { from, to, weight } of this.edges) {
                // 'relax' the edges: if a shorter path is found by going through curr
                if (distances[from] !== Infinity && distances[from] + weight < distances[to]) {
                    // update distance and predecessor
                    distances[to] = distances[from] + weight;
                    previous[to] = from;
                }
            }
        }

        // after v-1 iterations look for negative weight cycles
        for (const {from, to, weight} of this.edges){
            if (distances[from] !== Infinity && distances[from] + weight < distances[to]) {
                // if a shorter path is found on V-th iteration, theres a negative cycle
                throw new Error('Graph contains negative weight cycle');

            }
        }
        return {distances, previous};
    }

    bfs(startId){
        // keep track of visited nodes
        const visited = new Set();
        // dequeue neighbors
        const queue = [startId];
        // order
        const result = [];
        // predecessor
        const parent = {};

        visited.add(startId);
        parent[startId] = null;

        while (queue.length > 0){
            const current = queue.shift(); // get first node from the queue.
            result.push(current);

            const vertex = this.vertices.get(current);

            // iterate throuhg neighbors
            for (const { vertex: neighbpr } of vertex.adjacentList) {
                // if neighbor hasnt been visited
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    parent[neighbor] = current;
                    queue.push(neighbor);
                }
            }
        }
        return { traversal: result, parent};
    }

    dfs(startId) {
        const visited = new Set();
        const result = [];
        const parent = {};

        const dfsRecursive = (vertexId, parentId = null) => {
            visited.add(vertexId);
            result.push(vertexId);
            parent[vertexId] = parentId;

            const vertex = this.vertices.get(vertexId);
            // for each neighbor
            for (const { vertex: neighbor } of vertex.adjacentList) {
                // if neighbor not in visited call recursive function on it
                if(!visited.has(neighbor)){
                    dfsRecursive(neighbor, vertexId);

                }
            }
        };
        dfsRecursive(startId);

        return {traversal: result, parent };
    }

    // prims finds the MST of a connected and undirected graph
    prim() {
        if (this.vertices.size === 0) return { mst: [], weight: 0 };

        const mst = [];
        const visited = new Set();
        const pq = new PriorityQueue();
        let totalWeight = 0;

        // Start with first vertex
        const startId = this.vertices.keys().next().value;
        visited.add(startId);

        // Add all edges from start vertex
        const startVertex = this.vertices.get(startId);
        for (const { vertex, weight } of startVertex.adjacentList) {
            pq.enqueue({ from: startId, to: vertex, weight }, weight);
        }

        while (!pq.isEmpty() && visited.size < this.vertices.size) {
            const edge = pq.dequeue().element;

            if (visited.has(edge.to)) continue;

            visited.add(edge.to);
            mst.push(edge);
            totalWeight += edge.weight;

            // Add new edges
            const vertex = this.vertices.get(edge.to);
            for (const { vertex: neighbor, weight } of vertex.adjacentList) {
                if (!visited.has(neighbor)) {
                    pq.enqueue({ from: edge.to, to: neighbor, weight }, weight);
                }
            }
        }

        return { mst, weight: totalWeight };
    }

    // Kruskal's Algorithm for MST
    kruskal() {
        const mst = [];
        const ds = new DisjointSet();
        let totalWeight = 0;

        // Initialize disjoint set
        for (const [id] of this.vertices) {
            ds.makeSet(id);
        }

        // Sort edges by weight
        const sortedEdges = [...this.edges].sort((a, b) => a.weight - b.weight);

        for (const edge of sortedEdges) {
            if (ds.find(edge.from) !== ds.find(edge.to)) {
                ds.union(edge.from, edge.to);
                mst.push(edge);
                totalWeight += edge.weight;

                if (mst.length === this.vertices.size - 1) break;
            }
        }

        return { mst, weight: totalWeight };
    }

    // Floyd-Warshall Algorithm
    floydWarshall() {
        const vertices = Array.from(this.vertices.keys());
        const n = vertices.length;
        const dist = {};
        const next = {};

        // Initialize
        for (let i = 0; i < n; i++) {
            dist[vertices[i]] = {};
            next[vertices[i]] = {};
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    dist[vertices[i]][vertices[j]] = 0;
                    next[vertices[i]][vertices[j]] = null;
                } else {
                    dist[vertices[i]][vertices[j]] = Infinity;
                    next[vertices[i]][vertices[j]] = null;
                }
            }
        }

        // Set edge weights
        for (const { from, to, weight } of this.edges) {
            dist[from][to] = weight;
            next[from][to] = to;
            if (!this.directed) {
                dist[to][from] = weight;
                next[to][from] = from;
            }
        }

        // Floyd-Warshall
        for (const k of vertices) {
            for (const i of vertices) {
                for (const j of vertices) {
                    if (dist[i][k] + dist[k][j] < dist[i][j]) {
                        dist[i][j] = dist[i][k] + dist[k][j];
                        next[i][j] = next[i][k];
                    }
                }
            }
        }

        return { distances: dist, next };
    }

    // Topological Sort (for DAGs)
    topologicalSort() {
        if (!this.directed) {
            throw new Error('Topological sort requires a directed graph');
        }

        const inDegree = {};
        const queue = [];
        const result = [];

        // Calculate in-degrees
        for (const [id] of this.vertices) {
            inDegree[id] = 0;
        }

        for (const { to } of this.edges) {
            inDegree[to]++;
        }

        // Find vertices with 0 in-degree
        for (const [id] of this.vertices) {
            if (inDegree[id] === 0) {
                queue.push(id);
            }
        }

        // Process vertices
        while (queue.length > 0) {
            const current = queue.shift();
            result.push(current);

            const vertex = this.vertices.get(current);
            for (const { vertex: neighbor } of vertex.adjacentList) {
                inDegree[neighbor]--;
                if (inDegree[neighbor] === 0) {
                    queue.push(neighbor);
                }
            }
        }

        if (result.length !== this.vertices.size) {
            throw new Error('Graph contains a cycle');
        }

        return result;
    }

    // Utility method to reconstruct path
    reconstructPath(previous, endId) {
        const path = [];
        let current = endId;

        while (current !== null) {
            path.unshift(current);
            current = previous[current];
        }

        return path[0] === null ? null : path;
    }
}

class PriorityQueue {
    constructor() {
        this.elements = [];

    }

    enqueue(element, priority) {
        this.elements.push({ element, priority});
        this.elements.sort((a, b) => a.priority - b.priority);
    }

    dequeue() {
        return this.elements.shift();
    }

    isEmpty() {
        return this.elements.length === 0;
    }
}

class DisjointSet {
    constructor() {
        this.parent = {};
        this.rank = {};
    }

    makeSet(x) {
        this.parent[x] = x;
        this.rank[x] = 0;
    }

    find(x) {
        if (this.parent[x] !== x) {
            this.parent[x] = this.find(this.parent[x]);
        }
        return this.parent[x];
    }

    union(x, y) {
        const rootX = this.find(x);
        const rootY = this.find(y);

        if (rootX === rootY) return;

        if (this.rank[rootX] < this.rank[rootY]) {
            this.parent[rootX] = rootY;
        } else if (this.rank[rootX] > this.rank[rootY]) {
            this.parent[rootY] = rootX;
        } else {
            this.parent[rootY] = rootX;
            this.rank[rootX]++;
        }
    }
}

if (typeof module !== 'undefined' && module.exports){
    module.export = { Graph, PriorityQueue, DisjointSet };
}


