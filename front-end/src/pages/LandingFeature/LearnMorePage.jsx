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
import {
  Users,
  MessageCircle,
  Heart,
  Search,
  Zap,
  Shield,
  Check,
  ArrowRight,
  Target,
  Sparkles,
  Globe,
  Lock,
} from "lucide-react";
import ThemeToggle from "@/components/Others/ThemeToggle";
import BackgroundAnimation from "@/components/BgAnimFeature/BackgroundAnimation";

export default function LearnMorePage() {
  const features = [
    {
      icon: Users,
      title: "Social Connections",
      description:
        "Build and maintain meaningful relationships with friends, family, and like-minded individuals.",
      benefits: [
        "Friend requests and followers",
        "Mutual connections discovery",
        "Community groups (Soon)",
      ],
    },
    {
      icon: MessageCircle,
      title: "Rich Content Sharing",
      description:
        "Express yourself through posts, photos, videos, and more with our intuitive content creation tools.",
      benefits: [
        "Text, image, and video posts",
        "Story features (Soon)",
        "Live streaming capabilities (Soon)",
      ],
    },
    {
      icon: Heart,
      title: "Engagement & Interaction",
      description:
        "React, comment, and share content that resonates with you and your community.",
      benefits: [
        "Multiple reaction types",
        "Threaded comments",
        "Share and repost features",
      ],
    },
    {
      icon: Search,
      title: "Smart Discovery",
      description:
        "Find interesting content and people with our intelligent recommendation algorithm.",
      benefits: ["Trending topics", "Personalized feed", "Hashtag exploration"],
    },
    {
      icon: Zap,
      title: "Real-Time Updates",
      description:
        "Stay connected with instant notifications and live updates from your network.",
      benefits: [
        "Push notifications",
        "Activity feed",
        "Online status indicators",
      ],
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description:
        "Your data is protected with industry-leading security measures and granular privacy controls.",
      benefits: [
        "End-to-end encryption",
        "Privacy settings",
        "Two-factor authentication (Soon)",
      ],
    },
  ];

  const howItWorks = [
    {
      step: 1,
      title: "Create Your Account",
      description:
        "Sign up in seconds with just your email. Customize your profile with photos and bio.",
      icon: Target,
    },
    {
      step: 2,
      title: "Build Your Network",
      description:
        "Find and connect with friends, follow interesting people, and join communities.",
      icon: Users,
    },
    {
      step: 3,
      title: "Share & Engage",
      description:
        "Post updates, share moments, like and comment on content from your network.",
      icon: Sparkles,
    },
    {
      step: 4,
      title: "Stay Connected",
      description:
        "Get real-time updates, discover new content, and grow your social presence.",
      icon: Globe,
    },
  ];

  return (
    <div className="min-h-screen bg-background relative">
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
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link to="/register">
              <Button className="bg-primary hover:bg-primary/90">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Everything You Need to Know About{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Bubbly
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              A modern social media platform designed to bring people together,
              share moments, and build meaningful connections.
            </p>
            <Link to="/register">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16 md:py-24 bg-muted/30">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore the tools and capabilities that make Bubbly the best way
              to connect
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-xl transition-all duration-300 border-border/50">
                    <CardHeader>
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <Icon className="w-7 h-7 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                      <CardDescription className="text-base mt-2">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {feature.benefits.map((benefit, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm"
                          >
                            <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">
                              {benefit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* How It Works */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started with Bubbly in four simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="text-center"
                >
                  <div className="relative mb-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Security & Privacy */}
        <section className="container mx-auto px-4 py-16 md:py-24 bg-muted/30">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Lock className="w-16 h-16 text-primary mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Your Privacy is Our Priority
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                We take your privacy and security seriously. Bubbly is built
                with industry-leading security practices to keep your data safe
                and private.
              </p>
              <ul className="space-y-4">
                {[
                  "End-to-end encryption for private messages",
                  "Granular privacy controls for your content",
                  "No selling of personal data to third parties",
                  "Regular security audits and updates",
                  "Data Privacy Act of 2012 compliant",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex gap-4">
                <Link to="/privacy">
                  <Button variant="outline">Privacy Policy</Button>
                </Link>
                <Link to="/terms">
                  <Button variant="outline">Terms of Service</Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-border flex items-center justify-center">
                <Shield className="w-48 h-48 text-primary/40" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="p-8 md:p-12 text-center space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold">
                  Ready to Join Bubbly?
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Create your account today and start connecting with people who
                  matter most.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/register">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                    >
                      Create Free Account
                    </Button>
                  </Link>
                  <Link to="/about">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      Learn About Us
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t bg-background">
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
