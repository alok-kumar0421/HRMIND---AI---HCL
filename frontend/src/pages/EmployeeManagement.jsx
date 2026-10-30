import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

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
    logout: (
      <>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
      </>
    ),
    refresh: (
      <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />
    ),
    userPlus: (
      <>
        <path d="M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8" cy="7" r="4" />
        <path d="M19 8v6M16 11h6" />
      </>
    ),
    key: (
      <>
        <circle cx="7.5" cy="15.5" r="3.5" />
        <path d="m10 13 8-8M16 5l3 3M14 7l3 3" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
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

export default function EmployeeManagement() {
  const { user, logout } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tempPassword, setTempPassword] = useState('');

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.get('/employees/');
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load employees.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');
    setTempPassword('');

    try {
      const res = await api.post('/employees/', {
        email,
        full_name: fullName,
        role,
        is_active: true,
      });

      setTempPassword(res.data.temp_password);
      setSuccess('Employee created successfully!');

      setEmail('');
      setFullName('');
      setRole('EMPLOYEE');

      fetchEmployees();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          'Failed to create employee.'
      );
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    setError('');
    setSuccess('');

    try {
      await api.put(`/employees/${id}/status`, {
        is_active: !currentStatus,
      });

      setSuccess('Employee status updated.');
      fetchEmployees();
    } catch (err) {
      console.error(err);
      setError('Failed to update status.');
    }
  };

  const handleResetPassword = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to reset this user's password?"
      )
    ) {
      return;
    }

    setError('');
    setSuccess('');
    setTempPassword('');

    try {
      const res = await api.post(
        `/employees/${id}/reset-password`
      );

      setTempPassword(res.data.temp_password);
      setSuccess('Password reset successfully!');
    } catch (err) {
      console.error(err);
      setError('Failed to reset password.');
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const q = search.toLowerCase();

    return (
      String(emp.id).includes(q) ||
      (emp.full_name || '').toLowerCase().includes(q) ||
      (emp.email || '').toLowerCase().includes(q) ||
      (emp.role || '').toLowerCase().includes(q)
    );
  });

  const activeCount = employees.filter(
    (emp) => emp.is_active
  ).length;

  const inactiveCount = employees.length - activeCount;

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

        button,
        input,
        select {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        .emp-shell {
          min-height: 100vh;
          display: flex;
          background: #f5f7fb;
        }

        /* SIDEBAR */

        .emp-sidebar {
          width: 250px;
          background: #111827;
          color: white;
          position: fixed;
          inset: 0 auto 0 0;
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

        .emp-main {
          margin-left: 250px;
          width: calc(100% - 250px);
          min-height: 100vh;
        }

        .topbar {
          height: 76px;
          background: rgba(255,255,255,.94);
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

        .emp-content {
          padding: 30px 34px 50px;
          max-width: 1500px;
          margin: auto;
        }

        /* HERO */

        .emp-hero {
          background:
            radial-gradient(circle at 90% 15%, rgba(129,140,248,.25), transparent 30%),
            linear-gradient(135deg, #111827, #1e1b4b);
          color: white;
          border-radius: 18px;
          padding: 25px 29px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .emp-hero h2 {
          margin: 0;
          font-size: 24px;
          letter-spacing: -.5px;
        }

        .emp-hero p {
          margin: 7px 0 0;
          color: #c7d2fe;
          font-size: 12px;
        }

        .hero-stats {
          display: flex;
          gap: 10px;
        }

        .hero-stat {
          min-width: 90px;
          padding: 11px 14px;
          border-radius: 11px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.12);
          text-align: center;
        }

        .hero-stat strong {
          display: block;
          font-size: 20px;
        }

        .hero-stat span {
          color: #c7d2fe;
          font-size: 9px;
        }

        /* ALERT */

        .alert {
          padding: 12px 15px;
          border-radius: 10px;
          margin-bottom: 16px;
          font-size: 12px;
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

        .password-alert {
          background: #fffbeb;
          border: 1px solid #fde68a;
          color: #92400e;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 18px;
        }

        .password-title {
          font-weight: 750;
          font-size: 12px;
          margin-bottom: 10px;
        }

        .password-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .password-code {
          background: white;
          border: 1px solid #fcd34d;
          padding: 7px 12px;
          border-radius: 7px;
          font-family: monospace;
          font-size: 14px;
          font-weight: 700;
          color: #111827;
        }

        .password-note {
          margin: 8px 0 0;
          font-size: 10px;
          color: #a16207;
        }

        /* GRID */

        .emp-grid {
          display: grid;
          grid-template-columns: 330px 1fr;
          gap: 20px;
          align-items: start;
        }

        .card {
          background: white;
          border: 1px solid #e6e9ef;
          border-radius: 15px;
          box-shadow: 0 4px 18px rgba(15,23,42,.035);
        }

        /* CREATE */

        .create-card {
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
          margin-bottom: 15px;
        }

        .field label {
          display: block;
          font-size: 11px;
          color: #475569;
          font-weight: 650;
          margin-bottom: 6px;
        }

        .input,
        .select {
          width: 100%;
          border: 1px solid #dfe3ea;
          border-radius: 9px;
          padding: 10px 11px;
          outline: none;
          font-size: 12px;
          color: #334155;
          background: white;
        }

        .input:focus,
        .select:focus {
          border-color: #818cf8;
          box-shadow: 0 0 0 3px rgba(99,102,241,.1);
        }

        .create-btn {
          width: 100%;
          border: 0;
          background: #4f46e5;
          color: white;
          border-radius: 9px;
          padding: 11px;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
        }

        .create-btn:hover {
          background: #4338ca;
        }

        /* DIRECTORY */

        .directory-card {
          padding: 21px;
          min-width: 0;
        }

        .directory-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 15px;
        }

        .directory-title {
          margin: 0;
          font-size: 16px;
          color: #172033;
        }

        .directory-desc {
          margin: 4px 0 0;
          font-size: 11px;
          color: #8a93a3;
        }

        .head-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .search-box {
          position: relative;
        }

        .search-box svg {
          position: absolute;
          left: 9px;
          top: 9px;
          color: #94a3b8;
        }

        .search-input {
          width: 190px;
          border: 1px solid #e1e5eb;
          border-radius: 8px;
          padding: 8px 10px 8px 31px;
          font-size: 11px;
          outline: none;
        }

        .search-input:focus {
          border-color: #818cf8;
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

        .table-wrap {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 720px;
        }

        th {
          text-align: left;
          padding: 10px 9px;
          background: #f8fafc;
          color: #64748b;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: .65px;
          font-weight: 750;
        }

        td {
          padding: 12px 9px;
          border-bottom: 1px solid #edf0f4;
          color: #475569;
          font-size: 11px;
          vertical-align: middle;
        }

        tbody tr:hover {
          background: #fafbff;
        }

        .id-cell {
          color: #94a3b8;
          font-weight: 700;
        }

        .name-cell {
          color: #1e293b;
          font-weight: 700;
        }

        .email-cell {
          color: #64748b;
        }

        .role-badge {
          display: inline-block;
          padding: 5px 8px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 750;
        }

        .role-employee {
          background: #eff6ff;
          color: #2563eb;
        }

        .role-hr {
          background: #f5f3ff;
          color: #7c3aed;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 750;
        }

        .status-badge::before {
          content: "";
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }

        .active {
          background: #ecfdf5;
          color: #047857;
        }

        .active::before {
          background: #10b981;
        }

        .inactive {
          background: #fef2f2;
          color: #b91c1c;
        }

        .inactive::before {
          background: #ef4444;
        }

        .actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .action-btn {
          border: 0;
          border-radius: 7px;
          padding: 7px 9px;
          font-size: 9px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .toggle-btn {
          background: #fff7ed;
          color: #c2410c;
        }

        .toggle-btn:hover {
          background: #ffedd5;
        }

        .activate-btn {
          background: #ecfdf5;
          color: #047857;
        }

        .activate-btn:hover {
          background: #d1fae5;
        }

        .reset-btn {
          background: #eef2ff;
          color: #4f46e5;
        }

        .reset-btn:hover {
          background: #e0e7ff;
        }

        .loading,
        .empty {
          text-align: center;
          padding: 55px 20px;
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
          to {
            transform: rotate(360deg);
          }
        }

        .empty strong {
          display: block;
          color: #334155;
          font-size: 14px;
          margin-bottom: 5px;
        }

        .empty span {
          color: #94a3b8;
        }

        /* RESPONSIVE */

        @media (max-width: 1100px) {
          .emp-grid {
            grid-template-columns: 1fr;
          }

          .create-card {
            position: static;
          }
        }

        @media (max-width: 760px) {
          .emp-sidebar {
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

          .emp-main {
            margin-left: 70px;
            width: calc(100% - 70px);
          }

          .topbar {
            padding: 0 16px;
          }

          .top-email {
            display: none;
          }

          .emp-content {
            padding: 20px 15px 40px;
          }

          .emp-hero {
            align-items: flex-start;
            flex-direction: column;
          }

          .hero-stats {
            width: 100%;
          }

          .hero-stat {
            flex: 1;
          }

          .directory-head {
            align-items: flex-start;
            flex-direction: column;
          }

          .head-actions {
            width: 100%;
          }

          .search-box {
            flex: 1;
          }

          .search-input {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .page-title {
            font-size: 18px;
          }

          .topbar {
            height: 68px;
          }

          .head-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .refresh-btn {
            justify-content: center;
          }
        }
      `}</style>

      <div className="emp-shell">

        {/* SIDEBAR */}
        <aside className="emp-sidebar">

          <div className="brand">
            <div className="brand-logo">H</div>

            <div>
              <div className="brand-name">HRMind AI</div>
              <div className="brand-sub">HR MANAGEMENT</div>
            </div>
          </div>

          <div className="nav-label">
            Workspace
          </div>

          <nav className="side-nav">

            <Link
              className="nav-link"
              to="/hr-dashboard"
            >
              <Icon name="grid" />
              <span>Overview</span>
            </Link>

            <Link
              className="nav-link"
              to="/hr-dashboard"
            >
              <Icon name="ticket" />
              <span>Grievances</span>
            </Link>

            <Link
              className="nav-link"
              to="/policies"
            >
              <Icon name="file" />
              <span>Policies</span>
            </Link>

            <Link
              className="nav-link active"
              to="/employees"
            >
              <Icon name="users" />
              <span>Employees</span>
            </Link>

          </nav>

          <div className="sidebar-bottom">

            <div className="profile-mini">

              <div className="avatar">
                {(user?.email || 'HR')
                  .slice(0, 1)
                  .toUpperCase()}
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
        <main className="emp-main">

          <header className="topbar">

            <div>
              <h1 className="page-title">
                Employee Management
              </h1>

              <p className="page-subtitle">
                Manage employee accounts, access and credentials
              </p>
            </div>

            <div className="top-profile">

              <div className="avatar">
                {(user?.email || 'HR')
                  .slice(0, 1)
                  .toUpperCase()}
              </div>

              <div className="top-email">
                {user?.email || 'HR User'}{' '}
                <span className="top-role">
                  (HR)
                </span>
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

          <div className="emp-content">

            {/* HERO */}
            <section className="emp-hero">

              <div>
                <h2>Employee Directory 👥</h2>

                <p>
                  Create and manage employee accounts securely.
                </p>
              </div>

              <div className="hero-stats">

                <div className="hero-stat">
                  <strong>{employees.length}</strong>
                  <span>Total Users</span>
                </div>

                <div className="hero-stat">
                  <strong>{activeCount}</strong>
                  <span>Active</span>
                </div>

                <div className="hero-stat">
                  <strong>{inactiveCount}</strong>
                  <span>Inactive</span>
                </div>

              </div>

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

            {tempPassword && (
              <div className="password-alert">

                <div className="password-title">
                  🔐 Temporary Password Generated
                </div>

                <div className="password-row">

                  <span>
                    Provide this password securely to the employee:
                  </span>

                  <code className="password-code">
                    {tempPassword}
                  </code>

                </div>

                <p className="password-note">
                  This temporary password will not be shown again.
                  The employee will be required to change it after login.
                </p>

              </div>
            )}

            <div className="emp-grid">

              {/* CREATE EMPLOYEE */}
              <div className="card create-card">

                <div className="card-heading">

                  <div className="heading-icon">
                    <Icon name="userPlus" />
                  </div>

                  <h2 className="card-title">
                    Add New Employee
                  </h2>

                </div>

                <p className="card-desc">
                  Create an account and generate temporary credentials.
                </p>

                <form onSubmit={handleCreate}>

                  <div className="field">

                    <label>
                      Full Name
                    </label>

                    <input
                      className="input"
                      type="text"
                      value={fullName}
                      onChange={(e) =>
                        setFullName(e.target.value)
                      }
                      placeholder="Enter full name"
                      required
                    />

                  </div>

                  <div className="field">

                    <label>
                      Email Address
                    </label>

                    <input
                      className="input"
                      type="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      placeholder="employee@company.com"
                      required
                    />

                  </div>

                  <div className="field">

                    <label>
                      Role
                    </label>

                    <select
                      className="select"
                      value={role}
                      onChange={(e) =>
                        setRole(e.target.value)
                      }
                    >
                      <option value="EMPLOYEE">
                        Employee
                      </option>

                      <option value="HR">
                        HR
                      </option>

                    </select>

                  </div>

                  <button
                    className="create-btn"
                    type="submit"
                  >
                    <Icon name="userPlus" size={16} />
                    Create User
                  </button>

                </form>

              </div>

              {/* DIRECTORY */}
              <div className="card directory-card">

                <div className="directory-head">

                  <div>
                    <h2 className="directory-title">
                      Employee Directory
                    </h2>

                    <p className="directory-desc">
                      {employees.length}{' '}
                      {employees.length === 1
                        ? 'account'
                        : 'accounts'}{' '}
                      registered
                    </p>
                  </div>

                  <div className="head-actions">

                    <div className="search-box">

                      <Icon
                        name="search"
                        size={14}
                      />

                      <input
                        className="search-input"
                        value={search}
                        onChange={(e) =>
                          setSearch(e.target.value)
                        }
                        placeholder="Search employees..."
                      />

                    </div>

                    <button
                      className="refresh-btn"
                      onClick={fetchEmployees}
                      disabled={loading}
                    >
                      <Icon
                        name="refresh"
                        size={14}
                      />

                      {loading
                        ? 'Loading...'
                        : 'Refresh'}
                    </button>

                  </div>

                </div>

                {loading ? (

                  <div className="loading">

                    <div className="spinner" />

                    Loading employees...

                  </div>

                ) : filteredEmployees.length === 0 ? (

                  <div className="empty">

                    <strong>
                      No employees found
                    </strong>

                    <span>
                      {search
                        ? 'Try a different search.'
                        : 'Create the first employee account.'}
                    </span>

                  </div>

                ) : (

                  <div className="table-wrap">

                    <table>

                      <thead>

                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>

                      </thead>

                      <tbody>

                        {filteredEmployees.map((emp) => (

                          <tr key={emp.id}>

                            <td className="id-cell">
                              #{emp.id}
                            </td>

                            <td className="name-cell">
                              {emp.full_name || '—'}
                            </td>

                            <td className="email-cell">
                              {emp.email}
                            </td>

                            <td>

                              <span
                                className={`role-badge ${
                                  emp.role === 'HR'
                                    ? 'role-hr'
                                    : 'role-employee'
                                }`}
                              >
                                {emp.role}
                              </span>

                            </td>

                            <td>

                              <span
                                className={`status-badge ${
                                  emp.is_active
                                    ? 'active'
                                    : 'inactive'
                                }`}
                              >
                                {emp.is_active
                                  ? 'Active'
                                  : 'Inactive'}
                              </span>

                            </td>

                            <td>

                              <div className="actions">

                                <button
                                  className={`action-btn ${
                                    emp.is_active
                                      ? 'toggle-btn'
                                      : 'activate-btn'
                                  }`}
                                  onClick={() =>
                                    handleToggleStatus(
                                      emp.id,
                                      emp.is_active
                                    )
                                  }
                                >
                                  {emp.is_active
                                    ? 'Deactivate'
                                    : 'Activate'}
                                </button>

                                <button
                                  className="action-btn reset-btn"
                                  onClick={() =>
                                    handleResetPassword(
                                      emp.id
                                    )
                                  }
                                >
                                  <Icon
                                    name="key"
                                    size={12}
                                  />
                                  Reset Password
                                </button>

                              </div>

                            </td>

                          </tr>

                        ))}

                      </tbody>

                    </table>

                  </div>

                )}

              </div>

            </div>

          </div>

        </main>

      </div>
    </>
  );
}