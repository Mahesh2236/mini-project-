import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { printReportAsPDF } from "../utils/reportGenerator";
import LocationPicker from "../components/LocationPicker";

const API_BASE = "http://localhost:8000";

const PRIORITY_CONFIG = {
  LOW:      { color: "#27ae60", bg: "#eafaf1", border: "#a9dfbf", icon: "👁️" },
  MEDIUM:   { color: "#f39c12", bg: "#fefae6", border: "#f9e79f", icon: "🔧" },
  HIGH:     { color: "#e67e22", bg: "#fef5ec", border: "#fad7a0", icon: "⚠️" },
  CRITICAL: { color: "#c0392b", bg: "#fdecea", border: "#f1948a", icon: "🚨" },
  CLEAR:    { color: "#27ae60", bg: "#eafaf1", border: "#a9dfbf", icon: "✅" },
};

const SUBMIT_STEPS = [
  { key: "db",    label: "Saving report to database..."  },
  { key: "email", label: "Sending confirmation email..."  },
  { key: "pdf",   label: "Generating PDF report..."       },
];

// ── Email format validator ───────────────────────────────────────────
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ── Step Indicator ───────────────────────────────────────────────────
function StepIndicator({ currentStep }) {
  const steps = [
    { num: 1, label: "Upload & Info"   },
    { num: 2, label: "Review Results"  },
    { num: 3, label: "Done"            },
  ];
  return (
    <div className="step-indicator">
      {steps.map((s, i) => (
        <div key={s.num} className="step-indicator-item">
          <div className={`step-circle ${currentStep === s.num ? "step-active" : currentStep > s.num ? "step-done" : "step-pending"}`}>
            {currentStep > s.num ? "✓" : s.num}
          </div>
          <div className={`step-label ${currentStep === s.num ? "step-label-active" : ""}`}>{s.label}</div>
          {i < steps.length - 1 && (
            <div className={`step-connector ${currentStep > s.num ? "step-connector-done" : ""}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function DetectPage() {
  // ── Step: 1 | 2 | 3 ─────────────────────────────────────────────
  const [step, setStep] = useState(1);

  // ── Input state ──────────────────────────────────────────────────
  const [tab, setTab]         = useState("upload");
  const [files, setFiles]     = useState([]);
  const [previews, setPreviews] = useState([]);

  // Camera
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError,  setCameraError]  = useState("");

  // GPS
  const [gpsStatus,  setGpsStatus]  = useState("idle");
  const [gpsAddress, setGpsAddress] = useState("");

  // Form
  const [form, setForm] = useState({
    citizen_name: "", citizen_email: "", citizen_phone: "", location: "",
    latitude: null, longitude: null, address: ""
  });
  const [emailError,  setEmailError]  = useState("");
  const [formErrors,  setFormErrors]  = useState({});

  // ── Analysis state ───────────────────────────────────────────────
  const [analyzing,    setAnalyzing]    = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const [analysisData, setAnalysisData] = useState(null);

  // ── Submission state ─────────────────────────────────────────────
  const [submitting,    setSubmitting]    = useState(false);
  const [submitError,   setSubmitError]   = useState("");
  const [stepsDone,     setStepsDone]     = useState([]);
  const [submitResult,  setSubmitResult]  = useState(null);

  // OTP state
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  const fileInputRef = useRef();
  const addMoreRef   = useRef();

  // ── GPS ──────────────────────────────────────────────────────────
  const requestGPS = useCallback(() => {
    setGpsStatus("requesting");
    if (!navigator.geolocation) { setGpsStatus("error"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const locStr = `${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E (GPS ±${Math.round(accuracy)}m)`;
        setGpsAddress(locStr);
        setGpsStatus("granted");
        setForm(f => ({ ...f, location: locStr }));
      },
      (err) => setGpsStatus(err.code === 1 ? "denied" : "error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // ── Camera ───────────────────────────────────────────────────────
  const startCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch {
      setCameraError("Camera access denied or unavailable on this device.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current, canvas = canvasRef.current;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `camera_${Date.now()}.jpg`, { type: "image/jpeg" });
      const url  = URL.createObjectURL(blob);
      setFiles(f => [...f, file].slice(0, 10));
      setPreviews(p => [...p, url].slice(0, 10));
    }, "image/jpeg", 0.92);
  };

  const handleCameraTab = () => {
    setTab("camera");
    if (gpsStatus === "idle") requestGPS();
  };

  useEffect(() => { if (tab !== "camera") stopCamera(); return () => stopCamera(); }, [tab]);

  // ── File Upload ──────────────────────────────────────────────────
  const addFiles = (newFiles) => {
    const arr = Array.from(newFiles);
    setFiles(f => [...f, ...arr].slice(0, 10));
    setPreviews(p => [...p, ...arr.map(f => URL.createObjectURL(f))].slice(0, 10));
    setAnalyzeError("");
  };

  const removeFile = (idx) => {
    setFiles(f => f.filter((_, i) => i !== idx));
    setPreviews(p => p.filter((_, i) => i !== idx));
  };

  // ── OTP Handlers ─────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!isValidEmail(form.citizen_email)) {
      setEmailError("Please enter a valid email to receive OTP.");
      return;
    }
    setOtpLoading(true); setOtpError("");
    try {
      await axios.post(`${API_BASE}/send-otp`, { email: form.citizen_email });
      setOtpSent(true);
    } catch (err) {
      setOtpError(err.response?.data?.detail || "Failed to send OTP. Try again.");
    } finally { setOtpLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setOtpError("Please enter the 6-digit code.");
      return;
    }
    setOtpLoading(true); setOtpError("");
    try {
      await axios.post(`${API_BASE}/verify-otp`, { email: form.citizen_email, otp });
      setOtpVerified(true);
    } catch (err) {
      setOtpError(err.response?.data?.detail || "Invalid code. Please check and try again.");
    } finally { setOtpLoading(false); }
  };

  const getCaptchaToken = async () => {
    return new Promise((resolve) => {
      const siteKey = "6Le-g4ssAAAAAESvbgGLOgYqXV3FdXp_FQL3xAk9";
      if (typeof window.grecaptcha === 'undefined') {
        console.warn("reCAPTCHA not loaded");
        resolve("dev-token");
        return;
      }
      window.grecaptcha.ready(() => {
        window.grecaptcha.execute(siteKey, { action: 'submit' }).then(token => resolve(token));
      });
    });
  };

  // ── Email validation on blur ─────────────────────────────────────
  const handleEmailBlur = () => {
    if (form.citizen_email && !isValidEmail(form.citizen_email)) {
      setEmailError("Please enter a valid email address (e.g. name@gmail.com)");
    } else {
      setEmailError("");
    }
  };

  // ── Validate Step 1 form ─────────────────────────────────────────
  const validateStep1 = () => {
    const errors = {};
    if (files.length === 0)            errors.files        = "Please upload or capture at least one road image.";
    if (!form.citizen_name.trim())     errors.citizen_name = "Full name is required.";
    if (!form.location.trim())         errors.location     = "Damage location is required.";
    if (!form.citizen_email)           errors.citizen_email = "Email is required for verification.";
    else if (!isValidEmail(form.citizen_email)) {
      errors.citizen_email = "Please enter a valid email address (e.g. name@gmail.com)";
    }
    if (!otpVerified)                  errors.citizen_email = "Please verify your email address via OTP.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── STEP 1 → STEP 2: Analyze ────────────────────────────────────
  const handleAnalyze = async () => {
    if (!validateStep1()) return;

    setAnalyzing(true);
    setAnalyzeError("");

    const fd = new FormData();
    files.forEach(f => fd.append("files", f));

    try {
      const res = await axios.post(`${API_BASE}/analyze`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAnalysisData(res.data);
      setStep(2);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === "object"
        ? `${detail.filename}: ${detail.reason}`
        : detail || "Analysis failed. Please check backend is running at localhost:8000";
      setAnalyzeError(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  // ── STEP 2 → STEP 3: Submit ──────────────────────────────────────
  const handleSubmit = async () => {
    // Re-validate email in case they edited it on Step 2
    if (form.citizen_email && !isValidEmail(form.citizen_email)) {
      setEmailError("Please enter a valid email address (e.g. name@gmail.com)");
      return;
    }
    if (!form.citizen_name.trim()) {
      setSubmitError("Name is required.");
      return;
    }
    if (!form.latitude || !form.longitude) {
      alert("Please select the complaint location on the map.");
      setSubmitError("Please select the complaint location on the map.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    setStepsDone([]);

    const summary = analysisData.batch_summary;
    const captchaToken = await getCaptchaToken();

    let submitRes;
    try {
      const res = await axios.post(`${API_BASE}/submit`, {
        citizen_name:     form.citizen_name,
        citizen_email:    form.citizen_email || "",
        citizen_phone:    form.citizen_phone || "",
        location: {
          latitude:       form.latitude,
          longitude:      form.longitude,
          address:        form.address || form.location,
        },
        image_paths:      analysisData._image_paths,
        processed_paths:  analysisData._processed_paths,
        total_potholes:   summary.total_potholes,
        worst_severity:   summary.worst_severity,
        overall_priority: summary.overall_priority,
        max_confidence:   summary.max_confidence,
        has_detection:    summary.has_detection,
        total_images:     summary.total_images,
        captcha_token:    captchaToken,
      });
      submitRes = res.data;

      // Fix 404: backend renamed tmp_ files → update image URLs to permanent paths
      if (submitRes.permanent_image_paths && submitRes.permanent_processed_paths) {
        setAnalysisData(prev => ({
          ...prev,
          _image_paths:     submitRes.permanent_image_paths,
          _processed_paths: submitRes.permanent_processed_paths,
          results: prev.results.map((r, i) => ({
            ...r,
            image_url:           `/${submitRes.permanent_image_paths[i]     ?? prev._image_paths[i]}`,
            processed_image_url: `/${submitRes.permanent_processed_paths[i] ?? prev._processed_paths[i]}`,
          })),
        }));
      }
    } catch (err) {
      setSubmitError(err.response?.data?.detail || "Submission failed. Please try again.");
      setSubmitting(false);
      return;
    }

    // Animate progress steps
    await delay(600);  setStepsDone(["db"]);
    await delay(700);  setStepsDone(["db", "email"]);
    await delay(700);  setStepsDone(["db", "email", "pdf"]);
    await delay(400);

    // Auto-download PDF
    printReportAsPDF({
      batchReport: {
        ...summary,
        report_id:    submitRes.report_id,
        generated_at: submitRes.created_at,
      },
      imageResults: analysisData.results,
      citizen: { name: form.citizen_name, email: form.citizen_email, phone: form.citizen_phone },
      location: form.location,
    });

    setSubmitResult(submitRes);
    setSubmitting(false);
    setStep(3);
  };

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  // ── Reset ────────────────────────────────────────────────────────
  const handleReset = () => {
    setFiles([]); setPreviews([]);
    setAnalysisData(null); setSubmitResult(null);
    setStepsDone([]); setAnalyzeError(""); setSubmitError("");
    setEmailError(""); setFormErrors({});
    setAnalyzing(false); setSubmitting(false);
    setStep(1);
    setForm({ 
      citizen_name: "", citizen_email: "", citizen_phone: "", location: gpsAddress || "",
      latitude: null, longitude: null, address: ""
    });
    stopCamera(); setCameraActive(false);
  };

  const batchSummary = analysisData?.batch_summary;
  const pCfg = batchSummary
    ? (PRIORITY_CONFIG[batchSummary.overall_priority] || PRIORITY_CONFIG["CLEAR"])
    : null;

  // ════════════════════════════════════════════════════════════════
  return (
    <main id="main-content" className="page-wrapper">
      <div className="page-header">
        <div className="breadcrumb">🏠 Home › Report Road Damage</div>
        <h1 className="page-title">Report Road Damage</h1>
        <p className="page-subtitle">Upload road images for instant AI-powered damage assessment</p>
      </div>

      {/* Step Indicator */}
      <StepIndicator currentStep={step} />

      {/* ══════════════ STEP 1 ══════════════ */}
      {step === 1 && (
        <div className="detect-layout">

          {/* LEFT: Images */}
          <div className="detect-form-panel">
            <div className="form-card">
              <div className="form-card-header">
                <span className="form-card-icon">📸</span>
                <span>
                  Add Road Images
                  {files.length > 0 && <span className="img-count-badge">{files.length}/10</span>}
                </span>
              </div>

              <div className="input-tabs">
                <button className={`input-tab ${tab === "upload" ? "active" : ""}`} onClick={() => setTab("upload")}>📁 Upload</button>
                <button className={`input-tab ${tab === "camera" ? "active" : ""}`} onClick={handleCameraTab}>📷 Camera</button>
              </div>

              {tab === "upload" && (
                <div className="tab-content">
                  <div className="upload-zone"
                    onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current.click()}>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={e => addFiles(e.target.files)} />
                    <div className="upload-icon">📁</div>
                    <div className="upload-title">Drag & Drop road images here</div>
                    <div className="upload-sub">or click to browse</div>
                    <div className="upload-formats">JPG, PNG, JPEG, WEBP — up to 10 images, max 10MB each</div>
                  </div>
                </div>
              )}

              {tab === "camera" && (
                <div className="tab-content">
                  <div className={`gps-status-bar gps-${gpsStatus}`}>
                    {gpsStatus === "idle"       && <span>📍 GPS location will be requested</span>}
                    {gpsStatus === "requesting" && <span>📍 Requesting GPS location...</span>}
                    {gpsStatus === "granted"    && <span>✅ GPS: {gpsAddress}</span>}
                    {gpsStatus === "denied"     && <span>⚠️ GPS denied <button className="gps-retry-btn" onClick={requestGPS}>Retry</button></span>}
                    {gpsStatus === "error"      && <span>⚠️ GPS unavailable <button className="gps-retry-btn" onClick={requestGPS}>Retry</button></span>}
                  </div>
                  {cameraError && <div className="error-box" style={{margin:"0 0.75rem 0.75rem"}}>{cameraError}</div>}
                  {!cameraActive ? (
                    <div className="camera-start-box">
                      <div className="camera-icon">📷</div>
                      <div className="camera-start-title">Rear camera for road photos</div>
                      <div className="camera-start-sub">Rear-facing camera selected by default</div>
                      <button className="btn-start-camera" onClick={startCamera}>▶ Start Camera</button>
                    </div>
                  ) : (
                    <div className="camera-view">
                      <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
                      <canvas ref={canvasRef} style={{display:"none"}} />
                      <div className="camera-controls">
                        <button className="btn-capture" onClick={capturePhoto} disabled={files.length >= 10}>
                          📸 Capture {files.length >= 10 && "(Max)"}
                        </button>
                        <button className="btn-stop-camera" onClick={stopCamera}>⏹ Stop</button>
                      </div>
                      {files.length > 0 && <div className="captured-count">✅ {files.length} photo(s) ready</div>}
                    </div>
                  )}
                </div>
              )}

              {/* Image Manager */}
              {previews.length > 0 && (
                <div className="image-manager">
                  <div className="img-manager-title">
                    📋 Selected ({files.length}/10)
                    {files.length < 10 && (
                      <button className="btn-add-more" onClick={() => addMoreRef.current.click()}>+ Add More</button>
                    )}
                    <input ref={addMoreRef} type="file" accept="image/*" multiple hidden onChange={e => addFiles(e.target.files)} />
                  </div>
                  <div className="image-thumbs">
                    {previews.map((p, i) => (
                      <div className="img-thumb" key={i}>
                        <img src={p} alt={`Image ${i+1}`} />
                        <button className="img-delete-btn" onClick={() => removeFile(i)} title="Remove">✕</button>
                        <div className="img-thumb-label">{i+1}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formErrors.files && <div className="field-error" style={{margin:"0.5rem 1rem 0.75rem"}}>⚠️ {formErrors.files}</div>}
            </div>

            {/* Citizen & Complaint Info */}
            <div className="form-card">
              <div className="form-card-header">
                <span className="form-card-icon">👤</span>
                <span>Complaint Information</span>
              </div>
              <div className="form-grid">


                <div className="form-group">
                  <label>Full Name <span className="required-star">*</span></label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={form.citizen_name}
                    className={formErrors.citizen_name ? "input-error" : ""}
                    onChange={e => { setForm({...form, citizen_name: e.target.value}); setFormErrors(fe => ({...fe, citizen_name: ""})); }}
                  />
                  {formErrors.citizen_name && <div className="field-error">⚠️ {formErrors.citizen_name}</div>}
                </div>

                <div className="form-group">
                  <label>Email Address <span className="required-star">*</span></label>
                  <div className="email-input-row" style={{display:"flex", gap:"8px"}}>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={form.citizen_email}
                      disabled={otpVerified}
                      className={emailError || formErrors.citizen_email ? "input-error" : ""}
                      onChange={e => { setForm({...form, citizen_email: e.target.value}); setEmailError(""); setFormErrors(fe => ({...fe, citizen_email: ""})); }}
                      onBlur={handleEmailBlur}
                      style={{flex:1}}
                    />
                    {!otpVerified && (
                      <button className="btn-verify-email" onClick={handleSendOtp} disabled={otpLoading || !form.citizen_email}
                        style={{padding:"0 12px", background:"#003366", color:"#fff", border:"none", borderRadius:"4px", fontSize:"0.8rem", cursor:"pointer"}}>
                        {otpLoading ? "..." : otpSent ? "Resend" : "Verify"}
                      </button>
                    )}
                    {otpVerified && <span className="verified-badge" style={{color:"#138808", fontWeight:700, fontSize:"0.8rem", display:"flex", alignItems:"center"}}>✅ Verified</span>}
                  </div>

                  {otpSent && !otpVerified && (
                    <div className="otp-entry-row" style={{display:"flex", gap:"8px", marginTop:"8px"}}>
                      <input type="text" maxLength="6" placeholder="6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)}
                        style={{flex:1, textAlign:"center", letterSpacing:"4px", fontWeight:700}} />
                      <button className="btn-confirm-otp" onClick={handleVerifyOtp} disabled={otpLoading}
                        style={{padding:"0 12px", background:"#138808", color:"#fff", border:"none", borderRadius:"4px", fontSize:"0.8rem", cursor:"pointer"}}>
                        {otpLoading ? "..." : "Confirm Code"}
                      </button>
                    </div>
                  )}

                  {otpError && <div className="field-error" style={{color:"#c0392b", fontSize:"0.72rem", marginTop:"4px"}}>⚠️ {otpError}</div>}
                  {(emailError || formErrors.citizen_email) && (
                    <div className="field-error" style={{color:"#c0392b", fontSize:"0.72rem", marginTop:"4px"}}>⚠️ {emailError || formErrors.citizen_email}</div>
                  )}
                  {!emailError && !formErrors.citizen_email && !otpSent && (
                    <span className="form-hint" style={{fontSize:"0.7rem", color:"#888"}}>📧 OTP verification required to prevent spam</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Phone Number <span className="optional-tag">Optional</span></label>
                  <input
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={form.citizen_phone}
                    onChange={e => setForm({...form, citizen_phone: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>
                    Precise Damage Location <span className="required-star">*</span>
                  </label>
                  <LocationPicker 
                    onLocationSelect={(data) => {
                      setForm(prev => ({
                        ...prev, 
                        latitude: data.latitude, 
                        longitude: data.longitude, 
                        address: data.address,
                        location: data.address // Use address as the 'location' text field
                      }));
                      setFormErrors(fe => ({...fe, location: ""}));
                    }} 
                  />
                  {formErrors.location && <div className="field-error">⚠️ {formErrors.location}</div>}
                </div>

                <div className="security-info-row" style={{marginTop:"8px", textAlign:"right", padding:"0 4px"}}>
                  <span style={{fontSize:"0.65rem", color:"#888", fontStyle:"italic"}}>
                    🛡️ This site is protected by reCAPTCHA and the Google <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" style={{color:"#888"}}>Privacy Policy</a> and <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" style={{color:"#888"}}>Terms of Service</a> apply.
                  </span>
                </div>

              </div>
            </div>

            {analyzeError && <div className="error-box" style={{marginBottom:"1rem"}}>⚠️ {analyzeError}</div>}

            <div className="submit-row">
              <button 
                className="btn-submit" 
                onClick={handleAnalyze} 
                disabled={analyzing || !form.latitude}
                title={!form.latitude ? "Please select a location on the map first" : ""}
              >
                {analyzing
                  ? <><span className="spinner"></span> Analyzing {files.length} image(s)...</>
                  : "🔍 Analyze Images"}
              </button>
            </div>
          </div>

          {/* RIGHT: Placeholder */}
          <div className="detect-results-panel">
            <div className="results-placeholder">
              <div className="placeholder-icon">🛣️</div>
              <div className="placeholder-title">Detection Results</div>
              <div className="placeholder-sub">Add images, fill in your details, and click Analyze to run the AI assessment</div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ STEP 2 ══════════════ */}
      {step === 2 && analysisData && batchSummary && (
        <div className="detect-layout">

          {/* LEFT: Editable form (citizen can fix typos before submitting) */}
          <div className="detect-form-panel">
            <div className="form-card">
              <div className="form-card-header">
                <span className="form-card-icon">👤</span>
                <span>Review Your Information</span>
                <span className="editable-tag">✏️ Editable</span>
              </div>
              <div className="form-grid">

                <div className="form-group">
                  <label>Full Name <span className="required-star">*</span></label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={form.citizen_name}
                    onChange={e => setForm({...form, citizen_name: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Email Address <span className="optional-tag">Optional</span></label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={form.citizen_email}
                    className={emailError ? "input-error" : ""}
                    onChange={e => { setForm({...form, citizen_email: e.target.value}); setEmailError(""); }}
                    onBlur={handleEmailBlur}
                  />
                  {emailError && <div className="field-error">⚠️ {emailError}</div>}
                </div>

                <div className="form-group">
                  <label>Phone Number <span className="optional-tag">Optional</span></label>
                  <input
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={form.citizen_phone}
                    onChange={e => setForm({...form, citizen_phone: e.target.value})}
                  />
                </div>


                <div className="form-group">
                  <label>Damage Location <span className="required-star">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. NH-44, Near Nagpur Toll"
                    value={form.location}
                    onChange={e => setForm({...form, location: e.target.value})}
                  />
                </div>

              </div>
            </div>

            {/* Image thumbs (read-only) */}
            <div className="form-card">
              <div className="form-card-header">
                <span className="form-card-icon">📸</span>
                <span>Submitted Images ({previews.length})</span>
              </div>
              <div className="image-manager" style={{borderTop:"none"}}>
                <div className="image-thumbs">
                  {previews.map((p, i) => (
                    <div className="img-thumb" key={i}>
                      <img src={p} alt={`Image ${i+1}`} />
                      <div className="img-thumb-label">{i+1}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {submitError && <div className="error-box" style={{marginBottom:"1rem"}}>⚠️ {submitError}</div>}

            {/* Submit button */}
            {!submitting && (
              <div className="submit-row">
                <button className="btn-confirm-submit" onClick={handleSubmit}>
                  ✅ Submit Official Report
                </button>
                <button className="btn-back" onClick={() => { setStep(1); setAnalysisData(null); }}>
                  ← Go Back & Edit Images
                </button>
              </div>
            )}

            {/* Submission progress */}
            {submitting && (
              <div className="submission-progress-card">
                <div className="spc-title">Submitting Your Report...</div>
                {SUBMIT_STEPS.map((s, i) => {
                  const isDone   = stepsDone.includes(s.key);
                  const isActive = !isDone && stepsDone.length === i;
                  return (
                    <div className={`spc-step ${isDone ? "spc-done" : isActive ? "spc-active" : "spc-pending"}`} key={s.key}>
                      <div className="spc-icon">{isDone ? "✅" : <span className="spc-spinner"></span>}</div>
                      <div className="spc-label">{s.label}</div>
                    </div>
                  );
                })}
              </div>
            )}

            <button className="btn-reset-small" onClick={handleReset} style={{marginTop:"0.75rem"}}>↺ Start New Report</button>
          </div>

          {/* RIGHT: Detection Results */}
          <div className="detect-results-panel">

            {/* Batch Summary */}
            <div className="batch-summary-card" style={{borderColor: pCfg.border}}>
              <div className="bsc-header" style={{background: pCfg.color}}>
                <div className="bsc-left">
                  <div className="bsc-report-id">AI Analysis Complete</div>
                  <div className="bsc-sub">{batchSummary.total_images} image(s) analyzed — review and submit below</div>
                </div>
                <div className="bsc-priority-badge">{pCfg.icon} {batchSummary.overall_priority}</div>
              </div>

              {batchSummary.has_detection ? (
                <div className="bsc-stats" style={{background: pCfg.bg}}>
                  <div className="bsc-stat"><div className="bsc-stat-label">Total Potholes</div><div className="bsc-stat-val">{batchSummary.total_potholes}</div></div>
                  <div className="bsc-stat"><div className="bsc-stat-label">Worst Severity</div><div className="bsc-stat-val">{batchSummary.worst_severity}</div></div>
                  <div className="bsc-stat"><div className="bsc-stat-label">Max Confidence</div><div className="bsc-stat-val">{(parseFloat(batchSummary.max_confidence)*100).toFixed(1)}%</div></div>
                  <div className="bsc-stat"><div className="bsc-stat-label">Action Needed</div><div className="bsc-stat-val" style={{color:pCfg.color,fontSize:"0.82rem"}}>{batchSummary.recommended_action}</div></div>
                </div>
              ) : (
                <div className="no-detection-box" style={{margin:"1rem"}}>
                  <div className="no-det-icon">✅</div>
                  <div className="no-det-title">No Road Damage Detected</div>
                  <div className="no-det-sub">AI found no significant damage across all submitted images.</div>
                </div>
              )}
            </div>

            {/* Per-image result cards */}
            {analysisData.results.map((result, idx) => {
              const ir    = result.image_report;
              const iPCfg = PRIORITY_CONFIG[ir?.priority_level || "CLEAR"] || PRIORITY_CONFIG["CLEAR"];
              return (
                <div className="result-card" key={idx}>
                  <div className="result-card-header">
                    <span>🖼️ Image {idx+1} of {analysisData.results.length}: {result.filename}</span>
                    <span className="report-id-badge" style={{background: iPCfg.color}}>
                      {ir ? ir.priority_level : "CLEAR"}
                    </span>
                  </div>
                  <div className="result-images">
                    <div className="result-image-box">
                      <div className="result-image-label">Original</div>
                      <img src={`${API_BASE}${result.image_url}`} alt="Original" />
                    </div>
                    <div className="result-image-box">
                      <div className="result-image-label">AI Detection</div>
                      <img src={`${API_BASE}${result.processed_image_url}`} alt="Processed" />
                    </div>
                  </div>
                  {ir ? (
                    <div className="report-details" style={{borderColor:iPCfg.border, background:iPCfg.bg}}>
                      <div className="report-priority-banner" style={{background:iPCfg.color}}>
                        <span>{iPCfg.icon} {ir.priority_level}</span>
                        <span style={{marginLeft:"auto",fontSize:"0.82rem"}}>— {ir.recommended_action}</span>
                      </div>
                      <div className="report-stats-grid">
                        <div className="report-stat"><div className="rs-label">Potholes</div><div className="rs-value">{ir.detected_potholes}</div></div>
                        <div className="report-stat"><div className="rs-label">Severity</div><div className="rs-value">{ir.highest_severity}</div></div>
                        <div className="report-stat"><div className="rs-label">Confidence</div><div className="rs-value">{(parseFloat(ir.confidence_level)*100).toFixed(1)}%</div></div>
                      </div>
                    </div>
                  ) : (
                    <div className="no-detection-box" style={{margin:"0 1.25rem 1rem"}}>
                      <div className="no-det-icon">✅</div>
                      <div className="no-det-title">No Damage Detected</div>
                      <div className="no-det-sub">Road appears in good condition in this image.</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════ STEP 3 ══════════════ */}
      {step === 3 && submitResult && (
        <div className="step3-wrapper">
          <div className="success-banner">
            <div className="sb-icon">🎉</div>
            <div className="sb-title">Report Successfully Submitted!</div>
            <div className="sb-report-id">{submitResult.report_id}</div>
            <div className="sb-sub">Your report has been officially recorded.</div>
            <div className="sb-details">
              {/* Only show email line if email was actually provided */}
              {form.citizen_email && submitResult.email_sent && (
               <div className="sb-detail-item">✅ Confirmation email sent to <strong>{form.citizen_email}</strong></div>
              )}
              <div className="sb-detail-item">📍 Location: <strong>{submitResult.location?.address || form.address || form.location}</strong></div>
              {submitResult.location?.latitude && (
                <div className="sb-detail-item" style={{fontSize:"0.8rem", color:"#666", paddingLeft:"24px"}}>
                  GPS: {submitResult.location.latitude.toFixed(5)}, {submitResult.location.longitude.toFixed(5)}
                </div>
              )}
              <div className="sb-detail-item">📄 PDF report has been downloaded to your device</div>
            </div>
            <div className="sb-track-note">
              Track your report anytime at the <strong>Track Report</strong> page using ID: <strong>{submitResult.report_id}</strong>
            </div>
            <div className="sb-actions" style={{display:"flex", gap:"1rem", justifyContent:"center", marginTop:"1.5rem"}}>
              <button className="btn-submit" style={{width:"auto", padding:"0.75rem 2rem"}} onClick={handleReset}>
                ↺ Start New Report
              </button>
              <button 
                className="btn-submit" 
                style={{width:"auto", padding:"0.75rem 2rem", background:"#003366"}}
                onClick={() => {
                  window.location.href = `/track?id=${submitResult.report_id}&email=${form.citizen_email}`;
                }}
              >
                🔍 Track Live Progress
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline styles for new elements */}
      <style>{`
        /* ── Step Indicator ── */
        .step-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          padding: 1.5rem 2rem 0.5rem;
          max-width: 480px;
          margin: 0 auto;
        }
        .step-indicator-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          flex: 1;
        }
        .step-circle {
          width: 36px; height: 36px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.9rem;
          border: 2px solid #ccc;
          background: #fff;
          color: #999;
          transition: all 0.3s;
          z-index: 1;
        }
        .step-active  { border-color: #003366; background: #003366; color: #fff; }
        .step-done    { border-color: #138808; background: #138808; color: #fff; }
        .step-pending { border-color: #ccc; background: #f5f5f5; color: #aaa; }
        .step-label {
          font-size: 0.72rem; color: #888; margin-top: 0.3rem;
          text-align: center; white-space: nowrap;
        }
        .step-label-active { color: #003366; font-weight: 600; }
        .step-connector {
          position: absolute;
          top: 18px; left: calc(50% + 18px);
          width: calc(100% - 36px);
          height: 2px;
          background: #ccc;
          z-index: 0;
        }
        .step-connector-done { background: #138808; }

        /* ── Editable tag ── */
        .editable-tag {
          margin-left: auto;
          font-size: 0.72rem;
          color: #27ae60;
          background: #eafaf1;
          border: 1px solid #a9dfbf;
          border-radius: 4px;
          padding: 0.15rem 0.5rem;
        }

        /* ── Field error ── */
        .field-error {
          font-size: 0.78rem;
          color: #c0392b;
          margin-top: 0.3rem;
        }
        input.input-error {
          border-color: #c0392b !important;
          background: #fdecea !important;
        }

        /* ── Back button ── */
        .btn-back {
          width: 100%;
          padding: 0.65rem;
          background: #f0f0f0;
          color: #555;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.9rem;
          cursor: pointer;
          margin-top: 0.6rem;
          transition: background 0.2s;
        }
        .btn-back:hover { background: #e0e0e0; }

        /* ── Step 3 wrapper ── */
        .step3-wrapper {
          max-width: 640px;
          margin: 2rem auto;
          padding: 0 1rem;
        }
      `}</style>
    </main>
  );
}