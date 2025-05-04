import React, { useRef, useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { FaWhatsapp, FaFacebookF, FaRedo, FaPhone } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../utils/analytics';
import useLocalStorage from '../hooks/useLocalStorage';
import { Helmet } from "react-helmet";
import { initFacebookSDK } from "../utils/facebook";
import { getBaseUrl } from "../utils/helpers";
import { toast } from 'react-toastify';  // Import toast

const FB_APP_ID = "1043259181031240";

const Certificate = () => {
    const certRef = useRef(null);
    const navigate = useNavigate();
    const baseUrl = getBaseUrl();

    const [name, setName] = useLocalStorage('certificateName', '');
    const [age, setAge] = useLocalStorage('certificateAge', '');
    const [level, setLevel] = useState('Digital'); // Initialize with a default value
    const [shared, setShared] = useLocalStorage('certificateShared', false);
    const [paid, setPaid] = useLocalStorage('certificatePaid', false);
    const [customImage, setCustomImage] = useState(null);
    const [showDialog, setShowDialog] = useState(false);
    const [sharePlatform, setSharePlatform] = useState('');
    const [sharing, setSharing] = useState(false);
    const [showWhatsAppConfirmation, setShowWhatsAppConfirmation] = useState(false);
    const [isFacebookSDKReady, setIsFacebookSDKReady] = useState(false);
    const [tier, setTier] = useLocalStorage('certificateTier', 'free');

    useEffect(() => {
        trackEvent('page_view', 'certificate_page_viewed', `Certificate Page Viewed, Tier:${tier}`);
    }, [tier]);

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

    // Update level from local storage
    useEffect(() => {
        const storedLevel = localStorage.getItem('userLevel');
        if (storedLevel) {
            setLevel(storedLevel);
        }
    }, []);

    const handleTierSelect = (selectedTier) => {
        setTier(selectedTier);
        trackEvent('certificate_tier_selected', 'certificate_tier_selected', `Certificate Tier Selected: ${selectedTier}`);
    };

    const handleNameChange = (e) => {
        setName(e.target.value);
    };

    const handleAgeChange = (e) => {
        setAge(e.target.value);
    };

    const shareResults = async (method) => {
        setSharing(true);
        const shareText = `I earned a Digital Literacy Certificate and I am a ${level}! Get yours: ${baseUrl}/certificate`;

        try {
            if (method === "whatsapp") {
                const encoded = encodeURIComponent(shareText);
                const url = `https://wa.me/?text=${encoded}`;
                window.open(url, "_blank");
                setShowWhatsAppConfirmation(true);
            } else if (method === "facebook") {
                handleFacebookShare(shareText);
            } else if (navigator.share?.({ text: shareText })) {
                await navigator.share({ text: shareText });
                if (method === "whatsapp") {
                    setShowWhatsAppConfirmation(true);
                } else {
                    completeSharing(method);
                }
            } else {
                toast.warn("Sharing is not supported on this browser.");  // Use toast.warn
                setSharing(false);
            }
        } catch (error) {
            console.error("Sharing failed:", error);
            toast.error("Sharing failed. Please try again.");  // Use toast.error
            setSharing(false);
        }
    };

    const handleFacebookShare = async (shareText) => {
        setSharing(true);
        if (!window.FB || typeof window.FB.ui !== 'function' || !isFacebookSDKReady) {
            toast.warn("Facebook SDK not initialized. Please try again."); // Use toast.warn
            setSharing(false);
            return;
        }

        try {
            const pageUrl = baseUrl + "/certificate";
            const imageUrl = await downloadImage();
            if (!imageUrl) {
                toast.error("Failed to download image for sharing."); // Use toast.error
                setSharing(false);
                return;
            }

            window.FB.ui({
                method: 'share',
                href: pageUrl,
                quote: shareText,
                hashtag: '#Certificate',
                picture: imageUrl,
            }, (response) => {
                if (response && !response.error) {
                    completeSharing("facebook");
                } else {
                    console.error("Facebook sharing error:", response);
                    toast.error("Facebook sharing failed. Please try again."); // Use toast.error
                    setSharing(false);
                }
            });
        } catch (error) {
            console.error("Facebook sharing failed:", error);
            toast.error("Facebook sharing failed. Please try again."); // Use toast.error
            setSharing(false);
        }
    };

    const completeSharing = (method) => {
        setShared(true);
        setSharing(false);
        toast.success("Thanks for sharing!"); // Use toast.success
        trackEvent('certificate_shared', 'certificate_shared', `Shared Certificate via ${method}`);
    };

    const handleWhatsAppConfirmation = (confirmed) => {
        setShowWhatsAppConfirmation(false);
        if (confirmed) {
            completeSharing("whatsapp");
        } else {
            toast.info("Please share to unlock the certificate."); // Use toast.info
            setSharing(false);
        }
    };

    const handlePayment = () => {
        toast.success('✅ Your MTN MoMo payment of 1000 FCFA was successful!'); // Use toast.success
        setPaid(true);
        localStorage.setItem('certificatePaid', 'true');
        trackEvent('certificate_paid', 'certificate_paid', 'MoMo 1000 FCFA');
    };

    const downloadCertificate = async () => {
        if (!name.trim() || !age) {
            toast.warn('Please enter your name and age.'); // Use toast.warn
            return;
        }
        if (tier === 'standard' && !shared) {
            toast.info('Please share to unlock the Standard certificate.'); // Use toast.info
            return;
        }
        if (tier === 'premium' && !paid) {
            toast.info('Please pay to unlock the Premium certificate.'); // Use toast.info
            return;
        }

        try {
            const dataUrl = await toPng(certRef.current, {
                cacheBust: true,
                pixelRatio: 3,
                backgroundColor: "#fff",
            });
            const link = document.createElement('a');
            link.download = `CERTIFICATE_${name.toUpperCase()}.png`;
            link.href = dataUrl;
            link.click();
            trackEvent('certificate_downloaded', 'certificate_downloaded', `Certificate Downloaded, Tier: ${tier}`);
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('Failed to download certificate. Please try again.'); // Use toast.error
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setCustomImage(reader.result);
        reader.readAsDataURL(file);
        trackEvent('certificate_image_uploaded', 'certificate_image_uploaded', `Image Uploaded: ${file.name}`);
    };

    const downloadImage = async () => {
        try {
            const dataUrl = await toPng(certRef.current, {
                cacheBust: true,
                pixelRatio: 3,
                backgroundColor: "#fff",
            });
            return dataUrl;
        } catch (error) {
            console.error('Image download failed:', error);
            toast.error('Image download failed. Please try again.'); // Use toast.error
            return null;
        }
    };

    const handleDialogAction = (sharedNow) => {
        if (sharedNow) {
            setSharePlatform(sharePlatform);
            shareResults(sharePlatform === 'facebook' ? 'facebook' : 'whatsapp');
        }
        setShowDialog(false);
    };

    const sharingStatus = sharing ? 'Sharing in progress...' : 'Ready to share';

    const certificateWidth = 694;
    const certificateHeight = 650;

    // Base Styles
    const baseCertificateStyle = {
        margin: '1.5rem auto',
        padding: '2rem',
        maxWidth: 'calc(100% - 4rem)',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        position: 'relative',
        boxSizing: 'border-box',
        width: `${certificateWidth}px`,
        height: `${certificateHeight}px`,
        overflow: 'hidden',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif', // Consistent font
        color: '#333', // Consistent text color
    };

    const baseWatermarkStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(-30deg)',
        fontSize: '6rem',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        pointerEvents: 'none',
        fontWeight: 'bold',
    };

    const baseHeaderStyle = {
        wordBreak: 'break-word',
        fontSize: '2.5em',
        marginBottom: '0.5em',
        textShadow: '1px 1px 2px rgba(0,0,0,0.1)', // Subtle shadow
    };

    const baseNameStyle = {
        wordBreak: 'break-word',
        textTransform: 'uppercase',
        fontSize: '2em',
        fontWeight: 'bold',
        margin: '0.5em 0',
        letterSpacing: '1px', // Slight letter spacing
    };

    const baseLevelStyle = {
        wordBreak: 'break-word',
        fontSize: '1.8em',
        fontWeight: 'bold',
        margin: '0.5em 0',
    };

    const baseAwardedStyle = {
        fontSize: '0.85rem',
        color: '#555',
        fontStyle: 'italic', // Italicized awarded date
    };

    // Tier-Specific Styles
    let certificateStyle = { ...baseCertificateStyle };
    let watermarkStyle = { ...baseWatermarkStyle };
    let headerStyle = { ...baseHeaderStyle };
    let nameStyle = { ...baseNameStyle };
    let levelStyle = { ...baseLevelStyle };
    let awardedStyle = { ...baseAwardedStyle };

    switch (tier) {
        case 'premium':
            certificateStyle = {
                ...certificateStyle,
                background: 'linear-gradient(135deg, #fdf5e6, #eae0c8)', // Gradient background
                border: '6px solid #FFD700', // Gold border
                color: '#555', // Darker text color
            };
            watermarkStyle = {
                ...watermarkStyle,
                color: 'rgba(255,215,0,0.25)', // Gold watermark
                textShadow: '2px 2px 4px rgba(0,0,0,0.2)', // Stronger shadow
            };
            headerStyle = {
                ...headerStyle,
                color: '#c59b08', // Richer gold color
                textShadow: '2px 2px 4px rgba(0,0,0,0.2)', // Stronger shadow
            };
            nameStyle = { ...nameStyle, color: '#333' };
            levelStyle = { ...levelStyle, color: '#b8860b' }; // Dark goldenrod
            awardedStyle = { ...awardedStyle, color: '#777' };
            break;
        case 'standard':
            certificateStyle = {
                ...certificateStyle,
                background: 'linear-gradient(135deg, #e6f2ff, #c0d9ed)', // Light blue gradient
                border: '6px dashed #007bff', // Blue border
            };
            watermarkStyle = { ...watermarkStyle, color: 'rgba(0,123,255,0.2)' }; // Blue watermark
            headerStyle = { ...headerStyle, color: '#0056b3' }; // Darker blue
            levelStyle = { ...levelStyle, color: '#0056b3' };
            break;
        default: // free
            certificateStyle = {
                ...certificateStyle,
                background: '#f9f9f9',
                border: '4px solid #ccc',
            };
            watermarkStyle = { ...watermarkStyle, color: 'rgba(150,150,150,0.15)' };
            headerStyle = { ...headerStyle, color: '#007bff' };
            levelStyle = { ...levelStyle, color: '#d32f2f' };
            break;
    }

    return (
        <main role="main" style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <Helmet>
                <title>Digital Literacy Certificate</title>
                <meta name="description" content="Earn your Digital Literacy Certificate!" />
                <meta property="og:title" content="Digital Literacy Certificate" />
                <meta property="og:description" content="Earn your Digital Literacy Certificate" />
                <meta property="og:url" content={window.location.href} />
            </Helmet>
            <h1>Choose Your Certificate Tier</h1>
            <p>{sharingStatus}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', margin: '1.5rem 0' }}>
                {['free', 'standard', 'premium'].map((option) => (
                    <button
                        key={option}
                        onClick={() => handleTierSelect(option)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            border: tier === option ? '2px solid #007bff' : '1px solid #ccc',
                            background: tier === option ? '#007bff' : '#fff',
                            color: tier === option ? '#fff' : '#333',
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                        }}
                        aria-label={`Select ${option} tier`}
                    >
                        {option === 'free' ? 'Free' : option === 'standard' ? 'Share‑Unlock' : 'Premium (1000 FCFA)'}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={handleNameChange}
                    style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', minWidth: '200px' }}
                    aria-label="Enter your full name"
                />
                <input
                    type="number"
                    placeholder="Age"
                    value={age}
                    onChange={handleAgeChange}
                    style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', minWidth: '100px' }}
                    aria-label="Enter your age"
                />
            </div>

            {tier === 'standard' && !shared && (
                <div style={{ margin: '1rem 0' }}>
                    <p>🔓 Share to unlock Standard certificate:</p>
                    <button onClick={() => shareResults('whatsapp')} style={{ marginRight: '0.5rem' }} aria-label="Share on WhatsApp">
                        <FaWhatsapp /> WhatsApp
                    </button>
                    <button onClick={() => shareResults('facebook')} aria-label="Share on Facebook" disabled={!isFacebookSDKReady}>
                        <FaFacebookF /> Facebook
                    </button>
                </div>
            )}

            {tier === 'premium' && !paid && (
                <div style={{ margin: '1rem 0' }}>
                    <p>💳 Pay 1000 FCFA via MoMo to unlock Premium:</p>
                    <button onClick={handlePayment} style={{ background: '#fcc400', padding: '.5rem 1rem', border: 'none', borderRadius: '6px' }} aria-label="Pay with MoMo">
                        Pay with MoMo
                    </button>
                </div>
            )}

            {tier === 'premium' && paid && (
                <div style={{ margin: '1rem 0' }}>
                    <p>📷 Upload your photo for Premium certificate:</p>
                    <input type="file" accept="image/*" onChange={handleImageUpload} aria-label="Upload your photo" />
                </div>
            )}

            <div
                ref={certRef}
                style={certificateStyle}
                aria-live="polite"
            >
                {tier === 'standard' && !shared && (
                    <div
                        style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(255,255,255,0.8)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.25rem', color: '#555', zIndex: 2,
                        }}
                    >
                        🔒 Share to unlock preview
                    </div>
                )}

                {tier === 'premium' && !paid && (
                    <div
                        style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(255,255,255,0.8)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.25rem', color: '#555', zIndex: 2,
                        }}
                    >
                        🔒 Pay to unlock Premium certificate
                    </div>
                )}

                <div style={{ opacity: tier === 'standard' && !shared ? 0.5 : 1 }}>
                    <div
                        style={watermarkStyle}
                        aria-hidden="true"
                    >
                        CERTIFIED
                    </div>
                    <h2 style={headerStyle}>Certificate of Digital Literacy</h2>
                    <p>This certifies that</p>
                    <h3 aria-label={`Certificate name: ${name || 'YOUR NAME'}`} style={nameStyle}>{name ? name.toUpperCase() : 'YOUR NAME'}</h3>
                    <p>Age: {age || '--'}</p>
                    <p style={{ fontWeight: 'bold', margin: '1rem 0' }}>has demonstrated a digital literacy level of</p>
                    <h3 style={levelStyle} aria-label={`Digital literacy level: ${level}`}>{level}</h3>
                    <p style={awardedStyle}>Awarded on: {new Date().toLocaleDateString()}</p>

                    {tier === 'premium' && paid && customImage && (
                        <img
                            src={customImage}
                            alt="User"
                            style={{ marginTop: '1rem', width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                    )}

                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                            <img src="/signature1.png" alt="Signature" style={{ height: '40px' }} aria-hidden="true" />
                            <p style={{ fontWeight: 'bold' }}>Bellio-Noel</p>
                            <p style={{ fontSize: '.75rem' }}>Examiner</p>
                        </div>
                        <img src="/stamp.png" alt="Stamp" style={{ height: '80px', opacity: 0.85 }} aria-hidden="true" />
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                    onClick={downloadCertificate}
                    disabled={(tier === 'standard' && !shared) || (tier === 'premium' && !paid)}
                    style={{
                        padding: '.75rem 1.5rem',
                        background: ((tier === 'standard' && !shared) || (tier === 'premium' && !paid)) ? '#aaa' : '#28a745',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: ((tier === 'standard' && !shared) || (tier === 'premium' && !paid)) ? 'not-allowed' : 'pointer',
                    }}
                    aria-label="Download certificate"
                >
                    Download {tier.charAt(0).toUpperCase() + tier.slice(1)} Certificate
                </button>

                <button
                    onClick={() => navigate('/quiz')}
                    style={{
                        padding: '.5rem 1rem',
                        background: '#ff9800',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '.5rem',
                    }}
                    aria-label="Try again"
                >
                    <FaRedo /> Try Again
                </button>

                <a
                    href="https://wa.link/xfzgm7"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        padding: '.5rem 1rem',
                        background: '#25D366',
                        color: '#fff',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '.5rem',
                    }}
                    aria-label="Contact us"
                >
                    <FaPhone /> Contact Us
                </a>
            </div>

            {showWhatsAppConfirmation && (
                <div style={{ textAlign: "center", marginTop: "1rem" }}>
                    <p>Did you successfully share the certificate on WhatsApp?</p>
                    <button onClick={() => handleWhatsAppConfirmation(true)} style={{ marginRight: "0.5rem" }} aria-label="Yes, I shared!">Yes, I shared!</button>
                    <button onClick={() => handleWhatsAppConfirmation(false)} aria-label="Share on WhatsApp">Share Now</button>
                </div>
            )}

            {showDialog && (
                <div style={{ position: 'fixed', top: '0', left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} aria-modal="true" role="dialog">
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                        <h3>Share Now?</h3>
                        <p>Sorry, you can't unlock the shared certificate because you didn't share.</p>
                        <button onClick={() => handleDialogAction(true)} aria-label="Share now">Share Now</button>
                        <button onClick={() => handleDialogAction(false)} aria-label="Cancel">Cancel</button>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Certificate;