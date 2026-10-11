// src/hooks/useSocket.js — Custom Hook to consume SocketContext (Experiment 8)
import { useContext } from 'react';
import { SocketContext } from '../context/SocketContext';

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
