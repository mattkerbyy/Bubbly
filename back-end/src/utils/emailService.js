import nodemailer from 'nodemailer'

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'bubblycsph@gmail.com',
    pass: process.env.EMAIL_PASSWORD
  }
})

/**
 * Send password reset email with OTP code
 * @param {string} to - Recipient email
 * @param {string} resetCode - 6-digit reset code
 * @param {string} userName - User's name
 */
export const sendPasswordResetEmail = async (to, resetCode, userName) => {
  const mailOptions = {
    from: `"Bubbly" <${process.env.EMAIL_USER || 'bubblycsph@gmail.com'}>`,
    to,
    subject: 'Reset Your Bubbly Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 40px;
            text-align: center;
            color: white;
          }
          .logo {
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 10px;
          }
          .message {
            font-size: 16px;
            margin-bottom: 30px;
            opacity: 0.9;
          }
          .code-container {
            background: white;
            color: #667eea;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
          }
          .code {
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
          }
          .expiry {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.8);
            margin-top: 20px;
          }
          .footer {
            margin-top: 30px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
          }
          .warning {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">🫧 Bubbly</div>
          <div class="title">Password Reset Request</div>
          <div class="message">
            Hi ${userName || 'there'},<br>
            We received a request to reset your password. Use the code below to reset your password:
          </div>
          
          <div class="code-container">
            <div class="code">${resetCode}</div>
          </div>
          
          <div class="expiry">
            ⏱️ This code will expire in <strong>3 minutes</strong>
          </div>
          
          <div class="warning">
            ⚠️ If you didn't request this password reset, please ignore this email or contact support if you have concerns.
          </div>
          
          <div class="footer">
            This is an automated message from Bubbly. Please do not reply to this email.
          </div>
        </div>
      </body>
      </html>
    `
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('Password reset email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending password reset email:', error)
    throw new Error('Failed to send password reset email')
  }
}

/**
 * Send test email to verify configuration
 */
export const sendTestEmail = async () => {
  try {
    await transporter.verify()
    console.log('Email service is ready')
    return true
  } catch (error) {
    console.error('Email service error:', error)
    return false
  }
}
