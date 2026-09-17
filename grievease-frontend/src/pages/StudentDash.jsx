import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import DashboardAnalytics from '../components/DashboardAnalytics';
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  Send, 
  FileText, 
  Tag,
  Sparkles,
  RefreshCw,
  Cpu
} from 'lucide-react';

const StudentDash = () => {
  const { user } = useAuth();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    station: 'Academic Block'
  });

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString();
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date().toLocaleDateString() : date.toLocaleDateString();
  };

  const fetchGrievances = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/grievances/mine');
      const list = Array.isArray(data) ? data : (data.complaints || data.grievances || []);
      setGrievances(list);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialFetch = setTimeout(fetchGrievances, 0);
    return () => clearTimeout(initialFetch);
  }, []);

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      await API.post('/grievances', formData);
      await fetchGrievances();

      setMessage({ type: 'success', text: 'Complaint submitted & analyzed by ML model successfully!' });
      setFormData({ title: '', description: '', station: 'Academic Block' });
      setShowForm(false);
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to submit complaint.' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Priority badge logic aligned with Admin Dash (Critical: Red, High: Amber, Medium: Blue)
  const getUrgencyBadge = (level) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-950/80 text-red-400 border-red-700/80 animate-pulse';
      case 'MEDIUM':
        return 'bg-blue-950/80 text-blue-400 border-blue-800/80';
      case 'LOW':
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80';
      case 'In Progress':
        return 'bg-blue-950/80 text-blue-400 border-blue-800/80';
      default:
        return 'bg-yellow-950/80 text-yellow-400 border-yellow-800/80';
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Welcome, <span className="text-blue-400">{user?.name}</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              File and monitor your campus station grievances
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchGrievances}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Refresh Queue"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center space-x-2 transition shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-5 h-5" />
              <span>{showForm ? 'Close Form' : 'New Complaint'}</span>
            </button>
          </div>
        </div>

        {/* Status Message Notification */}
        {message.text && (
          <div className={`p-4 rounded-xl border text-sm font-medium transition-all duration-300 ${
            message.type === 'success' ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-red-950/60 border-red-800 text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Complaint Submission Form */}
        {showForm && (
          <div className="bg-slate-900 border border-blue-500/30 p-6 sm:p-8 rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="flex items-center space-x-2 text-blue-400 font-semibold mb-6">
              <Sparkles className="w-5 h-5" />
              <h2 className="text-xl text-white">Raise Campus Grievance</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Complaint Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Brief summary of the issue"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Campus Station</label>
                  <select
                    value={formData.station}
                    onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Academic Block">Academic Block</option>
                    <option value="Classroom">Classroom</option>
                    <option value="Hostel">Hostel</option>
                    <option value="Library">Library</option>
                    <option value="Main Gate">Main Gate</option>
                    <option value="Pedestrian">Pedestrian</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Detailed Description <span className="text-xs text-blue-400">(NLP Auto-Categorization Active)</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the issue clearly. Our ML model will automatically assign Category and Priority level..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span>Category & Urgency predicted dynamically via NLP</span>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center space-x-2 transition shadow-lg shadow-blue-600/30 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'Analyzing & Submitting...' : 'Submit Grievance'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        <DashboardAnalytics
          complaints={grievances}
          chartType="status-donut"
          title="Your Complaint Status"
          scopeLabel="Your submitted complaints"
        />

        {/* Complaints History */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span>Submitted Complaints History</span>
          </h2>

          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading grievances...</div>
          ) : grievances.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              No grievances filed yet. Click <strong>"New Complaint"</strong> to raise one.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {grievances.map((item) => (
                <div
                  key={item._id || `${item.title}-${item.createdAt}`}
                  className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-lg text-white">
                        {item.title || 'Untitled Grievance'}
                      </span>
                      
                      {/* AI Category Badge */}
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-purple-950/60 text-purple-300 text-xs border border-purple-800/60 font-semibold">
                        <Tag className="w-3 h-3 text-purple-400" />
                        <span>{item.category && item.category !== 'Analyzing...' ? item.category : 'General'}</span>
                      </span>

                      {/* Station Badge */}
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs border border-slate-700">
                        <MapPin className="w-3 h-3 text-blue-400" />
                        <span>{item.station || 'Campus'}</span>
                      </span>

                      {/* Priority Level Pill */}
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${getUrgencyBadge(item.priorityLevel || item.urgencyScore)}`}>
                        Priority: {item.priorityLevel || 'Low'}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-slate-400 text-sm">{item.description}</p>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDate(item.createdAt || item.created_at)}</span>
                      </span>
                    </div>
                  </div>

                  <div className="md:text-right">
                    <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(item.status)}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{item.status || 'Open'}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default StudentDash;
