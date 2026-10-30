import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.is_temporary_password) {
        navigate('/change-password');
      } else {
        navigate(user.role === 'HR' ? '/hr-dashboard' : '/dashboard');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const loggedInUser = await login(email, password);

      if (loggedInUser.is_temporary_password) {
        navigate('/change-password');
      } else {
        navigate(
          loggedInUser.role === 'HR'
            ? '/hr-dashboard'
            : '/dashboard'
        );
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
      html,
body,
#root {
  width: 100%;
  min-width: 100%;
  margin: 0;
  padding: 0;
}

body {
  overflow-x: hidden;
}
        * {
          box-sizing: border-box;
        }

        .login-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 10% 10%, rgba(59,130,246,.13), transparent 28%),
            radial-gradient(circle at 90% 90%, rgba(99,102,241,.12), transparent 30%),
            #f8fafc;
          color: #172033;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif;
          position: relative;
          overflow: hidden;
        }

        .login-container {
          width: min(1180px, calc(100% - 48px));
          min-height: calc(100vh - 55px);
          margin: auto;
          display: grid;
          grid-template-columns: 1.1fr .9fr;
          align-items: center;
          gap: 70px;
          padding: 45px 0;
          position: relative;
          z-index: 2;
        }

        .brand-section {
          max-width: 570px;
        }

        .logo-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 65px;
        }

        .logo {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px rgba(37,99,235,.25);
        }

        .logo-star {
          color: white;
          font-size: 24px;
        }

        .brand-name {
          font-size: 23px;
          font-weight: 800;
          letter-spacing: -.7px;
        }

        .brand-ai {
          color: #2563eb;
        }

        .eyebrow {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #2563eb;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
          margin-bottom: 17px;
        }

        .eyebrow-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #2563eb;
          box-shadow: 0 0 0 5px rgba(37,99,235,.1);
        }

        .main-heading {
          font-size: 55px;
          line-height: 1.06;
          letter-spacing: -2.8px;
          margin: 0 0 22px;
          font-weight: 800;
          color: #111827;
        }

        .heading-gradient {
          background: linear-gradient(90deg, #2563eb, #4f46e5);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .description {
          max-width: 510px;
          color: #64748b;
          font-size: 17px;
          line-height: 1.75;
          margin: 0 0 40px;
        }

        .features {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .feature-icon {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          background: white;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2563eb;
          font-weight: 800;
          box-shadow: 0 4px 12px rgba(15,23,42,.04);
          flex-shrink: 0;
        }

        .feature-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
        }

        .feature-text {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 3px;
        }

        .login-section {
          display: flex;
          justify-content: center;
        }

        .login-card {
          width: 100%;
          max-width: 440px;
          padding: 40px;
          background: rgba(255,255,255,.96);
          border: 1px solid #e2e8f0;
          border-radius: 22px;
          box-shadow:
            0 25px 70px rgba(15,23,42,.10),
            0 4px 15px rgba(15,23,42,.04);
        }

        .mobile-logo {
          display: none;
          align-items: center;
          gap: 10px;
          margin-bottom: 30px;
        }

        .welcome-badge {
          display: inline-block;
          padding: 6px 11px;
          border-radius: 8px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 13px;
        }

        .card-title {
          font-size: 29px;
          line-height: 1.2;
          letter-spacing: -.8px;
          margin: 0 0 9px;
          color: #111827;
          font-weight: 780;
        }

        .card-subtitle {
          margin: 0 0 30px;
          font-size: 14px;
          color: #94a3b8;
        }

        .error-box {
          display: flex;
          gap: 10px;
          padding: 12px;
          margin-bottom: 22px;
          border-radius: 11px;
          background: #fff1f2;
          border: 1px solid #fecdd3;
          color: #be123c;
          font-size: 12px;
          line-height: 1.4;
        }

        .error-icon {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #e11d48;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          flex-shrink: 0;
        }

        .error-title {
          font-weight: 750;
          margin-bottom: 2px;
        }

        .field {
          margin-bottom: 21px;
        }

        .label {
          display: block;
          margin-bottom: 8px;
          font-size: 13px;
          font-weight: 650;
          color: #334155;
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          display: flex;
          pointer-events: none;
        }

        .input {
          width: 100%;
          height: 50px;
          border: 1px solid #dbe3ef;
          border-radius: 11px;
          background: #f8fafc;
          padding: 0 44px;
          font-size: 14px;
          color: #172033;
          outline: none;
          transition: .2s;
        }

        .input::placeholder {
          color: #b0bac8;
        }

        .input:focus {
          border-color: #60a5fa;
          background: white;
          box-shadow: 0 0 0 4px rgba(37,99,235,.10);
        }

        .eye-button {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          padding: 6px;
          display: flex;
        }

        .eye-button:hover {
          color: #2563eb;
        }

        .login-button {
          width: 100%;
          height: 51px;
          border: none;
          border-radius: 11px;
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          color: white;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 10px 22px rgba(37,99,235,.22);
          transition: .2s;
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 14px 28px rgba(37,99,235,.28);
        }

        .login-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-button:disabled {
          opacity: .75;
          cursor: not-allowed;
        }

        .arrow {
          font-size: 19px;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,.35);
          border-top-color: white;
          border-radius: 50%;
          animation: spin .7s linear infinite;
        }

        .security-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 25px;
          color: #94a3b8;
          font-size: 11px;
        }

        .security-check {
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: #dcfce7;
          color: #16a34a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 800;
        }

        .footer {
          height: 55px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          font-size: 11px;
          position: relative;
          z-index: 2;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 900px) {
          .login-container {
            grid-template-columns: 1fr;
            max-width: 560px;
            gap: 10px;
          }

          .brand-section {
            display: none;
          }

          .mobile-logo {
            display: flex;
          }

          .login-card {
            margin: auto;
          }
        }

        @media (max-width: 600px) {
          .login-container {
            width: calc(100% - 30px);
            min-height: calc(100vh - 45px);
            padding: 25px 0;
          }

          .login-card {
            padding: 28px 22px;
            border-radius: 18px;
          }

          .card-title {
            font-size: 25px;
          }

          .footer {
            height: 45px;
          }
        }
      `}</style>

      <div className="login-page">
        <div className="login-container">

          {/* LEFT SIDE */}
          <section className="brand-section">
            <div className="logo-row">
              <div className="logo">
                <span className="logo-star">✦</span>
              </div>

              <span className="brand-name">
                HRMind <span className="brand-ai">AI</span>
              </span>
            </div>

            <div className="eyebrow">
              <span className="eyebrow-dot" />
              INTELLIGENT HR PLATFORM
            </div>

            <h1 className="main-heading">
              Smarter HR.
              <br />
              <span className="heading-gradient">
                Better workplace.
              </span>
            </h1>

            <p className="description">
              Your intelligent HR assistant for policy guidance,
              employee support, and grievance management — all in one
              secure workspace.
            </p>

            <div className="features">
              <Feature
                icon="✦"
                title="AI-powered HR assistance"
                text="Get grounded answers from your HR policies."
              />

              <Feature
                icon="✓"
                title="Secure & role-based"
                text="Employees and HR get their own protected workspace."
              />

              <Feature
                icon="◎"
                title="Centralized grievances"
                text="Track workplace concerns from submission to resolution."
              />
            </div>
          </section>

          {/* LOGIN SIDE */}
          <section className="login-section">
            <div className="login-card">

              <div className="mobile-logo">
                <div className="logo">
                  <span className="logo-star">✦</span>
                </div>

                <span className="brand-name">
                  HRMind <span className="brand-ai">AI</span>
                </span>
              </div>

              <div className="welcome-badge">
                Welcome back
              </div>

              <h2 className="card-title">
                Sign in to your workspace
              </h2>

              <p className="card-subtitle">
                Enter your credentials to continue.
              </p>

              {error && (
                <div className="error-box">
                  <div className="error-icon">!</div>

                  <div>
                    <div className="error-title">
                      Unable to sign in
                    </div>
                    <div>{error}</div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>

                {/* EMAIL */}
                <div className="field">
                  <label className="label">
                    Email address
                  </label>

                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <rect
                          x="3"
                          y="5"
                          width="18"
                          height="14"
                          rx="2"
                        />
                        <path d="m3 7 9 6 9-6" />
                      </svg>
                    </span>

                    <input
                      className="input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div className="field">
                  <label className="label">
                    Password
                  </label>

                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <rect
                          x="5"
                          y="10"
                          width="14"
                          height="10"
                          rx="2"
                        />
                        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                      </svg>
                    </span>

                    <input
                      className="input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                    />

                    <button
                      type="button"
                      className="eye-button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                    >
                      {showPassword ? '◉' : '◌'}
                    </button>
                  </div>
                </div>

                {/* LOGIN */}
                <button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <span className="arrow">→</span>
                    </>
                  )}
                </button>
              </form>

              <div className="security-note">
                <span className="security-check">✓</span>
                Secure access · HRMind AI
              </div>

            </div>
          </section>

        </div>

        <div className="footer">
          HRMind AI · Intelligent HR Management
        </div>
      </div>
    </>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="feature">
      <div className="feature-icon">
        {icon}
      </div>

      <div>
        <div className="feature-title">
          {title}
        </div>

        <div className="feature-text">
          {text}
        </div>
      </div>
    </div>
  );
}