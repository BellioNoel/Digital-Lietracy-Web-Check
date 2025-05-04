// src/pages/Quiz.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { trackEvent } from '../utils/analytics';
import useLocalStorage from '../hooks/useLocalStorage';
import { toast } from 'react-toastify';

const allQuestions = [
  { question: "What is a strong password?", options: ["123456", "password", "T!m3$ecure@2024", "johnny"], correctAnswer: "T!m3$ecure@2024" },
  { question: "What does HTTPS stand for?", options: ["Hyper Text Transfer Protocol Secure", "High Tech Protocol System", "High Transfer Secure Port", "None"], correctAnswer: "Hyper Text Transfer Protocol Secure" },
  { question: "Which file is potentially malicious?", options: ["resume.docx", "setup.exe", "photo.jpg", "notes.txt"], correctAnswer: "setup.exe" },
  { question: "What does two-factor authentication do?", options: ["Asks for two usernames", "Adds a layer of security", "Slows login", "Tracks your location"], correctAnswer: "Adds a layer of security" },
  { question: "Which is a phishing attempt?", options: ["Email from your bank with spelling errors", "Newsletter from YouTube", "Your password manager", "A verified email"], correctAnswer: "Email from your bank with spelling errors" },
  { question: "What’s the safest way to connect to public Wi-Fi?", options: ["Directly", "VPN", "Open proxy", "Shared hotspot"], correctAnswer: "VPN" },
  { question: "Which device needs regular updates?", options: ["PC only", "Smartphones only", "All digital devices", "None"], correctAnswer: "All digital devices" },
  { question: "What is a digital footprint?", options: ["A foot scan", "Tracking apps", "Your online activity", "Your profile picture"], correctAnswer: "Your online activity" },
  { question: "Cookies on websites are used for?", options: ["Making websites faster", "Storing user data", "Buying things", "Crashing browsers"], correctAnswer: "Storing user data" },
  { question: "Strongest security for accounts?", options: ["Password only", "Email verification", "2FA", "Security questions"], correctAnswer: "2FA" },
  { question: "What’s the risk of downloading cracked software?", options: ["No risk", "Saves money", "Malware infection", "Malware infection"], correctAnswer: "Malware infection" },
  { question: "Which one is encrypted communication?", options: ["Plain text", "Email", "HTTPS", "POP3"], correctAnswer: "HTTPS" },
  { question: "Cloud storage example?", options: ["USB", "OneDrive", "CD", "SSD"], correctAnswer: "OneDrive" },
  { question: "Spam emails often ask for?", options: ["Money", "Feedback", "Survey", "Unsubscribe"], correctAnswer: "Money" },
  { question: "How often should you change passwords?", options: ["Never", "Only if hacked", "Every year", "Regularly"], correctAnswer: "Regularly" },
  { question: "What is ransomware?", options: ["Software that locks your computer and demands payment", "A type of antivirus", "A social media platform", "A search engine"], correctAnswer: "Software that locks your computer and demands payment" },
  { question: "What is a VPN?", options: ["Virtual Private Network", "Very Personal Note", "Visual Pin Number", "Voluntary Public Notice"], correctAnswer: "Virtual Private Network" },
  { question: "What is malware?", options: ["A type of antivirus", "Malicious software", "A computer game", "A social media trend"], correctAnswer: "Malicious software" },
  { question: "What is data encryption?", options: ["Converting data into a secret code", "Making data public", "Deleting data permanently", "Compressing data for storage"], correctAnswer: "Converting data into a secret code" },
  { question: "What is identity theft?", options: ["Stealing someone's physical identity", "Impersonating someone online", "Damaging someone's reputation", "Gaining unauthorized access to someone's accounts"], correctAnswer: "Impersonating someone online" },
];

