import { CheckSquare, Github, Twitter, Zap, Target, Calendar, Sparkles, Users, BarChart3, Plus, CheckCircle, Trophy, ArrowRight, Star, Menu, X, Rocket, Heart, Layers, Bot, Bell, Sun, Moon } from "lucide-react";
import { motion, useScroll, useTransform, useInView, AnimatePresence, type Variants, type Easing } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "@/components/theme-provider";
import heroIllustration from "@/assets/hero-illustration.png";

// Easing values
const easeOut: Easing = [0.0, 0.0, 0.2, 1];
const easeInOut: Easing = [0.4, 0, 0.2, 1];

// Animation variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } }
};

const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: easeOut } }
};

const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: easeOut } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: easeOut } }
};

const slideInFromBottom: Variants = {
  hidden: { opacity: 0, y: 100 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: easeInOut } }
};

// Animated counter component
const AnimatedCounter = ({ target, duration = 2 }: { target: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
};

// Floating particles component
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 rounded-full bg-primary/20"
        initial={{ x: Math.random() * 100 + "%", y: "100%" }}
        animate={{
          y: "-100%",
          x: [
            Math.random() * 100 + "%",
            Math.random() * 100 + "%",
            Math.random() * 100 + "%"
          ]
        }}
        transition={{
          duration: Math.random() * 10 + 15,
          repeat: Infinity,
          ease: "linear",
          delay: Math.random() * 5
        }}
      />
    ))}
  </div>
);

// Typewriter effect
const TypewriterText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [displayedText, setDisplayedText] = useState("");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let i = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        if (i <= text.length) {
          setDisplayedText(text.slice(0, i));
          i++;
        } else {
          clearInterval(interval);
        }
      }, 50);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [isInView, text, delay]);

  return (
    <span ref={ref}>
      {displayedText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="inline-block w-1 h-8 bg-primary ml-1"
      />
    </span>
  );
};

// Data
const features = [
  { icon: Layers, title: "Project Power", description: "Manage complex projects with role-based access. Assign Owners, Editors, and Viewers.", color: "bg-accent" },
  { icon: Bot, title: "Smart Automation", description: "Create 'If This Then That' rules. Let the system handle repetitive tasks for you.", color: "bg-secondary" },
  { icon: Calendar, title: "Calendar Sync", description: "Two-way Google Calendar integration. Keep your schedule perfectly aligned.", color: "bg-primary" },
  { icon: Zap, title: "Real-Time Sync", description: "Live updates via WebSockets. See changes happen instantly across all devices.", color: "bg-accent" },
  { icon: Users, title: "Team Collaboration", description: "Comment on tasks, share lists, and stay in the loop with email notifications.", color: "bg-secondary" },
  { icon: BarChart3, title: "Deep Insights", description: "Visual productivity dashboards. Track completion rates and team performance.", color: "bg-primary" },
];

const steps = [
  { number: "01", icon: Layers, title: "Organize Projects", description: "Create projects, invite your team, and define roles. Structure your work your way." },
  { number: "02", icon: Bot, title: "Automate Workflows", description: "Set up 'If This Then That' rules. Let the system assign tasks and send reminders automatically." },
  { number: "03", icon: BarChart3, title: "Track Success", description: "Monitor team velocity and completion rates. Get accurate insights to keep you on track." },
];

const testimonials = [
  { name: "Alex Chen", role: "Startup Founder", avatar: "AC", quote: "Finally, a todo app that doesn't try to do everything. Just lets me focus on what matters.", rating: 5 },
  { name: "Sarah Miller", role: "Freelance Designer", avatar: "SM", quote: "The streak feature is addictive! I've been productive for 47 days straight now.", rating: 5 },
  { name: "Jordan Lee", role: "Engineering Lead", avatar: "JL", quote: "Our team adopted it in a day. No training needed. Everyone just got it immediately.", rating: 5 },
];

const stats = [
  { value: 10000, label: "Active Users", suffix: "+" },
  { value: 500000, label: "Tasks Completed", suffix: "+" },
  { value: 99, label: "Uptime", suffix: "%" },
  { value: 4.9, label: "App Rating", suffix: "/5" },
];

