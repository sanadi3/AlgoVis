class StepExplainer {
    constructor(visualizer) {
        this.visualizer = visualizer;
        this.steps = [];
        this.currentStepIndex = 0;
        this.isActive = false;
        this.isMinimized = false;

        this.algorithms = {
            dijkstra: new DijkstraExplainer(),
            bfs: new BFSExplainer(),
            dfs: new DFSExplainer(),
            prim: new PrimExplainer(),
            kruskal: new KruskalExplainer(),
            'bellman-ford': new BellmanFordExplainer()
        };

        this.createPanels();
        this.attachEventListeners();
    }

    createPanels() {
        // explanation panel
        const explanationPanel = document.createElement('div');
        explanationPanel.id = 'explanation-panel';
        explanationPanel.innerHTML = `
        <div class="explanation-header">
           <h3>Algorithm Steps</h3>
           <button class="minimize-btn"></button>
        </div>
        <div class="explanation-content">
            <div id="steps-container"></div>
        </div>
        `;

        // create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'toggle-explanation-btn';
        toggleBtn.textContent = 'Show Steps';
        toggleBtn.id = 'toggle-explanation';

        document.body.appendChild(explanationPanel);
        document.body.appendChild(pseudocodePanel);
        document.body.appendChild(stepCounter);
        document.body.appendChild(toggleBtn);
    }

    attachEventListeners() {
        document.getElementById('toggle-explanation').addEventListener('click', () => {
            this.toggle();
        });

        document.querySelector('.minimize-btn').addEventListener('click', () => {
            this.toggleMinimize();
        });
    }

    toggle() {
        this.isActive = !this.isActive();
        const panel = document.getElementById('explanation-panel');
        const pseudocode = document.getElementById('pseudocode-panel');
        const counter = document.querySelector('.step-counter');
        const toggleBtn = document.getElementById('toggle-explanation');

        if(this.isActive) {
            panel.classList.add('active');
            pseudocode.classList.add('active');
            counter.classList.add('active');
            toggleBtn.textContent = 'Hide Steps';
            toggleBtn.classList.add('hidden');
        } else {
            panel.classList.remove('active');
            pseudocode.classList.remove('active');
            counter.classList.remove('active');
            toggleBtn.textContent = 'Show Steps';
            toggleBtn.classList.remove('hidden');
        }
    }

    toggleMinimize () {
        this.isMinimized = !this.isMinimized;
        const panel = document.getElementById('explanation-panel');
        panel.classList.toggle('minimized');
    }

    startAlgorithm(algorithmName) {
        this.clear();
        this.currentAlgorithm = this.algorithms[algorithmName];

        if(this.currentAlgorithm) {
            this.showPseudocode(algorithmName);

            if(!this.isActive) {
                this.toggle();
            }
        }
    }

    showPseudocode(algorithmName) {
        const pseudocodeContent = document.getElementById('pseudocode-content');
        const algorithmNameSpan = document.getElementById('algorithm-name');

        algorithmNameSpan.textContent = algorithmName.charAt(0).toUpperCase() +
                                                        algorithmName.slice(1).replace('-', ' ');

        if(this.currentAlgorithm && this.currentAlgorithm.pseudocode) {
            pseudocodeContent.innerHTML = this.currentAlgorithm.pseudocode
                .split('/n')
                .map((line, index) => `<div class="pseudocode-line" data-line="${index}">${line}</div>`)
                .join('');
        }
    }

    addStep(type, data) {
        if(!this.currentAlgorithm) return;

        const step = this.currentAlgorithm.generateStep(type, data);
        if (!step) return;

        this.steps.psuh(step);
        this.renderStep(step, this.steps.length - 1);
        this.updateCounter();

        // highlight current line
        if (step.pseudocodeLine !== undefined) {
            this.highlightPseudocodeLine(step.pseucodeLine);
        }

        // auto scroll
        const container = document.getElementById('steps-container');
        if(container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    renderStep(step, index) {
        const container = document.getElementById('steps-container');
        const stepElement = document.createElement('div');
        stepElement.className = 'step-item new';
        stepElement.dataset.stepIndex = index;

        // Mark current step
        if (index === this.steps.length - 1) {
            stepElement.classList.add('current');
            // Remove current from previous steps
            container.querySelectorAll('.step-item.current').forEach(el => {
                if (el !== stepElement) el.classList.remove('current');
            });
        }

        let detailsHtml = '';
        if (step.details) {
            detailsHtml = `
                <div class="step-details">
                    ${Object.entries(step.details).map(([key, value]) => `
                        <div class="step-detail-item">
                            <span>${key}:</span>
                            <span class="step-detail-value">${value}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        let dataStructureHtml = '';
        if (step.dataStructure) {
            dataStructureHtml = this.renderDataStructure(step.dataStructure);
        }

        stepElement.innerHTML = `
            <div class="step-number">Step ${index + 1}</div>
            <div class="step-text">${step.text}</div>
            ${step.code ? `<div class="step-code">${step.code}</div>` : ''}
            ${detailsHtml}
            ${dataStructureHtml}
        `;

        container.appendChild(stepElement);

        // Remove 'new' class after animation
        setTimeout(() => stepElement.classList.remove('new'), 300);
    }

    renderDataStructure(dataStructure) {
        const { type, data } = dataStructure;

        switch (type) {
            case 'queue':
                return `
                    <div class="data-structure-view">
                        <div class="data-structure-title">Queue:</div>
                        <div class="queue-view">
                            ${data.map(item => `<div class="queue-item">${item}</div>`).join('')}
                        </div>
                    </div>
                `;

            case 'stack':
                return `
                    <div class="data-structure-view">
                        <div class="data-structure-title">Stack:</div>
                        <div class="stack-view">
                            ${data.reverse().map(item => `<div class="stack-item">${item}</div>`).join('')}
                        </div>
                    </div>
                `;

            case 'priority-queue':
                return `
                    <div class="data-structure-view">
                        <div class="data-structure-title">Priority Queue:</div>
                        <div class="priority-queue-view">
                            ${data.map(item => `
                                <div class="pq-item">
                                    <div>${item.node}</div>
                                    <div class="pq-priority">${item.priority}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;

            default:
                return '';
        }
    }

    highlightPseudocodeLine(lineNumber) {
        const lines = document.querySelectorAll('.pseudocode-line');
        lines.forEach((line, index) => {
            line.classList.remove('active');
            if (index < lineNumber) {
                line.classList.add('completed');
            }
        });

        if (lines[lineNumber]) {
            lines[lineNumber].classList.add('active');
        }
    }

    updateCounter() {
        document.getElementById('current-step').textContent = this.steps.length;
        document.getElementById('total-steps').textContent = this.steps.length;
    }

    clear() {
        this.steps = [];
        this.currentStepIndex = 0;
        document.getElementById('steps-container').innerHTML = '';
        document.getElementById('current-step').textContent = '0';
        document.getElementById('total-steps').textContent = '0';

        // Clear pseudocode highlights
        document.querySelectorAll('.pseudocode-line').forEach(line => {
            line.classList.remove('active', 'completed');
        });
    }
}

// Algorithm-specific explainers
class DijkstraExplainer {
    constructor() {
        this.pseudocode = `function dijkstra(graph, start):
    distances = {node: ∞ for all nodes}
    distances[start] = 0
    unvisited = all nodes
    
    while unvisited is not empty:
        current = node with min distance in unvisited
        remove current from unvisited
        
        for each neighbor of current:
            alt = distances[current] + weight(current, neighbor)
            if alt < distances[neighbor]:
                distances[neighbor] = alt
                previous[neighbor] = current
    
    return distances, previous`;
    }

    generateStep(type, data) {
        switch (type) {
            case 'init':
                return {
                    text: `Starting Bellman-Ford from node ${data.startNode}`,
                    code: `distance[${data.startNode}] = 0, all others = ∞`,
                    pseudocodeLine: 1
                };

            case 'iteration':
                return {
                    text: `Starting iteration ${data.iteration} of ${data.total}`,
                    code: `// Relaxing all edges, round ${data.iteration}`,
                    pseudocodeLine: 4
                };

            case 'relax':
                return {
                    text: `Relaxing edge ${data.from} → ${data.to}`,
                    code: `${data.fromDist} + ${data.weight} ${data.improved ? '<' : '≥'} ${data.toDist}`,
                    pseudocodeLine: 6,
                    details: {
                        'Edge': `${data.from} → ${data.to}`,
                        'Current Distance': data.toDist,
                        'New Distance': data.improved ? (data.fromDist + data.weight) : data.toDist,
                        'Updated': data.improved ? 'Yes' : 'No'
                    }
                };

            case 'negative-cycle':
                return {
                    text: 'Negative cycle detected!',
                    code: 'return "Negative cycle exists"',
                    pseudocodeLine: 12,
                    details: {
                        'Edge': `${data.from} → ${data.to}`,
                        'Issue': 'Distance can be further reduced'
                    }
                };

            case 'complete':
                return {
                    text: 'Algorithm complete! All shortest paths found.',
                    code: 'return distance, parent',
                    pseudocodeLine: 14
                };

            default:
                return null;
        }
    }
}

// Export for use in main.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StepExplainer;
}
switch (data.type) {
    case 'init':
        return {
            text: `Initializing Dijkstra's algorithm with start node ${data.startNode}`,
            code: `distances = {all: ∞, ${data.startNode}: 0}`,
            pseudocodeLine: 1,
            details: {
                'Start Node': data.startNode,
                'Total Nodes': data.totalNodes
            }
        };

    case 'select':
        return {
            text: `Selected node ${data.node} with minimum distance ${data.distance}`,
            code: `current = ${data.node} (distance: ${data.distance})`,
            pseudocodeLine: 5,
            details: {
                'Current Node': data.node,
                'Distance': data.distance,
                'Unvisited': data.unvisitedCount
            },
            dataStructure: {
                type: 'priority-queue',
                data: data.queue || []
            }
        };

    case 'relax':
        return {
            text: `Checking edge ${data.from} → ${data.to}`,
            code: `${data.currentDist} + ${data.weight} ${data.improved ? '<' : '≥'} ${data.oldDist}`,
            pseudocodeLine: 9,
            details: {
                'Edge': `${data.from} → ${data.to}`,
                'Current Path': data.currentDist + data.weight,
                'Previous Best': data.oldDist,
                'Updated': data.improved ? 'Yes' : 'No'
            }
        };

    case 'complete':
        return {
            text: 'Algorithm complete! All shortest paths found.',
            code: 'return distances, previous',
            pseudocodeLine: 12,
            details: {
                'Nodes Processed': data.processed,
                'Edges Relaxed': data.relaxed
            }
        };

    default:
        return null;
}


class BFSExplainer {
    constructor() {
        this.pseudocode = `function BFS(graph, start):
    visited = {start}
    queue = [start]
    
    while queue is not empty:
        current = queue.dequeue()
        
        for each neighbor of current:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.enqueue(neighbor)
                parent[neighbor] = current
    
    return visited, parent`;
    }

    generateStep(type, data) {
        switch (type) {
            case 'init':
                return {
                    text: `Starting BFS from node ${data.startNode}`,
                    code: `queue = [${data.startNode}], visited = {${data.startNode}}`,
                    pseudocodeLine: 1
                };

            case 'dequeue':
                return {
                    text: `Processing node ${data.node}`,
                    code: `current = queue.dequeue() // ${data.node}`,
                    pseudocodeLine: 4,
                    dataStructure: {
                        type: 'queue',
                        data: data.queue || []
                    }
                };

            case 'visit':
                return {
                    text: `Visiting neighbor ${data.node} from ${data.from}`,
                    code: `visited.add(${data.node}), queue.enqueue(${data.node})`,
                    pseudocodeLine: 8,
                    details: {
                        'Parent': data.from,
                        'Child': data.node,
                        'Queue Size': data.queueSize
                    }
                };

            case 'skip':
                return {
                    text: `Skipping ${data.node} (already visited)`,
                    code: `// ${data.node} already in visited`,
                    pseudocodeLine: 7
                };

            default:
                return null;
        }
    }
}

class DFSExplainer {
    constructor() {
        this.pseudocode = `function DFS(graph, start):
    visited = set()
    
    function dfs_recursive(node):
        visited.add(node)
        
        for each neighbor of node:
            if neighbor not in visited:
                parent[neighbor] = node
                dfs_recursive(neighbor)
    
    dfs_recursive(start)
    return visited, parent`;
    }

    generateStep(type, data) {
        switch (type) {
            case 'init':
                return {
                    text: `Starting DFS from node ${data.startNode}`,
                    code: `dfs_recursive(${data.startNode})`,
                    pseudocodeLine: 0
                };

            case 'visit':
                return {
                    text: `Visiting node ${data.node} ${data.from ? `from ${data.from}` : ''}`,
                    code: `visited.add(${data.node})`,
                    pseudocodeLine: 3,
                    details: {
                        'Current Node': data.node,
                        'Depth': data.depth || 0
                    }
                };

            case 'explore':
                return {
                    text: `Exploring unvisited neighbor ${data.node}`,
                    code: `dfs_recursive(${data.node})`,
                    pseudocodeLine: 8,
                    dataStructure: {
                        type: 'stack',
                        data: data.callStack || []
                    }
                };

            case 'backtrack':
                return {
                    text: `Backtracking from ${data.from} to ${data.to}`,
                    code: `// All neighbors of ${data.from} visited`,
                    pseudocodeLine: 9
                };

            default:
                return null;
        }
    }
}

class PrimExplainer {
    constructor() {
        this.pseudocode = `function prim(graph):
    MST = empty set
    key = {all nodes: ∞}
    key[arbitrary start] = 0
    Q = all nodes
    
    while Q is not empty:
        u = node with minimum key in Q
        remove u from Q
        add u to MST
        
        for each neighbor v of u:
            if v in Q and weight(u,v) < key[v]:
                key[v] = weight(u,v)
                parent[v] = u
    
    return MST`;
    }

    generateStep(type, data) {
        switch (type) {
            case 'init':
                return {
                    text: `Starting Prim's algorithm from node ${data.startNode}`,
                    code: `key[${data.startNode}] = 0, MST = {}`,
                    pseudocodeLine: 2
                };

            case 'select':
                return {
                    text: `Adding node ${data.node} to MST with key ${data.key}`,
                    code: `MST.add(${data.node})`,
                    pseudocodeLine: 7,
                    details: {
                        'Node': data.node,
                        'Key Value': data.key,
                        'MST Size': data.mstSize
                    }
                };

            case 'update':
                return {
                    text: `Updating key of ${data.node}: ${data.oldKey} → ${data.newKey}`,
                    code: `key[${data.node}] = ${data.newKey}`,
                    pseudocodeLine: 12,
                    details: {
                        'Edge': `${data.from} - ${data.node}`,
                        'Weight': data.newKey
                    }
                };

            case 'complete':
                return {
                    text: `MST complete with total weight ${data.totalWeight}`,
                    code: `return MST // weight: ${data.totalWeight}`,
                    pseudocodeLine: 15,
                    details: {
                        'Total Edges': data.edgeCount,
                        'Total Weight': data.totalWeight
                    }
                };

            default:
                return null;
        }
    }
}

class KruskalExplainer {
    constructor() {
        this.pseudocode = `function kruskal(graph):
    MST = empty set
    sort edges by weight
    make_set(v) for each vertex v
    
    for each edge (u,v) in sorted order:
        if find(u) ≠ find(v):
            MST.add(edge(u,v))
            union(u,v)
        
        if |MST| = |V| - 1:
            break
    
    return MST`;
    }

    generateStep(type, data) {
        switch (type) {
            case 'init':
                return {
                    text: 'Initializing Kruskal\'s algorithm',
                    code: 'sort edges by weight, initialize disjoint sets',
                    pseudocodeLine: 1
                };

            case 'consider':
                return {
                    text: `Considering edge ${data.from} - ${data.to} with weight ${data.weight}`,
                    code: `edge(${data.from}, ${data.to}, weight: ${data.weight})`,
                    pseudocodeLine: 5
                };

            case 'add':
                return {
                    text: `Adding edge ${data.from} - ${data.to} to MST`,
                    code: `MST.add(${data.from} - ${data.to}), union(${data.from}, ${data.to})`,
                    pseudocodeLine: 7,
                    details: {
                        'Components Before': data.componentsBefore,
                        'Components After': data.componentsAfter,
                        'MST Edges': data.mstSize
                    }
                };

            case 'skip':
                return {
                    text: `Skipping edge ${data.from} - ${data.to} (would create cycle)`,
                    code: `// ${data.from} and ${data.to} already connected`,
                    pseudocodeLine: 6,
                    details: {
                        'Reason': 'Would create cycle'
                    }
                };

            default:
                return null;
        }
    }
}

class BellmanFordExplainer {
    constructor() {
        this.pseudocode = `function bellmanFord(graph, start):
    distance = {all: ∞}
    distance[start] = 0
    
    for i = 1 to |V| - 1:
        for each edge (u,v) with weight w:
            if distance[u] + w < distance[v]:
                distance[v] = distance[u] + w
                parent[v] = u
    
    // Check for negative cycles
    for each edge (u,v) with weight w:
        if distance[u] + w < distance[v]:
            return "Negative cycle detected"
    
    return distance, parent`;
    }

    generateStep(type, data) {
        switch (type) {
            case 'init':
                return {
                    text: `Starting Bellman-Ford from node ${data.startNode}`,
                    code: `distance[${data.startNode}] = 0, distance[others] = ∞`,
                    pseudocodeLine: 1,
                    details: {
                        'Source Node': data.startNode,
                        'Total Nodes': data.nodeCount || 0,
                        'Total Edges': data.edgeCount || 0
                    }
                };

            case 'iteration':
                return {
                    text: `Starting iteration ${data.iteration} of ${data.totalIterations}`,
                    code: `// Iteration ${data.iteration}: checking all edges`,
                    pseudocodeLine: 4,
                    details: {
                        'Iteration': `${data.iteration} / ${data.totalIterations}`,
                        'Edges to Check': data.edgeCount || 0
                    }
                };

            case 'relax':
                return {
                    text: `Relaxing edge ${data.from} → ${data.to}: ${data.oldDistance} → ${data.newDistance}`,
                    code: `distance[${data.to}] = ${data.newDistance}, parent[${data.to}] = ${data.from}`,
                    pseudocodeLine: 7,
                    details: {
                        'Edge': `${data.from} → ${data.to}`,
                        'Weight': data.weight,
                        'Old Distance': data.oldDistance === Infinity ? '∞' : data.oldDistance,
                        'New Distance': data.newDistance,
                        'Via': data.from
                    }
                };

            case 'no_relax':
                return {
                    text: `Edge ${data.from} → ${data.to} not relaxed (${data.currentDistance} ≤ ${data.proposedDistance})`,
                    code: `// No update: ${data.currentDistance} ≤ ${data.from}(${data.fromDistance}) + ${data.weight}`,
                    pseudocodeLine: 6,
                    details: {
                        'Edge': `${data.from} → ${data.to}`,
                        'Current Distance': data.currentDistance === Infinity ? '∞' : data.currentDistance,
                        'Proposed Distance': data.proposedDistance
                    }
                };

            case 'check_cycle':
                return {
                    text: `Checking for negative cycles (final pass)`,
                    code: `// Checking all edges for further relaxation`,
                    pseudocodeLine: 11,
                    details: {
                        'Phase': 'Negative Cycle Detection',
                        'Edges Checked': data.edgesChecked || 0
                    }
                };

            case 'negative_cycle':
                return {
                    text: `Negative cycle detected! Edge ${data.from} → ${data.to} can still be relaxed`,
                    code: `return "Negative cycle detected"`,
                    pseudocodeLine: 13,
                    details: {
                        'Problematic Edge': `${data.from} → ${data.to}`,
                        'Current Distance': data.currentDistance,
                        'Could Be': data.proposedDistance,
                        'Status': 'Algorithm Terminated'
                    }
                };

            case 'complete':
                return {
                    text: `Bellman-Ford complete - shortest paths found`,
                    code: `return distance, parent`,
                    pseudocodeLine: 15,
                    details: {
                        'Reachable Nodes': data.reachableCount || 0,
                        'Unreachable Nodes': data.unreachableCount || 0,
                        'Total Relaxations': data.totalRelaxations || 0
                    }
                };

            case 'unreachable':
                return {
                    text: `Node ${data.node} remains unreachable from source`,
                    code: `distance[${data.node}] = ∞`,
                    pseudocodeLine: 1,
                    details: {
                        'Node': data.node,
                        'Distance': '∞',
                        'Status': 'Unreachable'
                    }
                };

            default:
                return null;
        }
    }
}

