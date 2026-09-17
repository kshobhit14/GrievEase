import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogOut, User, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 font-bold text-xl text-blue-400">
            <ShieldAlert className="w-7 h-7 text-blue-500" />
            <span>GrievEase</span>
          </Link>

          {/* Nav Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link 
                  to={user.role === 'admin' || user.role === 'main_admin' ? '/admin' : '/dashboard'} 
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                {/* Role Badge */}
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize border ${
                  user.role === 'main_admin' ? 'bg-red-950 text-red-300 border-red-800' :
                  user.role === 'admin' ? 'bg-purple-950 text-purple-300 border-purple-800' :
                  user.role === 'parent' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                  user.role === 'staff' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                  'bg-blue-950 text-blue-300 border-blue-800'
                }`}>
                  {user.role}
                </span>

                <div className="flex items-center space-x-2 text-slate-300 text-sm border-l border-slate-700 pl-4">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{user.name}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-400 rounded-md transition"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition">
                  Login
                </Link>
                <Link to="/register" className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-md shadow-blue-500/20">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
