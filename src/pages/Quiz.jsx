import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { trackEvent } from '../utils/analytics';
import useLocalStorage from '../hooks/useLocalStorage';
import { toast } from 'react-toastify'; // Import toast

const allQuestions = [
    {
        question: "What is a strong password?",
        options: ["123456", "password", "T!m3$ecure@2024", "johnny"],
        correctAnswer: "T!m3$ecure@2024",
    },
    {
        question: "What does HTTPS stand for?",
        options: ["Hyper Text Transfer Protocol Secure", "High Tech Protocol System", "High Transfer Secure Port", "None"],
        correctAnswer: "Hyper Text Transfer Protocol Secure",
    },
    {
        question: "Which file is potentially malicious?",
        options: ["resume.docx", "setup.exe", "photo.jpg", "notes.txt"],
        correctAnswer: "setup.exe",
    },
    {
        question: "What does two-factor authentication do?",
        options: ["Asks for two usernames", "Adds a layer of security", "Slows login", "Tracks your location"],
        correctAnswer: "Adds a layer of security",
    },
    {
        question: "Which is a phishing attempt?",
        options: ["Email from your bank with spelling errors", "Newsletter from YouTube", "Your password manager", "A verified email"],
        correctAnswer: "Email from your bank with spelling errors",
    },
    {
        question: "What’s the safest way to connect to public Wi-Fi?",
        options: ["Directly", "VPN", "Open proxy", "Shared hotspot"],
        correctAnswer: "VPN",
    },
    {
        question: "Which device needs regular updates?",
        options: ["PC only", "Smartphones only", "All digital devices", "None"],
        correctAnswer: "All digital devices",
    },
    {
        question: "What is a digital footprint?",
        options: ["A foot scan", "Tracking apps", "Your online activity", "Your profile picture"],
        correctAnswer: "Your online activity",
    },
    {
        question: "Cookies on websites are used for?",
        options: ["Making websites faster", "Storing user data", "Buying things", "Crashing browsers"],
        correctAnswer: "Storing user data",
    },
    {
        question: "Strongest security for accounts?",
        options: ["Password only", "Email verification", "2FA", "Security questions"],
        correctAnswer: "2FA",
    },
    {
        question: "What’s the risk of downloading cracked software?",
        options: ["No risk", "Saves money", "Malware infection", "Malware infection"], // Corrected typo
        correctAnswer: "Malware infection",
    },
    {
        question: "Which one is encrypted communication?",
        options: ["Plain text", "Email", "HTTPS", "POP3"],
        correctAnswer: "HTTPS",
    },
    {
        question: "Cloud storage example?",
        options: ["USB", "OneDrive", "CD", "SSD"],
        correctAnswer: "OneDrive",
    },
    {
        question: "Spam emails often ask for?",
        options: ["Money", "Feedback", "Survey", "Unsubscribe"],
        correctAnswer: "Money",
    },
    {
        question: "How often should you change passwords?",
        options: ["Never", "Only if hacked", "Every year", "Regularly"],
        correctAnswer: "Regularly",
    },
    {
        question: "What is ransomware?",
        options: ["Software that locks your computer and demands payment", "A type of antivirus", "A social media platform", "A search engine"],
        correctAnswer: "Software that locks your computer and demands payment",
    },
    {
        question: "What is a VPN?",
        options: ["Virtual Private Network", "Very Personal Note", "Visual Pin Number", "Voluntary Public Notice"],
        correctAnswer: "Virtual Private Network",
    },
    {
        question: "What is malware?",
        options: ["A type of antivirus", "Malicious software", "A computer game", "A social media trend"],
        correctAnswer: "Malicious software",
    },
    {
        question: "What is data encryption?",
        options: ["Converting data into a secret code", "Making data public", "Deleting data permanently", "Compressing data for storage"],
        correctAnswer: "Converting data into a secret code",
    },
    {
        question: "What is identity theft?",
        options: ["Stealing someone's physical identity", "Impersonating someone online", "Damaging someone's reputation", "Gaining unauthorized access to someone's accounts"],
        correctAnswer: "Impersonating someone online",
    },
];

