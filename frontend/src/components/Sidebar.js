import React from 'react';
import styled from 'styled-components';
import { useGraph } from '../context/GraphContext';

const SidebarContainer = styled.aside`
  width: 320px;
  background: #fff;
  box-shadow: 2px 0 8px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  z-index: 10;
`;

const SidebarHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid #e1e7ed;
  
  h1 {
    font-size: 24px;
    color: #1a1a1a;
    margin-bottom: 8px;
  }
  
  p {
    color: #666;
    font-size: 14px;
  }
`;

const SidebarContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

const ControlSection = styled.div`
  margin-bottom: 24px;
  
  h3 {
    font-size: 14px;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
  }
`;

const Button = styled.button`
  display: block;
  width: 100%;
  padding: 12px 16px;
  margin-bottom: 8px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  
  &.btn-primary {
    background: #3b82f6;
    color: white;
    
    &:hover {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
  }
  
  &.btn-secondary {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #e5e7eb;
    
    &:hover {
      background: #e5e7eb;
    }
  }
  
  &.btn-danger {
    background: #ef4444;
    color: white;
    
    &:hover {
      background: #dc2626;
    }
  }
  
  &.algo-btn {
    position: relative;
    padding-left: 40px;
    
    &::before {
      content: '';
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #9ca3af;
    }
    
    &.active::before {
      background: #3b82f6;
    }
  }
`;

const SpeedControl = styled.div`
  margin-top: 16px;
  
  label {
    display: block;
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
  }
`;

const SpeedSlider = styled.input`
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #e5e7eb;
  border-radius: 3px;
  outline: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    background: #3b82f6;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
`;

const InfoPanel = styled.div`
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
  font-size: 14px;
  color: #666;
  
  strong {
    color: #374151;
  }
`;

const Sidebar = () => {
  const { state, actions } = useGraph();
  const { currentAlgorithm, isDirected, isWeighted, animationSpeed } = state;

  const handleAlgorithmSelect = (algorithm) => {
    actions.setAlgorithm(algorithm);
  };

  const handleRunAlgorithm = () => {
    if (!currentAlgorithm) {
      alert('Please select an Algorithm first');
      return;
    }
    // Algorithm running logic will be implemented later
    alert('Algorithm running feature coming soon!');
  };

  const handleReset = () => {
    actions.resetGraph();
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear the entire graph?')) {
      actions.clearGraph();
    }
  };

  const handleGenerateRandom = () => {
    // Random graph generation logic will be implemented later
    alert('Random graph generation coming soon!');
  };

  const handleToggleDirected = () => {
    actions.toggleDirected();
  };

  const handleToggleWeighted = () => {
    actions.toggleWeighted();
  };

  const handleSpeedChange = (e) => {
    actions.setAnimationSpeed(parseInt(e.target.value));
  };

  return (
    <SidebarContainer>
      <SidebarHeader>
        <h1>Graph Visualizer</h1>
        <p>Interactive algorithm visualization tool</p>
      </SidebarHeader>
      
      <SidebarContent>
        <ControlSection>
          <h3>Graph Algorithms</h3>
          <Button 
            className={`btn btn-secondary algo-btn ${currentAlgorithm === 'dijkstra' ? 'active' : ''}`}
            onClick={() => handleAlgorithmSelect('dijkstra')}
          >
            Dijkstra's Shortest Path
          </Button>
          <Button 
            className={`btn btn-secondary algo-btn ${currentAlgorithm === 'bfs' ? 'active' : ''}`}
            onClick={() => handleAlgorithmSelect('bfs')}
          >
            Breadth-First Search
          </Button>
          <Button 
            className={`btn btn-secondary algo-btn ${currentAlgorithm === 'dfs' ? 'active' : ''}`}
            onClick={() => handleAlgorithmSelect('dfs')}
          >
            Depth-First Search
          </Button>
          <Button 
            className={`btn btn-secondary algo-btn ${currentAlgorithm === 'prim' ? 'active' : ''}`}
            onClick={() => handleAlgorithmSelect('prim')}
          >
            Prim's MST
          </Button>
          <Button 
            className={`btn btn-secondary algo-btn ${currentAlgorithm === 'kruskal' ? 'active' : ''}`}
            onClick={() => handleAlgorithmSelect('kruskal')}
          >
            Kruskal's MST
          </Button>
          <Button 
            className={`btn btn-secondary algo-btn ${currentAlgorithm === 'bellman-ford' ? 'active' : ''}`}
            onClick={() => handleAlgorithmSelect('bellman-ford')}
          >
            Bellman-Ford
          </Button>
        </ControlSection>

        <ControlSection>
          <h3>Controls</h3>
          <Button className="btn btn-primary" onClick={handleRunAlgorithm}>
            <span>▶</span> Run Algorithm
          </Button>
          <Button className="btn btn-secondary">
            Step Forward
          </Button>
          <Button className="btn btn-secondary" onClick={handleReset}>
            Reset
          </Button>
          <Button className="btn btn-danger" onClick={handleClear}>
            Clear Graph
          </Button>

          <SpeedControl>
            <label htmlFor="speedSlider">Animation Speed</label>
            <SpeedSlider
              type="range"
              id="speedSlider"
              min="1"
              max="10"
              value={animationSpeed}
              onChange={handleSpeedChange}
            />
          </SpeedControl>
        </ControlSection>

        <ControlSection>
          <h3>Graph Options</h3>
          <Button className="btn btn-secondary" onClick={handleGenerateRandom}>
            Generate Random Graph
          </Button>
          <Button className="btn btn-secondary" onClick={handleToggleDirected}>
            {isDirected ? 'Make Undirected' : 'Make Directed'}
          </Button>
          <Button className="btn btn-secondary" onClick={handleToggleWeighted}>
            {isWeighted ? 'Make Unweighted' : 'Make Weighted'}
          </Button>
          <Button className="btn btn-secondary">
            Export Graph
          </Button>
          <Button className="btn btn-secondary">
            Import Graph
          </Button>
        </ControlSection>

        <InfoPanel>
          <strong>Instructions:</strong><br />
          • Click to add nodes<br />
          • Use Edge tool to connect nodes<br />
          • Select an algorithm and click Run<br />
          • Right-click nodes to set start/end
        </InfoPanel>
      </SidebarContent>
    </SidebarContainer>
  );
};

export default Sidebar;
