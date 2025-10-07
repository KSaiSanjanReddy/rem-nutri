const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Email configuration (only initialize if credentials are provided)
let emailTransporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  try {
    emailTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } catch (error) {
    console.warn('Email transporter initialization failed:', error.message);
    emailTransporter = null;
  }
}

// Twilio configuration (only initialize if credentials are provided)
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  } catch (error) {
    console.warn('Twilio initialization failed:', error.message);
    twilioClient = null;
  }
}

// Send OTP via Email
const sendOTPEmail = async (email, otp) => {
  try {
    if (!emailTransporter || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email not configured. Email OTP not sent to:', email);
      console.log(`OTP for ${email}: ${otp}`);
      return true; // Return true for development purposes
    }

    const mailOptions = {
      from: `"Health Chat" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP for Health Chat',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Health Chat</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Your Health Companion</p>
          </div>
          
          <div style="padding: 40px 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Verify Your Account</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              Thank you for registering with Health Chat! To complete your registration, please use the following OTP to verify your email address.
            </p>
            
            <div style="background: white; border: 2px dashed #667eea; border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0;">
              <p style="color: #333; font-size: 18px; margin: 0 0 10px 0; font-weight: 600;">Your OTP Code</p>
              <div style="background: #667eea; color: white; font-size: 32px; font-weight: bold; letter-spacing: 5px; padding: 15px 20px; border-radius: 8px; display: inline-block; margin: 10px 0;">
                ${otp}
              </div>
              <p style="color: #999; font-size: 14px; margin: 15px 0 0 0;">This code will expire in 5 minutes</p>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
              If you didn't request this OTP, please ignore this email. For security reasons, do not share this code with anyone.
            </p>
          </div>
          
          <div style="background: #333; padding: 20px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2024 Health Chat. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

// Send OTP via SMS
const sendOTPSMS = async (mobile, otp) => {
  try {
    if (!twilioClient || !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.warn('Twilio not configured. SMS OTP not sent to:', mobile);
      console.log(`OTP for ${mobile}: ${otp}`);
      return true; // Return true for development purposes
    }

    const message = await twilioClient.messages.create({
      body: `Your Health Chat OTP is: ${otp}. This code will expire in 5 minutes. Do not share this code with anyone.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: mobile
    });

    console.log(`OTP SMS sent to ${mobile}, SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP SMS:', error);
    throw new Error('Failed to send OTP SMS');
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    if (!emailTransporter) {
      console.warn('Email not configured. Password reset email not sent to:', email);
      console.log(`Password reset token for ${email}: ${resetToken}`);
      return true;
    }

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"Health Chat" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your Password - Health Chat',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Health Chat</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Your Health Companion</p>
          </div>
          
          <div style="padding: 40px 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              You requested to reset your password for your Health Chat account. Click the button below to reset your password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
              If you didn't request this password reset, please ignore this email. This link will expire in 1 hour for security reasons.
            </p>
          </div>
          
          <div style="background: #333; padding: 20px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2024 Health Chat. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, fullName) => {
  try {
    if (!emailTransporter) {
      console.warn('Email not configured. Welcome email not sent to:', email);
      return true;
    }

    const mailOptions = {
      from: `"Health Chat" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Health Chat!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Health Chat!</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Your Health Companion</p>
          </div>
          
          <div style="padding: 40px 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Hello ${fullName}!</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              Welcome to Health Chat! We're excited to have you join our community of health-conscious individuals.
            </p>
            
            <div style="background: white; border-radius: 10px; padding: 30px; margin: 30px 0;">
              <h3 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">What you can do:</h3>
              <ul style="color: #666; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Chat with certified doctors and health professionals</li>
                <li>Share health reports and documents securely</li>
                <li>Get personalized health advice and consultations</li>
                <li>Track your health journey and progress</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboard" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                Get Started
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
              If you have any questions, feel free to reach out to our support team. We're here to help you on your health journey!
            </p>
          </div>
          
          <div style="background: #333; padding: 20px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2024 Health Chat. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new Error('Failed to send welcome email');
  }
};

module.exports = {
  sendOTPEmail,
  sendOTPSMS,
  sendPasswordResetEmail,
  sendWelcomeEmail
};
