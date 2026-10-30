import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function EmployeeDashboard() {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('assistant');

  // Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [threadId, setThreadId] = useState('');

  // Grievances
  const [grievances, setGrievances] = useState([]);
  const [loadingGrievances, setLoadingGrievances] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  // Manual grievance
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState('OTHER');
  const [newPri, setNewPri] = useState('MEDIUM');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (activeTab === 'grievances') {
      fetchGrievances();
    }
  }, [activeTab]);

  const fetchGrievances = async () => {
    setLoadingGrievances(true);
    try {
      const res = await api.get('/grievances');
      setGrievances(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGrievances(false);
    }
  };

  const fetchGrievanceDetails = async (id) => {
    try {
      const res = await api.get(`/grievances/${id}`);
      setSelectedGrievance(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || loadingChat) return;

    const userMsg = chatInput.trim();

    setChatInput('');
    setChatMessages(prev => [
      ...prev,
      { role: 'user', content: userMsg }
    ]);
    setLoadingChat(true);
    setChatError(null);

    try {
      const payload = { message: userMsg };

      if (threadId) {
        payload.thread_id = threadId;
      }

      const res = await api.post('/chat/', payload);

      setThreadId(res.data.thread_id);

      setChatMessages(prev => [
        ...prev,
        {
          role: 'ai',
          content: res.data.response
        }
      ]);
    } catch (err) {
      setChatError(
        err.response?.data?.detail || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoadingChat(false);
    }
  };

  const handleCreateGrievance = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      await api.post('/grievances/', {
        title: newTitle,
        description: newDesc,
        category: newCat,
        priority: newPri
      });

      setNewTitle('');
      setNewDesc('');
      setNewCat('OTHER');
      setNewPri('MEDIUM');

      fetchGrievances();
    } catch (err) {
      console.error(err);
      alert('Failed to create grievance');
    } finally {
      setCreating(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();

    if (!replyMessage.trim() || !selectedGrievance) return;

    try {
      await api.post(
        `/grievances/${selectedGrievance.id}/messages`,
        { message: replyMessage }
      );

      setReplyMessage('');
      fetchGrievanceDetails(selectedGrievance.id);
    } catch (err) {
      console.error(err);
      alert('Failed to send reply');
    }
  };

  const statusClass = (status) => {
    switch (status) {
      case 'OPEN':
        return 'status-open';
      case 'IN_PROGRESS':
        return 'status-progress';
      case 'RESOLVED':
        return 'status-resolved';
      case 'CLOSED':
        return 'status-closed';
      default:
        return 'status-default';
    }
  };

  const priorityClass = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'priority-high';
      case 'MEDIUM':
        return 'priority-medium';
      case 'LOW':
        return 'priority-low';
      default:
        return '';
    }
  };

  const askSuggestion = (text) => {
    setChatInput(text);
  };

  const renderInlineMarkdown = (text) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
};

