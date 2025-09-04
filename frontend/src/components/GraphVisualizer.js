import React, { useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useGraph } from '../context/GraphContext';

const Canvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  cursor: crosshair;
  
  &.connecting {
    cursor: pointer;
  }
`;

const GraphVisualizer = () => {
  const canvasRef = useRef(null);
  const { state, actions } = useGraph();
  
  const {
    nodes,
    edges,
    currentTool,
    selectedNode,
    startNode,
    endNode,
    hoveredNode,
    draggedNode,
    isDirected,
    isWeighted,
    isRunning
  } = state;

  // Colors and styling
  const nodeRadius = 25;
  const colors = {
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
  };

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      draw();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges first
    edges.forEach(edge => drawEdge(ctx, edge));
    // Then draw nodes on top
    nodes.forEach(node => drawNode(ctx, node));
  }, [nodes, edges, startNode, endNode, hoveredNode, selectedNode, isDirected, isWeighted, isRunning]);

  // Draw node
  const drawNode = useCallback((ctx, node) => {
    let color = colors.node;

    if (node === startNode) color = colors.nodeStart;
    else if (node === endNode) color = colors.nodeEnd;
    else if (node.state === 'visited') color = colors.nodeVisited;
    else if (node.state === 'current') color = colors.nodeCurrent;
    else if (node.state === 'path') color = colors.nodePath;
    else if (node === hoveredNode) color = colors.nodeHover;
    else if (node === selectedNode) color = colors.nodeSelected;

    // Draw circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw name
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.name, node.x, node.y);

    // Draw distance
    if (node.distance !== Infinity && node.distance !== null && isRunning) {
      ctx.fillStyle = colors.weight;
      ctx.font = '12px Arial';
      ctx.fillText(node.distance.toString(), node.x, node.y + nodeRadius + 15);
    }
  }, [startNode, endNode, hoveredNode, selectedNode, isRunning, colors]);

  // Draw edge
  const drawEdge = useCallback((ctx, edge) => {
    const { from, to, weight } = edge;

    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const startX = from.x + Math.cos(angle) * nodeRadius;
    const startY = from.y + Math.sin(angle) * nodeRadius;
    const endX = to.x - Math.cos(angle) * nodeRadius;
    const endY = to.y - Math.sin(angle) * nodeRadius;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = edge.state === 'path' ? colors.edgePath :
      edge.state === 'highlight' ? colors.edgeHighlight : colors.edge;
    ctx.lineWidth = edge.state === 'path' ? 3 : 2;
    ctx.stroke();

    // Directed graphs
    if (isDirected) {
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

    // Weight labels
    if (isWeighted) {
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(midX - 15, midY - 10, 30, 20);

      ctx.fillStyle = colors.weight;
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(weight.toString(), midX, midY);
    }
  }, [isDirected, isWeighted, colors]);

  // Get node at position
  const getNodeAt = useCallback((x, y) => {
    return nodes.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= nodeRadius;
    });
  }, [nodes]);

  // Add node
  const addNode = useCallback((x, y) => {
    const name = String.fromCharCode(65 + state.nodeCounter);
    const newNode = {
      id: state.nodeCounter,
      name,
      x,
      y,
      visited: false,
      distance: Infinity,
      parent: null,
      state: 'default'
    };
    actions.addNode(newNode);
  }, [state.nodeCounter, actions]);

  // Add edge
  const addEdge = useCallback((from, to, weight) => {
    const exists = edges.some(e =>
      (e.from === from && e.to === to) ||
      (!isDirected && e.from === to && e.to === from)
    );

    if (!exists) {
      const newEdge = {
        from, to,
        weight: weight || 1,
        state: 'default'
      };
      actions.addEdge(newEdge);
    }
  }, [edges, isDirected, actions]);

  // Canvas click handler
  const handleCanvasClick = useCallback((e) => {
    if (isRunning) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === 'node') {
      addNode(x, y);
    } else if (currentTool === 'edge') {
      const clickedNode = getNodeAt(x, y);
      if (clickedNode) {
        if (!selectedNode) {
          actions.setSelectedNode(clickedNode);
        } else if (selectedNode !== clickedNode) {
          if (isWeighted) {
            actions.setPendingEdge({ from: selectedNode, to: clickedNode });
            actions.showWeightModal();
          } else {
            addEdge(selectedNode, clickedNode, 1);
          }
          actions.setSelectedNode(null);
        }
      } else {
        actions.setSelectedNode(null);
      }
    }
  }, [isRunning, currentTool, addNode, getNodeAt, selectedNode, isWeighted, addEdge]);

  // Right click handler
  const handleRightClick = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedNode = getNodeAt(x, y);
    if (clickedNode) {
      if (!startNode || (startNode && !endNode && clickedNode !== startNode)) {
        actions.setStartNode(clickedNode);
        actions.setEndNode(null);
      } else {
        actions.setEndNode(clickedNode);
      }
    }
  }, [getNodeAt, startNode, endNode]);

  // Mouse handlers
  const handleMouseDown = useCallback((e) => {
    if (currentTool !== 'move') return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const node = getNodeAt(x, y);
    if (node) {
      actions.setDraggedNode(node);
      canvas.style.cursor = 'grabbing';
    }
  }, [currentTool, getNodeAt]);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (draggedNode && currentTool === 'move') {
      actions.updateNode(draggedNode.id, { x, y });
    } else {
      const hovered = getNodeAt(x, y);
      if (hovered !== hoveredNode) {
        actions.setHoveredNode(hovered);
      }
    }
  }, [draggedNode, currentTool, getNodeAt, hoveredNode]);

  const handleMouseUp = useCallback(() => {
    actions.setDraggedNode(null);
    if (currentTool === 'move') {
      const canvas = canvasRef.current;
      canvas.style.cursor = 'grab';
    }
  }, [currentTool, actions]);

  // Redraw when dependencies change
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <Canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      onContextMenu={handleRightClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={currentTool === 'edge' ? 'connecting' : ''}
    />
  );
};

export default GraphVisualizer;
