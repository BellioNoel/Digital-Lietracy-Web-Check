import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { LoadingProvider } from './context/LoadingContext';
import { BrowserRouter as Router } from 'react-router-dom'; // Import BrowserRouter

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router> {/* Wrap LoadingProvider with Router */}
      <LoadingProvider>
        <App />
      </LoadingProvider>
    </Router>
  </React.StrictMode>
);

reportWebVitals();