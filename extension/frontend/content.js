const PRIVACY_KEYWORDS = [
  "privacy",
  "privacy policy",
  "privacy notice",
  "data privacy",
  "data protection",
  "privacy statement",
  "data policy"
];

const BACKEND_URL = "https://datavault.0xstone.xyz/ndpaextension123/api/v1/analyze/link"

const MAX_RETRIES = 5;
const INITIAL_WAIT_TIME_MS = 1000;

window.__datavaultScanStatus = 'idle';

// Check if text contains privacy-related keywords
function containsPrivacyKeyword(text) {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase().trim();
  return PRIVACY_KEYWORDS.some((keyword) => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const isSingleWord = !keyword.includes(' ');
    const pattern = isSingleWord ? `\\b${escaped}\\b` : escaped;
    const regex = new RegExp(pattern, 'i');
    return regex.test(lower);
  });
}

// Check if element is part of our popup
function isPartOfDataVaultPopup(element) {
  let current = element;
  while (current && current !== document) {
    if (current.id === 'datavault-popup' || 
        current.id === 'datavault-backdrop' ||
        current.id === 'datavault-scan-btn' ||
        current.hasAttribute('data-datavault-element')) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

// Inject floating scan button when privacy links are found
function injectScanButton() {
  if (document.getElementById("datavault-scan-btn")) return;

  const btn = document.createElement("div");
  btn.id = "datavault-scan-btn";
  btn.title = "Scan Privacy Policy with DataVault";
  btn.setAttribute("data-datavault-element", "true");
  
  btn.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    border: 3px solid #ffffff;
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4), 0 4px 12px rgba(0,0,0,0.15);
    cursor: pointer;
    z-index: 999998;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    animation: datavault-pulse 2s ease-in-out infinite;
  `;

  // Shield icon SVG
  const icon = document.createElement("div");
  icon.innerHTML = `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L4 5V11C4 16.55 7.16 21.74 12 23C16.84 21.74 20 16.55 20 11V5L12 2Z" 
            stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="rgba(255,255,255,0.1)"/>
      <path d="M9 12L11 14L15 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  icon.style.cssText = `
    pointer-events: none;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
  `;
  btn.appendChild(icon);

  // Hover effects
  btn.addEventListener("mouseenter", () => {
    btn.style.transform = "scale(1.15) translateY(-2px)";
    btn.style.boxShadow = "0 12px 32px rgba(102, 126, 234, 0.5), 0 6px 16px rgba(0,0,0,0.2)";
  });

  btn.addEventListener("mouseleave", () => {
    btn.style.transform = "scale(1)";
    btn.style.boxShadow = "0 8px 24px rgba(102, 126, 234, 0.4), 0 4px 12px rgba(0,0,0,0.15)";
  });

  // Click handler
  btn.addEventListener("click", async (e) => {
    e.stopPropagation();
    btn.remove();
    await scanPrivacyPolicy();
  });

  document.body.appendChild(btn);

  // Add pulse animation
  if (!document.getElementById('datavault-animations')) {
    const style = document.createElement('style');
    style.id = 'datavault-animations';
    style.textContent = `
      @keyframes datavault-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    `;
    document.head.appendChild(style);
  }

  // Auto-remove after 30s
  setTimeout(() => {
    if (document.body.contains(btn)) {
      btn.style.opacity = "0";
      btn.style.transform = "scale(0.8)";
      setTimeout(() => btn.remove(), 300);
    }
  }, 30000);
}

// Scan for privacy policy links
function scanForPrivacyLinks() {
  const anchors = Array.from(document.getElementsByTagName('a'));
  let privacyLink = null;

  for (const link of anchors) {
    if (isPartOfDataVaultPopup(link)) continue;
    
    const linkText = (link.textContent || "").trim();
    const href = (link.href || "").toLowerCase();
    
    // Check if it's a privacy policy link
    if (containsPrivacyKeyword(linkText) || containsPrivacyKeyword(href)) {
      // Make sure it's actually a privacy link, not just containing the word
      if (href.includes("privacy") || linkText.toLowerCase().includes("privacy")) {
        privacyLink = link.href;
        break;
      }
    }
  }

  return privacyLink;
}

// Scan privacy policy and send to backend
async function scanPrivacyPolicy() {
  window.__datavaultScanStatus = 'running';
  showScanStatus('Analyzing privacy policy...', 'loading');

  try {
    // First, try to find privacy link on current page
    let privacyUrl = scanForPrivacyLinks();
    
    // If on a privacy policy page already, use current URL
    if (!privacyUrl) {
      const currentUrl = window.location.href.toLowerCase();
      const currentTitle = document.title.toLowerCase();
      if (containsPrivacyKeyword(currentUrl) || containsPrivacyKeyword(currentTitle)) {
        privacyUrl = window.location.href;
      }
    }

    if (!privacyUrl) {
      showScanStatus('No privacy policy link found on this page.', 'error');
      window.__datavaultScanStatus = 'idle';
      return;
    }

    // Send to backend
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: privacyUrl })
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    // Render results
    renderComplianceResults(data, privacyUrl);
    showScanStatus('Analysis complete!', 'success');
    window.__datavaultScanStatus = 'idle';

  } catch (err) {
    console.error("DataVault scan error:", err);
    showScanStatus('Analysis failed. Please try again.', 'error');
    window.__datavaultScanStatus = 'idle';
  }
}

// Show scan status
function showScanStatus(message, status = 'loading') {
  let existing = document.getElementById('datavault-scan-status');
  if (!existing) {
    existing = document.createElement('div');
    existing.id = 'datavault-scan-status';
    existing.setAttribute("data-datavault-element", "true");
    existing.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      z-index: 999999;
      max-width: 320px;
      border: 1px solid #e5e7eb;
    `;
    document.body.appendChild(existing);
  }

  const icon = status === 'loading' ? '⏳' : status === 'error' ? '❌' : '✅';
  existing.innerHTML = `
    <span style="font-size: 20px;">${icon}</span>
    <span>${message}</span>
  `;

  if (status === 'success') {
    setTimeout(() => existing.remove(), 3000);
  }
}

