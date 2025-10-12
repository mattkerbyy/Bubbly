import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import ThemeToggle from '@/components/ThemeToggle'
import { Heart, Users, Target, Zap, Globe, ArrowLeft } from 'lucide-react'

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: 'Community First',
      description: 'We believe in building meaningful connections and fostering positive interactions among users.',
    },
    {
      icon: Users,
      title: 'Inclusivity',
      description: 'Bubbly is a platform for everyone, celebrating diversity and promoting respectful dialogue.',
    },
    {
      icon: Target,
      title: 'User-Centric',
      description: 'Every feature we build is designed with our users\' needs and feedback in mind.',
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'We continuously evolve our platform with cutting-edge technology and fresh ideas.',
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Connecting people across borders, cultures, and languages to make the world smaller.',
    },
  ]

  const timeline = [
    {
      year: '2024',
      title: 'The Beginning',
      description: 'Bubbly was founded with a vision to create a social platform that prioritizes genuine connections over vanity metrics.',
    },
    {
      year: '2025',
      title: 'Launch & Growth',
      description: 'We launched our beta platform and grew to thousands of users who shared our vision of meaningful social networking.',
    },
    {
      year: 'Future',
      title: 'What\'s Next',
      description: 'We\'re working on exciting features like video calls, communities, marketplace, and AI-powered content discovery.',
    },
  ]

  return (
    <div className="min-h-screen bg-background">
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
            <Link to="/">
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 md:py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            About{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Bubbly
            </span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            We're on a mission to create a social media platform that brings people together 
            through authentic connections, meaningful conversations, and shared experiences.
          </p>
        </motion.div>

        {/* Mission Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-3xl font-bold mb-6 text-center">Our Mission</h2>
              <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto leading-relaxed">
                To empower people worldwide to connect, share, and inspire one another in a safe, 
                inclusive, and engaging digital environment. We believe social media should enhance 
                human relationships, not replace them.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Values */}
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              These core principles guide everything we do at Bubbly
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <Icon className="w-7 h-7 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* Timeline */}
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Journey</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From a simple idea to a growing community
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            {timeline.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative pl-8 pb-12 border-l-2 border-primary/20 last:pb-0"
              >
                <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-primary border-4 border-background" />
                <div className="mb-2">
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                    {item.year}
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Team Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <Card>
            <CardContent className="p-8 md:p-12 text-center">
              <Users className="w-16 h-16 text-primary mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-4">Built by a Passionate Team</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Bubbly is created by developers, designers, and community managers who are 
                passionate about technology and human connection. We're a diverse team working 
                remotely from around the globe, united by our vision for better social media.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">10K+</div>
                  <div className="text-sm text-muted-foreground">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">50K+</div>
                  <div className="text-sm text-muted-foreground">Posts Shared</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">25+</div>
                  <div className="text-sm text-muted-foreground">Countries</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-8 md:p-12 text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">Join Our Community</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Be part of a growing community that values authentic connections and meaningful interactions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                    Get Started
                  </Button>
                </Link>
                <Link to="/learn-more">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Learn More
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 text-center"
        >
          <h3 className="text-2xl font-bold mb-4">Get in Touch</h3>
          <p className="text-muted-foreground mb-6">
            Have questions or feedback? We'd love to hear from you!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline" asChild>
              <a href="mailto:hello@bubbly.com">hello@bubbly.com</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="mailto:support@bubbly.com">support@bubbly.com</a>
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src="/images/bubbly-logo-clearbg.png" alt="Bubbly" className="h-8 w-auto" />
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Bubbly. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/learn-more" className="hover:text-foreground transition-colors">Learn More</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
