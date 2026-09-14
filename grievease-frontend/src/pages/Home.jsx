import { Link } from 'react-router-dom';
import { ShieldAlert, Cpu, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

const Home = () => {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden">
      
      {/* Background Radial Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/15 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8 text-center flex flex-col items-center justify-center flex-1">
        
        {/* Top Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-950/70 border border-blue-500/30 text-blue-400 text-xs sm:text-sm font-semibold mb-8 backdrop-blur-md shadow-lg shadow-blue-950/50">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>NLP Powered Grievance Redressal</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-7xl font-black tracking-tight max-w-5xl leading-tight">
          AI-Driven Campus Grievance <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            Redressal Portal
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-400 max-w-3xl leading-relaxed">
          Submit issues across campus stations—Hostel, Library, Academic Block, Main Gate, or Pedestrian. GrievEase auto-evaluates urgency using NLP algorithms for fast resolution.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            to="/register"
            className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base flex items-center justify-center space-x-3 transition duration-200 shadow-xl shadow-blue-600/25 hover:scale-[1.02]"
          >
            <span>Raise a Complaint</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/login"
            className="px-8 py-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold text-base transition duration-200 backdrop-blur-md hover:scale-[1.02]"
          >
            User Login
          </Link>
        </div>

        {/* Glassmorphic Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left w-full max-w-6xl">
          <div className="p-7 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/40 transition duration-300 backdrop-blur-xl shadow-xl hover:-translate-y-1">
            <div className="p-3 bg-blue-950/60 border border-blue-800/50 rounded-xl w-fit mb-4">
              <ShieldAlert className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="font-bold text-xl text-white">Station Routing</h3>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              Tag exact campus locations: Hostel, Library, Academic Block, Pedestrian, or Main Gate.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 transition duration-300 backdrop-blur-xl shadow-xl hover:-translate-y-1">
            <div className="p-3 bg-indigo-950/60 border border-indigo-800/50 rounded-xl w-fit mb-4">
              <Cpu className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="font-bold text-xl text-white">NLP Severity Scoring</h3>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              Automated priority classification algorithm processes text intensity and safety hazards.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 transition duration-300 backdrop-blur-xl shadow-xl hover:-translate-y-1">
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/50 rounded-xl w-fit mb-4">
              <CheckCircle className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="font-bold text-xl text-white">Role Workflows</h3>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              Tailored dashboards for Students, Parents (Ward tracking), Staff, and Admin Queue managers.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;