// Render compliance results in beautiful popup
function renderComplianceResults(data, url) {
  // Remove existing popup
  const existing = document.getElementById('datavault-popup');
  if (existing) existing.remove();

  // Create backdrop with animated gradient orbs
  const backdrop = document.createElement('div');
  backdrop.id = 'datavault-backdrop';
  backdrop.setAttribute("data-datavault-element", "true");
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(10, 14, 39, 0.95);
    backdrop-filter: blur(20px);
    z-index: 999997;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.4s ease;
    overflow: hidden;
  `;

  // Add animated gradient orbs to backdrop
  const orb1 = document.createElement('div');
  orb1.style.cssText = `
    position: absolute;
    width: 400px;
    height: 400px;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
    border-radius: 50%;
    filter: blur(100px);
    top: -200px;
    left: -200px;
    animation: float-orb 20s ease-in-out infinite;
  `;
  backdrop.appendChild(orb1);

  const orb2 = document.createElement('div');
  orb2.style.cssText = `
    position: absolute;
    width: 300px;
    height: 300px;
    background: linear-gradient(135deg, rgba(240, 147, 251, 0.3), rgba(245, 87, 108, 0.3));
    border-radius: 50%;
    filter: blur(80px);
    bottom: -150px;
    right: -150px;
    animation: float-orb 25s ease-in-out infinite reverse;
  `;
  backdrop.appendChild(orb2);

  // Create popup with glassmorphism
  const popup = document.createElement('div');
  popup.id = 'datavault-popup';
  popup.setAttribute("data-datavault-element", "true");
  popup.style.cssText = `
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(30px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    width: 90%;
    max-width: 900px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
    position: relative;
    animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    color: white;
  `;

  // Close button with modern design
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
    position: absolute;
    top: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    color: rgba(255, 255, 255, 0.8);
    font-size: 24px;
    font-weight: 300;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 10;
    line-height: 1;
  `;
  closeBtn.onmouseenter = () => {
    closeBtn.style.background = 'rgba(239, 68, 68, 0.2)';
    closeBtn.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    closeBtn.style.color = '#ef4444';
    closeBtn.style.transform = 'rotate(90deg) scale(1.1)';
  };
  closeBtn.onmouseleave = () => {
    closeBtn.style.background = 'rgba(255, 255, 255, 0.05)';
    closeBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    closeBtn.style.color = 'rgba(255, 255, 255, 0.8)';
    closeBtn.style.transform = 'rotate(0deg) scale(1)';
  };
  closeBtn.onclick = () => {
    backdrop.style.animation = 'fadeOut 0.3s ease';
    popup.style.animation = 'slideDown 0.3s ease';
    setTimeout(() => backdrop.remove(), 300);
  };

  // Popup content
  popup.innerHTML = `
    <div style="padding: 32px;">
      ${closeBtn.outerHTML}
      
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 40px; padding-top: 20px;">
        <div style="
          position: relative;
          width: 100px;
          height: 100px;
          margin: 0 auto 20px;
        ">
          <div style="
            position: absolute;
            width: 100px;
            height: 100px;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
            border-radius: 24px;
            filter: blur(20px);
            animation: pulse-glow 2s ease-in-out infinite;
          "></div>
          <div style="
            position: relative;
            width: 100px;
            height: 100px;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
          ">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id="popupLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                </linearGradient>
              </defs>
              <path d="M12 2L4 5V11C4 16.55 7.16 21.74 12 23C16.84 21.74 20 16.55 20 11V5L12 2Z" 
                    stroke="url(#popupLogoGradient)" stroke-width="2.5" fill="rgba(102, 126, 234, 0.15)"/>
              <path d="M9 12L11 14L15 10" stroke="url(#popupLogoGradient)" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </div>
        </div>
        <h1 style="
          margin: 0 0 8px 0;
          font-size: 32px;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          letter-spacing: -1px;
        ">DataVault</h1>
        <p style="
          margin: 0;
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.5px;
        ">NDPA & NDPR Compliance Analysis</p>
      </div>

      <!-- Score Card -->
      <div id="datavault-score-card" style="
        position: relative;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 24px;
        padding: 40px 32px;
        margin-bottom: 28px;
        color: white;
        text-align: center;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(102, 126, 234, 0.4);
      ">
        <div style="
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: score-shine 3s ease-in-out infinite;
        "></div>
        <div style="position: relative; z-index: 1;">
          <div style="font-size: 13px; opacity: 0.9; margin-bottom: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Compliance Score</div>
          <div style="font-size: 72px; font-weight: 800; margin-bottom: 16px; line-height: 1; text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); letter-spacing: -3px;">
            ${Math.round(data.compliance_score || 0)}%
          </div>
          <div style="
            display: inline-block;
            padding: 8px 24px;
            background: rgba(255,255,255,0.25);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 24px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          ">${formatComplianceLevel(data.compliance_level || 'non_compliant')}</div>
        </div>
      </div>

      <!-- Risk Breakdown -->
      <div id="datavault-risk-breakdown" style="margin-bottom: 24px;"></div>

      <!-- Findings -->
      <div id="datavault-findings" style="margin-bottom: 24px;"></div>

      <!-- Missing Requirements -->
      <div id="datavault-missing" style="margin-bottom: 24px;"></div>
    </div>
  `;

  popup.insertBefore(closeBtn, popup.firstChild);
  backdrop.appendChild(popup);
  document.body.appendChild(backdrop);

  // Render risk breakdown
  renderRiskBreakdown(data.risk_breakdown || {});
  
  // Render findings
  renderFindings(data.findings || {});
  
  // Render missing requirements
  renderMissingRequirements(data.missing || []);

  // Close on backdrop click
  backdrop.onclick = (e) => {
    if (e.target === backdrop) {
      backdrop.remove();
    }
  };

  // Add animations
  if (!document.getElementById('datavault-popup-styles')) {
    const style = document.createElement('style');
    style.id = 'datavault-popup-styles';
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      @keyframes slideUp {
        from { 
          opacity: 0;
          transform: translateY(30px) scale(0.9);
        }
        to { 
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      @keyframes slideDown {
        from { 
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        to { 
          opacity: 0;
          transform: translateY(30px) scale(0.9);
        }
      }
      @keyframes float-orb {
        0%, 100% {
          transform: translate(0, 0) scale(1);
        }
        33% {
          transform: translate(50px, -50px) scale(1.1);
        }
        66% {
          transform: translate(-30px, 30px) scale(0.9);
        }
      }
      @keyframes pulse-glow {
        0%, 100% {
          opacity: 0.3;
          transform: scale(1);
        }
        50% {
          opacity: 0.6;
          transform: scale(1.1);
        }
      }
      @keyframes score-shine {
        0%, 100% {
          transform: rotate(0deg);
        }
        50% {
          transform: rotate(180deg);
        }
      }
      #datavault-popup::-webkit-scrollbar {
        width: 8px;
      }
      #datavault-popup::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
      }
      #datavault-popup::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
      }
      #datavault-popup::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    `;
    document.head.appendChild(style);
  }
}

// Format compliance level
function formatComplianceLevel(level) {
  const levels = {
    'fully_compliant': 'Fully Compliant',
    'compliant': 'Compliant',
    'partially_compliant': 'Partially Compliant',
    'non_compliant': 'Non-Compliant'
  };
  return levels[level] || level;
}

// Render risk breakdown
function renderRiskBreakdown(riskBreakdown) {
  const container = document.getElementById('datavault-risk-breakdown');
  if (!container) return;

  const hasRisks = Object.values(riskBreakdown).some(v => v > 0);
  if (!hasRisks) {
    container.style.display = 'none';
    return;
  }

  container.innerHTML = `
    <div style="
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 24px;
    ">
      <h3 style="
        font-size: 20px;
        font-weight: 700;
        color: white;
        margin: 0 0 20px 0;
        letter-spacing: -0.5px;
      ">Risk Breakdown</h3>
      <div style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 14px;
      ">
        ${riskBreakdown.high_failures > 0 ? `
          <div style="
            background: rgba(239, 68, 68, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-left: 4px solid #ef4444;
            padding: 18px 14px;
            border-radius: 14px;
            transition: all 0.3s ease;
          ">
            <div style="font-size: 36px; font-weight: 800; color: #fca5a5; margin-bottom: 8px; line-height: 1;">
              ${riskBreakdown.high_failures}
            </div>
            <div style="font-size: 10px; color: #fca5a5; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">
              High Risk Failures
            </div>
          </div>
        ` : ''}
        ${riskBreakdown.medium_failures > 0 ? `
          <div style="
            background: rgba(245, 158, 11, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-left: 4px solid #f59e0b;
            padding: 18px 14px;
            border-radius: 14px;
          ">
            <div style="font-size: 36px; font-weight: 800; color: #fcd34d; margin-bottom: 8px; line-height: 1;">
              ${riskBreakdown.medium_failures}
            </div>
            <div style="font-size: 10px; color: #fcd34d; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">
              Medium Risk Failures
            </div>
          </div>
        ` : ''}
        ${riskBreakdown.high_partials > 0 ? `
          <div style="
            background: rgba(59, 130, 246, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-left: 4px solid #3b82f6;
            padding: 18px 14px;
            border-radius: 14px;
          ">
            <div style="font-size: 36px; font-weight: 800; color: #93c5fd; margin-bottom: 8px; line-height: 1;">
              ${riskBreakdown.high_partials}
            </div>
            <div style="font-size: 10px; color: #93c5fd; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">
              High Risk Partials
            </div>
          </div>
        ` : ''}
        ${riskBreakdown.compliant > 0 ? `
          <div style="
            background: rgba(34, 197, 94, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-left: 4px solid #22c55e;
            padding: 18px 14px;
            border-radius: 14px;
          ">
            <div style="font-size: 36px; font-weight: 800; color: #86efac; margin-bottom: 8px; line-height: 1;">
              ${riskBreakdown.compliant}
            </div>
            <div style="font-size: 10px; color: #86efac; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">
              Compliant
            </div>
          </div>
        ` : ''}
        ${riskBreakdown.missing > 0 ? `
          <div style="
            background: rgba(139, 92, 246, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-left: 4px solid #8b5cf6;
            padding: 18px 14px;
            border-radius: 14px;
          ">
            <div style="font-size: 36px; font-weight: 800; color: #c4b5fd; margin-bottom: 8px; line-height: 1;">
              ${riskBreakdown.missing}
            </div>
            <div style="font-size: 10px; color: #c4b5fd; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">
              Missing
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// Render findings
function renderFindings(findings) {
  const container = document.getElementById('datavault-findings');
  if (!container) return;

  const findingsList = Object.values(findings);
  if (findingsList.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.innerHTML = `
    <div style="
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 24px;
    ">
      <h3 style="
        font-size: 20px;
        font-weight: 700;
        color: white;
        margin: 0 0 20px 0;
        letter-spacing: -0.5px;
      ">Compliance Findings</h3>
      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${findingsList.map(finding => {
          const statusStyles = {
            'compliant': { 
              bg: 'rgba(16, 185, 129, 0.1)', 
              border: '#10b981', 
              text: '#6ee7b7',
              badge: 'linear-gradient(135deg, #10b981, #059669)'
            },
            'partial': { 
              bg: 'rgba(245, 158, 11, 0.1)', 
              border: '#f59e0b', 
              text: '#fde68a',
              badge: 'linear-gradient(135deg, #f59e0b, #d97706)'
            },
            'non_compliant': { 
              bg: 'rgba(239, 68, 68, 0.1)', 
              border: '#ef4444', 
              text: '#fca5a5',
              badge: 'linear-gradient(135deg, #ef4444, #dc2626)'
            }
          }[finding.status] || { 
            bg: 'rgba(255, 255, 255, 0.05)', 
            border: '#9ca3af', 
            text: 'rgba(255, 255, 255, 0.7)',
            badge: 'rgba(156, 163, 175, 0.5)'
          };

          return `
            <div style="
              background: ${statusStyles.bg};
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-left: 4px solid ${statusStyles.border};
              padding: 20px;
              border-radius: 16px;
              transition: all 0.3s ease;
            ">
              <div style="
                display: flex;
                justify-content: space-between;
                align-items: start;
                margin-bottom: 12px;
                gap: 12px;
              ">
                <div style="flex: 1;">
                  <div style="
                    font-weight: 700;
                    color: ${statusStyles.text};
                    margin-bottom: 6px;
                    font-size: 15px;
                    line-height: 1.4;
                  ">${finding.requirement_title || 'N/A'}</div>
                  <div style="
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.6);
                    font-weight: 500;
                    letter-spacing: 0.5px;
                  ">${finding.ndpa_section || 'N/A'}</div>
                </div>
                <span style="
                  padding: 6px 16px;
                  background: ${statusStyles.badge};
                  color: white;
                  border-radius: 12px;
                  font-size: 10px;
                  font-weight: 700;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  white-space: nowrap;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                ">${finding.status || 'unknown'}</span>
              </div>
              ${finding.evidence ? `
                <div style="
                  margin-top: 12px;
                  padding: 12px;
                  background: rgba(0, 0, 0, 0.2);
                  backdrop-filter: blur(10px);
                  border-left: 3px solid rgba(255, 255, 255, 0.3);
                  border-radius: 8px;
                  font-size: 12px;
                  color: rgba(255, 255, 255, 0.9);
                  font-style: italic;
                  line-height: 1.6;
                ">"${finding.evidence}"</div>
              ` : ''}
              ${finding.recommendation ? `
                <div style="
                  margin-top: 12px;
                  padding: 12px;
                  background: rgba(255, 255, 255, 0.05);
                  border-radius: 8px;
                  font-size: 13px;
                  color: rgba(255, 255, 255, 0.8);
                  line-height: 1.6;
                ">
                  <strong style="color: white; font-weight: 700;">Recommendation:</strong> ${finding.recommendation}
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// Render missing requirements
function renderMissingRequirements(missing) {
  const container = document.getElementById('datavault-missing');
  if (!container) return;

  if (!missing || missing.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.innerHTML = `
    <div style="
      background: rgba(239, 68, 68, 0.1);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 20px;
      padding: 24px;
      position: relative;
      overflow: hidden;
    ">
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #ef4444, #dc2626, #ef4444);
        background-size: 200% 100%;
        animation: missing-shimmer 2s linear infinite;
      "></div>
      <h3 style="
        font-size: 20px;
        font-weight: 700;
        color: #fca5a5;
        margin: 0 0 16px 0;
        letter-spacing: -0.5px;
        display: flex;
        align-items: center;
        gap: 8px;
      ">
        <span>⚠️</span>
        <span>Missing Requirements</span>
      </h3>
      <div style="
        font-size: 14px;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 16px;
        font-weight: 500;
        line-height: 1.6;
      ">The following NDPA requirements were not found in the privacy policy:</div>
      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${missing.map((req, index) => {
          const severityStyles = {
            'high': { 
              bg: 'rgba(239, 68, 68, 0.15)', 
              border: '#ef4444', 
              text: '#fca5a5',
              badge: 'linear-gradient(135deg, #ef4444, #dc2626)'
            },
            'medium': { 
              bg: 'rgba(245, 158, 11, 0.15)', 
              border: '#f59e0b', 
              text: '#fcd34d',
              badge: 'linear-gradient(135deg, #f59e0b, #d97706)'
            },
            'low': { 
              bg: 'rgba(59, 130, 246, 0.15)', 
              border: '#3b82f6', 
              text: '#93c5fd',
              badge: 'linear-gradient(135deg, #3b82f6, #2563eb)'
            }
          }[req.severity] || { 
            bg: 'rgba(156, 163, 175, 0.15)', 
            border: '#9ca3af', 
            text: '#d1d5db',
            badge: 'rgba(156, 163, 175, 0.5)'
          };

          return `
            <div style="
              background: ${severityStyles.bg};
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-left: 4px solid ${severityStyles.border};
              padding: 20px;
              border-radius: 16px;
              transition: all 0.3s ease;
            ">
              <div style="
                display: flex;
                justify-content: space-between;
                align-items: start;
                margin-bottom: 12px;
                gap: 12px;
              ">
                <div style="flex: 1;">
                  <div style="
                    font-weight: 700;
                    color: ${severityStyles.text};
                    margin-bottom: 6px;
                    font-size: 15px;
                    line-height: 1.4;
                  ">${req.title || 'N/A'}</div>
                  <div style="
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.6);
                    font-weight: 500;
                    letter-spacing: 0.5px;
                  ">Section ${req.section || 'N/A'}</div>
                </div>
                <span style="
                  padding: 6px 16px;
                  background: ${severityStyles.badge};
                  color: white;
                  border-radius: 12px;
                  font-size: 10px;
                  font-weight: 700;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  white-space: nowrap;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                ">${req.severity || 'unknown'}</span>
              </div>
              ${req.description ? `
                <div style="
                  margin-top: 12px;
                  padding: 12px;
                  background: rgba(0, 0, 0, 0.2);
                  backdrop-filter: blur(10px);
                  border-left: 3px solid rgba(255, 255, 255, 0.3);
                  border-radius: 8px;
                  font-size: 12px;
                  color: rgba(255, 255, 255, 0.9);
                  line-height: 1.6;
                ">${req.description}</div>
              ` : ''}
              ${req.recommendation ? `
                <div style="
                  margin-top: 12px;
                  padding: 12px;
                  background: rgba(255, 255, 255, 0.05);
                  border-radius: 8px;
                  font-size: 13px;
                  color: rgba(255, 255, 255, 0.8);
                  line-height: 1.6;
                ">
                  <strong style="color: white; font-weight: 700;">Recommendation:</strong> ${req.recommendation}
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
  
  if (!document.getElementById('missing-shimmer-animation')) {
    const style = document.createElement('style');
    style.id = 'missing-shimmer-animation';
    style.textContent = `
      @keyframes missing-shimmer {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
// Initial scan for privacy links
function initialScan() {
  let retryCount = 0;
  let privacyLinkFound = false;

  const scan = () => {
    const privacyLink = scanForPrivacyLinks();
    if (privacyLink) {
      privacyLinkFound = true;
      injectScanButton();
    } else if (retryCount < MAX_RETRIES) {
      retryCount++;
      setTimeout(scan, INITIAL_WAIT_TIME_MS * Math.pow(2, retryCount));
    }
  };

  scan();
}

// Observe DOM changes
const observer = new MutationObserver((mutations) => {
  if (window.__datavaultScanStatus === 'running') return;
  
  for (const mutation of mutations) {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE && !isPartOfDataVaultPopup(node)) {
          if (node.tagName === 'A' || (node.querySelector && node.querySelector('a'))) {
            const links = node.tagName === 'A' ? [node] : Array.from(node.querySelectorAll('a'));
            for (const link of links) {
              const linkText = (link.textContent || "").trim();
              const href = link.href || "";
              if (containsPrivacyKeyword(linkText) || containsPrivacyKeyword(href)) {
                if (!document.getElementById("datavault-scan-btn")) {
                  injectScanButton();
                }
                return;
              }
            }
          }
        }
      }
    }
  }
});

// Start observing
if (document.body) {
  initialScan();
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
} else {
  document.addEventListener('DOMContentLoaded', () => {
    initialScan();
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scan") {
    scanPrivacyPolicy().then(() => {
      sendResponse({ status: 'success' });
    }).catch(err => {
      sendResponse({ status: 'error', message: err.toString() });
    });
    return true;
  }
  
  if (request.action === "findPrivacyLink") {
    const privacyLink = scanForPrivacyLinks();
    if (privacyLink) {
      sendResponse({ privacyUrl: privacyLink });
    } else {
      const currentUrl = window.location.href.toLowerCase();
      const currentTitle = document.title.toLowerCase();
      if (containsPrivacyKeyword(currentUrl) || containsPrivacyKeyword(currentTitle)) {
        sendResponse({ privacyUrl: window.location.href });
      } else {
        sendResponse({ privacyUrl: null });
      }
    }
    return true;
  }
  
  if (request.action === "displayResults") {
    // Display results from popup.js
    renderComplianceResults(request.data, request.url);
    sendResponse({ status: 'success' });
    return true;
  }
});

