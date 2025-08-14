class GraphVisualizer {
    // set up initial variables
    constructor() {

        // reference the html canvas
        this.canvas = document.getElementById('stage');
        this.ctx = this.canvas.getContext('2d');

        // graph data
        this.nodes = [];
        this.edges = [];
        this.nodeCounter = 0;

        // manage application state
        this.currentTool = 'node'; // node, edge, or move
        this.selectedNode = null; // used in edges
        this.startNode = null; // for algos
        this.endNode = null; // target node
        this.hoveredNode = null; // what mouse is over
        this.draggedNode = null; // used in 'mpve'
        this.currentAlgorithm = null;
        this.isDirected = false;
        this.isWeighted = true;

        // animation
        this.animationSpeed = 5;
        this.isRunning = false;
        this.animationSteps = [];
        this.currentStep = 0;

        this.useBackend = false;
        this.backendUrl = 'http://localhost:3001';

        // Add step explainer
        if (typeof StepExplainer !== 'undefined') {
            console.log('Creating StepExplainer');
            this.stepExplainer = new StepExplainer(this);
        } else {
            console.warn('StepExplainer not found! Make sure step-explainer.js is loaded');
            // Create a dummy explainer to prevent errors
            this.stepExplainer = {
                startAlgorithm: () => {},
                addStep: () => {},
                clear: () => {}
            };
        }

        // colors
        this.nodeRadius = 25;
        this.colors = {
            node: '#3b82f6',
            nodeHover: '#2563eb',
            nodeSelected: '#1d4ed8',
            nodeStart: '#10b981',
            nodeEnd: '#ef4444',
            nodeVisited: '#fbbf24',
            nodeCurrent: '#8b5cf6',
            nodePath: '#10b981',
            edge: '#6b7280',
            edgeHighlight: '#3b82f6',
            edgePath: '#10b981',
            text: '#ffffff',
            weight: '#374151'
        }

        this.init();

    }

    init() {
        this.setupCanvas();
        this.attachEventListeners();
        this.updateStatus(); // update nodes and edges n shi
        this.setupKeyboardShortcuts();
    }

    setupCanvas() {
        // arrow function to handle canvas resizing
        const resizeCanvas = () => {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
            this.draw(); // redraw whenever size changes
        };

        resizeCanvas(); // call once to set initial
        window.addEventListener('resize', resizeCanvas); // event listener for resize
    }

    // all events
    attachEventListeners() {
        // for different mouse interactions
        // .bind(this) to refer to the already instantiated graph
        this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
        this.canvas.addEventListener('contextmenu', this.handleRightClick.bind(this));
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // add a click listener for each tool button
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // set tool based on data embedded
                this.currentTool = btn.dataset.tool;
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active'); // highlight the active tool button
                this.canvas.style.cursor = this.currentTool === 'move' ? 'grab' : 'crosshair';
            });
        });

        // same for the algorithm buttons
        document.querySelectorAll('.algo-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentAlgorithm = btn.dataset.algo;
                document.querySelectorAll('.algo-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('currentAlgo').textContent = btn.textContent;
            });
        });

        // listeners for control buttons
        document.getElementById('runBtn').addEventListener('click', this.runAlgorithm.bind(this));
        document.getElementById('stepBtn').addEventListener('click', this.stepForward.bind(this));
        document.getElementById('resetBtn').addEventListener('click', this.reset.bind(this));
        document.getElementById('clearBtn').addEventListener('click', this.clearGraph.bind(this));
        document.getElementById('generateBtn').addEventListener('click', this.generateRandomGraph.bind(this));
        document.getElementById('directedBtn').addEventListener('click', this.toggleDirected.bind(this));
        document.getElementById('weightedBtn').addEventListener('click', this.toggleWeighted.bind(this));
        document.getElementById('exportBtn').addEventListener('click', this.exportGraph.bind(this));
        document.getElementById('importBtn').addEventListener('click', () => fileInput.click());

        // speed slider
        document.getElementById('speedSlider').addEventListener('input', (e) => {
            this.animationSpeed = parseInt(e.target.value);
        });

        document.getElementById('weightConfirm').addEventListener('click', this.confirmWeight.bind(this));
        document.getElementById('weightCancel').addEventListener('click', this.cancelWeight.bind(this));

    }

    handleCanvasClick(e) {
        if (this.isRunning) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.currentTool === 'node') {
            this.addNode(x, y);
        } else if (this.currentTool === 'edge') {
            const clickedNode = this.getNodeAt(x, y);
            if (clickedNode) {
                if (!this.selectedNode) {
                    this.selectedNode = clickedNode;
                } else if (this.selectedNode !== clickedNode) {
                    if (this.isWeighted) {
                        this.pendingEdge = {from: this.selectedNode, to: clickedNode};
                        this.showWeightModal();
                    } else {
                        this.addEdge(this.selectedNode, clickedNode, 1);
                    }
                    this.selectedNode = null;
                }
            } else {
                this.selectedNode = null;
            }
        }

        this.draw();
    }

    handleRightClick(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const clickedNode = this.getNodeAt(x, y);
        if (clickedNode) {
            if (!this.startNode || (this.startNode && !this.endNode && clickedNode !== this.startNode)) {
                this.startNode = clickedNode;
                this.endNode = null;
            } else {
                this.endNode = clickedNode;
            }
            this.draw();
        }
    }

    handleMouseDown(e) {
        if (this.currentTool !== 'move') return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.draggedNode = this.getNodeAt(x, y);
        if (this.draggedNode) {
            this.canvas.style.cursor = 'grabbing';
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.draggedNode && this.currentTool === 'move') {
            this.draggedNode.x = x;
            this.draggedNode.y = y;
            this.draw();
        } else {
            const hoveredNode = this.getNodeAt(x, y);
            if (hoveredNode !== this.hoveredNode) {
                this.hoveredNode = hoveredNode;
                this.draw();
            }
        }
    }

    handleMouseUp() {
        this.draggedNode = null;
        if (this.currentTool === 'move') {
            this.canvas.style.cursor = 'grab';
        }
    }

    addNode(x, y) {
        // A starts from 65
        const name = String.fromCharCode(65 + this.nodeCounter);
        // set node properties
        this.nodes.push({
            id: this.nodeCounter,
            name,
            x,
            y,
            visited: false,
            distance: Infinity,
            parent: null,
            state: 'default'
        });
        this.nodeCounter++;
        this.updateStatus();
    }

    addEdge(from, to, weight) {
        // does edge already exist
        const exists = this.edges.some(e =>
            (e.from === from && e.to === to) ||
            (!this.isDirected && e.from === to && e.to === from)
        );

        if (!exists) {
            this.edges.push({
                from, to,
                weight: weight || 1,
                state: 'default'
            });
            this.updateStatus();
        }
    }

    getNodeAt(x, y) {
        return this.nodes.find(node => {
            const dx = node.x - x;
            const dy = node.y - y;
            return Math.sqrt(dx * dx + dy * dy) <= this.nodeRadius;
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // first clear the canvas

        // draw each edge then each node on top so they draw right
        this.edges.forEach(edge => this.drawEdge(edge));
        this.nodes.forEach(node => this.drawNode(node));
    }

    drawNode(node) {
        const ctx = this.ctx;
        let color = this.colors.node; // access node colors

        // if/else cases to determine node color depending on state
        if (node === this.startNode) color = this.colors.nodeStart;
        else if (node === this.endNode) color = this.colors.nodeEnd;
        else if (node.state === 'visited') color = this.colors.nodeVisited;
        else if (node.state === 'current') color = this.colors.nodeCurrent;
        else if (node.state === 'path') color = this.colors.nodePath;
        else if (node === this.hoveredNode) color = this.colors.nodeHover;
        else if (node === this.selectedNode) color = this.colors.nodeSelected;

        // draw circle for this
        ctx.beginPath();
        ctx.arc(node.x, node.y, this.nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // draw name
        ctx.fillStyle = this.colors.text;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.name, node.x, node.y);

        // draw distance
        if (node.distance !== Infinity && node.distance !== null && this.isRunning) {
            ctx.fillStyle = this.colors.weight;
            ctx.font = '12px Arial';
            ctx.fillText(node.distance.toString(), node.x, node.y + this.nodeRadius + 15);
        }
    }

    drawEdge(edge) {
        const ctx = this.ctx;
        const { from, to, weight } = edge;

        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const startX = from.x + Math.cos(angle) * this.nodeRadius;
        const startY = from.y + Math.sin(angle) * this.nodeRadius;
        const endX = to.x - Math.cos(angle) * this.nodeRadius;
        const endY = to.y - Math.sin(angle) * this.nodeRadius;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = edge.state === 'path' ? this.colors.edgePath :
            edge.state === 'highlight' ? this.colors.edgeHighlight : this.colors.edge;
        ctx.lineWidth = edge.state === 'path' ? 3 : 2;
        ctx.stroke();

        // directed graphs
        if (this.isDirected) {
            const arrowSize = 10;
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - arrowSize * Math.cos(angle - Math.PI / 6),
                endY - arrowSize * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
                endX - arrowSize * Math.cos(angle + Math.PI / 6),
                endY - arrowSize * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fillStyle = ctx.strokeStyle;
            ctx.fill();
        }


        if (this.isWeighted) {
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(midX - 15, midY - 10, 30, 20);

            ctx.fillStyle = this.colors.weight;
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(weight.toString(), midX, midY);
        }
    }

    // -- ALGORITHMS --
    // ran asynchronously to pause and redraw at each step.

    async runAlgorithm() {
        if (!this.currentAlgorithm) {
            alert('Please select an Algorithm first');
            return;
        }

        if (this.isRunning) {
            this.isRunning = false;
            return;
        }

        this.reset();
        this.isRunning = true;
        document.getElementById('runBtn').innerHTML = '<span>⏸</span> Pause';

        // Clear previous explanations
        this.stepExplainer.clear();

        // switch staements
        switch (this.currentAlgorithm) {
            case 'dijkstra':
                await this.dijkstra();
                break;
            case 'bfs':
                await this.bfs();
                break;
            case 'dfs':
                await this.dfs();
                break;
            case 'prim':
                await this.prim();
                break;
            case 'kruskal':
                await this.kruskal();
                break;
            case 'bellman-ford':
                await this.bellmanFord();
                break;
        }
        this.isRunning = false;
        document.getElementById('runBtn').innerHTML = '<span>▶</span> Run Algorithm';
    }

    async dijkstra() {
        if (!this.startNode) {
            alert('Please right-click to select a start node');
            return;
        }

        // Start explanation
        this.stepExplainer.startAlgorithm('dijkstra');

        // Add initialization step
        this.stepExplainer.addStep('init', {
            startNode: this.startNode.name,
            totalNodes: this.nodes.length
        });

        // Initialize
        this.nodes.forEach(node => {
            node.distance = node === this.startNode ? 0 : Infinity;
            node.parent = null;
            node.visited = false;
        });

        const unvisited = [...this.nodes];

        while (unvisited.length > 0 && this.isRunning) {
            // Find node with minimum distance
            unvisited.sort((a, b) => a.distance - b.distance);
            const current = unvisited.shift();

            if (current.distance === Infinity) break;

            // Add step for node selection
            this.stepExplainer.addStep('select', {
                node: current.name,
                distance: current.distance,
                unvisitedCount: unvisited.length,
                queue: unvisited.slice(0, 5).map(n => ({
                    node: n.name,
                    priority: n.distance === Infinity ? '∞' : n.distance
                }))
            });

            current.visited = true;
            current.state = 'current';
            // drawing after changing state
            this.draw();
            await this.sleep(1000 / this.animationSpeed);

            // Update neighbors
            const neighbors = this.getNeighbors(current);
            for (const {node: neighbor, weight} of neighbors) {
                if (!neighbor.visited) {
                    const altDistance = current.distance + weight;
                    const oldDistance = neighbor.distance;
                    const improved = altDistance < neighbor.distance;

                    // Add step for edge relaxation
                    this.stepExplainer.addStep('relax', {
                        from: current.name,
                        to: neighbor.name,
                        weight: weight,
                        currentDist: current.distance,
                        oldDist: oldDistance === Infinity ? '∞' : oldDistance,
                        improved: improved
                    });

                    if (improved) {
                        neighbor.distance = altDistance;
                        neighbor.parent = current;
                    }
                }
            }

            current.state = 'visited';
            this.draw();
        }

        // Add completion step
        this.stepExplainer.addStep('complete', {
            processed: this.nodes.filter(n => n.visited).length,
            relaxed: this.edges.length
        });

        // Highlight shortest path if end node selected
        if (this.endNode && this.endNode.parent !== null) { // found a path to node
            let pathNode = this.endNode; // setting
            while (pathNode) { // while path is going on
                pathNode.state = 'path'; // highlight
                if (pathNode.parent) { // parent exists
                    const edge = this.edges.find(e =>
                        (e.from === pathNode.parent && e.to === pathNode) ||
                        (!this.isDirected && e.from === pathNode && e.to === pathNode.parent) // for undirected graphs check both directions
                    );
                    if (edge) edge.state = 'path';
                }
                pathNode = pathNode.parent;
                this.draw();
                await this.sleep(500 / this.animationSpeed);
            }
        }
    }

    async bfs() {
        if (!this.startNode) {
            alert('Please right-click to select a start node');
            return;
        }

        // Start explanation
        this.stepExplainer.startAlgorithm('bfs');

        // Add initialization step
        this.stepExplainer.addStep('init', {
            startNode: this.startNode.name
        });

        // Initialize
        this.nodes.forEach(node => {
            node.visited = false;
            node.parent = null;
            node.state = 'default';
        });

        const queue = [this.startNode];
        this.startNode.visited = true;

        while (queue.length > 0 && this.isRunning) {
            const current = queue.shift();

            // Add dequeue step
            this.stepExplainer.addStep('dequeue', {
                node: current.name,
                queue: queue.map(n => n.name)
            });

            current.state = 'current';
            this.draw();
            await this.sleep(1000 / this.animationSpeed);

            // Visit neighbors
            const neighbors = this.getNeighbors(current);
            for (const {node: neighbor} of neighbors) {
                if (!neighbor.visited) {
                    neighbor.visited = true;
                    neighbor.parent = current;
                    neighbor.state = 'visited';
                    queue.push(neighbor);

                    // Add visit step
                    this.stepExplainer.addStep('visit', {
                        node: neighbor.name,
                        from: current.name,
                        queueSize: queue.length
                    });

                    // Highlight edge
                    const edge = this.edges.find(e =>
                        (e.from === current && e.to === neighbor) ||
                        (!this.isDirected && e.from === neighbor && e.to === current)
                    );
                    if (edge) {
                        edge.state = 'highlight';
                        this.draw();
                        await this.sleep(500 / this.animationSpeed);
                        edge.state = 'default';
                    }
                } else {
                    // Add skip step for already visited nodes
                    this.stepExplainer.addStep('skip', {
                        node: neighbor.name
                    });
                }
            }

            current.state = 'visited';
            this.draw();
        }
    }

    async dfs() {
        if (!this.startNode) {
            alert('Please right-click to select a start node');
            return;
        }

        // Start explanation
        this.stepExplainer.startAlgorithm('dfs');

        // Add initialization step
        this.stepExplainer.addStep('init', {
            startNode: this.startNode.name
        });

        // Initialize
        this.nodes.forEach(node => {
            node.visited = false;
            node.parent = null;
            node.state = 'default';
        });

        // Track call stack for visualization
        this.callStack = [];

        await this.dfsRecursive(this.startNode, 0);
    }

    async dfsRecursive(node, depth) {
        if (!this.isRunning) return;

        this.callStack.push(node.name);

        node.visited = true;

        // Add visit step
        this.stepExplainer.addStep('visit', {
            node: node.name,
            from: node.parent ? node.parent.name : null,
            depth: depth
        });

        node.state = 'current';
        this.draw();
        await this.sleep(1000 / this.animationSpeed);

        const neighbors = this.getNeighbors(node);
        for (const {node: neighbor} of neighbors) {
            if (!neighbor.visited) {
                neighbor.parent = node;

                // Add explore step
                this.stepExplainer.addStep('explore', {
                    node: neighbor.name,
                    callStack: [...this.callStack]
                });

                // Highlight edge
                const edge = this.edges.find(e =>
                    (e.from === node && e.to === neighbor) ||
                    (!this.isDirected && e.from === neighbor && e.to === node)
                );
                if (edge) {
                    edge.state = 'highlight';
                    this.draw();
                    await this.sleep(500 / this.animationSpeed);
                }

                await this.dfsRecursive(neighbor, depth + 1);

                if (edge) edge.state = 'default';
            }
        }

        this.callStack.pop();

        // Add backtrack step if there's a parent
        if (node.parent && this.callStack.length > 0) {
            this.stepExplainer.addStep('backtrack', {
                from: node.name,
                to: node.parent.name
            });
        }

        node.state = 'visited';
        this.draw();
    }

    async prim() {
        if (this.nodes.length === 0) return;

        // Start explanation
        this.stepExplainer.startAlgorithm('prim');

        // Initialize
        this.nodes.forEach(node => {
            node.key = Infinity;
            node.parent = null;
            node.inMST = false;
            node.state = 'default';
        });

        this.edges.forEach(edge => edge.state = 'default');

        // Start with first node
        const startNode = this.nodes[0];
        startNode.key = 0;

        // Add init step
        this.stepExplainer.addStep('init', {
            startNode: startNode.name
        });

        const queue = [...this.nodes];
        let mstWeight = 0;
        let mstEdges = 0;

        while (queue.length > 0 && this.isRunning) {
            // Find minimum key node
            queue.sort((a, b) => a.key - b.key);
            const current = queue.shift();

            if (current.key === Infinity) break;

            current.inMST = true;
            mstEdges++;
            if (current.parent) mstWeight += current.key;

            // Add select step
            this.stepExplainer.addStep('select', {
                node: current.name,
                key: current.key === 0 ? 0 : current.key,
                mstSize: mstEdges
            });

            current.state = 'current';
            this.draw();
            await this.sleep(1000 / this.animationSpeed);

            // Update neighbors
            const neighbors = this.getNeighbors(current);
            for (const {node: neighbor, weight} of neighbors) {
                if (!neighbor.inMST && weight < neighbor.key) {
                    const oldKey = neighbor.key;
                    neighbor.key = weight;
                    neighbor.parent = current;

                    // Add update step
                    this.stepExplainer.addStep('update', {
                        node: neighbor.name,
                        from: current.name,
                        oldKey: oldKey === Infinity ? '∞' : oldKey,
                        newKey: weight
                    });
                }
            }

            // Highlight MST edge
            if (current.parent) {
                const edge = this.edges.find(e =>
                    (e.from === current.parent && e.to === current) ||
                    (e.from === current && e.to === current.parent)
                );
                if (edge) {
                    edge.state = 'path';
                }
            }

            current.state = 'path';
            this.draw();
        }

        // Add complete step
        this.stepExplainer.addStep('complete', {
            totalWeight: mstWeight,
            edgeCount: mstEdges - 1
        });
    }

    async kruskal() {
        if (this.nodes.length === 0) return;

        // Start explanation
        this.stepExplainer.startAlgorithm('kruskal');

        // Add initialization step
        this.stepExplainer.addStep('init', {});

        // Initialize disjoint set
        const parent = {};
        const rank = {};
        let components = this.nodes.length;

        this.nodes.forEach(node => {
            parent[node.id] = node.id;
            rank[node.id] = 0;
            node.state = 'default';
        });

        this.edges.forEach(edge => edge.state = 'default');

        // Sort edges by weight
        const sortedEdges = [...this.edges].sort((a, b) => a.weight - b.weight);

        const find = (id) => {
            if (parent[id] !== id) {
                parent[id] = find(parent[id]);
            }
            return parent[id];
        };

        const union = (id1, id2) => {
            const root1 = find(id1);
            const root2 = find(id2);

            if (root1 === root2) return false;

            if (rank[root1] < rank[root2]) {
                parent[root1] = root2;
            } else if (rank[root1] > rank[root2]) {
                parent[root2] = root1;
            } else {
                parent[root2] = root1;
                rank[root1]++;
            }
            return true;
        };

        let mstEdges = 0;
        let mstWeight = 0;

        // Process edges
        for (const edge of sortedEdges) {
            if (!this.isRunning) break;

            // Add consider step
            this.stepExplainer.addStep('consider', {
                from: edge.from.name,
                to: edge.to.name,
                weight: edge.weight
            });

            edge.state = 'highlight';
            this.draw();
            await this.sleep(1000 / this.animationSpeed);

            if (union(edge.from.id, edge.to.id)) {
                // Edge added to MST
                const oldComponents = components;
                components--;
                mstEdges++;
                mstWeight += edge.weight;

                this.stepExplainer.addStep('add', {
                    from: edge.from.name,
                    to: edge.to.name,
                    componentsBefore: oldComponents,
                    componentsAfter: components,
                    mstSize: mstEdges
                });

                edge.state = 'path';
                edge.from.state = 'path';
                edge.to.state = 'path';
            } else {
                // Edge would create cycle
                this.stepExplainer.addStep('skip', {
                    from: edge.from.name,
                    to: edge.to.name
                });

                edge.state = 'default';
            }

            this.draw();
            await this.sleep(500 / this.animationSpeed);
        }

        // Add completion step
        this.stepExplainer.addStep('complete', {
            totalWeight: mstWeight,
            edgeCount: mstEdges
        });
    }

    async bellmanFord() {
        if (!this.startNode) {
            alert('Please right-click to select a start node');
            return;
        }

        // Start explanation
        this.stepExplainer.startAlgorithm('bellman-ford');

        // Add initialization step
        this.stepExplainer.addStep('init', {
            startNode: this.startNode.name,
            totalNodes: this.nodes.length,
            totalEdges: this.edges.length
        });

        // Initialize
        this.nodes.forEach(node => {
            node.distance = node === this.startNode ? 0 : Infinity;
            node.parent = null;
            node.state = 'default';
        });

        let improvements = 0;
        let totalRelaxations = 0;

        // Relax edges V-1 times
        for (let i = 0; i < this.nodes.length - 1 && this.isRunning; i++) {
            let updated = false;

            // Add iteration step
            this.stepExplainer.addStep('iteration', {
                iteration: i + 1,
                total: this.nodes.length - 1,
                edgeCount: this.edges.length
            });

            for (const edge of this.edges) {
                if (!this.isRunning) break;

                edge.state = 'highlight';
                this.draw();
                await this.sleep(500 / this.animationSpeed);

                const fromDistance = edge.from.distance;
                const toDistance = edge.to.distance;
                const altDistance = fromDistance + edge.weight;

                totalRelaxations++;

                // Check if we can improve the distance
                const canImprove = fromDistance !== Infinity && altDistance < toDistance;

                // Add relaxation step
                this.stepExplainer.addStep('relax', {
                    from: edge.from.name,
                    to: edge.to.name,
                    weight: edge.weight,
                    fromDist: fromDistance === Infinity ? '∞' : fromDistance,
                    toDist: toDistance === Infinity ? '∞' : toDistance,
                    improved: canImprove
                });

                if (canImprove) {
                    edge.to.distance = altDistance;
                    edge.to.parent = edge.from;
                    edge.to.state = 'current';
                    updated = true;
                    improvements++;

                    this.draw();
                    await this.sleep(500 / this.animationSpeed);
                    edge.to.state = 'visited';
                }

                edge.state = 'default';
                this.draw();
            }

            // If no updates were made, we can terminate early
            if (!updated) {
                this.stepExplainer.addStep('no-change', {
                    iteration: i + 1,
                    saved: this.nodes.length - 1 - (i + 1)
                });
                break;
            }
        }

        // Add cycle check step
        this.stepExplainer.addStep('cycle-check', {});

        // Check for negative cycles
        let hasNegativeCycle = false;
        for (const edge of this.edges) {
            if (edge.from.distance !== Infinity &&
                edge.from.distance + edge.weight < edge.to.distance) {

                // Add negative cycle detection step
                this.stepExplainer.addStep('negative-cycle', {
                    from: edge.from.name,
                    to: edge.to.name
                });

                hasNegativeCycle = true;
                alert('Negative cycle detected!');

                // Highlight the problematic edge
                edge.state = 'highlight';
                edge.from.state = 'current';
                edge.to.state = 'current';
                this.draw();

                return;
            }
        }

        if (!hasNegativeCycle) {
            // Mark all visited nodes
            this.nodes.forEach(node => {
                if (node.distance !== Infinity) {
                    node.state = 'visited';
                }
            });

            // Add completion step
            this.stepExplainer.addStep('complete', {
                iterations: this.nodes.length - 1,
                relaxations: totalRelaxations,
                improvements: improvements
            });

            // Highlight shortest path if end node selected
            if (this.endNode && this.endNode.distance !== Infinity) {
                await this.highlightPath();
            }
        }
    }

    // Helper method to highlight the shortest path
    async highlightPath() {
        let pathNode = this.endNode;
        const path = [];

        // Build path from end to start
        while (pathNode) {
            path.unshift(pathNode);
            pathNode = pathNode.parent;
        }

        // Animate path highlighting
        for (let i = 0; i < path.length; i++) {
            const node = path[i];
            node.state = 'path';

            if (i > 0) {
                const prevNode = path[i - 1];
                const edge = this.edges.find(e =>
                    (e.from === prevNode && e.to === node) ||
                    (!this.isDirected && e.from === node && e.to === prevNode)
                );
                if (edge) {
                    edge.state = 'path';
                }
            }

            this.draw();
            await this.sleep(500 / this.animationSpeed);
        }
    }

    getNeighbors(node) {
        const neighbors = [];
        this.edges.forEach(edge => {
            if (edge.from === node) {
                neighbors.push({node: edge.to, weight: edge.weight});
            } else if (!this.isDirected && edge.to === node) {
                neighbors.push({node: edge.from, weight: edge.weight});
            }
        });
        return neighbors;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    stepForward() {
        // need to refactor algorithms
        alert('feature coming soon');
    }

    reset() {
        this.nodes.forEach(node => {
            node.state = 'default';
            node.visited = false;
            node.distance = Infinity;
            node.parent = null;
            node.key = Infinity;
            node.inMST = false;
        });
        this.edges.forEach(edge => {
            edge.state = 'default';
        });
        this.selectedNode = null;
        this.draw();
    }

    clearGraph() {
        if (confirm('Are you sure you want to clear the entire graph?')) {
            this.nodes = [];
            this.edges = [];
            this.nodeCounter = 0;
            this.startNode = null;
            this.endNode = null;
            this.selectedNode = null;
            this.draw();
            this.updateStatus();
        }
    }

    generateRandomGraph() {
        this.clearGraph();

        const nodeCount = Math.floor(Math.random() * 5) + 6; // 6-10 nodes
        const margin = 50;

        for (let i = 0; i < nodeCount; i++) {
            const x = margin + Math.random() * (this.canvas.width - 2 * margin);
            const y = margin + Math.random() * (this.canvas.height - 2 * margin);
            this.addNode(x, y);
        }

        const edgeCount = Math.floor(nodeCount * 1.5);

        for (let i = 0; i < edgeCount; i++) {
            const from = this.nodes[Math.floor(Math.random() * this.nodes.length)];
            const to = this.nodes[Math.floor(Math.random() * this.nodes.length)];

            if (from !== to) {
                const weight = Math.floor(Math.random() * 9) + 1;
                this.addEdge(from, to, weight);
            }
        }
        this.draw();

    }

    toggleDirected() {
        this.isDirected = !this.isDirected;
        document.getElementById('directedBtn').textContent =
            this.isDirected ? 'Make Undirected' : 'Make Directed'; // if is directed change button name to make undirected
        this.draw();
    }

    toggleWeighted() {
        this.isWeighted = !this.isWeighted;
        document.getElementById('weightedBtn').textContent =
            this.isWeighted ? 'Make Unweighted' : 'Make Weighted';
        this.draw();
    }

    showWeightModal() {
        document.getElementById('weightModal').classList.add('active');
        document.getElementById('weightInput').focus();
    }

    confirmWeight() {
        const weight = parseInt(document.getElementById('weightInput').value) || 1;

        if (this.pendingEdge) {
            this.addEdge(this.pendingEdge.from, this.pendingEdge.to, weight);
            this.pendingEdge = null; // done adding
        }
        document.getElementById('weightModal').classList.remove('active'); // remove popup
        this.draw();
    }

    cancelWeight() {
        this.pendingEdge = null;
        document.getElementById('weightModal').classList.remove('active');
    }

    updateStatus() {
        document.getElementById('nodeCount').textContent = this.nodes.length;
        document.getElementById('edgeCount').textContent = this.edges.length;
        document.getElementById('statusText').textContent =
            this.isRunning ? 'Running' : 'Ready';
    }


    async callBackendAlgorithm(algorithm, data) {
        try {
            const response = await fetch(`${this.backendUrl}/api/algorithms/${algorithm}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error);
            }
            return result.result;

        } catch (error) {
            console.error('Backend API error:', error);

            this.useBackend = false;
            return null;
        }
    }

    async generateRandomGraphFromBackend() {
        try {
            const response = await fetch(`${this.backendUrl}/api/graph/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nodeCount: 8,
                    edgeCount: 12,
                    maxWeight: 10,
                    directed: this.isDirected
                })
            });
            const result = await response.json();

            if(result.success) {
                this.nodes = result.graph.nodes;
                this.edges = result.graph.edges;
                this.nodeCounter = this.nodes.length;
                this.draw();
                this.updateStatus();
            }

        } catch(error) {
            console.error('Failed to generate graph from backend:', error);
            this.generateRandomGraph();
        }
    }

    exportGraph() {
        const graphData = {
            nodes: this.nodes,
            edges: this.edges.map( e => ({
                from: e.from.id,
                to: e.to.id,
                weight: e.weight
            })),
            isDirected: this.isDirected,
            isWeighted: this.isWeighted
        };

        const dataStr = JSON.stringify(graphData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = 'graph.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    importGraph(fileContent) {
        try {
            const graphData = JSON.parse(fileContent);

            this.clearGraph();

            // import nodes
            graphData.nodes.forEach(node => {
                this.nodes.push({
                    ...node,
                    visited: false,
                    distance: Infinity,
                    parent: null,
                    state: 'default'
                });
            });

            this.nodeCounter = this.nodes.length;

            // import edge
            graphData.edges.forEach(edgeData => {
                const from = this.nodes.find(n => n.id === edgeData.from);
                const to = this.nodes.find(n => n.id === edgeData.to);
                if (from && to) {
                    this.edges.push({
                        from,
                        to,
                        weight: edgeData.weight || 1,
                        state: 'default'
                    });
                }
            });

            this.isDirected = graphData.isDirected || false;
            this.isWeighted = graphData.isWeighted !== undefined ? graphData.isWeighted : true;

            this.draw();
            this.updateStatus();

            document.getElementById('directedBtn').textContent =
                this.isDirected ? 'Make Undirected' : 'Make Directed';
            document.getElementById('weightedBtn').textContent =
                this.isWeighted ? 'Make Unweighted' : 'Make Weighted';
        } catch (error) {
            alert('Failed to import graph: ' + error.message);
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (this.isRunning) return;

            switch(e.key) {
                case '1':
                    this.currentTool = 'node';
                    document.querySelector('[data-tool="node"]').click();
                    break;
                case '2':
                    this.currentTool = 'edge';
                    document.querySelector('[data-tool="edge"]').click();
                    break;
                case '3':
                    this.currentTool = 'move';
                    document.querySelector('[data-tool="move"]').click();
                    break;
                case 'Delete':
                case 'Backspace':
                    if(this.selectedNode) {
                        this.deleteNode(this.selectedNode);
                    }
                    break;
                case 'Escape':
                    this.selectedNode = null;
                    this.draw();
                    break;
                case ' ':
                    e.preventDefault();
                    if (this.currentAlgorithm) {
                        this.runAlgorithm();
                    }
                    break;
            }
        });
    }

    deleteNode(node) {
        this.nodes = this.nodes.filter(n => n !== node); // filter nodes that arent the chosen

        this.edges = this.edges.filter(e => e.from !== node && e.to !== node);

        if (this.selectedNode === node) this.selectedNode = null;
        if (this.startNode === node) this.startNode = null;
        if(this.endNode === node) this.endNode = null;

        this.draw();
        this.updateStatus();
    }
}

const visualizer = new GraphVisualizer();

const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.json';
fileInput.style.display = 'none';
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            visualizer.importGraph(e.target.result);
        };
        reader.readAsText(file);
    }
});
document.body.appendChild(fileInput);