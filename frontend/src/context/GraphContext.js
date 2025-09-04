import React, { createContext, useContext, useReducer, useCallback } from 'react';

const GraphContext = createContext();

// Initial state
const initialState = {
  nodes: [],
  edges: [],
  nodeCounter: 0,
  currentTool: 'node',
  selectedNode: null,
  startNode: null,
  endNode: null,
  hoveredNode: null,
  draggedNode: null,
  currentAlgorithm: null,
  isDirected: false,
  isWeighted: true,
  animationSpeed: 5,
  isRunning: false,
  pendingEdge: null,
  showWeightModal: false,
  stepExplainer: {
    isActive: false,
    isMinimized: false,
    steps: [],
    currentAlgorithm: null
  }
};

// Action types
const actionTypes = {
  ADD_NODE: 'ADD_NODE',
  ADD_EDGE: 'ADD_EDGE',
  SET_TOOL: 'SET_TOOL',
  SET_SELECTED_NODE: 'SET_SELECTED_NODE',
  SET_START_NODE: 'SET_START_NODE',
  SET_END_NODE: 'SET_END_NODE',
  SET_HOVERED_NODE: 'SET_HOVERED_NODE',
  SET_DRAGGED_NODE: 'SET_DRAGGED_NODE',
  SET_ALGORITHM: 'SET_ALGORITHM',
  TOGGLE_DIRECTED: 'TOGGLE_DIRECTED',
  TOGGLE_WEIGHTED: 'TOGGLE_WEIGHTED',
  SET_ANIMATION_SPEED: 'SET_ANIMATION_SPEED',
  SET_RUNNING: 'SET_RUNNING',
  SET_PENDING_EDGE: 'SET_PENDING_EDGE',
  SHOW_WEIGHT_MODAL: 'SHOW_WEIGHT_MODAL',
  HIDE_WEIGHT_MODAL: 'HIDE_WEIGHT_MODAL',
  UPDATE_NODE: 'UPDATE_NODE',
  RESET_GRAPH: 'RESET_GRAPH',
  CLEAR_GRAPH: 'CLEAR_GRAPH',
  GENERATE_RANDOM_GRAPH: 'GENERATE_RANDOM_GRAPH',
  STEP_EXPLAINER_START: 'STEP_EXPLAINER_START',
  STEP_EXPLAINER_ADD_STEP: 'STEP_EXPLAINER_ADD_STEP',
  STEP_EXPLAINER_CLEAR: 'STEP_EXPLAINER_CLEAR',
  STEP_EXPLAINER_TOGGLE: 'STEP_EXPLAINER_TOGGLE',
  STEP_EXPLAINER_MINIMIZE: 'STEP_EXPLAINER_MINIMIZE'
};

// Reducer
const graphReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.ADD_NODE:
      return {
        ...state,
        nodes: [...state.nodes, action.payload],
        nodeCounter: state.nodeCounter + 1
      };

    case actionTypes.ADD_EDGE:
      return {
        ...state,
        edges: [...state.edges, action.payload]
      };

    case actionTypes.SET_TOOL:
      return {
        ...state,
        currentTool: action.payload
      };

    case actionTypes.SET_SELECTED_NODE:
      return {
        ...state,
        selectedNode: action.payload
      };

    case actionTypes.SET_START_NODE:
      return {
        ...state,
        startNode: action.payload
      };

    case actionTypes.SET_END_NODE:
      return {
        ...state,
        endNode: action.payload
      };

    case actionTypes.SET_HOVERED_NODE:
      return {
        ...state,
        hoveredNode: action.payload
      };

    case actionTypes.SET_DRAGGED_NODE:
      return {
        ...state,
        draggedNode: action.payload
      };

    case actionTypes.SET_ALGORITHM:
      return {
        ...state,
        currentAlgorithm: action.payload
      };

    case actionTypes.TOGGLE_DIRECTED:
      return {
        ...state,
        isDirected: !state.isDirected
      };

    case actionTypes.TOGGLE_WEIGHTED:
      return {
        ...state,
        isWeighted: !state.isWeighted
      };

    case actionTypes.SET_ANIMATION_SPEED:
      return {
        ...state,
        animationSpeed: action.payload
      };

    case actionTypes.SET_RUNNING:
      return {
        ...state,
        isRunning: action.payload
      };

    case actionTypes.SET_PENDING_EDGE:
      return {
        ...state,
        pendingEdge: action.payload
      };

    case actionTypes.SHOW_WEIGHT_MODAL:
      return {
        ...state,
        showWeightModal: true
      };

    case actionTypes.HIDE_WEIGHT_MODAL:
      return {
        ...state,
        showWeightModal: false,
        pendingEdge: null
      };

    case actionTypes.UPDATE_NODE:
      return {
        ...state,
        nodes: state.nodes.map(node =>
          node.id === action.payload.id ? { ...node, ...action.payload.updates } : node
        )
      };

    case actionTypes.RESET_GRAPH:
      return {
        ...state,
        nodes: state.nodes.map(node => ({
          ...node,
          state: 'default',
          visited: false,
          distance: Infinity,
          parent: null,
          key: Infinity,
          inMST: false
        })),
        edges: state.edges.map(edge => ({
          ...edge,
          state: 'default'
        })),
        selectedNode: null
      };

    case actionTypes.CLEAR_GRAPH:
      return {
        ...state,
        nodes: [],
        edges: [],
        nodeCounter: 0,
        startNode: null,
        endNode: null,
        selectedNode: null
      };

    case actionTypes.GENERATE_RANDOM_GRAPH:
      return {
        ...state,
        nodes: action.payload.nodes,
        edges: action.payload.edges,
        nodeCounter: action.payload.nodeCounter
      };

    case actionTypes.STEP_EXPLAINER_START:
      return {
        ...state,
        stepExplainer: {
          ...state.stepExplainer,
          isActive: true,
          steps: [],
          currentAlgorithm: action.payload
        }
      };

    case actionTypes.STEP_EXPLAINER_ADD_STEP:
      return {
        ...state,
        stepExplainer: {
          ...state.stepExplainer,
          steps: [...state.stepExplainer.steps, action.payload]
        }
      };

    case actionTypes.STEP_EXPLAINER_CLEAR:
      return {
        ...state,
        stepExplainer: {
          ...state.stepExplainer,
          steps: [],
          currentAlgorithm: null
        }
      };

    case actionTypes.STEP_EXPLAINER_TOGGLE:
      return {
        ...state,
        stepExplainer: {
          ...state.stepExplainer,
          isActive: !state.stepExplainer.isActive
        }
      };

    case actionTypes.STEP_EXPLAINER_MINIMIZE:
      return {
        ...state,
        stepExplainer: {
          ...state.stepExplainer,
          isMinimized: !state.stepExplainer.isMinimized
        }
      };

    default:
      return state;
  }
};