const Quiz = () => {
    const navigate = useNavigate();

    // Initialize questions, user answers, and correct answers in local storage
    const [storedQuestions ] = useLocalStorage('storedQuestions', allQuestions);
    const [answers, setAnswers] = useLocalStorage('answers', Array(allQuestions.length).fill(null));
    const [quizProgress, setQuizProgress] = useLocalStorage('quizProgress', 0);

    // State variables
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Stage configuration
    const questionsPerStage = 4;
    const totalStages = Math.ceil(storedQuestions.length / questionsPerStage);
    const [currentStage, setCurrentStage] = useState(1);

    useEffect(() => {
        trackEvent('page_view', 'quiz_stage_viewed', `Quiz Stage ${currentStage} Viewed`);
    }, [currentStage]);

    const updateQuizProgress = (index, currentAnswers) => {
        const answeredQuestions = currentAnswers.filter(answer => answer !== null).length;
        const progress = (answeredQuestions / storedQuestions.length) * 100;
        setQuizProgress(progress);
    };

    const handleOptionClick = (questionIndex, optionIndex) => {
        try {
            const newAnswers = [...answers];
            newAnswers[questionIndex] = optionIndex;
            setAnswers(newAnswers);
            updateQuizProgress(currentQuestionIndex, newAnswers);

            trackEvent('answer_question', 'question_answered', `Question ${questionIndex + 1}, Answer ${optionIndex}`);
        } catch (error) {
            console.error("Error updating answers:", error);
            toast.error("Failed to save answer. Please try again.");
        }
    };

    const handleNextClick = () => {
        if (!areAllQuestionsAnswered()) {
            toast.warn('Please answer all questions before proceeding.');
            return;
        }

        const nextQuestionIndex = currentQuestionIndex + questionsPerStage;

        if (nextQuestionIndex >= storedQuestions.length) {
            trackEvent('quiz_completed', 'quiz_completed', 'User Completed Quiz');
            navigate('/results');
        } else {
            setCurrentQuestionIndex(nextQuestionIndex);
            setCurrentStage(Math.ceil((nextQuestionIndex + 1) / questionsPerStage));
            trackEvent('stage_completed', 'stage_completed', `Stage ${currentStage} Completed`);
        }
    };

    const handlePreviousClick = () => {
        const previousQuestionIndex = currentQuestionIndex - questionsPerStage;

        if (previousQuestionIndex < 0) {
            console.log('Cannot go back further.');
        } else {
            setCurrentQuestionIndex(previousQuestionIndex);
            setCurrentStage(Math.ceil((previousQuestionIndex + 1) / questionsPerStage));
        }
    };

    const areAllQuestionsAnswered = () => {
        for (let i = currentQuestionIndex; i < Math.min(currentQuestionIndex + questionsPerStage, storedQuestions.length); i++) {
            if (answers[i] === null) {
                return false;
            }
        }
        return true;
    };

    const currentQuestions = storedQuestions.slice(currentQuestionIndex, currentQuestionIndex + questionsPerStage);
    const isNextButtonDisabled = !areAllQuestionsAnswered();
    const isLastStage = currentStage === totalStages;

    return (
        <main style={{
            fontFamily: 'Arial, sans-serif',
            maxWidth: '900px',
            margin: '20px auto',
            padding: '20px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
        }}>
            <Helmet>
                <title>Digital Literacy Quiz</title>
                <meta name="description" content="Test your digital literacy knowledge with our interactive quiz." />
                <meta property="og:title" content="Digital Literacy Quiz" />
                <meta property="og:description" content="Test your digital literacy knowledge with our interactive quiz." />
                <meta property="og:url" content={window.location.href} />
            </Helmet>

            <div style={{
                textAlign: 'center',
                marginBottom: '20px',
            }}>
                <h1 style={{ marginBottom: '10px' }}>Digital Literacy Quiz</h1>
                <div style={{
                    width: '100%',
                    height: '10px',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '5px',
                    marginTop: '10px',
                }}>
                    <div
                        style={{
                            height: '10px',
                            backgroundColor: '#4caf50',
                            borderRadius: '5px',
                            width: `${quizProgress}%`,
                        }}
                    ></div>
                </div>
                <p style={{
                    fontSize: '0.9em',
                    color: '#777',
                    marginTop: '5px',
                }}>
                    Stage {currentStage} of {totalStages}
                </p>
            </div>

            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-around',
            }}>
                {currentQuestions.map((question, index) => {
                    const questionIndex = currentQuestionIndex + index;
                    return (
                        <div key={questionIndex} style={{
                            width: '45%',
                            marginBottom: '20px',
                            padding: '15px',
                            backgroundColor: '#fff',
                            borderRadius: '6px',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                            boxSizing: 'border-box',
                        }}>
                            <p style={{
                                fontSize: '1.1em',
                                color: '#333',
                                marginBottom: '10px',
                            }}>
                                {questionIndex + 1}. {question.question}
                            </p>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                            }}>
                                {question.options.map((option, optionIndex) => (
                                    <button
                                        key={optionIndex}
                                        style={{
                                            padding: '10px 15px',
                                            marginBottom: '8px',
                                            backgroundColor: '#eee',
                                            border: 'none',
                                            borderRadius: '4px',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.3s',
                                            ...(answers[questionIndex] === optionIndex ? {
                                                backgroundColor: '#5cb85c',
                                                color: 'white',
                                            } : {}),
                                        }}
                                        onClick={() => handleOptionClick(questionIndex, optionIndex)}
                                        aria-pressed={answers[questionIndex] === optionIndex}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '20px',
            }}>
                <button
                    onClick={handlePreviousClick}
                    disabled={currentQuestionIndex === 0}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s',
                        ...(currentQuestionIndex === 0 ? {
                            backgroundColor: '#ccc',
                            cursor: 'not-allowed',
                        } : {}),
                    }}
                >
                    Previous
                </button>
                <button
                    onClick={handleNextClick}
                    disabled={isNextButtonDisabled}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s',
                        ...(isNextButtonDisabled ? {
                            backgroundColor: '#ccc',
                            cursor: 'not-allowed',
                        } : {}),
                    }}
                >
                    {isLastStage ? 'Submit' : 'Next'}
                </button>
            </div>
        </main>
    );
};

export default Quiz;