import React from 'react';
import styled from 'styled-components';
import { useGraph } from '../context/GraphContext';

const ToolbarContainer = styled.div`
  background: #fff;
  border-bottom: 1px solid #e1e7ed;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
`;

const ToolButton = styled.button`
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }
  
  &.active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const Toolbar = () => {
  const { state, actions } = useGraph();
  const { currentTool } = state;

  const handleToolSelect = (tool) => {
    actions.setTool(tool);
  };

  return (
    <ToolbarContainer>
      <ToolButton 
        className={`tool-btn ${currentTool === 'node' ? 'active' : ''}`}
        onClick={() => handleToolSelect('node')}
      >
        <svg fill="currentColor" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="8"/>
        </svg>
        Node
      </ToolButton>
      <ToolButton 
        className={`tool-btn ${currentTool === 'edge' ? 'active' : ''}`}
        onClick={() => handleToolSelect('edge')}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 20 20">
          <path d="M4 10h12m0 0l-4-4m4 4l-4 4" strokeWidth="2"/>
        </svg>
        Edge
      </ToolButton>
      <ToolButton 
        className={`tool-btn ${currentTool === 'move' ? 'active' : ''}`}
        onClick={() => handleToolSelect('move')}
      >
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
        </svg>
        Move
      </ToolButton>
    </ToolbarContainer>
  );
};

export default Toolbar;
