import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Folder, 
  CheckSquare, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  User,
  Search,
  Sun,
  Moon,
  Bot,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationCenter } from "./NotificationCenter";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/theme-provider";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setTheme, theme } = useTheme();
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // We use a light fetch or rely on what we have. 
                // Ideally this should be in a context, but we'll fetch for now.
                // We'll reuse the backend's /users/me endpoint which is efficient.
                const response = await fetch('http://localhost:3000/users/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUserAvatar(data.avatar);
                }
            } catch (e) {
                console.error("Failed to load user info");
            }
        }
    };

    fetchUser();
    
    // Listen for updates from Settings page
    window.addEventListener('user-updated', fetchUser);
    
    return () => {
        window.removeEventListener('user-updated', fetchUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Folder, label: "Projects", path: "/projects" },
    { icon: CheckSquare, label: "My Tasks", path: "/tasks" },
    { icon: Bot, label: "Automation", path: "/automation" },
    { icon: TrendingUp, label: "Admin Analytics", path: "/admin" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <motion.aside 
        initial={{ width: 250 }}
        animate={{ width: isSidebarOpen ? 250 : 80 }}
        className="hidden md:flex flex-col border-r-2 border-foreground bg-secondary/10 relative z-20"
      >
        <div className="h-16 flex items-center justify-between px-4 border-b-2 border-foreground bg-background">
          {isSidebarOpen ? (
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 flex items-center justify-center bg-secondary text-secondary-foreground border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))]">
                 <CheckSquare className="w-4 h-4" />
               </div>
               <span className="font-pixel text-xl text-primary truncate">TASKTRACKER</span>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full pr-2">
             <div className="w-8 h-8 flex items-center justify-center bg-secondary text-secondary-foreground border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))]">
                 <CheckSquare className="w-4 h-4" />
             </div>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hover:bg-primary/20 shrink-0"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex items-center gap-3 p-3 rounded-none transition-all border-2 ${
                  isActive 
                    ? "bg-primary text-primary-foreground border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))]" 
                    : "border-transparent hover:border-foreground/50 hover:bg-secondary/20"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {isSidebarOpen && <span className="font-mono text-sm font-bold uppercase">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t-2 border-foreground bg-background">
          <Button 
            variant="ghost" 
            className={`w-full justify-start gap-3 hover:bg-destructive/20 hover:text-destructive ${!isSidebarOpen && 'justify-center px-0'}`}
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            {isSidebarOpen && <span className="font-mono text-sm font-bold uppercase">Logout</span>}
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b-2 border-foreground bg-background flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4 md:hidden">
                 <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    <Menu className="h-5 w-5" />
                 </Button>
                 <span className="font-pixel text-lg text-primary">TASKTRACKER</span>
            </div>

            <div className="hidden md:flex items-center gap-4 w-full max-w-md">
                 <div className="relative w-full">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search tasks..." 
                        className="pl-9 font-mono border-2 border-foreground focus-visible:ring-0 focus-visible:border-primary focus-visible:shadow-[2px_2px_0px_hsl(var(--foreground))] transition-all"
                    />
                 </div>
            </div>

            <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="relative"
                >
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
                
                <NotificationCenter />
                
                <Link to="/settings">
                  <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 border-2 border-transparent hover:border-foreground/20 overflow-hidden p-0">
                    {userAvatar ? (
                        <img src={userAvatar} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                        <User className="h-5 w-5" />
                    )}
                  </Button>
                </Link>
              </div>
        </header>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
            {isMobileMenuOpen && (
                <motion.div 
                    initial={{ opacity: 0, x: -300 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -300 }}
                    className="fixed inset-0 z-50 bg-background md:hidden"
                >
                     <div className="p-4 border-b-2 border-foreground flex justify-between items-center bg-secondary/10">
                         <span className="font-pixel text-xl text-primary">MENU</span>
                         <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                            <X className="h-5 w-5" />
                         </Button>
                     </div>
                     <nav className="p-4 space-y-4">
                        {navItems.map((item) => (
                             <Link 
                                key={item.path} 
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-4 p-4 border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_hsl(var(--foreground))] transition-all active:shadow-none"
                            >
                                <item.icon className="h-6 w-6" />
                                <span className="font-mono text-lg font-bold uppercase">{item.label}</span>
                             </Link>
                        ))}
                         <Button 
                            className="w-full justify-start gap-4 p-6 border-2 border-destructive text-destructive hover:bg-destructive/10 mt-8"
                            variant="outline"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-6 w-6" />
                            <span className="font-mono text-lg font-bold uppercase">Logout</span>
                        </Button>
                     </nav>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 bg-secondary/5 relative">
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
          </div>
            {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
