import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Automation from "./pages/Automation";
import AdminDashboard from "./pages/AdminDashboard";
import Settings from "./pages/Settings";
import Register from "./pages/Register";
import Login from "./pages/Login";
import PrivateRoute from "./components/PrivateRoute";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "./components/theme-provider";
import PrivacyPolicy from "@/pages/PrivacyPolicy";

import axios from "axios";
import { useEffect } from "react";

import { SocketProvider } from "./context/SocketContext";

const queryClient = new QueryClient();

// Setup global axios interceptor
const AxiosInterceptor = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TooltipProvider>
      <Toaster />
      <Sonner />
      <AxiosInterceptor>
        <SocketProvider>
            <BrowserRouter>
              <Routes>
                {/* ... routes ... */}
                <Route path="/" element={<Index />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/privacy" element={<PrivacyPolicy />} /> {/* Added route */}
                
                {/* Protected Routes */}
                <Route element={<PrivateRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/projects/:id" element={<Tasks />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/automation" element={<Automation />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
        </SocketProvider>
      </AxiosInterceptor>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
