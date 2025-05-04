import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaTimesCircle, FaTrophy, FaBook, FaGraduationCap, FaLightbulb } from "react-icons/fa";
import { trackEvent } from "../utils/analytics";
import { Helmet } from "react-helmet";
import useLocalStorage from "../hooks/useLocalStorage";
import { initFacebookSDK } from "../utils/facebook";
import { getBaseUrl } from "../utils/helpers";
import { toast } from 'react-toastify'; // Import toast

const FB_APP_ID = "1043259181031240";

const Results = () => {
    const navigate = useNavigate();
    const baseUrl = getBaseUrl();

    const [userAnswers] = useLocalStorage("answers", []);
    const [allQuestions] = useLocalStorage("storedQuestions", []);
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState("");
    const [tier, setTier] = useLocalStorage("resultsTier", "free");
    const [paid, setPaid] = useLocalStorage("premiumResultsPaid", false);
    const [shared, setShared] = useLocalStorage("resultsShared", false);
    const [sharing, setSharing] = useState(false);
    const [showWhatsAppConfirmation, setShowWhatsAppConfirmation] = useState(false);
    const [isFacebookSDKReady, setIsFacebookSDKReady] = useState(false);

    useEffect(() => {
        trackEvent('page_view', 'results_page_viewed', 'Results Page Viewed');
    }, []);

    useEffect(() => {
        if (FB_APP_ID) {
            initFacebookSDK(FB_APP_ID)
                .then(() => setIsFacebookSDKReady(true))
                .catch((error) => {
                    console.error("Facebook SDK initialization error:", error);
                    toast.warn("Facebook sharing may not work correctly."); // Use toast.warn
                });
        }
    }, []);

    useEffect(() => {
        let sc = 0;
        if (allQuestions && userAnswers && allQuestions.length > 0 && userAnswers.length > 0) {
            sc = userAnswers.reduce((acc, ans, idx) => {
                if (idx < allQuestions.length && allQuestions[idx].options) {
                    const correctAnswerIndex = allQuestions[idx]?.options?.findIndex(option => option === allQuestions[idx].correctAnswer);
                    if (correctAnswerIndex !== -1 && ans === correctAnswerIndex) {
                        return acc + 1;
                    }
                }
                return acc;
            }, 0);
        }
        setScore(sc);

        const lvl =
            sc >= (allQuestions.length * 0.85) ? "Digital Pro"
                : sc >= (allQuestions.length * 0.7) ? "Digitally Smart"
                    : sc >= (allQuestions.length * 0.5) ? "Getting There"
                        : "At Risk";
        setLevel(lvl);
        localStorage.setItem("userLevel", lvl);

        trackEvent("results_viewed", "results_viewed", `Score:${sc}, Level:${lvl}, Tier:${tier}`);
    }, [tier, allQuestions, userAnswers]);

    const selectTier = (newTier) => {
        setTier(newTier);
        trackEvent("tier_selected", "tier_selected", `Tier Selected: ${newTier}`);
    };

    const handlePayment = () => {
        const receiverNumber = "678507737";
        toast.success(`Simulating payment to ${receiverNumber}...✅ MTN MoMo payment of 1000 FCFA was successful!`); // Use toast.success
        setPaid(true);
        trackEvent("premium_unlocked", "premium_unlocked", "MoMo 1000 FCFA");
    };

    const shareResults = async (method) => {
        setSharing(true);
        const shareText = `I scored ${score}/${allQuestions.length} on the Digital Literacy Quiz and I am a ${level}! Try it: ${baseUrl}/quiz`;

        try {
            if (method === "whatsapp") {
                const encoded = encodeURIComponent(shareText);
                const url = `https://wa.me/?text=${encoded}`;
                window.open(url, "_blank");
                setShowWhatsAppConfirmation(true);
            } else if (method === "facebook") {
                if (window.FB && isFacebookSDKReady) {
                    window.FB.ui({
                        method: 'share',
                        href: baseUrl + "/quiz",
                        quote: shareText,
                    }, function (response) {
                        if (response && !response.error) {
                            completeSharing(method);
                        } else {
                            toast.error("Facebook sharing failed. Please try again."); // Use toast.error
                            setSharing(false);
                        }
                    });
                } else {
                    toast.warn("Facebook SDK not initialized. Please check your App ID."); // Use toast.warn
                    setSharing(false);
                }
            } else if (navigator.share?.({ text: shareText })) {
                await navigator.share({ text: shareText });
                if (method === "whatsapp") {
                    setShowWhatsAppConfirmation(true);
                } else {
                    completeSharing(method);
                }
            } else {
                toast.warn("Sharing is not supported on this browser."); // Use toast.warn
                setSharing(false);
            }
        } catch (error) {
            console.error("Sharing failed:", error);
            toast.error("Sharing failed. Please try again."); // Use toast.error
            setSharing(false);
        }
    };

    const completeSharing = (method) => {
        setShared(true);
        setSharing(false);
        trackEvent("results_shared", "results_shared", `Shared via ${method}`);
        toast.success("Thanks for sharing! Standard results unlocked."); // Use toast.success
    };

    const handleWhatsAppConfirmation = (confirmed) => {
        setShowWhatsAppConfirmation(false);
        if (confirmed) {
            completeSharing("whatsapp");
        } else {
            toast.info("Please share to unlock the Standard results."); // Use toast.info
            setSharing(false);
        }
    };

    const handleRetry = () => {
        trackEvent("retry_quiz", "retry_quiz", "User Retried Quiz");
        navigate("/quiz");
    };

    const renderLevelHeader = () => {
        let levelIcon;
        switch (level) {
            case "Digital Pro":
                levelIcon = <FaTrophy size={48} color="#FFD700" />;
                break;
            case "Digitally Smart":
                levelIcon = <FaLightbulb size={48} color="#007bff" />;
                break;
            case "Getting There":
                levelIcon = <FaGraduationCap size={48} color="#28a745" />;
                break;
            default: // "At Risk"
                levelIcon = <FaBook size={48} color="#dc3545" />;
                break;
        }

        return (
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                {levelIcon}
                <h2 style={{ fontSize: "1.5rem", margin: "0.5rem 0" }}>{level}</h2>
            </div>
        );
    };

    const renderFree = () => (
        <>
            <p style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                You scored {score} / {allQuestions.length}
            </p>
            <p>Unlock Premium for a full breakdown!</p>
            <p>Study Digital Literacy: <a href="https://www.example.com/digital-literacy-resource" target="_blank" rel="noopener noreferrer"><FaBook /> Learn More</a></p>
        </>
    );

    const renderFullTable = () => (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
            <thead>
                <tr>
                    <th style={{ border: "1px solid #999", padding: "0.5rem" }}>Q</th>
                    <th style={{ border: "1px solid #999", padding: "0.5rem" }}>Your Answer</th>
                    <th style={{ border: "1px solid #999", padding: "0.5rem" }}>Correct Answer</th>
                </tr>
            </thead>
            <tbody>
                {allQuestions.map((q, i) => {
                    const user = userAnswers[i];
                    return (
                        <tr key={i}>
                            <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>{i + 1}. {q.question}</td>
                            <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                                {user != null ? q.options[user] : "No Answer"}
                            </td>
                            <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                                Use Premium Version To View Correction
                            </td>
                        </tr>
                    );
                })}
            </tbody>
            <tfoot>
                <tr>
                    <td colSpan="3">
                        {sharedResources.map((resource, index) => (
                            <a key={index} href={resource} target="_blank" rel="noopener noreferrer">
                                <FaBook /> Study Resource {index + 1}
                            </a>
                        ))}
                    </td>
                </tr>
            </tfoot>
        </table>
    );

    const renderPremiumTable = () => (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
            <thead>
                <tr>
                    <th style={{ border: "1px solid #999", padding: "0.5rem" }}>Q</th>
                    <th style={{ border: "1px solid #999", padding: "0.5rem" }}>Your Answer</th>
                    <th style={{ border: "1px solid #999", padding: "0.5rem" }}>Correct</th>
                    <th style={{ border: "1px solid #999", padding: "0.5rem" }}>Correct Answer</th>
                </tr>
            </thead>
            <tbody>
                {allQuestions.map((q, i) => {
                    const user = userAnswers[i];
                    const correctAnswerIndex = q?.options?.findIndex(option => option === q.correctAnswer);
                    const isCorrect = user === correctAnswerIndex;
                    return (
                        <tr key={i}>
                            <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>{i + 1}. {q.question}</td>
                            <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                                {user != null ? q.options[user] : "No Answer"}
                            </td>
                            <td style={{ border: "1px solid #ccc", padding: "0.5rem", textAlign: "center" }}>
                                {isCorrect
                                    ? <FaCheckCircle color="#28a745" />
                                    : <FaTimesCircle color="#dc3545" />
                                }
                            </td>
                            <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>{q.options[correctAnswerIndex]}</td>
                        </tr>
                    );
                })}
            </tbody>
            <tfoot>
                <tr>
                    <td colSpan="4">
                        {premiumResources.map((resource, index) => (
                            <a key={index} href={resource} target="_blank" rel="noopener noreferrer">
                                <FaBook /> Study Resource {index + 1}
                            </a>
                        ))}
                    </td>
                </tr>
            </tfoot>
        </table>
    );

    return (
        <main style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
            <Helmet>
                <title>Quiz Results - Digital Literacy Test</title>
                <meta name="description" content="Check your digital literacy quiz results and see how you scored!" />
                <meta property="og:title" content="Quiz Results - Digital Literacy Test" />
                <meta property="og:description" content="Check your digital literacy quiz results and see how you scored!" />
                <meta property="og:url" content={window.location.href} />
            </Helmet>

            <h1 style={{ textAlign: "center", marginBottom: "1rem" }}>Quiz Results</h1>

            {renderLevelHeader()}

            {/* Tier selector */}
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <button
                    onClick={() => selectTier("free")}
                    style={{
                        marginRight: "1rem",
                        padding: "0.5rem 1rem",
                        border: tier === "free" ? "2px solid #007bff" : "1px solid #ccc",
                        background: tier === "free" ? "#007bff" : "#fff",
                        color: tier === "free" ? "#fff" : "#000",
                        borderRadius: "6px",
                        cursor: "pointer",
                    }}
                    disabled={sharing}
                    aria-label="Select Free Tier"
                >
                    Tier Plan  Free
                </button>
                <button
                    onClick={() => selectTier("standard")}
                    style={{
                        padding: "0.5rem 1rem",
                        border: tier === "standard" ? "2px solid #007bff" : "1px solid #ccc",
                        background: tier === "standard" ? "#007bff" : "#fff",
                        color: tier === "standard" ? "#fff" : "#000",
                        borderRadius: "6px",
                        cursor: "pointer",
                    }}
                    disabled={sharing}
                    aria-label="Select Standard Tier"
                >
                    Tier Plan  Standard (Share)
                </button>
                <button
                    onClick={() => selectTier("premium")}
                    style={{
                        padding: "0.5rem 1rem",
                        border: tier === "premium" ? "2px solid gold" : "1px solid #ccc",
                        background: tier === "premium" ? "gold" : "#ffffff",
                        color: "#000",
                        borderRadius: "6px",
                        cursor: "pointer",
                    }}
                    disabled={sharing}
                    aria-label="Select Premium Tier"
                >
                    Tier Plan  Premium (1000 FCFA)
                </button>
            </div>

            {/* Standard gating */}
            {tier === "standard" && !shared && !sharing && (
                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                    <p>🔓 Share to unlock Standard results:</p>
                    <button onClick={() => shareResults("whatsapp")} style={{ marginRight: "0.5rem" }} disabled={sharing} aria-label="Share on WhatsApp">WhatsApp</button>
                    <button onClick={() => shareResults("facebook")} disabled={sharing && isFacebookSDKReady} aria-label="Share on Facebook">Facebook</button>
                </div>
            )}

            {/* Premium gating */}
            {tier === "premium" && !paid && !sharing && (
                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                    <p>💳 Unlock full results for 1000 FCFA via MoMo</p>
                    <button
                        onClick={handlePayment}
                        style={{
                            padding: "0.5rem 1.5rem",
                            background: "#fcc400",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                        }}
                        disabled={sharing}
                        aria-label="Pay with MoMo"
                    >
                        Pay with MoMo
                    </button>
                </div>
            )}

            {/* WhatsApp Confirmation */}
            {showWhatsAppConfirmation && (
                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                    <p>Did you successfully share the results on WhatsApp?</p>
                    <button onClick={() => handleWhatsAppConfirmation(true)} style={{ marginRight: "0.5rem" }} aria-label="Yes, I shared!">Yes, I shared!</button>
                    <button onClick={() => handleWhatsAppConfirmation(false)} aria-label="Share on WhatsApp">Share Now</button>
                </div>
            )}

            {/* Results content */}
            <div style={{ border: "1px solid #ddd", borderRadius: "12px", padding: "2rem", background: "#fafafa", opacity: (sharing || (tier === "standard" && !shared) || (tier === "premium" && !paid)) ? 0.5 : 1 }}>
                {tier === "premium" && paid
                    ? <>{renderPremiumTable()}</>
                    : tier === "standard" && shared
                        ? <>{renderFullTable()}</>
                        : renderFree()
                }
            </div>

            {/* Actions */}
            <div style={{ marginTop: "2rem", display: "flex", justifyContent: "center", gap: "1rem" }}>
                <button
                    onClick={handleRetry}
                    style={{
                        padding: "0.5rem 1.5rem",
                        background: "#007bff",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                    }}
                    aria-label="Retry Quiz"
                >
                    Retry Quiz
                </button>
                <button
                    onClick={() => navigate("/certificate")}
                    style={{
                        padding: "0.5rem 1.5rem",
                        background: "#28a745",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                    }}
                    aria-label="Get Certificate"
                >
                    Get Certificate
                </button>
            </div>
        </main>
    );
};

const sharedResources = ["https://www.example.com/digital-literacy-resource1", "https://www.example.com/digital-literacy-resource2"];
const premiumResources = ["https://www.example.com/digital-literacy-resource3", "https://www.example.com/digital-literacy-resource4", "https://www.example.com/digital-literacy-resource5"];

export default Results;