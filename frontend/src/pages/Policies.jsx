import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Icon = ({ name, size = 20 }) => {
  const icons = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    ticket: (
      <>
        <path d="M4 5h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V5Z" />
        <path d="M9 8v8M12 8v2M12 14v2M15 8v8" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8M8 17h6" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M5 20h14" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6" />
        <path d="M10 11v6M14 11v6" />
      </>
    ),
    refresh: (
      <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />
    ),
    logout: (
      <>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
      </>
    ),
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[name]}
    </svg>
  );
};

export default function Policies() {
  const { user, logout } = useAuth();

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [uploadName, setUploadName] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/policies/');
      setPolicies(response.data);
    } catch (err) {
      setError('Failed to fetch policies.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files?.length > 0) {
      setUploadFile(e.target.files[0]);
      setError('');
      setSuccess('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!uploadName.trim() || !uploadFile) {
      setError('Please provide both a policy name and a PDF file.');
      return;
    }

    if (uploadFile.type !== 'application/pdf') {
      setError('Only PDF files are supported.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('name', uploadName);
    formData.append('file', uploadFile);

    try {
      await api.post('/policies/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Policy uploaded successfully. It is now processing.');
      setUploadName('');
      setUploadFile(null);

      const input = document.getElementById('policyFileInput');
      if (input) input.value = '';

      fetchPolicies();
    } catch (err) {
      let errMsg = 'Upload failed.';

      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errMsg = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errMsg =
            'Validation Error: ' +
            err.response.data.detail
              .map((d) => `${d.loc.join('.')} - ${d.msg}`)
              .join(', ');
        }
      }

      setError(errMsg);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (policyId) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this policy? This action cannot be undone.'
      )
    ) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await api.delete(`/policies/${policyId}`);
      setSuccess('Policy deleted successfully.');
      fetchPolicies();
    } catch (err) {
      setError('Failed to delete policy.');
      console.error(err);
    }
  };

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        html, body, #root {
          margin: 0;
          width: 100%;
          min-height: 100%;
        }

        body {
          font-family: Inter, ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: #f5f7fb;
          color: #172033;
        }

        button, input {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        .policy-shell {
          min-height: 100vh;
          display: flex;
          background: #f5f7fb;
        }

        /* SIDEBAR */

        .policy-sidebar {
          width: 250px;
          background: #111827;
          color: white;
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          z-index: 20;
          padding: 22px 16px;
          display: flex;
          flex-direction: column;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 4px 10px 30px;
        }

        .brand-logo {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          box-shadow: 0 8px 20px rgba(79,70,229,.3);
          font-weight: 800;
          font-size: 18px;
        }

        .brand-name {
          font-size: 19px;
          font-weight: 750;
          letter-spacing: -.4px;
        }

        .brand-sub {
          font-size: 10px;
          color: #9ca3af;
          margin-top: 2px;
          letter-spacing: .8px;
        }

        .nav-label {
          color: #6b7280;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          padding: 0 12px 9px;
        }

        .side-nav {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .nav-link {
          border: 0;
          background: transparent;
          color: #aeb6c6;
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 13px;
          border-radius: 10px;
          text-decoration: none;
          font-size: 14px;
          transition: .2s;
        }

        .nav-link:hover {
          color: white;
          background: #1f2937;
        }

        .nav-link.active {
          color: white;
          background: linear-gradient(
            90deg,
            rgba(79,70,229,.95),
            rgba(99,102,241,.75)
          );
          box-shadow: 0 7px 18px rgba(79,70,229,.2);
        }

        .sidebar-bottom {
          margin-top: auto;
          border-top: 1px solid #273142;
          padding-top: 15px;
        }

        .profile-mini {
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .avatar {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #312e81;
          color: #ddd6fe;
          font-size: 13px;
          font-weight: 700;
        }

        .profile-email {
          font-size: 11px;
          color: #d1d5db;
          max-width: 145px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .profile-role {
          color: #6b7280;
          font-size: 10px;
          margin-top: 2px;
        }

        .logout-side {
          border: 0;
          background: transparent;
          color: #fca5a5;
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 13px;
          border-radius: 10px;
          font-size: 14px;
        }

        .logout-side:hover {
          background: #1f2937;
        }

        /* MAIN */

        .policy-main {
          margin-left: 250px;
          width: calc(100% - 250px);
          min-height: 100vh;
        }

        .topbar {
          height: 76px;
          background: rgba(255,255,255,.92);
          border-bottom: 1px solid #e8ebf1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 34px;
          position: sticky;
          top: 0;
          z-index: 10;
          backdrop-filter: blur(10px);
        }

        .page-title {
          font-size: 22px;
          font-weight: 750;
          margin: 0;
          color: #111827;
          letter-spacing: -.4px;
        }

        .page-subtitle {
          margin: 4px 0 0;
          color: #7b8495;
          font-size: 12px;
        }

        .top-profile {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .top-email {
          color: #475569;
          font-size: 13px;
        }

        .top-role {
          color: #6366f1;
          font-weight: 650;
        }

        .logout-btn {
          border: 1px solid #fecaca;
          color: #dc2626;
          background: white;
          padding: 8px 12px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 650;
        }

        .logout-btn:hover {
          background: #fef2f2;
        }

        .policy-content {
          padding: 30px 34px 50px;
          max-width: 1450px;
          margin: auto;
        }

        /* HERO */

        .policy-hero {
          background:
            radial-gradient(circle at 90% 20%, rgba(129,140,248,.23), transparent 28%),
            linear-gradient(135deg, #111827, #1e1b4b);
          color: white;
          border-radius: 18px;
          padding: 25px 29px;
          margin-bottom: 22px;
          position: relative;
          overflow: hidden;
        }

        .policy-hero h2 {
          margin: 0;
          font-size: 24px;
          letter-spacing: -.5px;
        }

        .policy-hero p {
          margin: 7px 0 0;
          color: #c7d2fe;
          font-size: 12px;
        }

        /* ALERTS */

        .alert {
          padding: 12px 15px;
          border-radius: 10px;
          margin-bottom: 16px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .alert-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
        }

        .alert-success {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #047857;
        }

        /* LAYOUT */

        .policy-grid {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 20px;
          align-items: start;
        }

        .card {
          background: white;
          border: 1px solid #e6e9ef;
          border-radius: 15px;
          box-shadow: 0 4px 18px rgba(15,23,42,.035);
        }

        /* UPLOAD */

        .upload-card {
          padding: 22px;
          position: sticky;
          top: 100px;
        }

        .card-heading {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 5px;
        }

        .heading-icon {
          width: 39px;
          height: 39px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eef2ff;
          color: #4f46e5;
        }

        .card-title {
          margin: 0;
          font-size: 15px;
          color: #172033;
        }

        .card-desc {
          margin: 0 0 20px 50px;
          font-size: 11px;
          color: #8a93a3;
          line-height: 1.5;
        }

        .field {
          margin-bottom: 16px;
        }

        .field label {
          display: block;
          font-size: 11px;
          color: #475569;
          font-weight: 650;
          margin-bottom: 6px;
        }

        .text-input {
          width: 100%;
          border: 1px solid #dfe3ea;
          border-radius: 9px;
          padding: 10px 11px;
          outline: none;
          font-size: 12px;
          color: #334155;
          background: #fff;
        }

        .text-input:focus {
          border-color: #818cf8;
          box-shadow: 0 0 0 3px rgba(99,102,241,.1);
        }

        .file-box {
          border: 1.5px dashed #cbd5e1;
          border-radius: 10px;
          padding: 17px 12px;
          text-align: center;
          background: #fafbff;
          transition: .2s;
        }

        .file-box:hover {
          border-color: #818cf8;
          background: #f8f7ff;
        }

        .file-box input {
          width: 100%;
          font-size: 11px;
        }

        .file-name {
          margin-top: 8px;
          color: #6366f1;
          font-size: 10px;
          word-break: break-all;
        }

        .upload-btn {
          width: 100%;
          border: 0;
          background: #4f46e5;
          color: white;
          border-radius: 9px;
          padding: 11px;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .upload-btn:hover {
          background: #4338ca;
        }

        .upload-btn:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .upload-note {
          margin-top: 12px;
          font-size: 10px;
          color: #94a3b8;
          line-height: 1.5;
          text-align: center;
        }

        /* POLICY LIST */

        .list-card {
          padding: 21px;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .list-title {
          margin: 0;
          font-size: 16px;
          color: #172033;
        }

        .list-desc {
          margin: 4px 0 0;
          font-size: 11px;
          color: #8a93a3;
        }

        .refresh-btn {
          border: 1px solid #e1e5eb;
          background: white;
          color: #64748b;
          border-radius: 8px;
          padding: 8px 11px;
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
        }

        .refresh-btn:hover {
          background: #f8fafc;
        }

        .policy-item {
          border: 1px solid #e5e9f0;
          border-radius: 12px;
          padding: 17px;
          margin-bottom: 12px;
          transition: .2s;
        }

        .policy-item:hover {
          border-color: #c7d2fe;
          box-shadow: 0 6px 18px rgba(79,70,229,.06);
        }

        .policy-main-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
        }

        .policy-name-row {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .pdf-icon {
          width: 38px;
          height: 38px;
          border-radius: 9px;
          background: #fef2f2;
          color: #dc2626;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .policy-name {
          margin: 0;
          font-size: 14px;
          color: #1e293b;
          font-weight: 750;
        }

        .policy-meta {
          margin-top: 4px;
          font-size: 10px;
          color: #8a93a3;
        }

        .delete-btn {
          border: 1px solid #fecaca;
          background: #fff;
          color: #dc2626;
          padding: 7px 10px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          font-weight: 700;
        }

        .delete-btn:hover {
          background: #fef2f2;
        }

        .version-summary {
          margin-top: 15px;
          display: flex;
          align-items: center;
          gap: 9px;
          flex-wrap: wrap;
        }

        .version-badge {
          background: #eef2ff;
          color: #4f46e5;
          padding: 5px 8px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 750;
        }

        .status-badge {
          padding: 5px 8px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 750;
        }

        .ready {
          background: #ecfdf5;
          color: #047857;
        }

        .processing {
          background: #fff7ed;
          color: #c2410c;
        }

        .failed {
          background: #fef2f2;
          color: #dc2626;
        }

        .history {
          margin-top: 14px;
          border-top: 1px solid #edf0f4;
          padding-top: 13px;
        }

        .history summary {
          list-style: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 7px;
          color: #4f46e5;
          font-size: 11px;
          font-weight: 700;
        }

        .history summary::-webkit-details-marker {
          display: none;
        }

        .history-content {
          margin-top: 12px;
          overflow-x: auto;
        }

        .version-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 520px;
        }

        .version-table th {
          text-align: left;
          background: #f8fafc;
          color: #8a93a3;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: .6px;
          padding: 9px;
        }

        .version-table td {
          border-top: 1px solid #edf0f4;
          padding: 10px 9px;
          font-size: 10px;
          color: #475569;
        }

        .loading {
          padding: 60px 20px;
          text-align: center;
          color: #64748b;
          font-size: 11px;
        }

        .spinner {
          width: 25px;
          height: 25px;
          border: 3px solid #e0e7ff;
          border-top-color: #4f46e5;
          border-radius: 50%;
          animation: spin .7s linear infinite;
          margin: 0 auto 10px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-icon {
          width: 50px;
          height: 50px;
          margin: 0 auto 12px;
          border-radius: 50%;
          background: #f1f5f9;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .empty-title {
          font-size: 14px;
          font-weight: 700;
          color: #334155;
        }

        .empty-text {
          margin-top: 5px;
          font-size: 11px;
          color: #8a93a3;
        }

        /* RESPONSIVE */

        @media (max-width: 1000px) {
          .policy-grid {
            grid-template-columns: 1fr;
          }

          .upload-card {
            position: static;
          }
        }

        @media (max-width: 760px) {
          .policy-sidebar {
            width: 70px;
            padding: 16px 9px;
          }

          .brand {
            justify-content: center;
            padding: 3px 0 25px;
          }

          .brand-name,
          .brand-sub,
          .nav-label,
          .nav-link span,
          .profile-mini > div:not(.avatar),
          .logout-side span {
            display: none;
          }

          .nav-link,
          .logout-side {
            justify-content: center;
            padding: 12px;
          }

          .profile-mini {
            justify-content: center;
            padding: 10px 0;
          }

          .policy-main {
            margin-left: 70px;
            width: calc(100% - 70px);
          }

          .topbar {
            padding: 0 16px;
          }

          .top-email {
            display: none;
          }

          .policy-content {
            padding: 20px 15px 40px;
          }

          .policy-hero {
            padding: 21px;
          }

          .policy-hero h2 {
            font-size: 20px;
          }
        }

        @media (max-width: 480px) {
          .topbar {
            height: 68px;
          }

          .page-title {
            font-size: 18px;
          }

          .policy-main-row {
            flex-direction: column;
          }

          .delete-btn {
            align-self: flex-start;
          }
        }
      `}</style>

      <div className="policy-shell">

        {/* SIDEBAR */}
        <aside className="policy-sidebar">

          <div className="brand">
            <div className="brand-logo">H</div>

            <div>
              <div className="brand-name">HRMind AI</div>
              <div className="brand-sub">HR MANAGEMENT</div>
            </div>
          </div>

          <div className="nav-label">Workspace</div>

          <nav className="side-nav">

            <Link className="nav-link" to="/hr-dashboard">
              <Icon name="grid" />
              <span>Overview</span>
            </Link>

            <Link className="nav-link" to="/hr-dashboard">
              <Icon name="ticket" />
              <span>Grievances</span>
            </Link>

            <Link className="nav-link active" to="/policies">
              <Icon name="file" />
              <span>Policies</span>
            </Link>

            <Link className="nav-link" to="/employees">
              <Icon name="users" />
              <span>Employees</span>
            </Link>

          </nav>

          <div className="sidebar-bottom">

            <div className="profile-mini">
              <div className="avatar">
                {(user?.email || 'HR').slice(0, 1).toUpperCase()}
              </div>

              <div>
                <div className="profile-email">
                  {user?.email || 'HR User'}
                </div>

                <div className="profile-role">
                  HR Administrator
                </div>
              </div>
            </div>

            <button
              className="logout-side"
              onClick={logout}
            >
              <Icon name="logout" />
              <span>Logout</span>
            </button>

          </div>
        </aside>

        {/* MAIN */}
        <main className="policy-main">

          <header className="topbar">

            <div>
              <h1 className="page-title">
                Policy Knowledge Base
              </h1>

              <p className="page-subtitle">
                Manage HR policies and knowledge documents
              </p>
            </div>

            <div className="top-profile">

              <div className="avatar">
                {(user?.email || 'HR').slice(0, 1).toUpperCase()}
              </div>

              <div className="top-email">
                {user?.email || 'HR User'}{' '}
                <span className="top-role">(HR)</span>
              </div>

              <button
                className="logout-btn"
                onClick={logout}
              >
                <Icon name="logout" size={15} />
                Logout
              </button>

            </div>

          </header>

          <div className="policy-content">

            <section className="policy-hero">
              <h2>HR Policy Knowledge Base 📚</h2>

              <p>
                Upload and manage policy documents used by HRMind AI
                for grounded employee assistance.
              </p>
            </section>

            {error && (
              <div className="alert alert-error">
                ⚠ {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                ✓ {success}
              </div>
            )}

            <div className="policy-grid">

              {/* UPLOAD */}
              <div className="card upload-card">

                <div className="card-heading">
                  <div className="heading-icon">
                    <Icon name="upload" />
                  </div>

                  <h2 className="card-title">
                    Upload Policy
                  </h2>
                </div>

                <p className="card-desc">
                  Add a new HR policy PDF to the knowledge base.
                </p>

                <form onSubmit={handleUpload}>

                  <div className="field">

                    <label>
                      Policy Name
                    </label>

                    <input
                      className="text-input"
                      type="text"
                      value={uploadName}
                      onChange={(e) =>
                        setUploadName(e.target.value)
                      }
                      placeholder="e.g. Leave Policy"
                    />

                  </div>

                  <div className="field">

                    <label>
                      Policy Document
                    </label>

                    <div className="file-box">

                      <input
                        id="policyFileInput"
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                      />

                      {uploadFile && (
                        <div className="file-name">
                          {uploadFile.name}
                        </div>
                      )}

                    </div>

                  </div>

                  <button
                    className="upload-btn"
                    type="submit"
                    disabled={uploading}
                  >
                    <Icon name="upload" size={16} />

                    {uploading
                      ? 'Uploading...'
                      : 'Upload Policy'}
                  </button>

                  <div className="upload-note">
                    Only PDF files are supported.
                    <br />
                    Documents will be processed and indexed automatically.
                  </div>

                </form>

              </div>

              {/* POLICY LIST */}
              <div className="card list-card">

                <div className="list-header">

                  <div>
                    <h2 className="list-title">
                      Existing Policies
                    </h2>

                    <p className="list-desc">
                      {policies.length}{' '}
                      {policies.length === 1
                        ? 'policy'
                        : 'policies'}{' '}
                      available in the knowledge base
                    </p>
                  </div>

                  <button
                    className="refresh-btn"
                    onClick={fetchPolicies}
                    disabled={loading}
                  >
                    <Icon name="refresh" size={14} />

                    {loading
                      ? 'Refreshing...'
                      : 'Refresh'}
                  </button>

                </div>

                {loading ? (

                  <div className="loading">
                    <div className="spinner" />
                    Loading policies...
                  </div>

                ) : policies.length === 0 ? (

                  <div className="empty">

                    <div className="empty-icon">
                      <Icon name="file" />
                    </div>

                    <div className="empty-title">
                      No policies found
                    </div>

                    <div className="empty-text">
                      Upload your first HR policy to get started.
                    </div>

                  </div>

                ) : (

                  policies.map((policy) => {

                    const versions = policy.versions || [];

                    const currentVersion =
                      versions.length > 0
                        ? versions.reduce(
                            (prev, current) =>
                              prev.version_number >
                              current.version_number
                                ? prev
                                : current
                          )
                        : null;

                    const sortedVersions = [...versions].sort(
                      (a, b) =>
                        b.version_number -
                        a.version_number
                    );

                    return (

                      <div
                        className="policy-item"
                        key={policy.id}
                      >

                        <div className="policy-main-row">

                          <div className="policy-name-row">

                            <div className="pdf-icon">
                              <Icon
                                name="file"
                                size={19}
                              />
                            </div>

                            <div>

                              <h3 className="policy-name">
                                {policy.name}
                              </h3>

                              {currentVersion && (
                                <div className="policy-meta">
                                  Last version: v
                                  {currentVersion.version_number}
                                </div>
                              )}

                            </div>

                          </div>

                          <button
                            className="delete-btn"
                            onClick={() =>
                              handleDelete(policy.id)
                            }
                          >
                            <Icon
                              name="trash"
                              size={13}
                            />
                            Delete
                          </button>

                        </div>

                        {currentVersion && (

                          <div className="version-summary">

                            <span className="version-badge">
                              Current v
                              {currentVersion.version_number}
                            </span>

                            <span
                              className={`status-badge ${
                                currentVersion.status ===
                                'READY'
                                  ? 'ready'
                                  : currentVersion.status ===
                                    'FAILED'
                                  ? 'failed'
                                  : 'processing'
                              }`}
                            >
                              {currentVersion.status}
                            </span>

                            {currentVersion.filename && (
                              <span className="policy-meta">
                                {currentVersion.filename}
                              </span>
                            )}

                          </div>

                        )}

                        <details className="history">

                          <summary>
                            <Icon
                              name="history"
                              size={14}
                            />

                            View Version History

                            <Icon
                              name="arrow"
                              size={13}
                            />
                          </summary>

                          <div className="history-content">

                            {sortedVersions.length === 0 ? (

                              <div className="empty-text">
                                No versions available.
                              </div>

                            ) : (

                              <table className="version-table">

                                <thead>
                                  <tr>
                                    <th>Version</th>
                                    <th>Filename</th>
                                    <th>Status</th>
                                    <th>Upload Date</th>
                                  </tr>
                                </thead>

                                <tbody>

                                  {sortedVersions.map((v) => (

                                    <tr key={v.id}>

                                      <td>
                                        <strong>
                                          v{v.version_number}
                                        </strong>
                                      </td>

                                      <td>
                                        {v.filename}
                                      </td>

                                      <td>

                                        <span
                                          className={`status-badge ${
                                            v.status ===
                                            'READY'
                                              ? 'ready'
                                              : v.status ===
                                                'FAILED'
                                              ? 'failed'
                                              : 'processing'
                                          }`}
                                        >
                                          {v.status}
                                        </span>

                                      </td>

                                      <td>
                                        {new Date(
                                          v.created_at
                                        ).toLocaleString()}
                                      </td>

                                    </tr>

                                  ))}

                                </tbody>

                              </table>

                            )}

                          </div>

                        </details>

                      </div>

                    );

                  })

                )}

              </div>

            </div>

          </div>

        </main>

      </div>
    </>
  );
}