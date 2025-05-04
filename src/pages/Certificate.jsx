// src/pages/Certificate.jsx

import React, { useRef, useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { FaWhatsapp, FaFacebookF, FaRedo, FaPhone } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../utils/analytics';
import useLocalStorage from '../hooks/useLocalStorage';
import { Helmet } from 'react-helmet';
import { initFacebookSDK } from '../utils/facebook';
import { getBaseUrl } from '../utils/helpers';
import { toast } from 'react-toastify';

const FB_APP_ID = "1043259181031240";

const Certificate = () => {
  const certRef = useRef(null);
  const navigate = useNavigate();
  const baseUrl = getBaseUrl();

  // Persisted state
  const [name, setName] = useLocalStorage('certificateName', '');
  const [age, setAge] = useLocalStorage('certificateAge', '');
  const [shared, setShared] = useLocalStorage('certificateShared', false);
  const [paid, setPaid] = useLocalStorage('certificatePaid', false);
  const [tier, setTier] = useLocalStorage('certificateTier', 'free');

  // Transient state
  const [level, setLevel] = useState('Digital');
  const [customImage, setCustomImage] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [isFacebookSDKReady, setIsFacebookSDKReady] = useState(false);
  const [showWhatsAppConfirmation, setShowWhatsAppConfirmation] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState(''); // <-- new

  // Initialize analytics & SDK
  useEffect(() => {
    trackEvent('page_view', 'certificate_page_viewed', `Tier:${tier}`);
  }, [tier]);

  useEffect(() => {
    const lvl = localStorage.getItem('userLevel');
    if (lvl) setLevel(lvl);

    initFacebookSDK(FB_APP_ID)
      .then(() => setIsFacebookSDKReady(true))
      .catch(() => toast.warn("Facebook sharing may not work correctly."));
  }, []);

  // Handlers
  const handleTierSelect = (t) => {
    setTier(t);
    trackEvent('certificate_tier_selected', 'tier_selected', t);
  };
  const handleNameChange = (e) => setName(e.target.value);
  const handleAgeChange = (e) => setAge(e.target.value);

  const completeSharing = (method) => {
    setShared(true);
    setSharing(false);
    toast.success("Thanks for sharing!");
    trackEvent('certificate_shared', 'shared', method);
  };

  const shareResults = async (method) => {
    setSharing(true);
    const text = `I earned a Digital Literacy Certificate as a ${level}! Get yours: ${baseUrl}/certificate`;

    try {
      if (method === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        setShowWhatsAppConfirmation(true);
      } else if (method === 'facebook') {
        if (window.FB && isFacebookSDKReady) {
          const img = await captureImage();
          window.FB.ui({
            method: 'share',
            href: `${baseUrl}/certificate`,
            quote: text,
            picture: img,
          }, (res) => res && !res.error ? completeSharing('facebook') : toast.error("Facebook sharing failed."));
        } else {
          toast.warn("Facebook SDK not ready.");
          setSharing(false);
        }
      } else if (navigator.share) {
        await navigator.share({ text });
        completeSharing('native');
      } else {
        toast.warn("Sharing not supported.");
        setSharing(false);
      }
    } catch {
      toast.error("Sharing failed.");
      setSharing(false);
    }
  };

  const handleWhatsAppConfirmation = (ok) => {
    setShowWhatsAppConfirmation(false);
    ok ? completeSharing('whatsapp') : setSharing(false);
  };

  const handlePayment = () => {
    toast.success('✅ MoMo payment of 1000 FCFA successful!');
    setPaid(true);
    trackEvent('certificate_paid', 'paid', '1000 FCFA');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCustomImage(reader.result);
    reader.readAsDataURL(file);
    trackEvent('certificate_image_uploaded', 'image_uploaded', file.name);
  };

  // Capture as PNG
  const captureImage = async () => {
    if (!certRef.current) return null;
    try {
      return await toPng(certRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#fff',
      });
    } catch {
      toast.error("Image capture failed.");
      return null;
    }
  };

  // **Enhanced download with status messages**
  const downloadCertificate = async () => {
    if (!name.trim() || !age) return toast.warn('Enter name and age.');
    if (tier === 'standard' && !shared) return toast.info('Please share to unlock.');
    if (tier === 'premium' && !paid) return toast.info('Please pay to unlock.');

    setDownloadStatus('Downloading Certificate…');
    const img = await captureImage();
    if (img) {
      const link = document.createElement('a');
      link.href = img;
      link.download = `CERTIFICATE_${name.toUpperCase()}.png`;
      link.click();
      trackEvent('certificate_downloaded', 'downloaded', tier);
      setDownloadStatus('Download Complete');
    } else {
      setDownloadStatus('');
    }
  };

  // **Responsive, aspect‑ratio‑locked certificate container**
  const certificateStyle = {
    position: 'relative',
    width: '100%',
    maxWidth: '694px',
    aspectRatio: '694 / 650',
    margin: '0 auto',
    padding: '2rem',
    boxSizing: 'border-box',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    background:
      tier === 'premium'
        ? 'linear-gradient(135deg, #fdf5e6, #eae0c8)'
        : tier === 'standard'
        ? 'linear-gradient(135deg, #e6f2ff, #c0d9ed)'
        : '#f9f9f9',
    border:
      tier === 'premium'
        ? '6px solid #FFD700'
        : tier === 'standard'
        ? '6px dashed #007bff'
        : '4px solid #ccc',
    color: tier === 'premium' ? '#555' : '#333',
    overflow: 'visible', // <-- allow stamp to bleed inboard
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
  };

  const watermarkStyle = {
    position: 'absolute',
    top: '50%', left: '50%',
    transform: 'translate(-50%,-50%) rotate(-30deg)',
    fontSize: '6rem',
    opacity: tier === 'free' ? 0.15 : tier === 'standard' ? 0.2 : 0.25,
    fontWeight: 'bold',
    pointerEvents: 'none',
  };

  const headerStyle = {
    fontSize: '2.5vw',
    margin: '0.5em 0',
    textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
    color: tier === 'premium' ? '#c59b08' : tier === 'standard' ? '#0056b3' : '#007bff',
  };
  const nameStyle = {
    fontSize: '2.2vw',
    textTransform: 'uppercase',
    margin: '0.5em 0',
    letterSpacing: '1px',
  };
  const levelStyle = {
    fontSize: '1.8vw',
    fontWeight: 'bold',
    margin: '0.5em 0',
    color: tier === 'premium' ? '#b8860b' : tier === 'standard' ? '#0056b3' : '#d32f2f',
  };
  const awardedStyle = { fontSize: '0.9vw', fontStyle: 'italic', color: '#555' };

  return (
    <main style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <Helmet>
        <title>Digital Literacy Certificate</title>
        <meta name="description" content="Earn your Digital Literacy Certificate!" />
      </Helmet>

      <h1>Choose Your Certificate Tier</h1>
      <p>{sharing ? 'Sharing in progress…' : 'Ready to share'}</p>

      {/* Tier Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', margin: '1.5rem 0' }}>
        {['free','standard','premium'].map(opt => (
          <button
            key={opt}
            onClick={() => handleTierSelect(opt)}
            style={{
              padding: '0.5rem 1rem', borderRadius: '6px',
              border: tier===opt?'2px solid #007bff':'1px solid #ccc',
              background: tier===opt?'#007bff':'#fff',
              color: tier===opt?'#fff':'#333',
              cursor: 'pointer', textTransform: 'capitalize'
            }}
            aria-label={`Select ${opt}`}
          >
            {opt==='free'?'Free':opt==='standard'?'Share‑Unlock':'Premium (1000 FCFA)'}
          </button>
        ))}
      </div>

      {/* Name/Age Inputs */}
      <div style={{ display:'flex', justifyContent:'center', gap:'1rem', flexWrap:'wrap', marginBottom:'1rem' }}>
        <input
          type="text" placeholder="Full Name" value={name} onChange={handleNameChange}
          style={{ padding:'0.5rem', borderRadius:'6px', border:'1px solid #ccc', minWidth:'200px' }}
        />
        <input
          type="number" placeholder="Age" value={age} onChange={handleAgeChange}
          style={{ padding:'0.5rem', borderRadius:'6px', border:'1px solid #ccc', minWidth:'100px' }}
        />
      </div>

      {/* Share / Pay / Upload */}
      {tier==='standard' && !shared && (
        <div style={{ margin:'1rem 0' }}>
          <p>🔓 Share to unlock Standard certificate:</p>
          <button onClick={()=>shareResults('whatsapp')} aria-label="WhatsApp"><FaWhatsapp/> WhatsApp</button>
          <button onClick={()=>shareResults('facebook')} aria-label="Facebook" disabled={!isFacebookSDKReady}><FaFacebookF/> Facebook</button>
        </div>
      )}
      {tier==='premium' && !paid && (
        <div style={{ margin:'1rem 0' }}>
          <p>💳 Pay 1000 FCFA via MoMo to unlock Premium:</p>
          <button onClick={handlePayment} style={{ background:'#fcc400',padding:'.5rem 1rem',border:'none',borderRadius:'6px' }}>Pay with MoMo</button>
        </div>
      )}
      {tier==='premium' && paid && (
        <div style={{ margin:'1rem 0' }}>
          <p>📷 Upload your photo for Premium:</p>
          <input type="file" accept="image/*" onChange={handleImageUpload} aria-label="Upload photo"/>
        </div>
      )}

      {/* Certificate */}
      <div ref={certRef} style={certificateStyle} aria-live="polite">
        {(tier==='standard' && !shared) && (
          <div style={{
            position:'absolute',inset:0,
            background:'rgba(255,255,255,0.8)',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:'1.25rem',color:'#555',zIndex:2,
          }}>🔒 Share to preview</div>
        )}
        {(tier==='premium' && !paid) && (
          <div style={{
            position:'absolute',inset:0,
            background:'rgba(255,255,255,0.8)',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:'1.25rem',color:'#555',zIndex:2,
          }}>🔒 Pay to preview</div>
        )}

        <div style={{ position:'relative', height:'100%', opacity: (tier==='standard'&&!shared)?0.5:1 }}>
          <div style={watermarkStyle} aria-hidden="true">CERTIFIED</div>
          <h2 style={headerStyle}>Certificate of Digital Literacy</h2>
          <p>This certifies that</p>
          <h3 style={nameStyle} aria-label={`Name: ${name}`}>{name?name.toUpperCase():'YOUR NAME'}</h3>
          <p>Age: {age||'--'}</p>
          <p style={{fontWeight:'bold',margin:'1rem 0'}}>has demonstrated a digital literacy level of</p>
          <h3 style={levelStyle} aria-label={`Level: ${level}`}>{level}</h3>
          <p style={awardedStyle}>Awarded on: {new Date().toLocaleDateString()}</p>

          {tier==='premium'&&paid&&customImage&&(
            <img src={customImage} alt="User" style={{
              marginTop:'1rem',width:'20%',borderRadius:'50%',objectFit:'cover'
            }}/>
          )}

          {/* bottom row with stamp shifted inboard */}
          <div style={{ marginTop:'auto', display:'flex', justifyContent:'space-around', alignItems:'center' }}>
            <div style={{ textAlign:'center' }}>
              <img src="/signature1.png" alt="Signature" style={{ height:'3vw' }}/>
              <p style={{fontWeight:'bold'}}>Bellio-Noel</p>
              <p style={{fontSize:'0.75rem'}}>Examiner</p>
            </div>
            <img src="/stamp.png" alt="Stamp" style={{ height:'6vw', opacity:0.85 }}/>
          </div>
        </div>
      </div>

      {/* Actions & Download Status */}
      <div style={{ marginTop:'1.5rem',display:'flex',justifyContent:'center',gap:'1rem',flexWrap:'wrap' }}>
        <button
          onClick={downloadCertificate}
          disabled={(tier==='standard'&&!shared)||(tier==='premium'&&!paid)}
          style={{
            padding:'.75rem 1.5rem',
            background:((tier==='standard'&&!shared)||(tier==='premium'&&!paid))?'#aaa':'#28a745',
            color:'#fff',border:'none',borderRadius:'6px',
            cursor:((tier==='standard'&&!shared)||(tier==='premium'&&!paid))?'not-allowed':'pointer'
          }}
        >
          Download {tier.charAt(0).toUpperCase()+tier.slice(1)} Certificate
        </button>
        <button onClick={()=>navigate('/quiz')} style={{
          padding:'.5rem 1rem',background:'#ff9800',color:'#fff',border:'none',
          borderRadius:'6px',display:'flex',alignItems:'center',gap:'.5rem'
        }} aria-label="Retry"><FaRedo/> Try Again</button>
        <a href="https://wa.link/xfzgm7" target="_blank" rel="noopener noreferrer" style={{
          padding:'.5rem 1rem',background:'#25D366',color:'#fff',borderRadius:'6px',
          display:'flex',alignItems:'center',gap:'.5rem'
        }} aria-label="Contact"><FaPhone/> Contact Us</a>
      </div>

      {/* Download status message */}
      {downloadStatus && (
        <p style={{ marginTop: '1rem', fontStyle: 'italic', color: '#555' }}>
          {downloadStatus}
        </p>
      )}

      {/* WhatsApp Confirmation */}
      {showWhatsAppConfirmation && (
        <div style={{ textAlign:'center',marginTop:'1rem' }}>
          <p>Did you share on WhatsApp?</p>
          <button onClick={()=>handleWhatsAppConfirmation(true)}>Yes</button>
          <button onClick={()=>handleWhatsAppConfirmation(false)}>No</button>
        </div>
      )}
    </main>
  );
};

export default Certificate;
