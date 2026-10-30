import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Icon = ({ name, size = 20 }) => {
  const paths = {
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
    logout: (
      <>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
      </>
    ),
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    refresh: (
      <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />
    ),
    back: <path d="M19 12H5M12 19l-7-7 7-7" />,
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    alert: (
      <>
        <path d="M10.3 3.8 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4M12 17h.01" />
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
      {paths[name]}
    </svg>
  );
};

const statusClass = (status) => {
  if (status === 'OPEN') return 'status-open';
  if (status === 'IN_PROGRESS') return 'status-progress';
  if (status === 'RESOLVED') return 'status-resolved';
  if (status === 'CLOSED') return 'status-closed';
  return 'status-default';
};

const priorityClass = (priority) => {
  if (priority === 'HIGH') return 'priority-high';
  if (priority === 'MEDIUM') return 'priority-medium';
  return 'priority-low';
};

const formatStatus = (value) =>
  value?.replaceAll('_', ' ')?.replace(/\b\w/g, (c) => c.toUpperCase());

export default function HRDashboard() {
  const { logout, user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');

  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState(null);

  const [replyMessage, setReplyMessage] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');
  const [priorityUpdate, setPriorityUpdate] = useState('');
  const [teamUpdate, setTeamUpdate] = useState('');

  useEffect(() => {
    fetchGrievances();
  }, []);

  const fetchGrievances = async () => {
    setLoading(true);

    try {
      const res = await api.get('/grievances');
      setGrievances(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGrievanceDetails = async (id) => {
    try {
      const res = await api.get(`/grievances/${id}`);
      setSelectedGrievance(res.data);
      setStatusUpdate(res.data.status);
      setPriorityUpdate(res.data.priority);
      setTeamUpdate(res.data.assigned_team || '');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      await api.patch(`/grievances/${selectedGrievance.id}`, {
        status: statusUpdate,
        priority: priorityUpdate,
        assigned_team: teamUpdate || null,
      });

      await fetchGrievanceDetails(selectedGrievance.id);
      await fetchGrievances();

      alert('Updated successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to update');
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();

    if (!replyMessage.trim()) return;

    try {
      await api.post(`/grievances/${selectedGrievance.id}/messages`, {
        message: replyMessage,
      });

      setReplyMessage('');
      fetchGrievanceDetails(selectedGrievance.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAction = async (action) => {
    try {
      await api.post(`/grievances/${selectedGrievance.id}/${action}`);
      await fetchGrievanceDetails(selectedGrievance.id);
      await fetchGrievances();
    } catch (err) {
      console.error(err);
      alert('Action failed');
    }
  };

  const total = grievances.length;
  const open = grievances.filter((g) => g.status === 'OPEN').length;
  const progress = grievances.filter(
    (g) => g.status === 'IN_PROGRESS'
  ).length;
  const resolved = grievances.filter(
    (g) => g.status === 'RESOLVED' || g.status === 'CLOSED'
  ).length;

  const goOverview = () => {
    setSelectedGrievance(null);
    setActiveTab('overview');
  };

  const goGrievances = () => {
    setSelectedGrievance(null);
    setActiveTab('grievances');
    fetchGrievances();
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
          font-family:
            Inter, ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: #f5f7fb;
          color: #172033;
        }

        button, input, textarea, select {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        .hr-shell {
          min-height: 100vh;
          display: flex;
          background: #f5f7fb;
        }

        /* SIDEBAR */

        .sidebar {
          width: 250px;
          background: #111827;
          color: white;
          display: flex;
          flex-direction: column;
          padding: 22px 16px;
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          z-index: 20;
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
          box-shadow: 0 8px 20px rgba(79, 70, 229, .3);
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

        .nav-btn,
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

        .nav-btn:hover,
        .nav-link:hover {
          color: white;
          background: #1f2937;
        }

        .nav-btn.active {
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
          margin-bottom: 8px;
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
          color: #fca5a5;
        }

        /* MAIN */

        .main-content {
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
          font-size: 13px;
          color: #475569;
        }

        .top-role {
          color: #6366f1;
          font-weight: 650;
        }

        .logout-btn {
          border: 1px solid #fecaca;
          color: #dc2626;
          background: #fff;
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

        .content {
          padding: 30px 34px 50px;
          max-width: 1500px;
          margin: 0 auto;
        }

        /* WELCOME */

        .welcome {
          background:
            radial-gradient(circle at 90% 20%, rgba(129,140,248,.22), transparent 28%),
            linear-gradient(135deg, #111827, #1e1b4b);
          color: white;
          border-radius: 18px;
          padding: 27px 30px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }

        .welcome::after {
          content: "";
          position: absolute;
          width: 180px;
          height: 180px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 50%;
          right: 60px;
          top: -90px;
        }

        .welcome h2 {
          margin: 0;
          font-size: 25px;
          letter-spacing: -.6px;
        }

        .welcome p {
          margin: 7px 0 0;
          color: #c7d2fe;
          font-size: 13px;
        }

        /* STAT CARDS */

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          border: 1px solid #e7eaf0;
          border-radius: 14px;
          padding: 19px;
          box-shadow: 0 4px 15px rgba(15,23,42,.035);
        }

        .stat-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-icon {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: #eef2ff;
          color: #4f46e5;
        }

        .stat-value {
          font-size: 27px;
          font-weight: 800;
          margin-top: 13px;
          color: #111827;
        }

        .stat-label {
          color: #7b8495;
          font-size: 12px;
          margin-top: 2px;
        }

        /* SECTION */

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 13px;
        }

        .section-title {
          margin: 0;
          font-size: 16px;
          font-weight: 750;
          color: #172033;
        }

        .section-desc {
          margin: 4px 0 0;
          font-size: 11px;
          color: #8a93a3;
        }

        /* QUICK ACTIONS */

        .quick-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .quick-card {
          text-decoration: none;
          color: inherit;
          background: white;
          border: 1px solid #e7eaf0;
          border-radius: 14px;
          padding: 19px;
          display: flex;
          align-items: center;
          gap: 15px;
          transition: .2s;
          box-shadow: 0 4px 15px rgba(15,23,42,.035);
        }

        .quick-card:hover {
          transform: translateY(-2px);
          border-color: #c7d2fe;
          box-shadow: 0 9px 25px rgba(15,23,42,.08);
        }

        .quick-icon {
          width: 43px;
          height: 43px;
          border-radius: 11px;
          background: #eef2ff;
          color: #4f46e5;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .quick-title {
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
        }

        .quick-desc {
          font-size: 11px;
          color: #8a93a3;
          margin-top: 3px;
        }

        .quick-arrow {
          margin-left: auto;
          color: #9ca3af;
        }

        /* PANEL */

        .panel {
          background: white;
          border: 1px solid #e6e9ef;
          border-radius: 15px;
          box-shadow: 0 4px 18px rgba(15,23,42,.035);
          overflow: hidden;
        }

        .panel-header {
          padding: 19px 21px;
          border-bottom: 1px solid #edf0f4;
          display: flex;
          justify-content: space-between;
          align-items: center;
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

        /* TABLE */

        .table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .grievance-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 850px;
        }

        .grievance-table th {
          text-align: left;
          padding: 12px 18px;
          background: #fafbfc;
          color: #8a93a3;
          font-size: 10px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: .7px;
          white-space: nowrap;
        }

        .grievance-table td {
          padding: 14px 18px;
          border-top: 1px solid #f0f2f5;
          color: #475569;
          font-size: 12px;
          white-space: nowrap;
        }

        .grievance-table tbody tr:hover {
          background: #fafbff;
        }

        .ticket {
          font-weight: 750;
          color: #4f46e5;
        }

        .title-cell {
          max-width: 220px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          padding: 5px 8px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: .4px;
        }

        .status-open {
          background: #fff7ed;
          color: #c2410c;
        }

        .status-progress {
          background: #eff6ff;
          color: #2563eb;
        }

        .status-resolved {
          background: #ecfdf5;
          color: #047857;
        }

        .status-closed {
          background: #f1f5f9;
          color: #64748b;
        }

        .status-default {
          background: #f1f5f9;
          color: #64748b;
        }

        .priority-high {
          background: #fef2f2;
          color: #dc2626;
        }

        .priority-medium {
          background: #fffbeb;
          color: #b45309;
        }

        .priority-low {
          background: #f0fdf4;
          color: #15803d;
        }

        .manage-btn {
          border: 0;
          background: #eef2ff;
          color: #4f46e5;
          padding: 7px 10px;
          border-radius: 7px;
          font-size: 10px;
          font-weight: 700;
        }

        .manage-btn:hover {
          background: #e0e7ff;
        }

        /* DETAIL */

        .back-btn {
          border: 0;
          background: transparent;
          color: #6366f1;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0;
          font-size: 12px;
          font-weight: 650;
          margin-bottom: 15px;
        }

        .detail-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }

        .detail-ticket {
          font-size: 11px;
          color: #6366f1;
          font-weight: 750;
          margin-bottom: 5px;
        }

        .detail-title {
          margin: 0;
          font-size: 22px;
          color: #111827;
          letter-spacing: -.4px;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .detail-card {
          background: #fafbfc;
          border: 1px solid #e8ebf0;
          border-radius: 12px;
          padding: 18px;
        }

        .detail-card h3 {
          margin: 0 0 15px;
          font-size: 13px;
          color: #1e293b;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .info-item label {
          display: block;
          color: #8a93a3;
          font-size: 10px;
          margin-bottom: 4px;
        }

        .info-item span {
          font-size: 12px;
          font-weight: 650;
          color: #334155;
        }

        .control-form {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }

        .field label {
          display: block;
          color: #64748b;
          font-size: 10px;
          font-weight: 650;
          margin-bottom: 5px;
        }

        .field select,
        .field input {
          width: 100%;
          border: 1px solid #dfe3ea;
          background: white;
          color: #334155;
          border-radius: 8px;
          padding: 9px 10px;
          outline: none;
          font-size: 12px;
        }

        .field select:focus,
        .field input:focus {
          border-color: #818cf8;
          box-shadow: 0 0 0 3px rgba(99,102,241,.1);
        }

        .save-btn {
          border: 0;
          background: #4f46e5;
          color: white;
          border-radius: 8px;
          padding: 10px;
          font-size: 11px;
          font-weight: 700;
          margin-top: 2px;
        }

        .save-btn:hover {
          background: #4338ca;
        }

        .action-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 10px;
        }

        .action-btn {
          border: 0;
          border-radius: 8px;
          padding: 9px 7px;
          font-size: 10px;
          font-weight: 700;
        }

        .request-btn {
          background: #fff7ed;
          color: #c2410c;
        }

        .resolve-btn {
          background: #ecfdf5;
          color: #047857;
        }

        .close-btn {
          background: #fef2f2;
          color: #dc2626;
        }

        /* CONVERSATION */

        .conversation-card {
          margin-top: 18px;
          background: white;
          border: 1px solid #e6e9ef;
          border-radius: 15px;
          overflow: hidden;
        }

        .conversation-header {
          padding: 17px 20px;
          border-bottom: 1px solid #edf0f4;
          font-size: 14px;
          font-weight: 750;
        }

        .messages {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 390px;
          overflow-y: auto;
          background: #fafbfc;
        }

        .message-row {
          display: flex;
        }

        .message-row.hr {
          justify-content: flex-end;
        }

        .message-bubble {
          max-width: 72%;
          padding: 11px 13px;
          border-radius: 12px;
          background: white;
          border: 1px solid #e5e7eb;
        }

        .message-row.hr .message-bubble {
          background: #eef2ff;
          border-color: #c7d2fe;
        }

        .message-meta {
          font-size: 9px;
          color: #8a93a3;
          margin-bottom: 5px;
          font-weight: 650;
        }

        .message-text {
          font-size: 12px;
          color: #334155;
          line-height: 1.55;
          white-space: pre-wrap;
        }

        .reply-area {
          padding: 17px;
          border-top: 1px solid #edf0f4;
          background: white;
        }

        .reply-area textarea {
          width: 100%;
          resize: vertical;
          min-height: 90px;
          border: 1px solid #dfe3ea;
          border-radius: 9px;
          padding: 11px;
          outline: none;
          font-size: 12px;
          color: #ffffff;
        }

        .reply-area textarea:focus {
          border-color: #818cf8;
          box-shadow: 0 0 0 3px rgba(99,102,241,.1);
        }

        .reply-bottom {
          display: flex;
          justify-content: flex-end;
          margin-top: 8px;
        }

        .send-btn {
          border: 0;
          background: #4f46e5;
          color: white;
          border-radius: 8px;
          padding: 9px 16px;
          font-size: 11px;
          font-weight: 700;
        }

        .send-btn:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        /* EMPTY */

        .empty-state {
          text-align: center;
          padding: 55px 20px;
          color: #8a93a3;
        }

        .empty-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #f1f5f9;
          color: #64748b;
        }

        .empty-title {
          color: #334155;
          font-size: 14px;
          font-weight: 700;
        }

        .empty-text {
          font-size: 11px;
          margin-top: 4px;
        }

        .loading {
          padding: 55px;
          text-align: center;
          color: #64748b;
          font-size: 12px;
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

        /* RESPONSIVE */

        @media (max-width: 1000px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .quick-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .sidebar {
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
          .nav-btn span,
          .nav-link span,
          .profile-mini > div:not(.avatar) {
            display: none;
          }

          .nav-btn,
          .nav-link {
            justify-content: center;
            padding: 12px;
          }

          .profile-mini {
            justify-content: center;
            padding: 10px 0;
          }

          .logout-side {
            justify-content: center;
          }

          .main-content {
            margin-left: 70px;
            width: calc(100% - 70px);
          }

          .topbar {
            padding: 0 16px;
          }

          .top-email {
            display: none;
          }

          .content {
            padding: 20px 15px 40px;
          }

          .stats-grid {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .detail-grid {
            grid-template-columns: 1fr;
          }

          .welcome {
            padding: 22px;
          }

          .welcome h2 {
            font-size: 20px;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .topbar {
            height: 68px;
          }

          .page-title {
            font-size: 18px;
          }

          .top-profile .avatar {
            display: none;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .action-row {
            grid-template-columns: 1fr;
          }

          .message-bubble {
            max-width: 90%;
          }
        }
      `}</style>

      <div className="hr-shell">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-logo">H</div>
            <div>
              <div className="brand-name">HRMind AI</div>
              <div className="brand-sub">HR MANAGEMENT</div>
            </div>
          </div>

          <div className="nav-label">Workspace</div>

          <nav className="side-nav">
            <button
              className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={goOverview}
            >
              <Icon name="grid" />
              <span>Overview</span>
            </button>

            <button
              className={`nav-btn ${
                activeTab === 'grievances' ? 'active' : ''
              }`}
              onClick={goGrievances}
            >
              <Icon name="ticket" />
              <span>Grievances</span>
            </button>

            <Link className="nav-link" to="/policies">
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
                <div className="profile-role">HR Administrator</div>
              </div>
            </div>

            <button className="nav-btn logout-side" onClick={logout}>
              <Icon name="logout" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="main-content">
          <header className="topbar">
            <div>
              <h1 className="page-title">
                {activeTab === 'grievances'
                  ? selectedGrievance
                    ? 'Grievance Details'
                    : 'Grievance Management'
                  : 'HR Dashboard'}
              </h1>

              <p className="page-subtitle">
                {activeTab === 'grievances'
                  ? 'Review and manage employee grievances'
                  : 'Manage your workplace from one place'}
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

              <button className="logout-btn" onClick={logout}>
                <Icon name="logout" size={15} />
                Logout
              </button>
            </div>
          </header>

          <div className="content">
            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <>
                <section className="welcome">
                  <h2>Good to see you, HR 👋</h2>
                  <p>
                    Monitor employee concerns, manage policies and keep your
                    HR operations organized.
                  </p>
                </section>

                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-top">
                      <div>
                        <div className="stat-label">Total Grievances</div>
                        <div className="stat-value">{total}</div>
                      </div>

                      <div className="stat-icon">
                        <Icon name="ticket" />
                      </div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-top">
                      <div>
                        <div className="stat-label">Open</div>
                        <div className="stat-value">{open}</div>
                      </div>

                      <div className="stat-icon">
                        <Icon name="alert" />
                      </div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-top">
                      <div>
                        <div className="stat-label">In Progress</div>
                        <div className="stat-value">{progress}</div>
                      </div>

                      <div className="stat-icon">
                        <Icon name="clock" />
                      </div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-top">
                      <div>
                        <div className="stat-label">Resolved / Closed</div>
                        <div className="stat-value">{resolved}</div>
                      </div>

                      <div className="stat-icon">
                        <Icon name="check" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="section-header">
                  <div>
                    <h2 className="section-title">Quick Actions</h2>
                    <p className="section-desc">
                      Access the most important HR tools
                    </p>
                  </div>
                </div>

                <div className="quick-grid">
                  <button className="quick-card" onClick={goGrievances}>
                    <div className="quick-icon">
                      <Icon name="ticket" />
                    </div>

                    <div>
                      <div className="quick-title">Grievance Management</div>
                      <div className="quick-desc">
                        Review and resolve employee concerns
                      </div>
                    </div>

                    <div className="quick-arrow">
                      <Icon name="arrow" size={17} />
                    </div>
                  </button>

                  <Link className="quick-card" to="/policies">
                    <div className="quick-icon">
                      <Icon name="file" />
                    </div>

                    <div>
                      <div className="quick-title">Policy Knowledge Base</div>
                      <div className="quick-desc">
                        Manage HR policy documents
                      </div>
                    </div>

                    <div className="quick-arrow">
                      <Icon name="arrow" size={17} />
                    </div>
                  </Link>

                  <Link className="quick-card" to="/employees">
                    <div className="quick-icon">
                      <Icon name="users" />
                    </div>

                    <div>
                      <div className="quick-title">Employee Directory</div>
                      <div className="quick-desc">
                        Manage employee accounts
                      </div>
                    </div>

                    <div className="quick-arrow">
                      <Icon name="arrow" size={17} />
                    </div>
                  </Link>
                </div>

                <div style={{ marginTop: 25 }}>
                  <div className="section-header">
                    <div>
                      <h2 className="section-title">Recent Grievances</h2>
                      <p className="section-desc">
                        Latest employee concerns
                      </p>
                    </div>

                    <button className="refresh-btn" onClick={fetchGrievances}>
                      <Icon name="refresh" size={14} />
                      Refresh
                    </button>
                  </div>

                  <div className="panel">
                    {loading ? (
                      <div className="loading">
                        <div className="spinner" />
                        Loading grievances...
                      </div>
                    ) : grievances.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">
                          <Icon name="ticket" />
                        </div>
                        <div className="empty-title">
                          No grievances found
                        </div>
                        <div className="empty-text">
                          Employee grievances will appear here.
                        </div>
                      </div>
                    ) : (
                      <div className="table-wrap">
                        <table className="grievance-table">
                          <thead>
                            <tr>
                              <th>Ticket</th>
                              <th>Title</th>
                              <th>Category</th>
                              <th>Priority</th>
                              <th>Status</th>
                              <th>Action</th>
                            </tr>
                          </thead>

                          <tbody>
                            {grievances.slice(0, 5).map((g) => (
                              <tr key={g.id}>
                                <td className="ticket">{g.ticket_id}</td>

                                <td className="title-cell">
                                  {g.title}
                                </td>

                                <td>
                                  {formatStatus(g.category)}
                                </td>

                                <td>
                                  <span
                                    className={`badge ${priorityClass(
                                      g.priority
                                    )}`}
                                  >
                                    {g.priority}
                                  </span>
                                </td>

                                <td>
                                  <span
                                    className={`badge ${statusClass(
                                      g.status
                                    )}`}
                                  >
                                    {formatStatus(g.status)}
                                  </span>
                                </td>

                                <td>
                                  <button
                                    className="manage-btn"
                                    onClick={() =>
                                      fetchGrievanceDetails(g.id)
                                    }
                                  >
                                    Manage
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* GRIEVANCE LIST */}
            {activeTab === 'grievances' && !selectedGrievance && (
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="section-title">All Grievances</h2>
                    <p className="section-desc">
                      Review and manage employee complaints
                    </p>
                  </div>

                  <button className="refresh-btn" onClick={fetchGrievances}>
                    <Icon name="refresh" size={14} />
                    Refresh
                  </button>
                </div>

                {loading ? (
                  <div className="loading">
                    <div className="spinner" />
                    Loading grievances...
                  </div>
                ) : grievances.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <Icon name="ticket" />
                    </div>
                    <div className="empty-title">
                      No grievances found
                    </div>
                    <div className="empty-text">
                      There are currently no employee grievances.
                    </div>
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table className="grievance-table">
                      <thead>
                        <tr>
                          <th>Ticket</th>
                          <th>Title</th>
                          <th>Employee</th>
                          <th>Category</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Info</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {grievances.map((g) => (
                          <tr key={g.id}>
                            <td className="ticket">{g.ticket_id}</td>

                            <td className="title-cell">{g.title}</td>

                            <td>{g.employee_id}</td>

                            <td>{formatStatus(g.category)}</td>

                            <td>
                              <span
                                className={`badge ${priorityClass(
                                  g.priority
                                )}`}
                              >
                                {g.priority}
                              </span>
                            </td>

                            <td>
                              <span
                                className={`badge ${statusClass(g.status)}`}
                              >
                                {formatStatus(g.status)}
                              </span>
                            </td>

                            <td>
                              <span
                                className={`badge ${
                                  g.awaiting_employee_info
                                    ? 'priority-medium'
                                    : 'status-closed'
                                }`}
                              >
                                {g.awaiting_employee_info ? 'Yes' : 'No'}
                              </span>
                            </td>

                            <td>
                              <button
                                className="manage-btn"
                                onClick={() =>
                                  fetchGrievanceDetails(g.id)
                                }
                              >
                                Manage
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* GRIEVANCE DETAIL */}
            {activeTab === 'grievances' && selectedGrievance && (
              <>
                <button className="back-btn" onClick={goGrievances}>
                  <Icon name="back" size={16} />
                  Back to Grievances
                </button>

                <div className="panel">
                  <div style={{ padding: 22 }}>
                    <div className="detail-title-row">
                      <div>
                        <div className="detail-ticket">
                          {selectedGrievance.ticket_id}
                        </div>

                        <h2 className="detail-title">
                          {selectedGrievance.title}
                        </h2>
                      </div>

                      <span
                        className={`badge ${statusClass(
                          selectedGrievance.status
                        )}`}
                      >
                        {formatStatus(selectedGrievance.status)}
                      </span>
                    </div>

                    <div className="detail-grid">
                      {/* DETAILS */}
                      <div className="detail-card">
                        <h3>Grievance Details</h3>

                        <div className="info-grid">
                          <div className="info-item">
                            <label>Employee ID</label>
                            <span>
                              {selectedGrievance.employee_id}
                            </span>
                          </div>

                          <div className="info-item">
                            <label>Category</label>
                            <span>
                              {formatStatus(
                                selectedGrievance.category
                              )}
                            </span>
                          </div>

                          <div className="info-item">
                            <label>Priority</label>
                            <span
                              className={`badge ${priorityClass(
                                selectedGrievance.priority
                              )}`}
                            >
                              {selectedGrievance.priority}
                            </span>
                          </div>

                          <div className="info-item">
                            <label>Created At</label>
                            <span>
                              {new Date(
                                selectedGrievance.created_at
                              ).toLocaleString()}
                            </span>
                          </div>

                          <div className="info-item">
                            <label>Awaiting Employee Info</label>
                            <span>
                              {selectedGrievance.awaiting_employee_info
                                ? 'YES'
                                : 'NO'}
                            </span>
                          </div>

                          <div className="info-item">
                            <label>Assigned Team</label>
                            <span>
                              {selectedGrievance.assigned_team ||
                                'Not assigned'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* CONTROLS */}
                      <div className="detail-card">
                        <h3>Management Controls</h3>

                        <form
                          className="control-form"
                          onSubmit={handleUpdate}
                        >
                          <div className="field">
                            <label>Status</label>

                            <select
                              value={statusUpdate}
                              onChange={(e) =>
                                setStatusUpdate(e.target.value)
                              }
                            >
                              <option value="OPEN">Open</option>
                              <option value="IN_PROGRESS">
                                In Progress
                              </option>
                              <option value="RESOLVED">
                                Resolved
                              </option>
                              <option value="CLOSED">Closed</option>
                            </select>
                          </div>

                          <div className="field">
                            <label>Priority</label>

                            <select
                              value={priorityUpdate}
                              onChange={(e) =>
                                setPriorityUpdate(e.target.value)
                              }
                            >
                              <option value="LOW">Low</option>
                              <option value="MEDIUM">Medium</option>
                              <option value="HIGH">High</option>
                            </select>
                          </div>

                          <div className="field">
                            <label>Assigned Team</label>

                            <input
                              type="text"
                              placeholder="e.g. Payroll / HR"
                              value={teamUpdate}
                              onChange={(e) =>
                                setTeamUpdate(e.target.value)
                              }
                            />
                          </div>

                          <button className="save-btn" type="submit">
                            Save Updates
                          </button>
                        </form>

                        <div className="action-row">
                          <button
                            className="action-btn request-btn"
                            onClick={() => handleAction('request-info')}
                          >
                            Request Info
                          </button>

                          <button
                            className="action-btn resolve-btn"
                            onClick={() => handleAction('resolve')}
                          >
                            Resolve
                          </button>

                          <button
                            className="action-btn close-btn"
                            onClick={() => handleAction('close')}
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CONVERSATION */}
                <div className="conversation-card">
                  <div className="conversation-header">
                    Conversation History
                  </div>

                  <div className="messages">
                    {!selectedGrievance.messages?.length ? (
                      <div className="empty-state">
                        <div className="empty-text">
                          No conversation messages yet.
                        </div>
                      </div>
                    ) : (
                      selectedGrievance.messages.map((m) => (
                        <div
                          key={m.id}
                          className={`message-row ${
                            m.sender_role === 'HR' ? 'hr' : ''
                          }`}
                        >
                          <div className="message-bubble">
                            <div className="message-meta">
                              {m.sender_role === 'HR'
                                ? 'HR'
                                : 'EMPLOYEE'}{' '}
                              •{' '}
                              {new Date(
                                m.created_at
                              ).toLocaleString()}
                            </div>

                            <div className="message-text">
                              {m.message}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <form
                    className="reply-area"
                    onSubmit={handleReply}
                  >
                    <textarea
                      placeholder="Write your response to the employee..."
                      value={replyMessage}
                      onChange={(e) =>
                        setReplyMessage(e.target.value)
                      }
                      required
                    />

                    <div className="reply-bottom">
                      <button
                        className="send-btn"
                        type="submit"
                        disabled={!replyMessage.trim()}
                      >
                        Send Response
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}