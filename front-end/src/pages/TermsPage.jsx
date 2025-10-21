import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import ThemeToggle from '@/components/ThemeToggle'
import { FileText, ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: [
        'By accessing and using Bubbly, you accept and agree to be bound by these Terms of Service.',
        'If you do not agree to these terms, please do not use our platform.',
        'We reserve the right to modify these terms at any time with notice to users.',
        'Continued use after modifications constitutes acceptance of updated terms.',
      ]
    },
    {
      title: '2. Eligibility',
      content: [
        'You must be at least 13 years old to use Bubbly.',
        'If you are under 18, you must have parental or guardian consent.',
        'You must provide accurate and complete information when creating an account.',
        'You are responsible for maintaining the security of your account credentials.',
        'One person or legal entity may maintain only one account.',
      ]
    },
    {
      title: '3. User Accounts',
      content: [
        'You are responsible for all activity that occurs under your account.',
        'You must notify us immediately of any unauthorized use of your account.',
        'You may not transfer your account to another person without our permission.',
        'We reserve the right to suspend or terminate accounts that violate these terms.',
        'You must not impersonate others or provide false information.',
      ]
    },
    {
      title: '4. User Content',
      content: [
        'You retain ownership of content you post on Bubbly.',
        'By posting content, you grant us a worldwide, non-exclusive license to use, reproduce, and distribute your content.',
        'You are solely responsible for the content you post and its legality.',
        'You must not post content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable.',
        'We reserve the right to remove content that violates these terms or our community guidelines.',
        'You must respect intellectual property rights and not post copyrighted material without permission.',
      ]
    },
    {
      title: '5. Prohibited Activities',
      content: [
        'Violating any applicable laws or regulations',
        'Harassing, bullying, or threatening other users',
        'Posting spam, malware, or phishing attempts',
        'Attempting to hack, disrupt, or compromise the platform',
        'Using automated systems (bots) without authorization',
        'Collecting user information without consent',
        'Impersonating others or misrepresenting your identity',
        'Selling or transferring your account',
        'Engaging in any activity that interferes with or disrupts the service',
      ]
    },
    {
      title: '6. Intellectual Property',
      content: [
        'Bubbly and its original content, features, and functionality are owned by Bubbly Inc.',
        'Our trademarks, logos, and brand features are protected by intellectual property laws.',
        'You may not use our intellectual property without express written permission.',
        'User-generated content remains the property of the respective users.',
      ]
    },
    {
      title: '7. Privacy',
      content: [
        'Your use of Bubbly is also governed by our Privacy Policy.',
        'We collect and use information as described in our Privacy Policy.',
        'You consent to the collection and use of your information as outlined.',
        'Please review our Privacy Policy to understand our practices.',
      ]
    },
    {
      title: '8. Termination',
      content: [
        'You may delete your account at any time through account settings.',
        'We may suspend or terminate your account if you violate these terms.',
        'We reserve the right to terminate accounts at our discretion for any reason.',
        'Upon termination, your right to use the service ceases immediately.',
        'Provisions that should survive termination will remain in effect.',
      ]
    },
    {
      title: '9. Disclaimers',
      content: [
        'Bubbly is provided "as is" without warranties of any kind.',
        'We do not guarantee that the service will be uninterrupted or error-free.',
        'We are not responsible for user-generated content.',
        'We do not endorse any content, opinions, or recommendations posted by users.',
        'Use of the service is at your own risk.',
      ]
    },
    {
      title: '10. Limitation of Liability',
      content: [
        'To the maximum extent permitted by law, Bubbly shall not be liable for any indirect, incidental, special, consequential, or punitive damages.',
        'Our total liability shall not exceed the amount you paid us in the past 12 months.',
        'Some jurisdictions do not allow limitation of liability, so these limitations may not apply to you.',
      ]
    },
    {
      title: '11. Indemnification',
      content: [
        'You agree to indemnify and hold Bubbly harmless from any claims, damages, or expenses arising from:',
        '• Your use of the service',
        '• Your violation of these terms',
        '• Your violation of any rights of another party',
        '• Your content posted on the platform',
      ]
    },
    {
      title: '12. Dispute Resolution',
      content: [
        'Any disputes arising from these terms will be resolved through binding arbitration.',
        'Arbitration will be conducted in Taguig City, Philippines.',
        'You waive your right to participate in class action lawsuits.',
        'Small claims court disputes are exempt from arbitration.',
      ]
    },
    {
      title: '13. Governing Law',
      content: [
        'These Terms are governed by the laws of the Republic of the Philippines.',
        'You consent to the exclusive jurisdiction of courts in Taguig City, Philippines.',
      ]
    },
    {
      title: '14. Changes to Terms',
      content: [
        'We may update these Terms of Service at any time.',
        'We will notify users of material changes via email or platform notification.',
        'Your continued use after changes constitutes acceptance.',
        'It is your responsibility to review these terms periodically.',
      ]
    },
    {
      title: '15. Contact Information',
      content: [
        'For questions about these Terms of Service, contact us:',
        'Email: legal@bubbly.com',
        'Support: support@bubbly.com',
      ]
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

      <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <FileText className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-lg text-muted-foreground">
            Last Updated: October 18, 2025
          </p>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Welcome to Bubbly. These Terms of Service ("Terms") govern your access to and use of our platform. 
            Please read them carefully before using our services.
          </p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Card>
            <CardContent className="p-8 md:p-12 space-y-8">
              {sections.map((section, index) => (
                <div key={index} className="space-y-4">
                  <h2 className="text-2xl font-bold text-foreground">
                    {section.title}
                  </h2>
                  <ul className="space-y-3">
                    {section.content.map((item, i) => (
                      <li key={i} className="text-muted-foreground leading-relaxed pl-4 border-l-2 border-primary/20">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="pt-8 border-t">
                <p className="text-sm text-muted-foreground">
                  By using Bubbly, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use our platform.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Related Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-12 flex flex-wrap justify-center gap-4"
        >
          <Link to="/privacy">
            <Button variant="outline">Privacy Policy</Button>
          </Link>
          <Link to="/about">
            <Button variant="outline">About Us</Button>
          </Link>
          <Link to="/learn-more">
            <Button variant="outline">Learn More</Button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
