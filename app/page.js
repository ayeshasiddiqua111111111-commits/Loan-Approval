'use client';

import React, { useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

const DEFAULT_FORM_STATE = {
  Gender: 'Male',
  Married: 'Yes',
  Dependents: '0',
  Education: 'Graduate',
  Self_Employed: 'No',
  ApplicantIncome: '5000',
  CoapplicantIncome: '1500',
  LoanAmount: '120',
  Loan_Amount_Term: '360',
  Credit_History: '1.0',
  Property_Area: 'Semiurban'
};

const PRESETS = {
  prime: {
    Gender: 'Male',
    Married: 'Yes',
    Dependents: '2',
    Education: 'Graduate',
    Self_Employed: 'No',
    Property_Area: 'Semiurban',
    ApplicantIncome: '8500',
    CoapplicantIncome: '2000',
    LoanAmount: '150',
    Loan_Amount_Term: '360',
    Credit_History: '1.0'
  },
  young: {
    Gender: 'Female',
    Married: 'No',
    Dependents: '1',
    Education: 'Graduate',
    Self_Employed: 'No',
    Property_Area: 'Urban',
    ApplicantIncome: '4500',
    CoapplicantIncome: '1200',
    LoanAmount: '90',
    Loan_Amount_Term: '180',
    Credit_History: '1.0'
  },
  risky: {
    Gender: 'Female',
    Married: 'No',
    Dependents: '0',
    Education: 'Not Graduate',
    Self_Employed: 'Yes',
    Property_Area: 'Rural',
    ApplicantIncome: '2800',
    CoapplicantIncome: '0',
    LoanAmount: '175',
    Loan_Amount_Term: '360',
    Credit_History: '0.0'
  }
};

export default function Home() {
  const [formData, setFormData] = useState(DEFAULT_FORM_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [prediction, setPrediction] = useState(null); // { prediction: 'Y'|'N', status: 'Approved'|'Rejected' }
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking', 'online', 'offline'
  const [interestRate, setInterestRate] = useState(6.5);
  
  // Real-time calculator values
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);

  // Ping server on load
  const checkStatus = async () => {
    try {
      const endpoint = API_BASE_URL ? `${API_BASE_URL}/` : '/predict';
      const res = await fetch(endpoint, { method: 'GET' });
      if (res.ok) {
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch (err) {
      setServerStatus('offline');
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Update payment calculations
  useEffect(() => {
    const principal = (parseFloat(formData.LoanAmount) || 0) * 1000;
    const termDays = parseFloat(formData.Loan_Amount_Term) || 360;
    const months = termDays / 30;
    const monthlyRate = (interestRate / 100) / 12;

    let payment = 0;
    if (principal > 0 && months > 0) {
      if (monthlyRate === 0) {
        payment = principal / months;
      } else {
        payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
      }
    }
    setMonthlyPayment(payment);
    setTotalDebt(payment * months);
  }, [formData.LoanAmount, formData.Loan_Amount_Term, interestRate]);

  // Input handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const loadPreset = (presetKey) => {
    setFormData(PRESETS[presetKey]);
  };

  const handleReset = () => {
    setFormData(DEFAULT_FORM_STATE);
    setPrediction(null);
    setError(null);
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPrediction(null);

    // Build float formatted body to match model requirements
    const payload = {
      Gender: formData.Gender,
      Married: formData.Married,
      Dependents: formData.Dependents,
      Education: formData.Education,
      Self_Employed: formData.Self_Employed,
      ApplicantIncome: parseFloat(formData.ApplicantIncome) || 0,
      CoapplicantIncome: parseFloat(formData.CoapplicantIncome) || 0,
      LoanAmount: parseFloat(formData.LoanAmount) || 0,
      Loan_Amount_Term: parseFloat(formData.Loan_Amount_Term) || 360,
      Credit_History: parseFloat(formData.Credit_History),
      Property_Area: formData.Property_Area
    };

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errDetails = await response.json();
        throw new Error(errDetails.detail || 'Failed to communicate with prediction engine.');
      }

      const data = await response.json();
      setPrediction(data);
    } catch (err) {
      setError(err.message);
      console.error('Prediction request error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Debt to income ratio (DTI)
  const totalIncome = (parseFloat(formData.ApplicantIncome) || 0) + (parseFloat(formData.CoapplicantIncome) || 0);
  const dti = totalIncome > 0 ? ((monthlyPayment / totalIncome) * 100).toFixed(1) : '0.0';

  return (
    <>
      <div className="background-decorations">
        <div className="glow-sphere glow-1"></div>
        <div className="glow-sphere glow-2"></div>
        <div className="glow-sphere glow-3"></div>
      </div>

      <header className="app-header">
        <div className="header-container">
          <div className="logo-area">
            <div className="logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="url(#logo-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="url(#logo-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="url(#logo-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="logo-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6366f1"/>
                    <stop offset="1" stopColor="#10b981"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-outfit), sans-serif', fontSize: '1.4rem' }}>
                Loan Approval Prediction
              </h1>
              <p style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 600, letterSpacing: '0.02em' }}>
                K-Nearest Neighbors Machine Learning System
              </p>
            </div>
          </div>
          <div className="server-status-pill">
            <span className={`status-indicator ${serverStatus === 'online' ? 'online' : serverStatus === 'offline' ? 'offline' : 'warning'}`}></span>
            <span className="status-text">
              {serverStatus === 'online' ? 'API Server: Online' : serverStatus === 'offline' ? 'API Server: Connection Offline' : 'Checking API Server...'}
            </span>
          </div>
        </div>
      </header>

      {/* Overview Explanation Banner */}
      <div className="system-overview-bar">
        <div className="overview-container">
          <p>
            This system predicts whether a loan application is likely to be <strong>Approved</strong> or <strong>Rejected</strong> based on the applicant's demographic and financial information using a trained <strong>K-Nearest Neighbors (KNN)</strong> machine learning model.
          </p>
        </div>
      </div>

      <main className="dashboard-container">
        {/* LEFT PANEL: Form and Presets */}
        <section className="panel form-panel">
          
          {/* Quick Presets */}
          <div className="card glass-card">
            <h3 style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>Quick Application Presets</h3>
            <p className="subtitle">Load sample profiles to test the model prediction instantly.</p>
            <div className="preset-buttons">
              <button type="button" className="btn btn-preset" onClick={() => loadPreset('prime')}>
                <span className="preset-name">🌟 Prime Applicant</span>
                <span className="preset-desc">Graduate, High Income, Good Credit</span>
              </button>
              <button type="button" className="btn btn-preset" onClick={() => loadPreset('young')}>
                <span className="preset-name">🎓 Young Professional</span>
                <span className="preset-desc">Single, Stable Income, Good Credit</span>
              </button>
              <button type="button" className="btn btn-preset" onClick={() => loadPreset('risky')}>
                <span className="preset-name">⚠️ Borderline / High Risk</span>
                <span className="preset-desc">Low Income, Bad Credit History</span>
              </button>
            </div>
          </div>

          {/* Form Card */}
          <div className="card glass-card">
            <h3 style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>Loan Application Details</h3>
            <p className="subtitle" style={{ marginBottom: '1.5rem' }}>Provide applicant variables for KNN decision modeling.</p>
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                
                <div className="form-group">
                  <label htmlFor="Gender">Gender</label>
                  <select id="Gender" name="Gender" value={formData.Gender} onChange={handleInputChange} required>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="Married">Marital Status</label>
                  <select id="Married" name="Married" value={formData.Married} onChange={handleInputChange} required>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="Dependents">Dependents</label>
                  <select id="Dependents" name="Dependents" value={formData.Dependents} onChange={handleInputChange} required>
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3+">3+</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="Education">Education</label>
                  <select id="Education" name="Education" value={formData.Education} onChange={handleInputChange} required>
                    <option value="Graduate">Graduate</option>
                    <option value="Not Graduate">Not Graduate</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="Self_Employed">Self Employed</label>
                  <select id="Self_Employed" name="Self_Employed" value={formData.Self_Employed} onChange={handleInputChange} required>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="Property_Area">Property Area</label>
                  <select id="Property_Area" name="Property_Area" value={formData.Property_Area} onChange={handleInputChange} required>
                    <option value="Semiurban">Semiurban</option>
                    <option value="Urban">Urban</option>
                    <option value="Rural">Rural</option>
                  </select>
                </div>

                <div className="form-group separator-title">
                  <span>Financial Profile & Loan Metrics</span>
                </div>

                <div className="form-group">
                  <label htmlFor="ApplicantIncome">Applicant Income ($/Month)</label>
                  <input 
                    type="number" 
                    id="ApplicantIncome" 
                    name="ApplicantIncome" 
                    min="0" 
                    value={formData.ApplicantIncome} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="CoapplicantIncome">Coapplicant Income ($/Month)</label>
                  <input 
                    type="number" 
                    id="CoapplicantIncome" 
                    name="CoapplicantIncome" 
                    min="0" 
                    value={formData.CoapplicantIncome} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="LoanAmount">Loan Amount ($ in Thousands)</label>
                  <input 
                    type="number" 
                    id="LoanAmount" 
                    name="LoanAmount" 
                    min="1" 
                    value={formData.LoanAmount} 
                    onChange={handleInputChange} 
                    required 
                  />
                  <span className="input-helper">e.g. 120 = $120,000</span>
                </div>

                <div className="form-group">
                  <label htmlFor="Loan_Amount_Term">Loan Amount Term (Days)</label>
                  <select id="Loan_Amount_Term" name="Loan_Amount_Term" value={formData.Loan_Amount_Term} onChange={handleInputChange} required>
                    <option value="360">360</option>
                    <option value="180">180</option>
                    <option value="120">120</option>
                    <option value="84">84</option>
                    <option value="60">60</option>
                    <option value="36">36</option>
                    <option value="12">12</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="Credit_History">Credit History</label>
                  <select id="Credit_History" name="Credit_History" className="highlight-select" value={formData.Credit_History} onChange={handleInputChange} required>
                    <option value="1.0">1.0 — Good</option>
                    <option value="0.0">0.0 — Not Good</option>
                  </select>
                </div>
              </div>

              <div className="form-actions-row">
                <button type="submit" className={`btn btn-primary ${loading ? 'loading' : ''}`} disabled={loading}>
                  <span className="btn-text">Predict Loan Status</span>
                  <div className="loader"></div>
                </button>
                
                <button type="button" className="btn btn-secondary" onClick={handleReset} disabled={loading}>
                  Clear
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* RIGHT PANEL: Prediction Screen, Calculator & Charts */}
        <section className="panel results-panel">
          
          {/* Interactive Calculator */}
          <div className="card glass-card">
            <div className="card-header-row">
              <h3 style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>Interactive Payment Estimator</h3>
              <div className="interest-rate-badge">Rate: {interestRate}%</div>
            </div>
            <p className="subtitle">Simulate mortgage payment terms in real-time.</p>
            
            <div className="calc-row">
              <div className="calc-slider-group">
                <label htmlFor="interest-slider">Simulate Annual Interest Rate</label>
                <input 
                  type="range" 
                  id="interest-slider" 
                  min="3.0" 
                  max="15.0" 
                  step="0.1" 
                  value={interestRate} 
                  onChange={(e) => setInterestRate(parseFloat(e.target.value))} 
                />
              </div>
            </div>

            <div className="calc-results-grid">
              <div className="calc-metric">
                <span className="metric-label">Estimated Monthly Payment</span>
                <span className="metric-value">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(monthlyPayment)}
                </span>
              </div>
              <div className="calc-metric">
                <span className="metric-label">Total Debt Value</span>
                <span className="metric-value">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalDebt)}
                </span>
              </div>
            </div>
          </div>

          {/* Prediction Result Display */}
          <div className={`card glass-card prediction-card ${prediction ? (prediction.prediction === 'Y' ? 'state-approved' : 'state-rejected') : ''}`}>
            
            {/* Empty State */}
            {!loading && !prediction && !error && (
              <div className="screen-empty">
                <div className="radar-scan">
                  <div className="radar-line"></div>
                </div>
                <h4 style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>ML Decision Console Awaiting Input</h4>
                <p>Modify form values or select a preset, then click Predict to call the FastAPI classifier.</p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="screen-loading">
                <div className="radar-scan">
                  <div className="radar-line"></div>
                </div>
                <h4 style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>Running KNN Classifier...</h4>
                <p>Contacting FastAPI inference engine at {API_BASE_URL}</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="screen-error">
                <h4 style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>Connection Error</h4>
                <p>{error}</p>
                <button className="btn btn-secondary" onClick={() => setError(null)}>Acknowledge</button>
              </div>
            )}

            {/* Results State */}
            {!loading && prediction && (
              <div className="screen-results">
                <div className="result-badge-container">
                  <div className="result-circle">
                    {prediction.prediction === 'Y' ? '✓' : '✗'}
                  </div>
                  <h2 className="result-text" style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>
                    {prediction.prediction === 'Y' ? 'Loan Approved' : 'Loan Rejected'}
                  </h2>
                </div>

                <div className="metrics-grid">
                  <div className="metric-box">
                    <span className="box-title">Simulated Debt-To-Income</span>
                    <span className="box-value">{dti}%</span>
                  </div>
                  <div className="metric-box">
                    <span className="box-title">Credit Standing</span>
                    <span className="box-value">{formData.Credit_History === '1.0' ? 'Good' : 'Poor'}</span>
                  </div>
                </div>

                <div className="result-details">
                  <h4 style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>KNN Classification Verdict</h4>
                  <p style={{ marginBottom: '0.5rem' }}>
                    {prediction.prediction === 'Y' 
                      ? 'The model evaluated the financial inputs and concluded this applicant falls within approved loan limits.'
                      : 'The model flagged this profile as presenting higher risk, likely due to inadequate credit history or income ratios.'
                    }
                  </p>
                  <p style={{ fontStyle: 'italic', opacity: 0.9, marginBottom: '0.35rem' }}>
                    Prediction generated by the KNN machine-learning model.
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Disclaimer: This prediction is generated for educational evaluation purposes and does not guarantee loan approval or represent a real banking decision.
                  </p>
                </div>

                <button className="btn btn-secondary" onClick={() => setPrediction(null)}>Reset Decision Console</button>
              </div>
            )}
          </div>

          {/* Insights Charts */}
          <div className="card glass-card">
            <h3 style={{ fontFamily: 'var(--font-outfit), sans-serif' }}>KNN Model Analytics</h3>
            <p className="subtitle">Tuned K-Nearest Neighbors Classifier Overview (Accuracy: 84.55%)</p>

            <div className="dashboard-grid">
              <div className="chart-container">
                <span className="chart-title">KNN Classification Space</span>
                <div className="svg-chart-wrapper">
                  <svg viewBox="0 0 200 120" className="svg-chart">
                    <line x1="20" y1="100" x2="190" y2="100" stroke="#334155" strokeDasharray="2 2" />
                    <line x1="20" y1="10" x2="20" y2="100" stroke="#334155" strokeDasharray="2 2" />
                    
                    {/* Approved points */}
                    <circle cx="50" cy="40" r="5" fill="#10b981" fillOpacity="0.7" />
                    <circle cx="80" cy="30" r="5" fill="#10b981" fillOpacity="0.7" />
                    <circle cx="110" cy="50" r="5" fill="#10b981" fillOpacity="0.7" />
                    <circle cx="140" cy="20" r="5" fill="#10b981" fillOpacity="0.7" />
                    <circle cx="160" cy="45" r="5" fill="#10b981" fillOpacity="0.7" />
                    
                    {/* Rejected points */}
                    <circle cx="40" cy="80" r="5" fill="#ef4444" fillOpacity="0.7" />
                    <circle cx="65" cy="90" r="5" fill="#ef4444" fillOpacity="0.7" />
                    <circle cx="90" cy="75" r="5" fill="#ef4444" fillOpacity="0.7" />
                    <circle cx="120" cy="85" r="5" fill="#ef4444" fillOpacity="0.7" />
                    <circle cx="150" cy="80" r="5" fill="#ef4444" fillOpacity="0.7" />

                    <path d="M 20 65 Q 100 55 190 60" fill="none" stroke="#6366f1" strokeDasharray="4" strokeWidth="1.5" />
                    <text x="180" y="112" fill="#94a3b8" fontSize="8">Income</text>
                    <text x="6" y="15" fill="#94a3b8" fontSize="8" transform="rotate(-90 6 15)">Loan Amt</text>
                  </svg>
                </div>
                <p className="chart-caption">Decision boundary dividing sample applications.</p>
              </div>

              <div className="chart-container">
                <span className="chart-title">Key Feature Impact</span>
                <div className="svg-chart-wrapper">
                  <svg viewBox="0 0 200 120" className="svg-chart">
                    <text x="10" y="25" fill="#e2e8f0" fontSize="9">Credit History</text>
                    <rect x="80" y="16" width="100" height="10" rx="3" fill="#6366f1" />
                    
                    <text x="10" y="50" fill="#e2e8f0" fontSize="9">Applicant Inc</text>
                    <rect x="80" y="41" width="55" height="10" rx="3" fill="#818cf8" />
                    
                    <text x="10" y="75" fill="#e2e8f0" fontSize="9">Loan Amount</text>
                    <rect x="80" y="66" width="42" height="10" rx="3" fill="#a5b4fc" />

                    <text x="10" y="100" fill="#e2e8f0" fontSize="9">Co-applicant</text>
                    <rect x="80" y="91" width="28" height="10" rx="3" fill="#c7d2fe" />
                  </svg>
                </div>
                <p className="chart-caption">Impact factor weight of model variables.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>AeroLoan ML Suite &copy; 2026. Academic Machine Learning Project powered by Tuned K-Nearest Neighbors.</p>
      </footer>
    </>
  );
}
