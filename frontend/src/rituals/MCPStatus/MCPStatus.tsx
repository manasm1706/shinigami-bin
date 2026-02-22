import React, { useState, useEffect } from 'react';
import { getMCPServerStatus } from '../../services/weatherOmen';
import './MCPStatus.css';

interface MCPStatusProps {
  className?: string;
}

const MCPStatus: React.FC<MCPStatusProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<{
    available: boolean;
    capabilities: string[];
    version?: string;
    lastTest?: string;
    loading: boolean;
    error?: string;
  }>({
    available: false,
    capabilities: [],
    loading: true
  });

  useEffect(() => {
    const checkMCPStatus = async () => {
      try {
        setStatus(prev => ({ ...prev, loading: true, error: undefined }));
        
        const mcpStatus = await getMCPServerStatus();
        
        setStatus({
          ...mcpStatus,
          loading: false
        });
      } catch (error) {
        setStatus(prev => ({
          ...prev,
          loading: false,
          available: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    };

    checkMCPStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(checkMCPStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setStatus(prev => ({ ...prev, loading: true }));
    // Trigger useEffect to re-run
    window.location.reload();
  };

  return (
    <div className={`mcp-status ${className}`}>
      <div className="mcp-header">
        <h4 className="mcp-title">
          🔗 MCP Server Status
        </h4>
        <button 
          className="refresh-button"
          onClick={handleRefresh}
          disabled={status.loading}
        >
          {status.loading ? '⟳' : '↻'}
        </button>
      </div>
      
      <div className="mcp-info">
        <div className={`status-indicator ${status.available ? 'online' : 'offline'}`}>
          <span className="status-dot">●</span>
          <span className="status-text">
            {status.loading ? 'Checking...' : status.available ? 'Online' : 'Offline'}
          </span>
        </div>
        
        {status.error && (
          <div className="error-message">
            ⚠ {status.error}
          </div>
        )}
        
        {status.available && (
          <div className="mcp-details">
            {status.version && (
              <div className="detail-item">
                <span className="detail-label">Version:</span>
                <span className="detail-value">{status.version}</span>
              </div>
            )}
            
            <div className="detail-item">
              <span className="detail-label">Capabilities:</span>
              <div className="capabilities-list">
                {status.capabilities.map((capability, index) => (
                  <span key={index} className="capability-tag">
                    {capability.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
            
            {status.lastTest && (
              <div className="detail-item">
                <span className="detail-label">Last Test:</span>
                <span className="detail-value">
                  {new Date(status.lastTest).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mcp-description">
        <p>Weather Omen MCP Server provides real-time weather data and mystical interpretation services.</p>
      </div>
    </div>
  );
};

export default MCPStatus;