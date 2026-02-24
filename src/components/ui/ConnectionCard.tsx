import type React from 'react';
import ActionSection from './ActionSection';

type ConnectionState = {
  content: React.ReactNode;
  actions: React.ReactNode;
};

type ConnectionStatesConfig = {
  connected: ConnectionState;
  disconnected: ConnectionState;
};

type ConnectionCardProps = {
  isConnected: boolean;
  states: ConnectionStatesConfig;
  className?: string;
};

export default function ConnectionCard({
  isConnected,
  states,
  className = '',
}: ConnectionCardProps) {
  const currentState = isConnected ? states.connected : states.disconnected;

  return (
    <ActionSection
      content={currentState.content}
      actions={currentState.actions}
      className={className}
    />
  );
}
