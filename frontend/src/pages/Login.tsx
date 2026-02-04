import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, type Easing } from "framer-motion";
import { CheckSquare, ArrowRight, Loader2, Mail, Lock, Eye, EyeOff, Github } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { API_BASE_URL } from "@/config";

// ... existing variants
const ease: Easing = [0.0, 0.0, 0.2, 1];
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } }
};


const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const error = params.get("error");

    if (token) {
        localStorage.setItem("token", token);
        toast({
            title: "Login Successful",
            description: "Welcome back!",
        });
        navigate("/dashboard");
    } else if (error) {
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Google Authentication failed.",
        });
    }
  }, [location, navigate, toast]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      // Assuming backend is running on default port 3000
      const response = await axios.post(`${API_BASE_URL}/auth/login`, data);
      
      // Store token
      localStorage.setItem('token', response.data.access_token);
      
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      // Navigate to dashboard or home, for now home
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.response?.data?.message || "Invalid credentials. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
      window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden p-4">
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>
      
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="w-full max-w-md z-10"
      >
        <div className="mb-8 text-center flex flex-col items-center">
          <Link to="/" className="flex items-center gap-2 mb-4 group">
             <div className="w-10 h-10 flex items-center justify-center bg-secondary text-secondary-foreground border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))] group-hover:translate-x-px group-hover:translate-y-px group-hover:shadow-[1px_1px_0px_hsl(var(--foreground))] transition-all">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span className="font-pixel text-2xl text-primary">TASKTRACKER</span>
          </Link>
          <h1 className="font-pixel text-4xl text-primary mb-2" style={{ textShadow: "2px 2px 0px hsl(30, 90%, 30%)" }}>
            WELCOME BACK
          </h1>
          <p className="font-mono text-muted-foreground text-center">
            Continue where you left off.
          </p>
        </div>

        <Card className="border-2 border-foreground shadow-[8px_8px_0px_hsl(var(--foreground))] bg-card">
          <CardHeader>
            <CardTitle className="font-pixel text-2xl">Login</CardTitle>
            <CardDescription className="font-mono text-xs">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono font-bold uppercase text-xs">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="john@example.com" 
                            className="pl-9 font-mono border-2 border-foreground focus-visible:ring-0 focus-visible:border-primary focus-visible:shadow-[2px_2px_0px_hsl(var(--foreground))] transition-all" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="font-mono text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono font-bold uppercase text-xs">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••" 
                            className="pl-9 pr-10 font-mono border-2 border-foreground focus-visible:ring-0 focus-visible:border-primary focus-visible:shadow-[2px_2px_0px_hsl(var(--foreground))] transition-all" 
                            {...field} 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="font-mono text-xs" />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full font-bold uppercase tracking-wider bg-accent text-accent-foreground border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_hsl(var(--foreground))] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                  Login
                </Button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-foreground/20" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground font-mono">Or continue with</span>
                    </div>
                </div>

                <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full border-2 border-foreground font-bold font-mono uppercase hover:bg-muted"
                    onClick={handleGoogleLogin}
                >
                     <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                        <path d="M1 1h22v22H1z" fill="none" />
                     </svg>
                     Google
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center border-t-2 border-foreground/10 pt-4">
             <p className="font-mono text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="font-bold text-primary hover:underline hover:text-primary/80">
                Register
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
