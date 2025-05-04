import React from 'react';

const LoadingSpinner = () => {
  return (
    <div style={{
      position: 'fixed', // Cover the entire screen
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000, // Ensure it's on top of everything
    }}>
      <div style={{
        border: '8px solid #f3f3f3', /* Light grey */
        borderTop: '8px solid #3498db', /* Blue */
        borderRadius: '50%',
        width: '60px',
        height: '60px',
        animation: 'spin 2s linear infinite',
      }}></div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingSpinner;