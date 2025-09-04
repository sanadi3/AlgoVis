import React, { useState } from 'react';
import styled from 'styled-components';
import { useGraph } from '../context/GraphContext';

const ModalOverlay = styled.div`
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  align-items: center;
  justify-content: center;
  
  &.active {
    display: flex;
  }
`;

const ModalContent = styled.div`
  background: white;
  padding: 32px;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
`;

const ModalHeader = styled.div`
  margin-bottom: 20px;
  
  h2 {
    font-size: 24px;
    margin-bottom: 8px;
  }
`;

const WeightInput = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 16px;
  margin-bottom: 16px;
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
`;

const WeightModal = () => {
  const { state, actions } = useGraph();
  const { showWeightModal, pendingEdge } = state;
  const [weight, setWeight] = useState(1);

  const handleConfirm = () => {
    if (pendingEdge) {
      // Add edge with weight
      const newEdge = {
        from: pendingEdge.from,
        to: pendingEdge.to,
        weight: weight || 1,
        state: 'default'
      };
      actions.addEdge(newEdge);
    }
    actions.hideWeightModal();
    setWeight(1);
  };

  const handleCancel = () => {
    actions.hideWeightModal();
    setWeight(1);
  };

  if (!showWeightModal) return null;

  return (
    <ModalOverlay className="modal active">
      <ModalContent>
        <ModalHeader>
          <h2>Set Edge Weight</h2>
        </ModalHeader>
        <WeightInput
          type="number"
          placeholder="Enter weight (default: 1)"
          value={weight}
          onChange={(e) => setWeight(parseInt(e.target.value) || 1)}
        />
        <Button className="btn btn-primary" onClick={handleConfirm}>
          Confirm
        </Button>
        <Button className="btn btn-secondary" onClick={handleCancel}>
          Cancel
        </Button>
      </ModalContent>
    </ModalOverlay>
  );
};

export default WeightModal;
