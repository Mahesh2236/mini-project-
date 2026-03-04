export default function AboutPage() {
  const techStack = [
    { icon: "🤖", name: "YOLOv8 (Ultralytics)", desc: "State-of-the-art real-time object detection — fine-tuned on road damage dataset" },
    { icon: "🔥", name: "PyTorch", desc: "Deep learning framework powering model training and inference" },
    { icon: "⚡", name: "FastAPI", desc: "High-performance async REST API backend with automatic Swagger docs" },
    { icon: "⚛️", name: "React + Vite", desc: "Modern frontend framework with fast build tooling and routing" },
    { icon: "🗄️", name: "SQLite", desc: "Lightweight embedded database for persistent report storage" },
    { icon: "👁️", name: "OpenCV + PIL", desc: "Image processing and annotation for detection result visualization" },
    { icon: "📡", name: "Web Geolocation API", desc: "GPS-based automatic location capture for camera-submitted reports" },
    { icon: "📧", name: "Gmail SMTP", desc: "Automated email notification to citizens after report generation" },
  ];

  const team = [
    { roll: "727823TUCS101", name: "Hari Kesavan M",    role: "Student",       contrib: "Model training, FastAPI backend, system architecture" },
    { roll: "727823TUCS145", name: "Mahesh P",          role: "Student",                contrib: "React frontend, API integration, report generation" },
    { roll: "727823TUCS146", name: "Mahmood Sakeen N",  role: "Student",              contrib: "Dataset preparation, annotation, UI design" },
  ];

  const objectives = [
    "Automate road damage detection using YOLOv8 deep learning model",
    "Classify damage severity into Minor, Moderate, and Severe categories",
    "Assign maintenance priority levels — LOW, MEDIUM, HIGH, and CRITICAL",
    "Enable citizen reporting via image upload or live camera with GPS location",
    "Generate unique report IDs and send automated email confirmations",
    "Provide a searchable report tracking system for submitted complaints",
    "Demonstrate a full-stack AI application with production-level architecture",
  ];

  const future = [
    { icon: "🗺️", title: "GPS Map Integration", desc: "Show damage locations on an interactive map with clustering" },
    { icon: "📱", title: "Mobile App", desc: "Native Android/iOS app for on-the-go road damage reporting" },
    { icon: "🎥", title: "Video Analysis", desc: "Process dashcam video feeds for continuous road monitoring" },
    { icon: "🌐", title: "Multi-class Detection", desc: "Detect cracks, surface wear, broken markings beyond potholes" },
    { icon: "🔔", title: "Authority Dashboard", desc: "Admin portal for municipal corporations to manage and assign repairs" },
    { icon: "📊", title: "Analytics & Reports", desc: "State-wise damage statistics, heat maps, and trend analysis" },
  ];

  return (
    <main id="main-content" className="page-wrapper">
      <div className="page-header">
        <div className="breadcrumb">🏠 Home › About</div>
        <h1 className="page-title">About the Project</h1>
        <p className="page-subtitle">Intelligent Road Damage Detection and Prioritization — VI Semester Capstone Project</p>
      </div>

      <div className="about-wrapper">

        {/* Overview */}
        <div className="about-card">
          <div className="about-card-title">📌 Project Overview</div>
          <p>
            <strong>Intelligent Road Damage Detection and Prioritization (IRDDP)</strong> is an AI-powered web application developed as a VI Semester Capstone Project in Computer Science and Engineering. The system leverages the <strong>YOLOv8 nano deep learning model</strong> trained on road damage images to automatically detect potholes and road defects from uploaded or camera-captured photographs.
          </p>
          <p style={{marginTop:"1rem"}}>
            Beyond simple detection, the system implements an intelligent <strong>multi-factor priority scoring algorithm</strong> that considers damage area ratio, pothole density, and model confidence to assign maintenance priority from LOW to CRITICAL — helping road maintenance authorities efficiently allocate repair resources.
          </p>
        </div>

        {/* Problem Statement */}
        <div className="about-card">
          <div className="about-card-title">⚠️ Problem Statement</div>
          <div className="problem-box">
            <p>Traditional road inspection is conducted <strong>manually by human inspectors</strong> — a process that is time-consuming, expensive, inconsistent, and exposes workers to safety hazards. In a country with millions of kilometers of roads, manual inspection cannot scale to meet maintenance needs.</p>
            <div className="problem-points">
              {["Manual inspection is slow and cannot cover large road networks efficiently","Human judgment introduces subjectivity — different inspectors rate the same damage differently","Delayed detection of potholes leads to vehicle damage, accidents and increased repair costs","No systematic prioritization means critical roads may wait while minor ones get repaired first"].map((p, i) => (
                <div className="problem-point" key={i}><span className="problem-icon">❌</span><span>{p}</span></div>
              ))}
            </div>
            <div className="solution-banner">
              <span>✅ Our Solution:</span> An automated, real-time AI system that detects road damage from images with high accuracy and intelligently assigns repair priority — eliminating human subjectivity and enabling data-driven maintenance decisions.
            </div>
          </div>
        </div>

        {/* Base Paper */}
        <div className="about-card">
          <div className="about-card-title">📄 Base Research Paper</div>
          <div className="paper-box">
            <div className="paper-title">"POT-YOLO: Real-Time Road Potholes Detection Using Edge Segmentation-Based YOLOv8 Network"</div>
            <div className="paper-meta">
              <span>📍 IEEE Sensors Journal, 2024</span>
              <span>📊 74+ Citations</span>
              <span>🏆 Peer-Reviewed</span>
              <span>🔬 YOLOv8 Based</span>
            </div>
            <p className="paper-desc">Our project extends this base paper from single-class pothole detection to a complete multi-class damage detection and maintenance prioritization system. While the base paper focuses on the detection algorithm, we add citizen reporting, GPS location capture, priority scoring, email notifications, persistent database storage, and a full web dashboard.</p>
            <div className="paper-comparison">
              <div className="pc-col">
                <div className="pc-title" style={{color:"#e67e22"}}>📄 Base Paper</div>
                {["Pothole detection only","Research algorithm","No reporting system","No user interface","No prioritization"].map((i,k)=><div className="pc-item" key={k}>✗ {i}</div>)}
              </div>
              <div className="pc-arrow">→</div>
              <div className="pc-col">
                <div className="pc-title" style={{color:"#27ae60"}}>🚀 Our Project</div>
                {["Multi-class damage detection","Full web application","Citizen complaint system","Production-grade UI","AUTO priority scoring"].map((i,k)=><div className="pc-item green" key={k}>✓ {i}</div>)}
              </div>
            </div>
          </div>
        </div>

        {/* Objectives */}
        <div className="about-card">
          <div className="about-card-title">🎯 Project Objectives</div>
          <div className="features-list">
            {objectives.map((o, i) => (
              <div className="feature-item" key={i}>
                <span className="feature-check">0{i+1}</span>
                <span>{o}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Architecture Diagram */}
        <div className="about-card">
          <div className="about-card-title">🏗️ System Architecture</div>
          <div className="arch-diagram">
            {/* Row 1: Input */}
            <div className="arch-row">
              <div className="arch-node input-node">📸<br/><strong>Image Upload</strong><br/><span>JPG/PNG/WEBP</span></div>
              <div className="arch-node input-node">📷<br/><strong>Camera Capture</strong><br/><span>Live + GPS</span></div>
            </div>
            <div className="arch-arrow-down">↓</div>

            {/* Row 2: Frontend */}
            <div className="arch-row">
              <div className="arch-node frontend-node" style={{width:"100%"}}>
                ⚛️ <strong>React + Vite Frontend</strong> — Citizen form, image management, results display
              </div>
            </div>
            <div className="arch-arrow-down">↓ HTTP POST /detect</div>

            {/* Row 3: Backend */}
            <div className="arch-row">
              <div className="arch-node backend-node" style={{width:"100%"}}>
                ⚡ <strong>FastAPI Backend</strong> — Request validation, file handling, response formatting
              </div>
            </div>
            <div className="arch-arrow-down">↓</div>

            {/* Row 4: AI */}
            <div className="arch-row">
              <div className="arch-node ai-node" style={{width:"100%",background:"linear-gradient(135deg,#003366,#1a3a6b)",color:"white",borderColor:"#003366"}}>
                🤖 <strong>YOLOv8 Model (best.pt)</strong><br/>
                <span style={{fontSize:"0.8rem",opacity:0.85}}>Inference → Bounding Boxes → Confidence Scores → Class Labels</span>
              </div>
            </div>
            <div className="arch-arrow-down">↓</div>

            {/* Row 5: Processing */}
            <div className="arch-row">
              <div className="arch-node process-node">📐<br/><strong>Severity Engine</strong><br/><span>Area ratio calculation</span></div>
              <div className="arch-node process-node">⚖️<br/><strong>Priority Scoring</strong><br/><span>Weighted formula</span></div>
              <div className="arch-node process-node">🖼️<br/><strong>Result Annotator</strong><br/><span>Bounding box overlay</span></div>
            </div>
            <div className="arch-arrow-down">↓</div>

            {/* Row 6: Output */}
            <div className="arch-row">
              <div className="arch-node output-node">🗄️<br/><strong>SQLite DB</strong><br/><span>Report stored</span></div>
              <div className="arch-node output-node">📧<br/><strong>Email Alert</strong><br/><span>If email given</span></div>
              <div className="arch-node output-node">⬇️<br/><strong>Report Download</strong><br/><span>HTML report</span></div>
              <div className="arch-node output-node">🔍<br/><strong>Report Tracking</strong><br/><span>By Report ID</span></div>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="about-card">
          <div className="about-card-title">🛠️ Technology Stack</div>
          <div className="tech-grid">
            {techStack.map((t, i) => (
              <div className="tech-item" key={i}>
                <div className="tech-icon">{t.icon}</div>
                <div><div className="tech-name">{t.name}</div><div className="tech-desc">{t.desc}</div></div>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="about-card">
          <div className="about-card-title">👥 Project Team</div>
          <div className="team-grid">
            {team.map((m, i) => (
              <div className="team-card" key={i}>
                <div className="team-avatar" style={{background: ["#003366","#FF6600","#138808"][i]}}>{m.name[0]}</div>
                <div className="team-roll">{m.roll}</div>
                <div className="team-name">{m.name}</div>
                <div className="team-role">{m.role}</div>
                <div className="team-contrib">{m.contrib}</div>
              </div>
            ))}
          </div>
          <div className="team-dept-note">VI Semester — B.E. Computer Science & Engineering | Capstone Project 2026</div>
        </div>

        {/* Future Enhancements */}
        <div className="about-card">
          <div className="about-card-title">🔮 Future Enhancements</div>
          <div className="future-grid">
            {future.map((f, i) => (
              <div className="future-card" key={i}>
                <div className="future-icon">{f.icon}</div>
                <div className="future-title">{f.title}</div>
                <div className="future-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
