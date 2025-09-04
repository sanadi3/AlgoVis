# Graph Algorithm Visualizer - React Version

This is a React.js conversion of the original vanilla JavaScript graph algorithm visualizer. The application provides an interactive interface for visualizing various graph algorithms including Dijkstra's shortest path, BFS, DFS, Prim's MST, Kruskal's MST, and Bellman-Ford.

## Features

- **Interactive Graph Creation**: Click to add nodes, use edge tool to connect nodes
- **Algorithm Visualization**: Step-by-step visualization of graph algorithms
- **Draggable Panels**: Step explainer and pseudocode panels can be dragged around
- **Real-time Status**: Live updates of node count, edge count, and algorithm status
- **Graph Options**: Toggle between directed/undirected and weighted/unweighted graphs
- **Export/Import**: Save and load graph configurations

## Project Structure

```
src/
├── components/
│   ├── GraphVisualizer.js    # Main canvas component for graph rendering
│   ├── Sidebar.js            # Algorithm selection and controls
│   ├── Toolbar.js            # Tool selection (node, edge, move)
│   ├── StatusBar.js          # Status information display
│   ├── WeightModal.js        # Modal for setting edge weights
│   └── StepExplainer.js      # Step-by-step algorithm explanation
├── context/
│   └── GraphContext.js       # Global state management
├── App.js                    # Main application component
└── index.js                  # Application entry point
```

## Key React Features Used

### 1. Context API for State Management
- Centralized state management using React Context
- Reducer pattern for complex state updates
- Custom hooks for easy state access

### 2. Styled Components
- CSS-in-JS styling approach
- Component-scoped styles
- Dynamic styling based on state

### 3. React Hooks
- `useState` for local component state
- `useEffect` for side effects and canvas management
- `useCallback` for performance optimization
- `useRef` for DOM element references

### 4. Component Architecture
- Functional components with hooks
- Separation of concerns
- Reusable components

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Usage

1. **Add Nodes**: Select the Node tool and click on the canvas
2. **Connect Nodes**: Select the Edge tool, click on two nodes to connect them
3. **Move Nodes**: Select the Move tool and drag nodes around
4. **Set Start/End**: Right-click on nodes to set start and end points
5. **Run Algorithms**: Select an algorithm from the sidebar and click "Run Algorithm"
6. **View Steps**: The step explainer panel shows detailed algorithm steps

## Algorithm Support

- **Dijkstra's Shortest Path**: Finds shortest paths from a source node
- **Breadth-First Search (BFS)**: Explores nodes level by level
- **Depth-First Search (DFS)**: Explores nodes as deep as possible
- **Prim's MST**: Finds minimum spanning tree
- **Kruskal's MST**: Alternative MST algorithm
- **Bellman-Ford**: Handles negative edge weights

## Technical Improvements Over Vanilla JS

1. **Better State Management**: Centralized state with predictable updates
2. **Component Reusability**: Modular components that can be easily extended
3. **Performance**: Optimized re-renders with React's reconciliation
4. **Developer Experience**: Better debugging with React DevTools
5. **Maintainability**: Cleaner code structure and separation of concerns
6. **Type Safety**: Ready for TypeScript integration

## Future Enhancements

- [ ] Add TypeScript support
- [ ] Implement remaining algorithms (A*, Floyd-Warshall)
- [ ] Add graph import/export functionality
- [ ] Implement step-by-step algorithm execution
- [ ] Add more graph generation options
- [ ] Improve mobile responsiveness
- [ ] Add unit tests

## Dependencies

- React 18.2.0
- React DOM 18.2.0
- Styled Components 6.1.0
- React Scripts 5.0.1

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
