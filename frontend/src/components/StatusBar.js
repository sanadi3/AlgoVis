import React from 'react';
import styled from 'styled-components';
import { useGraph } from '../context/GraphContext';

const StatusBarContainer = styled.div`
  background: #1f2937;
  color: #e5e7eb;
  padding: 8px 20px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 20px;
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusIndicator = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
`;

const StatusBar = () => {
  const { state } = useGraph();
  const { nodes, edges, isRunning, currentAlgorithm } = state;

  return (
    <StatusBarContainer>
      <StatusItem>
        <StatusIndicator />
        <span>{isRunning ? 'Running' : 'Ready'}</span>
      </StatusItem>
      <StatusItem>
        Nodes: <span>{nodes.length}</span>
      </StatusItem>
      <StatusItem>
        Edges: <span>{edges.length}</span>
      </StatusItem>
      <StatusItem>
        Algorithm: <span>{currentAlgorithm || 'None'}</span>
      </StatusItem>
    </StatusBarContainer>
  );
};

export default StatusBar;
