import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { google } from 'googleapis';

// Load environment variables
dotenv.config();

// Create a transporter for sending emails
const createTransporter = async () => {
  const emailUser = process.env.EMAIL_USER;

  // OAuth2 configuration (Gmail / Google Workspace)
  const gmailClientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const gmailClientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const gmailRefreshToken = process.env.GMAIL_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;
  const oauthRedirectUri = process.env.GMAIL_OAUTH_REDIRECT_URI || process.env.GOOGLE_OAUTH_REDIRECT_URI || 'https://developers.google.com/oauthplayground';

  const isOAuthConfigured = Boolean(emailUser && gmailClientId && gmailClientSecret && gmailRefreshToken);

  // Prefer OAuth2 if configured
  if (isOAuthConfigured) {
    try {
      const oAuth2Client = new google.auth.OAuth2(
        gmailClientId,
        gmailClientSecret,
        oauthRedirectUri
      );
      oAuth2Client.setCredentials({ refresh_token: gmailRefreshToken });

      const accessTokenResult = await oAuth2Client.getAccessToken();
      const accessToken = typeof accessTokenResult === 'string' ? accessTokenResult : accessTokenResult?.token;

      if (!accessToken) {
        throw new Error('Failed to obtain Gmail access token');
      }

      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: emailUser,
          clientId: gmailClientId,
          clientSecret: gmailClientSecret,
          refreshToken: gmailRefreshToken,
          accessToken
        }
      });
    } catch (err) {
      console.error('OAuth2 transporter setup failed:', err?.message || err);
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
      console.warn('Falling back to test transporter (non-production).');
      return {
        sendMail: async (options) => {
          return { messageId: 'test-message-id' };
        }
      };
    }
  }

  // OAuth2 not configured: production -> error; non-prod -> test transporter
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Gmail OAuth2 not configured. Set EMAIL_USER, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN.');
  }
  console.warn('Gmail OAuth2 not configured; using test transporter (non-production).');
  return {
    sendMail: async (options) => {
      return { messageId: 'test-message-id' };
    }
  };
};

export const sendInviteEmail = async (email, inviteToken, inviterName = 'Admin') => {
  try {
    const transporter = await createTransporter();
    
    // Create the invite URL
    const inviteUrl = `${process.env.ADMIN_PANEL_URL || 'http://localhost:3000'}/accept-invite?token=${inviteToken}`;
    
    const mailOptions = {
      from: `"LiquosIO" <${process.env.EMAIL_USER || 'noreply@waterreportcard.com'}>`,
      to: email,
      subject: 'You\'ve been invited to join LiquosIO',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">LIQUOSLabs</h1>
            <p style="color: #e0e0e0; margin: 10px 0 0 0; font-size: 16px;">You've been invited to join our platform</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Welcome to LIQUOSLabs!</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              <strong>${inviterName}</strong> has invited you to join LIQUOSLabs, our comprehensive water management platform.
            </p>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              Click the button below to accept your invitation and set up your account:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" 
                 style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
                Accept Invitation
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            <p style="color: #007bff; word-break: break-all; font-size: 14px; background: #f1f1f1; padding: 10px; border-radius: 5px;">
              ${inviteUrl}
            </p>
            
            <div style="border-top: 1px solid #ddd; margin-top: 30px; padding-top: 20px;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
          </div>
        </div>
      `,
      text: `
        You've been invited to join LIQUOSLabs!
        
        ${inviterName} has invited you to join our water management platform.
        
        To accept your invitation, visit: ${inviteUrl}
        
        This invitation will expire in 7 days.
        
        If you didn't expect this invitation, you can safely ignore this email.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending invite email:', error);
    console.error('Email sending failed for:', email);
    return { success: false, error: error.message };
  }
};