const Quiz = () => {
  const navigate = useNavigate();

  // Persisted state (in localStorage)
  const [storedQuestions, setStoredQuestions] = useLocalStorage('storedQuestions', []);
  const [answers, setAnswers] = useLocalStorage('answers', []);
  const [quizProgress, setQuizProgress] = useLocalStorage('quizProgress', 0);
  const [correctAnswers, setCorrectAnswers] = useLocalStorage('correctAnswers', []);
  const [totalQuestions, setTotalQuestions] = useLocalStorage('totalQuestions', 0);

  // Transient UI state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const questionsPerStage = 4;
  const totalStages = Math.ceil(storedQuestions.length / questionsPerStage);
  const [currentStage, setCurrentStage] = useState(1);

  // One‑time initialization
  useEffect(() => {
    if (storedQuestions.length === 0) {
      setStoredQuestions(allQuestions);
      setAnswers(Array(allQuestions.length).fill(null));
      setCorrectAnswers(allQuestions.map(q => q.correctAnswer));
      setTotalQuestions(allQuestions.length);
      setQuizProgress(0);
    }
    trackEvent('page_view', 'quiz_stage_viewed', `Quiz Stage ${currentStage} Viewed`);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Log each stage view
  useEffect(() => {
    trackEvent('page_view', 'quiz_stage_viewed', `Quiz Stage ${currentStage} Viewed`);
  }, [currentStage]);

  const updateProgress = (updatedAnswers) => {
    const answeredCount = updatedAnswers.filter(a => a !== null).length;
    setQuizProgress((answeredCount / totalQuestions) * 100);
  };

  const handleOptionClick = (qIndex, optIndex) => {
    const newAnswers = [...answers];
    newAnswers[qIndex] = optIndex;
    setAnswers(newAnswers);
    updateProgress(newAnswers);

    trackEvent(
      'answer_question',
      'question_answered',
      `Question ${qIndex + 1}, Option ${optIndex}`
    );
  };

  const areAllAnsweredInStage = () => {
    const start = currentQuestionIndex;
    const end = Math.min(start + questionsPerStage, totalQuestions);
    for (let i = start; i < end; i++) {
      if (answers[i] === null) return false;
    }
    return true;
  };

  const handleNextClick = () => {
    if (!areAllAnsweredInStage()) {
      toast.warn('Please answer all questions before proceeding.');
      return;
    }

    const nextIndex = currentQuestionIndex + questionsPerStage;
    if (nextIndex >= totalQuestions) {
      trackEvent('quiz_completed', 'quiz_completed', 'User Completed Quiz');
      navigate('/results');
    } else {
      setCurrentQuestionIndex(nextIndex);
      setCurrentStage(Math.ceil((nextIndex + 1) / questionsPerStage));
      trackEvent('stage_completed', 'stage_completed', `Stage ${currentStage} Completed`);
    }
  };

  const handlePreviousClick = () => {
    const prevIndex = currentQuestionIndex - questionsPerStage;
    if (prevIndex >= 0) {
      setCurrentQuestionIndex(prevIndex);
      setCurrentStage(Math.ceil((prevIndex + 1) / questionsPerStage));
    }
  };

  // Slice out this stage’s questions for rendering
  const currentQuestions = storedQuestions.slice(
    currentQuestionIndex,
    currentQuestionIndex + questionsPerStage
  );
  const isLastStage = currentStage === totalStages;

  return (
    <main style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '900px',
      margin: '20px auto',
      padding: '20px',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)'
    }}>
      <Helmet>
        <title>Digital Literacy Quiz</title>
        <meta name="description" content="Test your digital literacy knowledge with our interactive quiz." />
        <meta property="og:title" content="Digital Literacy Quiz" />
        <meta property="og:description" content="Test your digital literacy knowledge with our interactive quiz." />
        <meta property="og:url" content={window.location.href} />
      </Helmet>

      {/* Progress Bar */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ marginBottom: '10px' }}>Digital Literacy Quiz</h1>
        <div style={{
          width: '100%',
          height: '10px',
          backgroundColor: '#e0e0e0',
          borderRadius: '5px'
        }}>
          <div style={{
            height: '10px',
            backgroundColor: '#4caf50',
            borderRadius: '5px',
            width: `${quizProgress}%`
          }} />
        </div>
        <p style={{ fontSize: '0.9em', color: '#777', marginTop: '5px' }}>
          Stage {currentStage} of {totalStages}
        </p>
      </div>

      {/* Questions */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-around'
      }}>
        {currentQuestions.map((q, idx) => {
          const qi = currentQuestionIndex + idx;
          return (
            <div key={qi} style={{
              width: '45%',
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#fff',
              borderRadius: '6px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              boxSizing: 'border-box'
            }}>
              <p style={{
                fontSize: '1.1em',
                color: '#333',
                marginBottom: '10px'
              }}>
                {qi + 1}. {q.question}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {q.options.map((opt, optIdx) => (
                  <button
                    key={optIdx}
                    onClick={() => handleOptionClick(qi, optIdx)}
                    aria-pressed={answers[qi] === optIdx}
                    style={{
                      padding: '10px 15px',
                      marginBottom: '8px',
                      backgroundColor: answers[qi] === optIdx ? '#5cb85c' : '#eee',
                      color: answers[qi] === optIdx ? '#fff' : '#000',
                      border: 'none',
                      borderRadius: '4px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s'
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '20px'
      }}>
        <button
          onClick={handlePreviousClick}
          disabled={currentQuestionIndex === 0}
          style={{
            padding: '10px 20px',
            backgroundColor: currentQuestionIndex === 0 ? '#ccc' : '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          Previous
        </button>
        <button
          onClick={handleNextClick}
          style={{
            padding: '10px 20px',
            backgroundColor: areAllAnsweredInStage() ? '#007bff' : '#ccc',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: areAllAnsweredInStage() ? 'pointer' : 'not-allowed'
          }}
        >
          {isLastStage ? 'Submit' : 'Next'}
        </button>
      </div>
    </main>
  );
};

export default Quiz;
