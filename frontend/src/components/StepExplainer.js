import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

// Draggable Panel Component
const DraggablePanel = ({ children, className, onDragStart, onDragEnd }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [initialMousePos, setInitialMousePos] = useState({ x: 0, y: 0 });
  const panelRef = useRef(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    setPosition({ x: rect.left, y: rect.top });
  }, []);

  const handleMouseDown = (e) => {
    if (e.target.matches('button, input, select, textarea, a') ||
        e.target.closest('button, input, select, textarea, a')) {
      return;
    }

    e.preventDefault();
    setIsDragging(true);
    setInitialMousePos({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });

    if (onDragStart) onDragStart();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    e.preventDefault();
    const newX = e.clientX - initialMousePos.x;
    const newY = e.clientY - initialMousePos.y;

    // Apply bounds checking
    const padding = 20;
    const panelWidth = panelRef.current.offsetWidth;
    const panelHeight = panelRef.current.offsetHeight;

    const boundedX = Math.max(-panelWidth + padding,
      Math.min(newX, window.innerWidth - padding));
    const boundedY = Math.max(0,
      Math.min(newY, window.innerHeight - padding));

    setPosition({ x: boundedX, y: boundedY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (onDragEnd) onDragEnd();
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  return (
    <div
      ref={panelRef}
      className={`${className} ${isDragging ? 'dragging' : ''}`}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        transform: 'translate3d(0, 0, 0)',
        willChange: isDragging ? 'transform' : 'auto'
      }}
      onMouseDown={handleMouseDown}
    >
      {children}
    </div>
  );
};

// Styled Components
const ExplanationPanel = styled(DraggablePanel)`
  bottom: 20px;
  right: 20px;
  width: 400px;
  max-height: 300px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: none;
  flex-direction: column;
  overflow: hidden;
  transition: box-shadow 0.3s ease, opacity 0.3s ease;
  resize: both;
  min-width: 300px;
  min-height: 200px;
  max-width: 600px;
  max-height: 80vh;
  
  &.active {
    display: flex;
  }
  
  &.dragging {
    opacity: 0.95;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    cursor: move !important;
  }
  
  &.minimized {
    max-height: none;
    height: auto !important;
    resize: none;
  }
`;

const ExplanationHeader = styled.div`
  background: #1f2937;
  color: white;
  padding: 12px 20px;
  padding-left: 40px;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
  position: relative;
  user-select: none;
  -webkit-user-select: none;
  
  &::before {
    content: '⋮⋮';
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%) rotate(90deg);
    color: rgba(255, 255, 255, 0.4);
    font-size: 14px;
    letter-spacing: -2px;
  }
  
  &:hover {
    background: #374151;
  }
  
  h3 {
    margin: 0;
    font-size: 16px;
    flex: 1;
  }
`;

const MinimizeButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 20px;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
  margin-left: 8px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  &::before {
    content: '▲';
  }
  
  .minimized &::before {
    content: '▼';
  }
`;

const ExplanationContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  min-height: 0;
  
  .minimized & {
    display: none;
  }
`;

const StepItem = styled.div`
  margin-bottom: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #e5e7eb;
  transition: all 0.2s;
  
  &.current {
    background: #eff6ff;
    border-left-color: #3b82f6;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
  }
  
  &.completed {
    opacity: 0.6;
  }
  
  &.new {
    animation: slideIn 0.3s ease;
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

const StepNumber = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 4px;
  
  .current & {
    color: #3b82f6;
  }
`;

const StepText = styled.div`
  font-size: 14px;
  color: #374151;
  margin-bottom: 8px;
  line-height: 1.5;
`;

const StepCode = styled.div`
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
  font-size: 12px;
  background: #1f2937;
  color: #e5e7eb;
  padding: 8px 12px;
  border-radius: 6px;
  overflow-x: auto;
  white-space: pre;
`;

const StepDetails = styled.div`
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
`;

const StepDetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
`;

const StepDetailValue = styled.span`
  font-weight: 500;
  color: #374151;
`;

const PseudocodePanel = styled(DraggablePanel)`
  top: 80px;
  right: 20px;
  width: 350px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  z-index: 999;
  display: none;
  max-height: 400px;
  overflow: hidden;
  transition: box-shadow 0.3s ease, opacity 0.3s ease;
  
  &.active {
    display: block;
  }
  
  &.dragging {
    opacity: 0.95;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    cursor: move !important;
  }
`;

const PseudocodeHeader = styled.div`
  background: #f3f4f6;
  padding: 12px 16px;
  padding-left: 36px;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
  font-size: 14px;
  color: #374151;
  cursor: move;
  position: relative;
  user-select: none;
  -webkit-user-select: none;
  
  &::before {
    content: '⋮⋮';
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%) rotate(90deg);
    color: rgba(55, 65, 81, 0.4);
    font-size: 12px;
    letter-spacing: -2px;
  }
  
  &:hover {
    background: #e5e7eb;
  }
