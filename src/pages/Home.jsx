import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { FaShieldAlt, FaArrowRight, FaWhatsapp, FaFacebookF, FaEnvelope } from "react-icons/fa";
import { trackEvent } from "../utils/analytics";
import { getBaseUrl } from "../utils/helpers";
import { toast } from "react-toastify";
import { useLoading } from "../context/LoadingContext";

const Home = () => {
  const navigate = useNavigate();
  const baseUrl = getBaseUrl();
  const shareUrl = encodeURIComponent(baseUrl + "/");
  const shareText = encodeURIComponent("Join me on this Digital Literacy Check!");
  const { hideLoading } = useLoading();

  useEffect(() => {
    trackEvent("page_view", "home_page_accessed", "Home Page Accessed");
    hideLoading();
  }, [hideLoading]);

  const handleStartQuizClick = () => {
    trackEvent("button_click", "start_quiz_button_clicked", "Start Quiz Button Clicked");
    navigate("/quiz");
  };

  const handleShare = async (platform) => {
    trackEvent("share_click", `shared_via_${platform}`, `Shared via ${platform}`);
    try {
      if (navigator.share) {
        await navigator.share({ title: "Digital Literacy Check", text: shareText, url: shareUrl });
        toast.success("Shared successfully!");
      }
    } catch {
      toast.error(`Sharing failed on ${platform}. Please try again.`);
    }
  };

  return (
    <main
      role="main"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",       // center all children horizontally
        textAlign: "center",
        padding: "2rem 1rem",
        background: "#f7f9fc",
        minHeight: "100vh",
      }}
    >
      <Helmet>
        <title>Digital Literacy Check | Quick Online Quiz</title>
        <meta name="description" content="Take our free Digital Literacy Check to measure your awareness in privacy, security, and tech usage." />
        <meta property="og:title" content="Digital Literacy Check" />
        <meta property="og:description" content="Measure your digital literacy with our quick online quiz." />
        <meta property="og:url" content={window.location.href} />
      </Helmet>

      <div
        style={{
          display: "flex",
          justifyContent: "center",   // center shield container
          width: "100%",
          marginBottom: "1rem",
        }}
        aria-hidden="true"
      >
        <FaShieldAlt size={70} color="#007bff" aria-label="Shield icon" />
      </div>

      <h1
        style={{
          fontSize: "2.5rem",
          margin: "0.5rem 0",
          lineHeight: 1.2,
          color: "#333",
        }}
      >
        Digital Literacy Check
      </h1>

      <p
        style={{
          maxWidth: "550px",
          margin: "0.5rem auto 2rem",
          fontSize: "1.1rem",
          lineHeight: 1.5,
          color: "#555",
        }}
      >
        Discover how digitally savvy you are. This quick test measures your privacy, security, and basic tech awareness.
      </p>

      <button
        onClick={handleStartQuizClick}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",   // center text + icon
          backgroundColor: "#007bff",
          color: "#fff",
          padding: "0.75rem 2rem",
          fontSize: "1.125rem",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          gap: "0.5rem",
        }}
        aria-label="Start the Digital Literacy Quiz"
      >
        <span>Start Quiz</span>
        <FaArrowRight aria-hidden="true" />
      </button>

      <div
        style={{
          marginTop: "3rem",
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
        }}
        aria-label="Share this quiz"
      >
        <a
          href={`https://wa.me/?text=${shareText}%20${shareUrl}`}
          onClick={() => handleShare("WhatsApp")}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#25D366" }}
          aria-label="Share on WhatsApp"
        >
          <FaWhatsapp size={32} />
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
          onClick={() => handleShare("Facebook")}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#1877F2" }}
          aria-label="Share on Facebook"
        >
          <FaFacebookF size={32} />
        </a>
        <a
          href={`mailto:?subject=${encodeURIComponent("Try this Digital Literacy Quiz")}&body=${shareText}%20${shareUrl}`}
          onClick={() => handleShare("Email")}
          style={{ color: "#333" }}
          aria-label="Share via Email"
        >
          <FaEnvelope size={32} />
        </a>
      </div>
    </main>
  );
};

export default Home;