const renderAIContent = (content) => {
  const text = content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\r/g, '');

  const lines = text.split('\n');
  const elements = [];
  let tableRows = [];

  const flushTable = () => {
    if (!tableRows.length) return;

    const rows = tableRows
      .filter(row => !/^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(row))
      .map(row =>
        row
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map(cell => cell.trim())
      );

    if (rows.length) {
      elements.push(
        <div className="ai-table-wrap" key={`table-${elements.length}`}>
          <table className="ai-table">
            <thead>
              <tr>
                {rows[0].map((cell, i) => (
                  <th key={i}>{renderInlineMarkdown(cell)}</th>
                ))}
              </tr>
            </thead>

            {rows.length > 1 && (
              <tbody>
                {rows.slice(1).map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci}>{renderInlineMarkdown(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      );
    }

    tableRows = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      tableRows.push(trimmed);
      return;
    }

    flushTable();

    if (!trimmed) {
      elements.push(<div className="ai-space" key={index} />);
      return;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 className="ai-heading" key={index}>
          {renderInlineMarkdown(trimmed.replace(/^### /, ''))}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 className="ai-heading" key={index}>
          {renderInlineMarkdown(trimmed.replace(/^## /, ''))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('# ')) {
      elements.push(
        <h3 className="ai-heading" key={index}>
          {renderInlineMarkdown(trimmed.replace(/^# /, ''))}
        </h3>
      );
      return;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      elements.push(
        <div className="ai-bullet" key={index}>
          <span>•</span>
          <span>
            {renderInlineMarkdown(trimmed.replace(/^[-*]\s+/, ''))}
          </span>
        </div>
      );
      return;
    }

    elements.push(
      <p className="ai-paragraph" key={index}>
        {renderInlineMarkdown(trimmed)}
      </p>
    );
  });

  flushTable();

  return <div className="ai-content">{elements}</div>;
};

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
          background: #0b1020;
          color: #e8edf7;
        }

        button,
        input,
        textarea,
        select {
          font-family: inherit;
        }

        .employee-app {
          min-height: 100vh;
          display: flex;
          background:
            radial-gradient(circle at 20% 0%, rgba(37,99,235,.16), transparent 30%),
            #0b1020;
        }

        /* SIDEBAR */

        .sidebar {
          width: 245px;
          min-height: 100vh;
          background: rgba(12,18,35,.96);
          border-right: 1px solid rgba(255,255,255,.08);
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          z-index: 10;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 10px 28px;
        }

        .brand-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg,#2563eb,#7c3aed);
          font-size: 20px;
          box-shadow: 0 8px 25px rgba(37,99,235,.3);
        }

        .brand-title {
          font-size: 18px;
          font-weight: 800;
        }

        .brand-sub {
          font-size: 11px;
          color: #7f8ba3;
          margin-top: 2px;
        }

        .nav-title {
          color: #65718a;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .12em;
          padding: 0 12px 10px;
        }

        .nav-btn {
          width: 100%;
          border: 0;
          background: transparent;
          color: #9ba7bd;
          padding: 13px 14px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-size: 14px;
          margin-bottom: 5px;
          text-align: left;
          transition: .2s;
        }

        .nav-btn:hover {
          background: rgba(255,255,255,.05);
          color: white;
        }

        .nav-btn.active {
          background: linear-gradient(90deg,rgba(37,99,235,.25),rgba(124,58,237,.15));
          color: white;
          border: 1px solid rgba(59,130,246,.2);
        }

        .sidebar-bottom {
          margin-top: auto;
        }

        .user-mini {
          padding: 13px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 12px;
          margin-bottom: 10px;
        }

        .user-mini-name {
          font-size: 13px;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-mini-role {
          font-size: 11px;
          color: #71809a;
          margin-top: 3px;
        }

        .logout-btn {
          width: 100%;
          padding: 11px;
          border-radius: 9px;
          border: 1px solid rgba(239,68,68,.2);
          background: rgba(239,68,68,.08);
          color: #f87171;
          cursor: pointer;
        }

        /* MAIN */

        .main {
          margin-left: 245px;
          width: calc(100% - 245px);
          min-height: 100vh;
          padding: 30px 38px;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }

        .page-title {
          font-size: 28px;
          font-weight: 750;
          margin: 0;
        }

        .page-subtitle {
          margin: 6px 0 0;
          color: #7f8ba3;
          font-size: 14px;
        }

        .top-user {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #a8b3c7;
          font-size: 13px;
        }

        .avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg,#2563eb,#7c3aed);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: white;
        }

        /* ASSISTANT */

        .assistant-card {
          background: rgba(17,25,45,.86);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,.2);
        }

        .assistant-header {
          padding: 22px 24px;
          border-bottom: 1px solid rgba(255,255,255,.07);
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .ai-icon {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: linear-gradient(135deg,#2563eb,#7c3aed);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .assistant-header h2 {
          margin: 0;
          font-size: 18px;
        }

        .online {
          color: #4ade80;
          font-size: 12px;
          margin-top: 3px;
        }

        .chat-area {
          height: 480px;
          overflow-y: auto;
          padding: 25px;
        }

        .welcome {
          min-height: 390px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          text-align: center;
        }

        .welcome-icon {
          width: 70px;
          height: 70px;
          border-radius: 20px;
          background: rgba(37,99,235,.12);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          margin-bottom: 18px;
        }

        .welcome h3 {
          margin: 0 0 8px;
          font-size: 21px;
        }

        .welcome p {
          color: #7f8ba3;
          max-width: 500px;
          font-size: 14px;
        }

        .suggestions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin-top: 18px;
        }

        .suggestion {
          background: rgba(255,255,255,.04);
          color: #aeb9cb;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 20px;
          padding: 9px 13px;
          cursor: pointer;
          font-size: 12px;
        }

        .suggestion:hover {
          border-color: #3b82f6;
          color: white;
        }

        .message-row {
          display: flex;
          margin-bottom: 18px;
        }

        .message-row.user {
          justify-content: flex-end;
        }

        .message {
          max-width: 72%;
          padding: 13px 16px;
          border-radius: 15px;
          line-height: 1.55;
          font-size: 14px;
          white-space: pre-wrap;
        }

        .message.user {
          background: linear-gradient(135deg,#2563eb,#4f46e5);
          color: white;
          border-bottom-right-radius: 4px;
        }

        .message.ai {
          background: #182239;
          color: #dbe3f0;
          border: 1px solid rgba(255,255,255,.06);
          border-bottom-left-radius: 4px;
        }

        .typing {
          color: #77839a;
          font-size: 13px;
        }

        .chat-error {
          background: rgba(239,68,68,.1);
          color: #fca5a5;
          padding: 12px;
          border-radius: 10px;
          margin-bottom: 15px;
        }

        .chat-input-area {
          padding: 17px;
          border-top: 1px solid rgba(255,255,255,.07);
          background: rgba(9,14,28,.6);
        }

        .chat-form {
          display: flex;
          gap: 10px;
        }

        .chat-input {
          flex: 1;
          background: #111a2d;
          border: 1px solid #26334d;
          color: white;
          border-radius: 11px;
          padding: 13px 15px;
          outline: none;
        }

        .chat-input:focus {
          border-color: #3b82f6;
        }

        .send-btn {
          border: 0;
          background: linear-gradient(135deg,#2563eb,#4f46e5);
          color: white;
          border-radius: 11px;
          padding: 0 22px;
          cursor: pointer;
          font-weight: 600;
        }

        .send-btn:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        .clear-btn {
          border: 1px solid #33415c;
          background: transparent;
          color: #8f9bb0;
          border-radius: 11px;
          padding: 0 15px;
          cursor: pointer;
        }

        /* GRIEVANCES */

        .section-grid {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 20px;
        }

        .panel {
          background: rgba(17,25,45,.86);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 16px;
          padding: 22px;
        }

        .panel h2 {
          margin: 0 0 5px;
          font-size: 18px;
        }

        .panel-sub {
          color: #758198;
          font-size: 12px;
          margin-bottom: 20px;
        }

        .field {
          margin-bottom: 14px;
        }

        .field label {
          display: block;
          color: #9ba7bb;
          font-size: 12px;
          margin-bottom: 7px;
        }

        .field input,
        .field textarea,
        .field select {
          width: 100%;
          background: #0e1729;
          border: 1px solid #26334d;
          color: white;
          border-radius: 9px;
          padding: 11px;
          outline: none;
        }

        .field textarea {
          min-height: 110px;
          resize: vertical;
        }

        .field input:focus,
        .field textarea:focus,
        .field select:focus {
          border-color: #3b82f6;
        }

        .create-btn {
          width: 100%;
          border: 0;
          border-radius: 9px;
          padding: 12px;
          background: linear-gradient(135deg,#2563eb,#4f46e5);
          color: white;
          cursor: pointer;
          font-weight: 600;
        }

        .ticket-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }

        .refresh-btn {
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.1);
          color: #aeb9cb;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
        }

        .tickets {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .ticket {
              display: grid;
              grid-template-columns: 120px minmax(220px, 1fr) 100px 85px 70px;
              align-items: center;
              gap: 14px;
              padding: 16px;
              background: rgba(255,255,255,.025);
              border: 1px solid rgba(255,255,255,.06);
              border-radius: 11px;
            }
        .ticket:hover {
          border-color: rgba(59,130,246,.35);
          background: rgba(37,99,235,.05);
        }

        .ticket-id {
          color: #60a5fa;
          font-size: 12px;
          font-weight: 700;
        }

        .ticket-title {
  font-size: 14px;
  font-weight: 600;
  color: #e5eaf3;
  line-height: 1.4;
  white-space: normal;
  word-break: normal;
  overflow-wrap: break-word;
}

        .ticket-category {
          color: #8793a8;
          font-size: 12px;
        }

        .badge {
          display: inline-block;
          padding: 5px 8px;
          border-radius: 20px;3
          font-size: 10px;
          font-weight: 700;
          width: fit-content;
        }

        .status-open {
          color: #60a5fa;
          background: rgba(59,130,246,.12);
        }

        .status-progress {
          color: #fbbf24;
          background: rgba(245,158,11,.12);
        }

        .status-resolved {
          color: #4ade80;
          background: rgba(34,197,94,.12);
        }

        .status-closed {
          color: #a78bfa;
          background: rgba(139,92,246,.12);
        }

        .status-default {
          color: #9ca3af;
          background: rgba(156,163,175,.1);
        }

        .priority-high {
          color: #f87171;
        }

        .priority-medium {
          color: #fbbf24;
        }

        .priority-low {
          color: #4ade80;
        }

        .view-btn {
          border: 0;
          background: rgba(37,99,235,.15);
          color: #60a5fa;
          border-radius: 7px;
          padding: 7px 10px;
          cursor: pointer;
        }

        /* DETAILS */

        .back-btn {
          border: 0;
          background: transparent;
          color: #60a5fa;
          cursor: pointer;
          padding: 0;
          margin-bottom: 18px;
        }

        .detail-title {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .detail-title h2 {
          margin: 0;
        }

        .detail-meta {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 10px;
          margin-bottom: 25px;
        }

        .meta-box {
          background: rgba(255,255,255,.035);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 10px;
          padding: 13px;
        }

        .meta-label {
          color: #69758b;
          font-size: 10px;
          text-transform: uppercase;
          margin-bottom: 5px;
        }

        .meta-value {
          font-size: 13px;
          color: #dce3ef;
        }

        .conversation {
          border-top: 1px solid rgba(255,255,255,.07);
          padding-top: 20px;
        }

        .conversation h3 {
          font-size: 15px;
        }

        .conversation-msg {
          padding: 13px;
          border-radius: 10px;
          margin-bottom: 10px;
          background: #141e33;
          border: 1px solid rgba(255,255,255,.06);
        }

        .conversation-msg.hr {
          background: rgba(37,99,235,.08);
          border-color: rgba(59,130,246,.15);
        }

        .msg-meta {
          font-size: 10px;
          color: #68758c;
          margin-bottom: 7px;
        }

        .msg-text {
          font-size: 13px;
          line-height: 1.5;
          white-space: pre-wrap;
        }

        .reply-form {
          margin-top: 18px;
        }

        .reply-form textarea {
          width: 100%;
          min-height: 90px;
          resize: vertical;
          background: #0e1729;
          color: white;
          border: 1px solid #26334d;
          border-radius: 10px;
          padding: 12px;
          outline: none;
        }

        .reply-btn {
          margin-top: 9px;
          background: #2563eb;
          color: white;
          border: 0;
          border-radius: 8px;
          padding: 10px 17px;
          cursor: pointer;
        }

        /* MOBILE */

        @media (max-width: 900px) {
          .sidebar {
            width: 70px;
            padding: 18px 8px;
          }

          .brand-title,
          .brand-sub,
          .nav-title,
          .nav-text,
          .user-mini {
            display: none;
          }

          .brand {
            justify-content: center;
            padding-bottom: 25px;
          }

          .nav-btn {
            justify-content: center;
            padding: 13px 5px;
          }

          .main {
            margin-left: 70px;
            width: calc(100% - 70px);
            padding: 22px;
          }

          .section-grid {
            grid-template-columns: 1fr;
          }

          .ticket {
            grid-template-columns: 1fr 1fr;
          }

          .detail-meta {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 600px) {
          .main {
            padding: 15px;
          }

          .topbar {
            align-items: flex-start;
          }

          .page-title {
            font-size: 22px;
          }

          .top-user {
            display: none;
          }

          .chat-area {
            height: 55vh;
          }

          .chat-form {
            flex-wrap: wrap;
          }

          .chat-input {
            width: 100%;
            flex-basis: 100%;
          }

          .send-btn,
          .clear-btn {
            height: 42px;
          }

          .ticket {
            grid-template-columns: 1fr;
          }

          .detail-meta {
            grid-template-columns: 1fr;
          }
        }
        .ai-content {
  width: 100%;
  font-size: 14px;
  line-height: 1.65;
  color: #dbe3f0;
}

.ai-heading {
  color: #ffffff;
  margin: 4px 0 12px;
  font-size: 16px;
  font-weight: 700;
}

.ai-paragraph {
  margin: 0 0 10px;
}

.ai-space {
  height: 5px;
}

.ai-bullet {
  display: flex;
  gap: 9px;
  margin: 6px 0;
  padding-left: 4px;
}

.ai-bullet > span:first-child {
  color: #60a5fa;
  font-weight: 700;
}

.ai-table-wrap {
  width: 100%;
  overflow-x: auto;
  margin: 14px 0;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,.08);
}

.ai-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.ai-table th {
  text-align: left;
  background: #202c45;
  color: #ffffff;
  padding: 11px 13px;
  border-bottom: 1px solid #33415c;
}

.ai-table td {
  padding: 11px 13px;
  color: #cbd5e1;
  border-bottom: 1px solid rgba(255,255,255,.06);
  vertical-align: top;
}

.ai-table tr:last-child td {
  border-bottom: none;
}

.ai-table tbody tr:hover {
  background: rgba(255,255,255,.025);
}
      `}</style>

      <div className="employee-app">

        {/* SIDEBAR */}
        <aside className="sidebar">

          <div className="brand">
            <div className="brand-icon">✦</div>
            <div>
              <div className="brand-title">HRMind AI</div>
              <div className="brand-sub">Employee Portal</div>
            </div>
          </div>

          <div className="nav-title">Workspace</div>

          <button
            className={`nav-btn ${activeTab === 'assistant' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('assistant');
              setSelectedGrievance(null);
            }}
          >
            <span>🤖</span>
            <span className="nav-text">AI HR Assistant</span>
          </button>

          <button
            className={`nav-btn ${activeTab === 'grievances' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('grievances');
              setSelectedGrievance(null);
            }}
          >
            <span>🎫</span>
            <span className="nav-text">My Grievances</span>
          </button>

          <div className="sidebar-bottom">

            <div className="user-mini">
              <div className="user-mini-name">
                {user?.username || user?.email}
              </div>
              <div className="user-mini-role">
                Employee Account
              </div>
            </div>

            <button className="logout-btn" onClick={logout}>
              <span>↪</span>
              <span className="nav-text">Logout</span>
            </button>

          </div>
        </aside>

        {/* MAIN */}
        <main className="main">

          <div className="topbar">

            <div>
              <h1 className="page-title">
                {activeTab === 'assistant'
                  ? 'AI HR Assistant'
                  : selectedGrievance
                    ? 'Grievance Details'
                    : 'My Grievances'}
              </h1>

              <p className="page-subtitle">
                {activeTab === 'assistant'
                  ? 'Get answers from your company HR policies or report an issue.'
                  : 'Track and manage your HR requests and grievances.'}
              </p>
            </div>

            <div className="top-user">
              <div className="avatar">
                {(user?.email || 'E')[0].toUpperCase()}
              </div>

              <span>
                {user?.username || user?.email}
              </span>
            </div>

          </div>

          {/* ASSISTANT */}
          {activeTab === 'assistant' && (
            <div className="assistant-card">

              <div className="assistant-header">
                <div className="ai-icon">🤖</div>

                <div>
                  <h2>HRMind AI Assistant</h2>
                  <div className="online">● Online · Policy grounded</div>
                </div>
              </div>

              <div className="chat-area">

                {chatMessages.length === 0 ? (
                  <div className="welcome">

                    <div className="welcome-icon">✨</div>

                    <h3>How can I help you today?</h3>

                    <p>
                      Ask me about HR policies, leave rules, payroll,
                      benefits, or report a workplace issue.
                    </p>

                    <div className="suggestions">

                      <button
                        className="suggestion"
                        onClick={() =>
                          askSuggestion('How many casual leaves are allowed?')
                        }
                      >
                        How many casual leaves are allowed?
                      </button>

                      <button
                        className="suggestion"
                        onClick={() =>
                          askSuggestion('What is the sick leave policy?')
                        }
                      >
                        What is the sick leave policy?
                      </button>

                      <button
                        className="suggestion"
                        onClick={() =>
                          askSuggestion('I want to report a payroll issue')
                        }
                      >
                        Report a payroll issue
                      </button>

                    </div>

                  </div>
                ) : (
                  <>
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`message-row ${msg.role}`}
                      >
                        <div className={`message ${msg.role}`}>
                          {msg.role === 'ai'
                            ? renderAIContent(msg.content)
                            : msg.content}
                        </div>
                      </div>
                    ))}

                    {loadingChat && (
                      <div className="typing">
                        HRMind AI is thinking...
                      </div>
                    )}

                    {chatError && (
                      <div className="chat-error">
                        {chatError}
                      </div>
                    )}
                  </>
                )}

              </div>

              <div className="chat-input-area">

                <form
                  onSubmit={handleChat}
                  className="chat-form"
                >
                  <input
                    className="chat-input"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Ask anything about HR policies..."
                    disabled={loadingChat}
                  />

                  <button
                    className="send-btn"
                    type="submit"
                    disabled={loadingChat || !chatInput.trim()}
                  >
                    {loadingChat ? '...' : 'Send'}
                  </button>

                  <button
                    className="clear-btn"
                    type="button"
                    onClick={() => {
                      setChatMessages([]);
                      setThreadId('');
                      setChatError(null);
                    }}
                  >
                    Clear
                  </button>
                </form>

              </div>

            </div>
          )}

          {/* GRIEVANCES LIST */}
          {activeTab === 'grievances' && !selectedGrievance && (

            <div className="section-grid">

              {/* CREATE */}
              <div className="panel">

                <h2>Raise a Grievance</h2>

                <div className="panel-sub">
                  Submit an HR issue manually.
                </div>

                <form onSubmit={handleCreateGrievance}>

                  <div className="field">
                    <label>Title</label>
                    <input
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="e.g. Salary not credited"
                      required
                    />
                  </div>

                  <div className="field">
                    <label>Description</label>
                    <textarea
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                      placeholder="Describe your issue..."
                      required
                    />
                  </div>

                  <div className="field">
                    <label>Category</label>

                    <select
                      value={newCat}
                      onChange={e => setNewCat(e.target.value)}
                    >
                      <option value="LEAVE">Leave</option>
                      <option value="PAYROLL">Payroll</option>
                      <option value="ATTENDANCE">Attendance</option>
                      <option value="WORKPLACE_CONDUCT">
                        Workplace Conduct
                      </option>
                      <option value="BENEFITS">Benefits</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div className="field">
                    <label>Priority</label>

                    <select
                      value={newPri}
                      onChange={e => setNewPri(e.target.value)}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>

                  <button
                    className="create-btn"
                    type="submit"
                    disabled={creating}
                  >
                    {creating ? 'Creating...' : 'Submit Grievance'}
                  </button>

                </form>

              </div>

              {/* TICKETS */}
              <div className="panel">

                <div className="ticket-header">
                  <div>
                    <h2>My Grievances</h2>
                    <div className="panel-sub">
                      Your submitted HR requests
                    </div>
                  </div>

                  <button
                    className="refresh-btn"
                    onClick={fetchGrievances}
                  >
                    ↻ Refresh
                  </button>
                </div>

                {loadingGrievances ? (
                  <p className="panel-sub">Loading grievances...</p>
                ) : (
                  <div className="tickets">

                    {grievances.map(g => (
                      <div className="ticket" key={g.id}>

                        <div className="ticket-id">
                          {g.ticket_id}
                        </div>

                        <div>
                          <div className="ticket-title">
                            {g.title}
                          </div>

                          <div className="ticket-category">
                            {g.category}
                          </div>
                        </div>

                        <span className={`badge ${statusClass(g.status)}`}>
                          {g.status.replace('_', ' ')}
                        </span>

                        <span className={`badge ${priorityClass(g.priority)}`}>
                          {g.priority}
                        </span>

                        <button
                          className="view-btn"
                          onClick={() =>
                            fetchGrievanceDetails(g.id)
                          }
                        >
                          View
                        </button>

                        {g.awaiting_employee_info && (
                          <div style={{
                            gridColumn: '1 / -1',
                            color: '#fbbf24',
                            fontSize: '11px'
                          }}>
                            ⚠ HR requested additional information
                          </div>
                        )}

                      </div>
                    ))}

                    {grievances.length === 0 && (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '50px',
                          color: '#6f7b91'
                        }}
                      >
                        No grievances found.
                      </div>
                    )}

                  </div>
                )}

              </div>

            </div>
          )}

          {/* GRIEVANCE DETAILS */}
          {activeTab === 'grievances' && selectedGrievance && (

            <div className="panel">

              <button
                className="back-btn"
                onClick={() => setSelectedGrievance(null)}
              >
                ← Back to My Grievances
              </button>

              <div className="detail-title">

                <div>
                  <h2>
                    {selectedGrievance.title}
                  </h2>

                  <div className="ticket-id" style={{ marginTop: 7 }}>
                    {selectedGrievance.ticket_id}
                  </div>
                </div>

                <span className={`badge ${statusClass(selectedGrievance.status)}`}>
                  {selectedGrievance.status.replace('_', ' ')}
                </span>

              </div>

              <div className="detail-meta">

                <div className="meta-box">
                  <div className="meta-label">Category</div>
                  <div className="meta-value">
                    {selectedGrievance.category}
                  </div>
                </div>

                <div className="meta-box">
                  <div className="meta-label">Priority</div>
                  <div className={`meta-value ${priorityClass(selectedGrievance.priority)}`}>
                    {selectedGrievance.priority}
                  </div>
                </div>

                <div className="meta-box">
                  <div className="meta-label">Assigned Team</div>
                  <div className="meta-value">
                    {selectedGrievance.assigned_team || 'Unassigned'}
                  </div>
                </div>

                <div className="meta-box">
                  <div className="meta-label">Status</div>
                  <div className="meta-value">
                    {selectedGrievance.status}
                  </div>
                </div>

              </div>

              {selectedGrievance.awaiting_employee_info && (
                <div
                  style={{
                    padding: '13px',
                    borderRadius: '9px',
                    background: 'rgba(245,158,11,.1)',
                    color: '#fbbf24',
                    marginBottom: '20px'
                  }}
                >
                  ⚠ HR has requested additional information from you.
                </div>
              )}

              <div className="conversation">

                <h3>Conversation History</h3>

                {selectedGrievance.messages?.map(m => (
                  <div
                    key={m.id}
                    className={`conversation-msg ${m.sender_role === 'HR' ? 'hr' : ''}`}
                  >
                    <div className="msg-meta">
                      <strong>
                        {m.sender_role === 'HR' ? 'HR Team' : 'You'}
                      </strong>
                      {' · '}
                      {new Date(m.created_at).toLocaleString()}
                    </div>

                    <div className="msg-text">
                      {m.message}
                    </div>
                  </div>
                ))}

                <form
                  className="reply-form"
                  onSubmit={handleReply}
                >
                  <textarea
                    placeholder="Write a reply to HR..."
                    value={replyMessage}
                    onChange={e =>
                      setReplyMessage(e.target.value)
                    }
                    required
                  />

                  <button
                    className="reply-btn"
                    type="submit"
                    disabled={!replyMessage.trim()}
                  >
                    Send Reply
                  </button>
                </form>

              </div>

            </div>
          )}

        </main>

      </div>
    </>
  );
}