`;

const PseudocodeContent = styled.div`
  padding: 16px;
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  overflow-y: auto;
  max-height: 350px;
`;

const PseudocodeLine = styled.div`
  padding: 2px 0;
  transition: background 0.3s;
  
  &.active {
    background: #fef3c7;
    padding: 2px 8px;
    margin: 0 -8px;
    border-radius: 4px;
    font-weight: 600;
  }
  
  &.completed {
    color: #9ca3af;
  }
`;

const StepCounter = styled(DraggablePanel)`
  bottom: 20px;
  right: 440px;
  background: #3b82f6;
  color: white;
  padding: 12px 20px;
  border-radius: 30px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 2px 10px rgba(59, 130, 246, 0.3);
  display: none;
  align-items: center;
  gap: 8px;
  z-index: 998;
  cursor: move;
  user-select: none;
  -webkit-user-select: none;
  transition: box-shadow 0.3s ease, opacity 0.3s ease;
  
  &.active {
    display: flex;
  }
  
  &.dragging {
    opacity: 0.95;
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.5);
  }
  
  &:hover {
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
  }
`;

const StepCounterNumber = styled.span`
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
`;

const ToggleButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  box-shadow: 0 2px 10px rgba(59, 130, 246, 0.3);
  z-index: 1001;
  transition: all 0.2s;
  
  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }
  
  &.hidden {
    display: none;
  }
`;

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
  }
}

const StepExplainer = () => {
  const { state, actions } = useGraph();
  const { stepExplainer } = state;
  const { isActive, isMinimized, steps, currentAlgorithm } = stepExplainer;

  const algorithms = {
    dijkstra: new DijkstraExplainer(),
    // Add other algorithms here
  };

  const toggle = () => {
    actions.stepExplainerToggle();
  };

  const toggleMinimize = () => {
    actions.stepExplainerMinimize();
  };

  const startAlgorithm = (algorithmName) => {
    actions.stepExplainerClear();
    actions.stepExplainerStart(algorithms[algorithmName]);
    if (!isActive) {
      actions.stepExplainerToggle();
    }
  };

  const addStep = (type, data) => {
    if (!currentAlgorithm) return;

    const step = currentAlgorithm.generateStep(type, data);
    if (!step) return;

    actions.stepExplainerAddStep(step);
  };

  const clear = () => {
    actions.stepExplainerClear();
  };

  const renderStep = (step, index) => {
    const isCurrent = index === steps.length - 1;

    return (
      <StepItem key={index} className={`${isCurrent ? 'current' : ''} new`}>
        <StepNumber>Step {index + 1}</StepNumber>
        <StepText>{step.text}</StepText>
        {step.code && <StepCode>{step.code}</StepCode>}
        {step.details && (
          <StepDetails>
            {Object.entries(step.details).map(([key, value]) => (
              <StepDetailItem key={key}>
                <span>{key}:</span>
                <StepDetailValue>{value}</StepDetailValue>
              </StepDetailItem>
            ))}
          </StepDetails>
        )}
      </StepItem>
    );
  };

  const renderPseudocode = () => {
    if (!currentAlgorithm || !currentAlgorithm.pseudocode) return null;

    return currentAlgorithm.pseudocode
      .split('\n')
      .map((line, index) => (
        <PseudocodeLine key={index} data-line={index}>
          {line}
        </PseudocodeLine>
      ));
  };

  return (
    <>
      <ExplanationPanel
        className={`${isActive ? 'active' : ''} ${isMinimized ? 'minimized' : ''}`}
      >
        <ExplanationHeader>
          <h3>Algorithm Steps</h3>
          <MinimizeButton onClick={toggleMinimize} />
        </ExplanationHeader>
        <ExplanationContent>
          {steps.map((step, index) => renderStep(step, index))}
        </ExplanationContent>
      </ExplanationPanel>

      <PseudocodePanel className={isActive ? 'active' : ''}>
        <PseudocodeHeader>
          <span id="algorithm-name">
            {currentAlgorithm ? 'Algorithm' : 'Algorithm'} Pseudocode
          </span>
        </PseudocodeHeader>
        <PseudocodeContent>
          {renderPseudocode()}
        </PseudocodeContent>
      </PseudocodePanel>

      <StepCounter className={isActive ? 'active' : ''}>
        <span>Step</span>
        <StepCounterNumber>
          <span id="current-step">{steps.length}</span> / <span id="total-steps">{steps.length}</span>
        </StepCounterNumber>
      </StepCounter>

      <ToggleButton
        className={isActive ? 'hidden' : ''}
        onClick={toggle}
      >
        {isActive ? 'Hide Steps' : 'Show Steps'}
      </ToggleButton>
    </>
  );
};

export default StepExplainer;
