import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
  width?: string;
  height?: string;
  lines?: number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '14px',
  lines = 1,
  className = '',
}) => {
  if (lines > 1) {
    return (
      <div className={`skeleton-group ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{
              width: i === lines - 1 ? '60%' : width,
              height,
            }}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
};

export const MessageSkeleton: React.FC = () => (
  <div className="message-skeleton" aria-hidden="true">
    <div className="ms-header">
      <Skeleton width="80px" height="12px" />
      <Skeleton width="50px" height="10px" />
    </div>
    <Skeleton lines={2} height="13px" />
  </div>
);

export const ConversationSkeleton: React.FC = () => (
  <div className="conversation-skeleton" aria-hidden="true">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="cs-item">
        <Skeleton width="16px" height="16px" />
        <Skeleton width={`${60 + Math.random() * 30}%`} height="12px" />
      </div>
    ))}
  </div>
);

export default Skeleton;