const benefits = ["Free forever plan", "No credit card required", "Start in 30 seconds"];

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { setTheme, theme } = useTheme();
  const { scrollYProgress } = useScroll();
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const testimonialsRef = useRef(null);
  const statsRef = useRef(null);

  const heroInView = useInView(heroRef, { once: true, amount: 0.3 });
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.2 });
  const howItWorksInView = useInView(howItWorksRef, { once: true, amount: 0.2 });
  const testimonialsInView = useInView(testimonialsRef, { once: true, amount: 0.2 });
  const statsInView = useInView(statsRef, { once: true, amount: 0.3 });

  // Parallax effects
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.3]);

  // Progress bar
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-[100] origin-left"
        style={{ scaleX }}
      />

      {/* Floating particles */}
      <FloatingParticles />

      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-1 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b-2 border-foreground"
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-10 h-10 flex items-center justify-center bg-secondary text-secondary-foreground border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))]">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span className="font-pixel text-2xl text-primary">TASKTRACKER</span>
          </motion.div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {["Features", "How it Works", "Testimonials"].map((item, i) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase().split(' ').join('-')}`}
                className="font-mono text-sm uppercase tracking-wider hover:text-primary transition-colors relative group"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </motion.a>
            ))}

          </div>

          <div className="hidden md:flex items-center gap-4">
             <motion.button
               onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
               className="relative w-10 h-10 border-2 border-foreground flex items-center justify-center hover:bg-muted transition-colors shadow-[2px_2px_0px_hsl(var(--foreground))] hover:translate-x-px hover:translate-y-px hover:shadow-[1px_1px_0px_hsl(var(--foreground))] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
               whileTap={{ scale: 0.95 }}
             >
               <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
               <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
             </motion.button>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-6 py-3 font-bold uppercase tracking-wider bg-card text-foreground border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_hsl(var(--foreground))] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all text-sm"
              >
                Login
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-6 py-3 font-bold uppercase tracking-wider bg-accent text-accent-foreground border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_hsl(var(--foreground))] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all text-sm"
              >
                Get Started
              </Link>
            </motion.div>
          </div>

          {/* Mobile menu button */}
          <motion.button
            className="md:hidden w-10 h-10 flex items-center justify-center border-2 border-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            whileTap={{ scale: 0.9 }}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t-2 border-foreground bg-background"
            >
              <div className="container mx-auto px-6 py-4 flex flex-col gap-4">
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="flex items-center gap-2 font-mono text-sm uppercase tracking-wider py-2"
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
                {["Features", "How it Works", "Testimonials"].map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase().split(' ').join('-')}`}
                    className="font-mono text-sm uppercase tracking-wider py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item}
                  </a>
                ))}
                <Link
                  to="/login"
                   className="font-mono text-sm uppercase tracking-wider py-2"
                   onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-6 py-3 font-bold uppercase tracking-wider bg-accent text-accent-foreground border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero */}
      <motion.section
        ref={heroRef}
        className="min-h-screen flex items-center pt-20 relative"
        style={{ y: heroY, opacity: heroOpacity }}
      >
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="space-y-8"
              initial="hidden"
              animate={heroInView ? "visible" : "hidden"}
              variants={staggerContainer}
            >
              <motion.h1
                className="font-pixel text-6xl md:text-7xl lg:text-8xl leading-tight text-primary"
                style={{ textShadow: "3px 3px 0px hsl(30, 90%, 30%)" }}
                variants={fadeInLeft}
              >
                GET STUFF<br />
                <motion.span
                  className="text-secondary inline-block"
                  animate={{ rotate: [0, -2, 2, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  DONE.
                </motion.span>
              </motion.h1>

              <motion.p
                className="font-mono text-lg md:text-xl text-muted-foreground max-w-md"
                variants={fadeInUp}
              >
                Simple tasks, meaningful progress. The todo list that actually helps you focus.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                variants={fadeInUp}
              >
                <motion.div
                  className="inline-flex"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center px-6 py-3 font-bold uppercase tracking-wider bg-accent text-accent-foreground border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_hsl(var(--foreground))] transition-all text-lg"
                  >
                    <Rocket className="w-5 h-5 mr-2" />
                    Start Free Today
                  </Link>
                </motion.div>
                <motion.a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center px-6 py-3 font-bold uppercase tracking-wider bg-card text-foreground border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_hsl(var(--foreground))] transition-all text-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  See How It Works
                </motion.a>
              </motion.div>

              <motion.div
                className="flex items-center gap-6 pt-4"
                variants={fadeInUp}
              >
                <div className="flex -space-x-3">
                  {["A", "B", "C", "D"].map((letter, i) => (
                    <motion.div
                      key={letter}
                      className="w-10 h-10 rounded-full bg-secondary border-2 border-foreground flex items-center justify-center text-secondary-foreground font-mono text-xs"
                      initial={{ opacity: 0, scale: 0, x: -20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                    >
                      {letter}
                    </motion.div>
                  ))}
                </div>
                <p className="font-mono text-sm text-muted-foreground">
                  <span className="text-primary font-bold">
                    <AnimatedCounter target={10000} />+
                  </span> productive humans
                </p>
              </motion.div>
            </motion.div>

            <motion.div
              className="relative"
              initial="hidden"
              animate={heroInView ? "visible" : "hidden"}
              variants={fadeInRight}
            >
              <motion.div
                className="bg-card border-2 border-foreground p-4 shadow-[4px_4px_0px_hsl(var(--foreground))]"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <img src={heroIllustration} alt="Person completing tasks happily" className="w-full h-auto border-2 border-foreground" />
              </motion.div>

              <motion.div
                className="absolute -top-4 -right-4 bg-card border-2 border-foreground p-3 shadow-[4px_4px_0px_hsl(var(--foreground))]"
                initial={{ opacity: 0, scale: 0, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 1, type: "spring", stiffness: 200 }}
              >
                <motion.span
                  className="font-pixel text-xl text-secondary"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ✓ DONE!
                </motion.span>
              </motion.div>

              <motion.div
                className="absolute -bottom-4 -left-4 bg-card border-2 border-foreground p-3 shadow-[4px_4px_0px_hsl(var(--foreground))] hidden md:block"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}
              >
                <motion.span
                  className="font-pixel text-lg text-primary"
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  +5 TASKS
                </motion.span>
              </motion.div>

              {/* Decorative elements */}
              <motion.div
                className="absolute top-1/4 -left-8 w-4 h-4 bg-accent border-2 border-foreground"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute bottom-1/4 -right-8 w-6 h-6 bg-secondary border-2 border-foreground rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
        >
          <motion.div
            className="w-6 h-10 border-2 border-foreground rounded-full flex justify-center pt-2"
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <motion.div
              className="w-1.5 h-3 bg-primary rounded-full"
              animate={{ y: [0, 8, 0], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-16 bg-secondary/10 border-y-2 border-foreground">
        <div className="container mx-auto px-6">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial="hidden"
            animate={statsInView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                variants={scaleIn}
              >
                <motion.div
                  className="font-pixel text-4xl md:text-5xl text-primary mb-2"
                  style={{ textShadow: "2px 2px 0px hsl(30, 90%, 30%)" }}
                >
                  {typeof stat.value === "number" && stat.value > 100 ? (
                    <AnimatedCounter target={stat.value} />
                  ) : (
                    stat.value
                  )}
                  {stat.suffix}
                </motion.div>
                <p className="font-mono text-sm text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" ref={featuresRef} className="py-24 relative">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            animate={featuresInView ? "visible" : "hidden"}
            variants={fadeInUp}
          >
            <h2 className="font-pixel text-5xl md:text-6xl text-primary mb-4" style={{ textShadow: "3px 3px 0px hsl(30, 90%, 30%)" }}>
              BUILT FOR DOERS
            </h2>
            <p className="font-mono text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to organize your life. Nothing you don't.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate={featuresInView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="bg-card border-2 border-foreground p-6 shadow-[4px_4px_0px_hsl(var(--foreground))] group cursor-pointer"
                variants={fadeInUp}
                whileHover={{
                  x: 4,
                  y: -4,
                  boxShadow: "8px 8px 0px hsl(var(--foreground))"
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div
                  className={`w-16 h-16 flex items-center justify-center ${feature.color} text-${feature.color === "bg-accent" ? "accent" : feature.color === "bg-secondary" ? "secondary" : "primary"}-foreground border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))] mb-4`}
                >
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="font-pixel text-2xl text-foreground mb-2">{feature.title}</h3>
                <p className="font-mono text-sm text-muted-foreground">{feature.description}</p>

                <motion.div
                  className="w-0 h-1 bg-primary mt-4"
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" ref={howItWorksRef} className="py-24 bg-secondary/10">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            animate={howItWorksInView ? "visible" : "hidden"}
            variants={fadeInUp}
          >
            <h2 className="font-pixel text-5xl md:text-6xl text-primary mb-4" style={{ textShadow: "3px 3px 0px hsl(30, 90%, 30%)" }}>
              SIMPLE AS 1-2-3
            </h2>
            <p className="font-mono text-lg text-muted-foreground max-w-2xl mx-auto">
              No learning curve. No tutorials needed. Just start doing.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            initial="hidden"
            animate={howItWorksInView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            {steps.map((step, index) => (
              <motion.div key={step.number} className="relative" variants={slideInFromBottom}>
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <motion.div
                    className="hidden md:block absolute top-12 left-[60%] w-[80%] h-1 border-t-2 border-dashed border-foreground/30"
                    initial={{ scaleX: 0 }}
                    animate={howItWorksInView ? { scaleX: 1 } : { scaleX: 0 }}
                    transition={{ delay: 0.5 + index * 0.3, duration: 0.5 }}
                  />
                )}

                <motion.div
                  className="bg-card border-2 border-foreground p-6 shadow-[4px_4px_0px_hsl(var(--foreground))] text-center relative z-10"
                  whileHover={{ y: -8 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.div
                    className="font-pixel text-6xl text-primary/30 mb-4"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                  >
                    {step.number}
                  </motion.div>

                  <div
                    className="w-16 h-16 mx-auto flex items-center justify-center bg-secondary text-secondary-foreground border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))] mb-6"
                  >
                    <step.icon className="w-8 h-8" />
                  </div>

                  <h3 className="font-pixel text-3xl text-foreground mb-4">{step.title}</h3>
                  <p className="font-mono text-sm text-muted-foreground">{step.description}</p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" ref={testimonialsRef} className="py-24">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            animate={testimonialsInView ? "visible" : "hidden"}
            variants={fadeInUp}
          >
            <h2 className="font-pixel text-5xl md:text-6xl text-primary mb-4" style={{ textShadow: "3px 3px 0px hsl(30, 90%, 30%)" }}>
              DOERS LOVE US
            </h2>
            <p className="font-mono text-lg text-muted-foreground max-w-2xl mx-auto">
              Don't take our word for it. Here's what productive people say.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-6"
            initial="hidden"
            animate={testimonialsInView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                className="bg-card border-2 border-foreground p-6 shadow-[4px_4px_0px_hsl(var(--foreground))]"
                variants={scaleIn}
                whileHover={{ y: -8, boxShadow: "8px 8px 0px hsl(var(--foreground))" }}
              >
                <motion.div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * i + index * 0.2 }}
                    >
                      <Star className="w-5 h-5 fill-accent text-accent" />
                    </motion.div>
                  ))}
                </motion.div>

                <p className="font-mono text-foreground mb-6 italic">"{testimonial.quote}"</p>

                <div className="flex items-center gap-3">
                  <motion.div className="w-12 h-12 rounded-full bg-primary border-2 border-foreground flex items-center justify-center text-primary-foreground font-mono font-bold">
                    {testimonial.avatar}
                  </motion.div>
                  <div>
                    <p className="font-pixel text-lg text-foreground">{testimonial.name}</p>
                    <p className="font-mono text-xs text-muted-foreground uppercase">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="py-24 bg-primary/10">
        <div className="container mx-auto px-6">
          <motion.div
            className="bg-card border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] max-w-4xl mx-auto text-center p-12"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.h2
              className="font-pixel text-5xl md:text-6xl lg:text-7xl text-primary mb-6"
              style={{ textShadow: "3px 3px 0px hsl(30, 90%, 30%)" }}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              READY TO BE<br />PRODUCTIVE?
            </motion.h2>

            <p className="font-mono text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Join thousands of people who've simplified their lives with TaskFlow.
            </p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 font-bold uppercase tracking-wider bg-accent text-accent-foreground border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_hsl(var(--foreground))] transition-all text-lg"
                >
                  Get Started Free
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.span>
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              className="flex flex-wrap justify-center gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  className="flex items-center gap-2"
                  variants={fadeInUp}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                  >
                    <CheckCircle className="w-5 h-5 text-secondary" />
                  </motion.div>
                  <span className="font-mono text-sm text-muted-foreground">{benefit}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t-2 border-foreground">
        <div className="container mx-auto px-6">
          <motion.div
            className="flex flex-col md:flex-row items-center justify-between gap-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="flex items-center gap-2"
              // whileHover={{ scale: 1.05 }}
            >
              <div className="w-8 h-8 flex items-center justify-center bg-secondary text-secondary-foreground border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))]">
                <CheckSquare className="w-4 h-4" />
              </div>
              <span className="font-pixel text-xl text-primary">TASKTRACKER</span>
            </motion.div>

            <div className="flex items-center gap-6">
              {["Privacy", "Terms", "Contact"].map((item) => (
                <motion.a
                  key={item}
                  href="#"
                  className="font-mono text-sm text-muted-foreground hover:text-primary transition-colors uppercase"
                  whileHover={{ y: -2 }}
                >
                  {item}
                </motion.a>
              ))}
            </div>

            <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <a
                href="https://x.com/HiranmayPore"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 border-2 border-foreground flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                title="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/hiranmaypore"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 border-2 border-foreground flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                title="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
            </div>
          </motion.div>

          <motion.div
            className="text-center mt-8 pt-8 border-t border-muted"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <p className="font-mono text-xs text-muted-foreground flex items-center justify-center gap-1">
              © 2026 TaskFlow. Made with
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Heart className="w-3 h-3 text-destructive fill-destructive" />
              </motion.span>
              for productive people.
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
