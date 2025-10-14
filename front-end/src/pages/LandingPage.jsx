import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, MessageCircle, Heart, Search, Zap, Shield } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import RotatingWords from "@/components/RotatingWords";
import BackgroundAnimation from "@/components/BackgroundAnimation";
import Spline from "@splinetool/react-spline";
import { memo } from "react";

// Memoize Spline component to prevent unnecessary re-renders
const MemoizedSpline = memo(({ scene }) => (
  <Spline
    scene={scene}
    style={{
      width: "100%",
      height: "100%",
      pointerEvents: "none",
    }}
  />
));
MemoizedSpline.displayName = "MemoizedSpline";

export default function LandingPage() {
  const rotatingWords = ["Create", "Share", "Connect", "Discover"];
  const features = [
    {
      icon: Users,
      title: "Connect with Friends",
      description:
        "Build meaningful connections and stay in touch with people who matter most.",
    },
    {
      icon: MessageCircle,
      title: "Share Your Moments",
      description:
        "Post updates, photos, and thoughts to share your life with your community.",
    },
    {
      icon: Heart,
      title: "Engage & React",
      description:
        "Like, comment, and interact with content that resonates with you.",
    },
    {
      icon: Search,
      title: "Discover Content",
      description: "Explore trending posts and discover new people to follow.",
    },
    {
      icon: Zap,
      title: "Real-time Updates",
      description:
        "Get instant notifications and stay updated with your network.",
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description:
        "Your data is secure with industry-standard encryption and privacy controls.",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  };

  // Optimized motion config
  const motionConfig = {
    initial: "hidden",
    animate: "visible",
    viewport: { once: true, margin: "-50px" }, // Load animations earlier
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
      <BackgroundAnimation />
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <motion.img
              src="/images/bubbly-logo-clearbg.png"
              alt="Bubbly Logo"
              className="h-10 w-auto"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            />
          </Link>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <ThemeToggle />
            <Link to="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link to="/register">
              <Button className="bg-primary hover:bg-primary/90">
                Sign Up
              </Button>
            </Link>
          </motion.div>
        </div>
      </header>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
            className="space-y-6"
            style={{ willChange: 'transform, opacity' }}
          >
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              <RotatingWords
                words={rotatingWords}
                className="inline-block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent min-w-[200px]"
              />
              <br />
              <span className="text-foreground">Your World</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Join Bubbly to share moments, follow friends, and engage with
              communities that inspire you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                >
                  Get Started
                </Button>
              </Link>
              <Link to="/learn-more">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="relative w-full"
            style={{ willChange: 'transform, opacity' }}
          >
            {/* Responsive container - adapts to screen size */}
            <div className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] lg:aspect-square lg:h-auto rounded-2xl overflow-visible">
              <div className="absolute inset-0 flex items-center justify-center">
                <MemoizedSpline scene="https://prod.spline.design/stfAWIIqbhrL49W1/scene.splinecode" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose Bubbly?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience social networking with modern features and intuitive
            design
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-8 md:p-12 text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join thousands of users already connecting, sharing, and
                discovering on Bubbly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                  >
                    Create Account
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16 bg-background relative z-10">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img
                src="/images/bubbly-logo-clearbg.png"
                alt="Bubbly"
                className="h-8 w-auto"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Bubbly. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link
                to="/privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <Link
                to="/terms"
                className="hover:text-foreground transition-colors"
              >
                Terms
              </Link>
              <Link
                to="/about"
                className="hover:text-foreground transition-colors"
              >
                About
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
