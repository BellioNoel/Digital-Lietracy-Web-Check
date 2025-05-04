import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { FaShieldAlt, FaArrowRight, FaWhatsapp, FaFacebookF, FaEnvelope } from "react-icons/fa";
import { trackEvent } from "../utils/analytics";
import { getBaseUrl } from "../utils/helpers";
import { toast } from 'react-toastify'; // Import toast
import { useLoading } from '../context/LoadingContext'; // Import useLoading

const Home = () => {
    const navigate = useNavigate();
    const baseUrl = getBaseUrl();
    const shareUrl = encodeURIComponent(baseUrl + "/");
    const shareText = encodeURIComponent("Join me on this Digital Literacy Check!");
    const { hideLoading } = useLoading(); // Get hideLoading from context

    useEffect(() => {
        trackEvent("page_view", "home_page_accessed", "Home Page Accessed");
        hideLoading(); // Hide loading spinner when component mounts
    }, [hideLoading]); // Add hideLoading to the dependency array

    const handleStartQuizClick = () => {
        trackEvent("button_click", "start_quiz_button_clicked", "Start Quiz Button Clicked");
        navigate("/quiz");
    };

    const handleShare = async (platform) => {
        trackEvent("share_click", `shared_via_${platform}`, `Shared via ${platform}`);
        try {
            if (navigator.share) {
                await navigator.share({
                    title: "Digital Literacy Check",
                    text: shareText,
                    url: shareUrl,
                });
                toast.success("Shared successfully!"); // Use toast.success
            }
        } catch (error) {
            console.error("Sharing error:", error);
            toast.error(`Sharing failed on ${platform}. Please try again.`); // Use toast.error
        }
    };

    return (
        <main role="main" style={{
            textAlign: "center",
            padding: "2rem 1rem",
            background: "#f7f9fc",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
        }}>
            <Helmet>
                <title>Digital Literacy Check | Quick Online Quiz</title>
                <meta
                    name="description"
                    content="Take our free Digital Literacy Check to measure your awareness in privacy, security, and tech usage."
                />
                <meta property="og:title" content="Digital Literacy Check" />
                <meta property="og:description" content="Measure your digital literacy with our quick online quiz." />
                <meta property="og:url" content={window.location.href} />
            </Helmet>

            <FaShieldAlt
                size={70}
                color="#007bff"
                aria-hidden="true"
                role="img"
                aria-label="Shield icon"
            />

            <h1 style={{
                fontSize: "2.5rem",
                margin: "1rem 0",
                lineHeight: 1.2,
                color: "#333",
            }}>Digital Literacy Check</h1>

            <p style={{
                maxWidth: "550px",
                margin: "0 auto",
                fontSize: "1.1rem",
                lineHeight: 1.5,
                color: "#555",
            }}>
                Discover how digitally savvy you are. This quick test measures your
                privacy, security, and basic tech awareness.
            </p>

            <button
                onClick={handleStartQuizClick}
                style={{
                    backgroundColor: "#007bff",
                    color: "#fff",
                    padding: "0.75rem 2rem",
                    fontSize: "1.125rem",
                    border: "none",
                    borderRadius: "6px",
                    marginTop: "2rem",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                }}
                aria-label="Start the Digital Literacy Quiz"
            >
                Start Quiz
                <FaArrowRight
                    style={{ marginLeft: "0.5rem" }}
                    aria-hidden="true"
                />
            </button>

            {/* Social Share */}
            <div style={{
                marginTop: "3rem",
                display: "flex",
                justifyContent: "center",
                gap: "1rem",
            }} aria-label="Share this quiz">
                <a
                    href={`https://wa.me/?text=${shareText}%20${shareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on WhatsApp"
                    onClick={() => handleShare("WhatsApp")}
                    style={{ color: "#25D366" }}
                >
                    <FaWhatsapp size={32} />
                </a>
                <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on Facebook"
                    onClick={() => handleShare("Facebook")}
                    style={{ color: "#1877F2" }}
                >
                    <FaFacebookF size={32} />
                </a>
                <a
                    href={`mailto:?subject=${encodeURIComponent("Try this Digital Literacy Quiz")}&body=${shareText}%20${shareUrl}`}
                    aria-label="Share via Email"
                    onClick={() => handleShare("Email")}
                    style={{ color: "#333" }}
                >
                    <FaEnvelope size={32} />
                </a>
            </div>
        </main>
    );
};

export default Home;