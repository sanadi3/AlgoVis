import React from 'react';
import styled from 'styled-components';
import { GraphProvider } from './context/GraphContext';
import GraphVisualizer from './components/GraphVisualizer';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import StatusBar from './components/StatusBar';
import WeightModal from './components/WeightModal';
import StepExplainer from './components/StepExplainer';

const AppContainer = styled.div`
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  height: 100vh;
  background: #f5f7fa;
  overflow: hidden;
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fafbfc;
`;

const CanvasContainer = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
`;

function App() {
  return (
    <GraphProvider>
      <AppContainer>
        <Sidebar />
        <Main>
          <Toolbar />
          <CanvasContainer>
            <GraphVisualizer />
          </CanvasContainer>
          <StatusBar />
        </Main>
        <WeightModal />
        <StepExplainer />
      </AppContainer>
    </GraphProvider>
  );
}

export default App;
