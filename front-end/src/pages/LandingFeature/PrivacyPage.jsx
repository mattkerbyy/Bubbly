import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ThemeToggle from "@/components/Others/ThemeToggle";
import { Shield, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  const sections = [
    {
      title: "1. Information We Collect",
      content: [
        "Account Information: When you create an account, we collect your name, email address, username, and password.",
        "Profile Information: You may choose to provide additional information such as profile photo, bio, location, and website.",
        "Content: We collect the content you create, including posts, comments, likes, and messages.",
        "Usage Data: We automatically collect information about how you interact with Bubbly, including pages visited, features used, and time spent on the platform.",
        "Device Information: We collect information about the device you use to access Bubbly, including IP address, browser type, and operating system.",
      ],
    },
    {
      title: "2. How We Use Your Information",
      content: [
        "To provide, maintain, and improve our services",
        "To personalize your experience and show you relevant content",
        "To communicate with you about updates, security alerts, and support",
        "To detect, prevent, and address fraud, security issues, and technical problems",
        "To comply with legal obligations and enforce our Terms of Service",
        "To analyze usage patterns and improve our platform",
      ],
    },
    {
      title: "3. Information Sharing",
      content: [
        "Public Content: Content you choose to post publicly (posts, comments, profile information) is visible to other users.",
        "With Your Consent: We will share your information with third parties when you give us explicit permission.",
        "Service Providers: We may share information with trusted service providers who help us operate our platform.",
        "Legal Requirements: We may disclose information if required by law or in response to valid legal requests.",
        "Business Transfers: If Bubbly is involved in a merger or acquisition, your information may be transferred.",
        "We do NOT sell your personal information to advertisers or third parties.",
      ],
    },
    {
      title: "4. Data Security",
      content: [
        "We use industry-standard encryption to protect your data in transit and at rest.",
        "Passwords are hashed using bcrypt before storage.",
        "We implement regular security audits and vulnerability assessments.",
        "Access to user data is restricted to authorized personnel only.",
        "However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.",
      ],
    },
    {
      title: "5. Your Rights and Choices",
      content: [
        "Access: You can access your personal information through your account settings.",
        "Correction: You can update or correct your information at any time.",
        "Deletion: You can request deletion of your account and associated data.",
        "Data Portability: You can request a copy of your data in a portable format.",
        "Opt-Out: You can opt out of marketing communications at any time.",
        "Privacy Settings: You can control who sees your content through privacy settings.",
      ],
    },
    {
      title: "6. Cookies and Tracking",
      content: [
        "We use cookies and similar technologies to provide functionality and improve your experience.",
        "Essential cookies are required for the platform to function properly.",
        "Analytics cookies help us understand how users interact with Bubbly.",
        "You can control cookie preferences through your browser settings.",
        "Disabling certain cookies may affect the functionality of the platform.",
      ],
    },
    {
      title: "7. Children's Privacy",
      content: [
        "Bubbly is not intended for users under the age of 13.",
        "We do not knowingly collect personal information from children under 13.",
        "If we become aware that a child under 13 has provided us with personal information, we will take steps to delete such information.",
        "Parents or guardians who believe their child has provided information should contact us immediately.",
      ],
    },
    {
      title: "8. International Data Transfers",
      content: [
        "Your information may be transferred to and processed in countries other than your own.",
        "We ensure adequate safeguards are in place for international data transfers.",
        "By using Bubbly, you consent to the transfer of your information to our servers.",
      ],
    },
    {
      title: "9. Changes to This Policy",
      content: [
        "We may update this Privacy Policy from time to time.",
        "We will notify you of significant changes by posting a notice on the platform or sending an email.",
        "Your continued use of Bubbly after changes constitutes acceptance of the updated policy.",
        "We encourage you to review this policy periodically.",
      ],
    },
    {
      title: "10. Contact Us",
      content: [
        "If you have questions about this Privacy Policy or our data practices, please contact us:",
        "Email: privacy@bubbly.com",
        "We will respond to your inquiries within 30 days.",
      ],
    },
  ];

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
          <Shield className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground">
            Last Updated: October 18, 2025
          </p>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            At Bubbly, we take your privacy seriously. This Privacy Policy
            explains how we collect, use, disclose, and protect your information
            when you use our social media platform.
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
                      <li
                        key={i}
                        className="text-muted-foreground leading-relaxed pl-4 border-l-2 border-primary/20"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="pt-8 border-t">
                <p className="text-sm text-muted-foreground">
                  By using Bubbly, you acknowledge that you have read and
                  understood this Privacy Policy and agree to the collection,
                  use, and disclosure of your information as described herein.
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
          <Link to="/terms">
            <Button variant="outline">Terms of Service</Button>
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
  );
}