// Provider component
export const GraphProvider = ({ children }) => {
  const [state, dispatch] = useReducer(graphReducer, initialState);

  // Action creators
  const actions = {
    addNode: useCallback((node) => {
      dispatch({ type: actionTypes.ADD_NODE, payload: node });
    }, []),

    addEdge: useCallback((edge) => {
      dispatch({ type: actionTypes.ADD_EDGE, payload: edge });
    }, []),

    setTool: useCallback((tool) => {
      dispatch({ type: actionTypes.SET_TOOL, payload: tool });
    }, []),

    setSelectedNode: useCallback((node) => {
      dispatch({ type: actionTypes.SET_SELECTED_NODE, payload: node });
    }, []),

    setStartNode: useCallback((node) => {
      dispatch({ type: actionTypes.SET_START_NODE, payload: node });
    }, []),

    setEndNode: useCallback((node) => {
      dispatch({ type: actionTypes.SET_END_NODE, payload: node });
    }, []),

    setHoveredNode: useCallback((node) => {
      dispatch({ type: actionTypes.SET_HOVERED_NODE, payload: node });
    }, []),

    setDraggedNode: useCallback((node) => {
      dispatch({ type: actionTypes.SET_DRAGGED_NODE, payload: node });
    }, []),

    setAlgorithm: useCallback((algorithm) => {
      dispatch({ type: actionTypes.SET_ALGORITHM, payload: algorithm });
    }, []),

    toggleDirected: useCallback(() => {
      dispatch({ type: actionTypes.TOGGLE_DIRECTED });
    }, []),

    toggleWeighted: useCallback(() => {
      dispatch({ type: actionTypes.TOGGLE_WEIGHTED });
    }, []),

    setAnimationSpeed: useCallback((speed) => {
      dispatch({ type: actionTypes.SET_ANIMATION_SPEED, payload: speed });
    }, []),

    setRunning: useCallback((running) => {
      dispatch({ type: actionTypes.SET_RUNNING, payload: running });
    }, []),

    setPendingEdge: useCallback((edge) => {
      dispatch({ type: actionTypes.SET_PENDING_EDGE, payload: edge });
    }, []),

    showWeightModal: useCallback(() => {
      dispatch({ type: actionTypes.SHOW_WEIGHT_MODAL });
    }, []),

    hideWeightModal: useCallback(() => {
      dispatch({ type: actionTypes.HIDE_WEIGHT_MODAL });
    }, []),

    updateNode: useCallback((id, updates) => {
      dispatch({ type: actionTypes.UPDATE_NODE, payload: { id, updates } });
    }, []),

    resetGraph: useCallback(() => {
      dispatch({ type: actionTypes.RESET_GRAPH });
    }, []),

    clearGraph: useCallback(() => {
      dispatch({ type: actionTypes.CLEAR_GRAPH });
    }, []),

    generateRandomGraph: useCallback((graphData) => {
      dispatch({ type: actionTypes.GENERATE_RANDOM_GRAPH, payload: graphData });
    }, []),

    stepExplainerStart: useCallback((algorithm) => {
      dispatch({ type: actionTypes.STEP_EXPLAINER_START, payload: algorithm });
    }, []),

    stepExplainerAddStep: useCallback((step) => {
      dispatch({ type: actionTypes.STEP_EXPLAINER_ADD_STEP, payload: step });
    }, []),

    stepExplainerClear: useCallback(() => {
      dispatch({ type: actionTypes.STEP_EXPLAINER_CLEAR });
    }, []),

    stepExplainerToggle: useCallback(() => {
      dispatch({ type: actionTypes.STEP_EXPLAINER_TOGGLE });
    }, []),

    stepExplainerMinimize: useCallback(() => {
      dispatch({ type: actionTypes.STEP_EXPLAINER_MINIMIZE });
    }, [])
  };

  return (
    <GraphContext.Provider value={{ state, actions }}>
      {children}
    </GraphContext.Provider>
  );
};

// Custom hook to use the context
export const useGraph = () => {
  const context = useContext(GraphContext);
  if (!context) {
    throw new Error('useGraph must be used within a GraphProvider');
  }
  return context;
};

export { actionTypes };
