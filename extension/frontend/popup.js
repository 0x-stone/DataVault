const BACKEND_URL = "https://datavault.0xstone.xyz/ndpaextension123/api/v1/analyze/link"

const states = {
  welcome: document.getElementById('welcome-state'),
  loading: document.getElementById('loading-state'),
  results: document.getElementById('results-state'),
  error: document.getElementById('error-state')
};

function showState(stateName) {
  Object.values(states).forEach(state => {
    state.classList.remove('active');
  });
  if (states[stateName]) {
    states[stateName].classList.add('active');
  }
}


async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}


function isPrivacyPolicyPage(url, title) {
  const privacyKeywords = ['privacy', 'data protection', 'data privacy'];
  const lowerUrl = url.toLowerCase();
  const lowerTitle = (title || '').toLowerCase();
  
  return privacyKeywords.some(keyword => 
    lowerUrl.includes(keyword) || lowerTitle.includes(keyword)
  );
}


async function scanPrivacyPolicy() {
  showState('loading');
  
  try {
    const tab = await getCurrentTab();
    
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
      throw new Error('Cannot scan this page. Please navigate to a regular website.');
    }

    let privacyUrl = tab.url;

    if (!isPrivacyPolicyPage(tab.url, tab.title)) {
      try {
        const response = await new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(tab.id, { action: 'findPrivacyLink' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error('Please navigate to a page with a privacy policy link or visit a privacy policy page directly.'));
            } else {
              resolve(response);
            }
          });
        });

        if (response && response.privacyUrl) {
          privacyUrl = response.privacyUrl;
        } else {
          throw new Error('No privacy policy link found on this page. Please navigate to a privacy policy page.');
        }
      } catch (err) {
        throw err;
      }
    }

    let response;
    try {
      response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: privacyUrl })
      });
    } catch (fetchError) {
      if (fetchError.name === 'TypeError' && fetchError.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the backend server. Please check your connection and ensure the backend is running.');
      }
      throw new Error(`Network error: ${fetchError.message}`);
    }

    if (!response.ok) {
      let errorMessage = `Backend error: ${response.status}`;
      if (response.status === 400) {
        errorMessage = 'Invalid URL. Please ensure the privacy policy URL is valid.';
      } else if (response.status === 500) {
        errorMessage = 'Server error: The backend encountered an error processing your request.';
      } else if (response.status === 503) {
        errorMessage = 'Service unavailable: The backend server is temporarily unavailable.';
      } else if (response.status === 404) {
        errorMessage = 'Endpoint not found: The backend API endpoint is not available.';
      }
      throw new Error(errorMessage);
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      throw new Error('Invalid response from server: Unable to parse the response.');
    }
    
    if (data.error) {
      let errorMessage = data.error;
      if (data.error === 'no_content') {
        errorMessage = 'No content found: The privacy policy page appears to be empty or inaccessible.';
      } else if (data.error === 'captcha_detected') {
        errorMessage = 'Access blocked: The website is using CAPTCHA or bot protection. Please try accessing the page manually first.';
      } else if (data.error === 'no_chunks') {
        errorMessage = 'Processing error: Unable to process the privacy policy content.';
      } else if (data.error === 'no_findings') {
        errorMessage = 'Analysis error: Unable to analyze the privacy policy.';
      }
      throw new Error(errorMessage);
    }

    try {
      await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tab.id, { 
          action: 'displayResults', 
          data: data,
          url: privacyUrl
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      
      setTimeout(() => {
        window.close();
      }, 100);
    } catch (messageError) {
      console.warn('Could not send to content script, showing in popup:', messageError);
      renderResults(data, privacyUrl);
      showState('results');
    }

  } catch (error) {
    console.error('Scan error:', error);
    const errorMessage = error.message || 'Unable to analyze privacy policy. Please try again.';
    document.getElementById('error-message').textContent = errorMessage;
    showState('error');
  }
}

