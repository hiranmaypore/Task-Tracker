import { Link } from "react-router-dom";
import { CheckSquare } from "lucide-react";
import { motion } from "framer-motion";

interface MinimalLayoutProps {
  children: React.ReactNode;
}

const MinimalLayout = ({ children }: MinimalLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-20 flex items-center justify-between px-6 border-b-2 border-foreground bg-background sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 flex items-center justify-center bg-secondary text-secondary-foreground border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))]">
            <CheckSquare className="w-5 h-5" />
          </div>
          <span className="font-pixel text-2xl text-primary">TASKTRACKER</span>
        </Link>
      </header>

      <main className="flex-1 overflow-auto p-6 bg-secondary/5 relative">
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          {children}
        </motion.div>
      </main>

      <footer className="py-6 border-t-2 border-foreground bg-background text-center space-y-2">
        <p className="font-mono text-xs text-muted-foreground">
          © 2026 TaskFlow. Back to <Link to="/" className="underline hover:text-primary">Home</Link>
        </p>
        <p className="font-mono text-[10px] text-muted-foreground/60 uppercase">
          Contact: <a href="mailto:hiranmay.dev@gmail.com" className="hover:text-primary underline">hiranmay.dev@gmail.com</a>
        </p>
      </footer>
    </div>
  );
};

export default MinimalLayout;
