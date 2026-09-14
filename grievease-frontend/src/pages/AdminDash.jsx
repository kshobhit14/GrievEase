import { useState, useEffect } from 'react';
import API from '../services/api';
import { socket } from '../services/socket';
import { 
  ShieldAlert, 
  Clock, 
  MapPin, 
  Filter, 
  RefreshCw,
  AlertOctagon,
  BarChart3,
  Tag,
  Radio
} from 'lucide-react';

const AdminDash = () => {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(socket.connected);
  const [stationFilter, setStationFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [updatingId, setUpdatingId] = useState(null);
  const [liveNotification, setLiveNotification] = useState(null);

  const fetchAllGrievances = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/complaints');
      setGrievances(data);
    } catch (err) {
      console.error("Failed to fetch complaints from backend:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Initial Data Fetch
    fetchAllGrievances();

    // 2. Ensure Socket is connected on mount
    if (!socket.connected) {
      socket.connect();
    }

    // Handlers
    const onConnect = () => {
      console.log('🟢 Socket Connected with ID:', socket.id);
      setIsSocketConnected(true);
    };

    const onDisconnect = () => {
      console.log('🔴 Socket Disconnected');
      setIsSocketConnected(false);
    };

    const onNewComplaint = (newGrievance) => {
      console.log('⚡ Real-time complaint received:', newGrievance);
      
      // Prevent duplicates if API fetch and Socket trigger simultaneously
      setGrievances(prev => {
        if (prev.some(item => item._id === newGrievance._id)) return prev;
        return [newGrievance, ...prev];
      });

      // Show temporary live notification banner
      setLiveNotification(`New Complaint Received: "${newGrievance.title}"`);
      setTimeout(() => setLiveNotification(null), 5000);
    };

    const onStatusUpdated = (updatedGrievance) => {
      console.log('🔄 Real-time status update received:', updatedGrievance);
      setGrievances(prev =>
        prev.map(item => (item._id === updatedGrievance._id ? updatedGrievance : item))
      );
    };

    // Attach Listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('new_complaint', onNewComplaint);
    socket.on('status_updated', onStatusUpdated);

    // Cleanup Listeners on unmount
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('new_complaint', onNewComplaint);
      socket.off('status_updated', onStatusUpdated);
    };
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await API.patch(`/complaints/${id}/status`, { status: newStatus });
      setGrievances(prev =>
        prev.map(item => (item._id === id ? { ...item, status: newStatus } : item))
      );
    } catch (err) {
      alert('Failed to update complaint status on backend.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter Logic
  const filteredGrievances = grievances.filter(g => {
    const matchesStation = stationFilter === 'All' || g.station === stationFilter;
    const matchesStatus = statusFilter === 'All' || g.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || g.category === categoryFilter;
    const matchesPriority = priorityFilter === 'All' || g.priorityLevel?.toUpperCase() === priorityFilter.toUpperCase();
    
    return matchesStation && matchesStatus && matchesCategory && matchesPriority;
  });

  const getUrgencyBadge = (level) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-950 text-red-400 border-red-700 animate-pulse';
      case 'HIGH':
        return 'bg-amber-950 text-amber-400 border-amber-800';
      case 'MEDIUM':
        return 'bg-blue-950 text-blue-400 border-blue-800';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  // Stats Counters
  const totalCount = grievances.length;
  const criticalCount = grievances.filter(
    g => g.priorityLevel?.toUpperCase() === 'CRITICAL' || g.priorityLevel?.toUpperCase() === 'HIGH'
  ).length;
  const openCount = grievances.filter(g => g.status === 'Open').length;

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Real-time Socket Toast Banner */}
        {liveNotification && (
          <div className="bg-purple-900/90 border border-purple-500 text-purple-100 px-5 py-3 rounded-xl shadow-lg flex items-center justify-between animate-bounce">
            <div className="flex items-center space-x-3">
              <Radio className="w-5 h-5 text-purple-300 animate-pulse" />
              <span className="font-semibold text-sm">{liveNotification}</span>
            </div>
            <span className="text-xs bg-purple-950 px-2 py-1 rounded border border-purple-700 font-mono">LIVE</span>
          </div>
        )}

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center space-x-3">
              <ShieldAlert className="w-8 h-8 text-purple-400" />
              <span>Admin Urgency Queue</span>
              
              {/* Dynamic Connection Indicator */}
              {isSocketConnected ? (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>SOCKET LIVE</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-red-950 text-red-400 border border-red-800 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span>SOCKET OFFLINE</span>
                </span>
              )}
            </h1>
            <p className="text-slate-400 text-sm mt-1">NLP Prioritized Campus Grievance Redressal Center</p>
          </div>

          <button
            onClick={fetchAllGrievances}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm font-semibold">Refresh Queue</span>
          </button>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Complaints</p>
              <h3 className="text-3xl font-black text-white mt-1">{totalCount}</h3>
            </div>
            <BarChart3 className="w-10 h-10 text-blue-400 opacity-80" />
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">High / Critical Urgency</p>
              <h3 className="text-3xl font-black text-red-400 mt-1">{criticalCount}</h3>
            </div>
            <AlertOctagon className="w-10 h-10 text-red-400 opacity-80" />
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Open Tickets</p>
              <h3 className="text-3xl font-black text-yellow-400 mt-1">{openCount}</h3>
            </div>
            <Clock className="w-10 h-10 text-yellow-400 opacity-80" />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-300 font-semibold text-sm">
            <Filter className="w-4 h-4 text-blue-400" />
            <span>Queue Filters:</span>
          </div>

          <div className="flex flex-wrap gap-4 w-full sm:w-auto">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            >
              <option value="All">All Categories</option>
              <option value="Electrical">Electrical</option>
              <option value="Sanitation">Sanitation</option>
              <option value="Cleanliness">Cleanliness</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Academics">Academics</option>
              <option value="IT & Network">IT & Network</option>
              <option value="Online Learning">Online Learning</option>
              <option value="Security">Security</option>
            </select>

            {/* Station Filter */}
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Stations</option>
              <option value="Academic Block">Academic Block</option>
              <option value="Classroom">Classroom</option>
              <option value="Hostel">Hostel</option>
              <option value="Library">Library</option>
              <option value="Main Gate">Main Gate</option>
              <option value="Pedestrian">Pedestrian</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Queue Items List */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading urgency queue...</div>
          ) : filteredGrievances.length === 0 ? (
            <div className="py-12 text-center text-slate-500">No complaints match current filters.</div>
          ) : (
            filteredGrievances.map((item) => (
              <div
                key={item._id}
                className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-bold text-xl text-white">{item.title}</span>

                    {/* AI Category Tag */}
                    <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-purple-950/60 text-purple-300 text-xs border border-purple-800/60 font-semibold">
                      <Tag className="w-3.5 h-3.5 text-purple-400" />
                      <span>{item.category && item.category !== 'Analyzing...' ? item.category : 'General'}</span>
                    </span>

                    {/* NLP Priority Level Pill */}
                    <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide border ${getUrgencyBadge(item.priorityLevel)}`}>
                      Priority: {item.priorityLevel || 'Low'}
                    </span>

                    {/* Station Tag */}
                    <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs border border-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      <span>{item.station}</span>
                    </span>
                  </div>

                  <p className="text-slate-300 text-sm leading-relaxed">{item.description}</p>

                  {/* Raised by Section */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                    <span>
                      Raised by: <strong className="text-slate-200">{item.raisedBy?.name || 'User'}</strong> ({item.raisedBy?.email || 'N/A'})
                    </span>

                    {item.raisedBy && (
                      <span className="bg-purple-950/80 text-purple-300 border border-purple-800/80 px-2.5 py-0.5 rounded-md font-mono text-[11px] inline-flex items-center gap-1">
                        <span className="capitalize font-semibold">{item.raisedBy.role || 'student'}</span>
                        {item.raisedBy.studentId && ` | ID: ${item.raisedBy.studentId}`}
                        {item.raisedBy.staffId && ` | Staff ID: ${item.raisedBy.staffId}`}
                        {item.raisedBy.wardId && ` | Ward ID: ${item.raisedBy.wardId}`}
                        {!item.raisedBy.studentId && !item.raisedBy.staffId && !item.raisedBy.wardId && item.raisedBy.role !== 'admin' && ' | ID: N/A'}
                      </span>
                    )}

                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                    </span>
                  </div>
                </div>

                {/* Status Selector */}
                <div className="flex items-center space-x-3 w-full lg:w-auto justify-end border-t lg:border-t-0 border-slate-800 pt-4 lg:pt-0">
                  <span className="text-xs text-slate-400 font-medium">Status:</span>
                  <select
                    value={item.status}
                    disabled={updatingId === item._id}
                    onChange={(e) => handleStatusChange(item._id, e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminDash;