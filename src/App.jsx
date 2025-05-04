// App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Quiz from "./pages/Quiz";
import Results from "./pages/Results";
import Certificate from "./pages/Certificate";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useLoading } from './context/LoadingContext';
import LoadingSpinner from './pages/LoadingSpinner';

const App = () => {
  const { isLoading, hideLoading } = useLoading();
  const [appInitialized, setAppInitialized] = useState(false);

  useEffect(() => {
    // Simulate app initialization (e.g., checking auth, loading config)
    const initializeApp = async () => {
      // Add any initialization logic here (e.g., fetching config)
      await new Promise(resolve => setTimeout(resolve, 250)); // Simulate delay
      setAppInitialized(true);
      hideLoading(); // Hide loading spinner after initialization
    };

    initializeApp();
  }, [hideLoading]);

  if (isLoading || !appInitialized) { // Use isLoading here!
    return (
      <>
        <LoadingSpinner /> {/* Keep the loading spinner visible */}
      </>
    );
  }

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/results" element={<Results />} />
        <Route path="/certificate" element={<Certificate />} />
      </Routes>
    </>
  );
};

export default App;