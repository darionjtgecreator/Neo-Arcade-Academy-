import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { 
  Home, Trophy, Medal, User, LogOut, Zap, Flame, 
  BookOpen, Target, ChevronRight, Menu, X, History 
} from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/grades", label: "Practice", icon: BookOpen },
    { path: "/history", label: "History", icon: History },
    { path: "/achievements", label: "Badges", icon: Medal },
    { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { path: "/profile", label: "Profile", icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-dark border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl hidden sm:block gradient-text">
                Neo-Arcade Academy
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-link flex items-center gap-2 text-sm font-medium ${
                      isActive ? "active" : "text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* User Stats & Actions */}
            <div className="flex items-center gap-4">
              {/* XP Display */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
                <Zap className="w-4 h-4 text-secondary" />
                <span className="text-sm font-bold xp-counter">{user?.xp || 0} XP</span>
              </div>

              {/* Level Badge */}
              <div className="level-badge text-sm">
                {user?.level || 1}
              </div>

              {/* Streak */}
              {user?.streak > 0 && (
                <div className="streak-flame hidden sm:flex">
                  <Flame className="w-4 h-4" />
                  {user.streak}
                </div>
              )}

              {/* Logout Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
                data-testid="logout-btn"
              >
                <LogOut className="w-5 h-5" />
              </Button>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="mobile-menu-btn"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-lg">
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                      isActive 
                        ? "bg-primary text-white" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </Link>
                );
              })}
              
              {/* Mobile XP Display */}
              <div className="flex items-center gap-4 px-4 py-3 mt-4 rounded-xl bg-muted">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-secondary" />
                  <span className="font-bold">{user?.xp || 0} XP</span>
                </div>
                {user?.streak > 0 && (
                  <div className="streak-flame">
                    <Flame className="w-4 h-4" />
                    {user.streak}
                  </div>
                )}
              </div>
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="relative">
        {children}
      </main>
    </div>
  );
};

export default Layout;