function renderResults(data, url) {
  const container = document.getElementById('results-content');
  
  const complianceScore = Math.round(data.compliance_score || 0);
  const complianceLevel = formatComplianceLevel(data.compliance_level || 'non_compliant');
  const riskBreakdown = data.risk_breakdown || {};
  const findings = data.findings || {};
  const missing = data.missing || [];

  container.innerHTML = `
    <!-- Score Card -->
    <div class="score-card">
      <div class="score-label">Compliance Score</div>
      <div class="score-value">${complianceScore}%</div>
      <div class="compliance-badge">${complianceLevel}</div>
    </div>

    <!-- Risk Breakdown -->
    ${renderRiskBreakdown(riskBreakdown)}

    <!-- Findings -->
    ${renderFindings(findings)}

    <!-- Missing Requirements -->
    ${renderMissingRequirements(missing)}
  `;
}


function renderRiskBreakdown(riskBreakdown) {
  const hasRisks = Object.values(riskBreakdown).some(v => v > 0);
  if (!hasRisks) return '';

  return `
    <div class="section">
      <div class="section-title">Risk Breakdown</div>
      <div class="risk-grid">
        ${riskBreakdown.high_failures > 0 ? `
          <div class="risk-item high">
            <div class="risk-count">${riskBreakdown.high_failures}</div>
            <div class="risk-label">High Risk Failures</div>
          </div>
        ` : ''}
        ${riskBreakdown.medium_failures > 0 ? `
          <div class="risk-item medium">
            <div class="risk-count">${riskBreakdown.medium_failures}</div>
            <div class="risk-label">Medium Risk Failures</div>
          </div>
        ` : ''}
        ${riskBreakdown.low_failures > 0 ? `
          <div class="risk-item low">
            <div class="risk-count">${riskBreakdown.low_failures}</div>
            <div class="risk-label">Low Risk Failures</div>
          </div>
        ` : ''}
        ${riskBreakdown.high_partials > 0 ? `
          <div class="risk-item low">
            <div class="risk-count">${riskBreakdown.high_partials}</div>
            <div class="risk-label">High Risk Partials</div>
          </div>
        ` : ''}
        ${riskBreakdown.medium_partials > 0 ? `
          <div class="risk-item medium">
            <div class="risk-count">${riskBreakdown.medium_partials}</div>
            <div class="risk-label">Medium Risk Partials</div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}


function renderFindings(findings) {
  const findingsList = Object.values(findings);
  if (findingsList.length === 0) return '';

  return `
    <div class="section">
      <div class="section-title">Compliance Findings</div>
      <div class="findings-list">
        ${findingsList.map(finding => {
          const statusClass = finding.status || 'non_compliant';
          return `
            <div class="finding-item ${statusClass}">
              <div class="finding-header">
                <div>
                  <div class="finding-title">${finding.requirement_title || 'N/A'}</div>
                  <div class="finding-section">${finding.ndpa_section || 'N/A'}</div>
                </div>
                <span class="finding-status">${finding.status || 'unknown'}</span>
              </div>
              ${finding.evidence ? `
                <div class="finding-evidence">"${finding.evidence}"</div>
              ` : ''}
              ${finding.recommendation ? `
                <div class="finding-recommendation">
                  <strong>Recommendation:</strong> ${finding.recommendation}
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}


function renderMissingRequirements(missing) {
  if (!missing || missing.length === 0) return '';

  return `
    <div class="section missing-section">
      <div class="section-title missing-title">⚠️ Missing Requirements</div>
      <div class="missing-title">The following NDPA requirements were not found:</div>
      <ul class="missing-list">
        ${missing.map(req => `<li>${req}</li>`).join('')}
      </ul>
    </div>
  `;
}


function formatComplianceLevel(level) {
  const levels = {
    'fully_compliant': 'Fully Compliant',
    'compliant': 'Compliant',
    'partially_compliant': 'Partially Compliant',
    'non_compliant': 'Non-Compliant'
  };
  return levels[level] || level.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}


document.getElementById('scan-btn').addEventListener('click', scanPrivacyPolicy);
document.getElementById('retry-btn').addEventListener('click', scanPrivacyPolicy);


document.getElementById('learn-more').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'https://ndpc.gov.ng' });
});


showState('welcome');