// Generic email sending function
export const sendEmail = async (emailData) => {
  try {
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: `"LiquosIO" <${process.env.EMAIL_USER || 'noreply@waterreportcard.com'}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html || emailData.template,
      text: emailData.text
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Email verification email
export const sendEmailVerification = async (email, userName, verificationUrl) => {
  try {
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: `"LiquosIO" <${process.env.EMAIL_USER || 'noreply@waterreportcard.com'}>`,
      to: email,
      subject: 'Verify your email address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">LIQUOSLabs</h1>
            <p style="color: #e0e0e0; margin: 10px 0 0 0; font-size: 16px;">Email Verification Required</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Welcome to LIQUOSLabs!</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              Hello <strong>${userName}</strong>!
            </p>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              Thank you for registering with LIQUOSLabs. To complete your registration, please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-weight: bold; 
                        display: inline-block;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #999; font-size: 14px; line-height: 1.6;">
              If the button doesn't work, you can also copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
            </p>
            
            <p style="color: #999; font-size: 12px; margin: 30px 0 0 0;">
              This verification link will expire in 24 hours. If you didn't create an account with LIQUOSLabs, please ignore this email.
            </p>
          </div>
        </div>
      `,
      text: `
        Welcome to LIQUOSLabs!
        
        Hello ${userName}!
        
        Thank you for registering with LIQUOSLabs. To complete your registration, please verify your email address by visiting this link:
        
        ${verificationUrl}
        
        This verification link will expire in 24 hours. If you didn't create an account with LIQUOSLabs, please ignore this email.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email verification:', error);
    return { success: false, error: error.message };
  }
};

// Password reset email
export const sendPasswordReset = async (email, userName, resetUrl) => {
  try {
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: `"LiquosIO" <${process.env.EMAIL_USER || 'noreply@waterreportcard.com'}>`,
      to: email,
      subject: 'Reset your password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">LIQUOSLabs</h1>
            <p style="color: #e0e0e0; margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              Hello <strong>${userName}</strong>!
            </p>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              We received a request to reset your password for your LIQUOSLabs account. Click the button below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-weight: bold; 
                        display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #999; font-size: 14px; line-height: 1.6;">
              If the button doesn't work, you can also copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
            </p>
            
            <p style="color: #999; font-size: 12px; margin: 30px 0 0 0;">
              This password reset link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
            </p>
          </div>
        </div>
      `,
      text: `
        Reset Your Password
        
        Hello ${userName}!
        
        We received a request to reset your password for your LIQUOSLabs account. Visit this link to reset your password:
        
        ${resetUrl}
        
        This password reset link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

// User invitation email
export const sendUserInvitation = async (email, roleDisplay, orgName, invitationUrl, expiresAt) => {
  try {
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: `"LiquosIO" <${process.env.EMAIL_USER || 'noreply@waterreportcard.com'}>`,
      to: email,
      subject: `You're invited to join ${orgName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">LIQUOSLabs</h1>
            <p style="color: #e0e0e0; margin: 10px 0 0 0; font-size: 16px;">You've been invited to join our platform</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Welcome to LIQUOSLabs!</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              You've been invited to join <strong>${orgName}</strong> as a <strong>${roleDisplay}</strong>.
            </p>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              Click the button below to accept your invitation and create your account:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-weight: bold; 
                        display: inline-block;">
                Accept Invitation
              </a>
            </div>
            
            <p style="color: #999; font-size: 14px; line-height: 1.6;">
              If the button doesn't work, you can also copy and paste this link into your browser:<br>
              <a href="${invitationUrl}" style="color: #667eea; word-break: break-all;">${invitationUrl}</a>
            </p>
            
            <p style="color: #999; font-size: 12px; margin: 30px 0 0 0;">
              This invitation will expire on ${expiresAt}. If you didn't expect this invitation, please ignore this email.
            </p>
          </div>
        </div>
      `,
      text: `
        Welcome to LIQUOSLabs!
        
        You've been invited to join ${orgName} as a ${roleDisplay}.
        
        Click the link below to accept your invitation and create your account:
        
        ${invitationUrl}
        
        This invitation will expire on ${expiresAt}. If you didn't expect this invitation, please ignore this email.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending user invitation email:', error);
    return { success: false, error: error.message };
  }
};

export const sendWelcomeEmail = async (email, userName) => {
  try {
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: `"LiquosIO" <${process.env.EMAIL_USER || 'noreply@waterreportcard.com'}>`,
      to: email,
      subject: 'Welcome to LIQUOSLabs!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome toLIQUOSLabs!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${userName}!</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              Your account has been successfully created and you can now access the LIQUOSLabs platform.
            </p>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              You can log in using your email address and the password you set during the invitation process.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.ADMIN_PANEL_URL || 'http://localhost:3000'}/login" 
                 style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
                Log In Now
              </a>
            </div>
            
            <div style="border-top: 1px solid #ddd; margin-top: 30px; padding-top: 20px;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                If you have any questions, please contact your administrator.
              </p>
            </div>
          </div>
        </div>
      `,
      text: `
        Welcome to LIQUOSLabs!
        
        Hello ${userName}!
        
        Your account has been successfully created and you can now access the LIQUOSLabs platform.
        
        You can log in using your email address and the password you set during the invitation process.
        
        Log in at: ${process.env.ADMIN_PANEL_URL || 'http://localhost:3000'}/login
        
        If you have any questions, please contact your administrator.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};
