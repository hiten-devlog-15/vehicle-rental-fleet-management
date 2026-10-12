// services/emailService.js — DriveFleet Professional Email Notification Service
//
// Automatically sends transactional emails for DriveFleet bookings:
//   1. Customer Booking Confirmation / Acknowledgement email
//   2. Fleet Manager New Booking Notification email
//
// Features:
//   - SMTP support for Gmail (App Password), SendGrid, Mailgun, AWS SES, or custom SMTP
//   - Graceful fallback: skips sending cleanly if SMTP credentials are missing (never crashes or rolls back)
//   - Beautiful, responsive HTML email templates with DriveFleet branding
//   - Clean plain-text fallback for every email
//   - Dynamic data mapping using actual MongoDB booking, customer, vehicle, and manager records
//   - Safe diagnostic logging (credentials and passwords are NEVER logged)
//   - Test transport support for automated verification without external network dependency

const nodemailer = require('nodemailer');

let transporter = null;
let testTransporter = null;

/**
 * Configure or override transporter for testing
 */
const setTestTransporter = (mock) => {
  testTransporter = mock;
};

/**
 * Reset transporter (useful when environment variables change or for tests)
 */
const resetTransporter = () => {
  transporter = null;
  testTransporter = null;
};

/**
 * Validate and resolve SMTP configuration from environment variables
 */
const getSmtpConfig = () => {
  const user = process.env.SMTP_USER || process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT, 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  const senderAddress = process.env.EMAIL_FROM || (user ? `"DriveFleet Notifications" <${user}>` : null);

  return {
    user,
    pass,
    host,
    port,
    secure,
    senderAddress,
    isConfigured: Boolean(user && pass),
  };
};

/**
 * Initialize email transporter (lazy — created on first use)
 */
const getTransporter = () => {
  if (testTransporter) return testTransporter;
  if (transporter) return transporter;

  const config = getSmtpConfig();

  if (!config.isConfigured) {
    console.warn('⚠️  [Email] SMTP credentials not set (SMTP_USER/SMTP_EMAIL and SMTP_PASS/SMTP_PASSWORD) — transactional emails disabled.');
    return null;
  }

  try {
    // If specific host is provided (or not Gmail)
    if (config.host && config.host !== 'smtp.gmail.com') {
      transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port || 587,
        secure: config.secure,
        auth: {
          user: config.user,
          pass: config.pass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });
    } else {
      // Default to Gmail SMTP service (supports Google App Passwords)
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.user,
          pass: config.pass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });
    }

    console.log(`📧 [Email] Transporter initialized for ${config.user}`);
    return transporter;
  } catch (initErr) {
    console.error('❌ [Email] Failed to initialize SMTP transporter:', initErr.message);
    return null;
  }
};

/**
 * Format currency in Indian Rupees
 */
const formatINR = (amount) => {
  const val = Number(amount) || 0;
  return `₹${val.toLocaleString('en-IN')}`;
};

/**
 * Format date string into human-readable format
 */
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

/**
 * Format timestamp into detailed submission time
 */
const formatSubmissionTime = (dateObj) => {
  try {
    const d = dateObj ? new Date(dateObj) : new Date();
    return d.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return new Date().toISOString();
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// HTML EMAIL WRAPPER TEMPLATE
// ═══════════════════════════════════════════════════════════════════════════════

const wrapInEmailLayout = ({ previewText, headerTitle, headerSubtitle, contentHtml, footerNote }) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${headerTitle}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#1e293b;">
  <!-- Preview Text (Invisible snippet in inbox preview) -->
  <div style="display:none;font-size:1px;color:#f1f5f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${previewText || headerTitle}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(15,23,42,0.08);border:1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 50%,#3b82f6 100%);padding:36px 32px 30px;text-align:center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;padding:8px 16px;background:rgba(255,255,255,0.15);backdrop-filter:blur(10px);border-radius:999px;margin-bottom:12px;border:1px solid rgba(255,255,255,0.2);">
                      <span style="color:#ffffff;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                        DriveFleet • Smart Mobility
                      </span>
                    </div>
                    <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;line-height:1.2;">
                      ${headerTitle}
                    </h1>
                    <p style="margin:8px 0 0;color:#dbeafe;font-size:14px;font-weight:500;">
                      ${headerSubtitle || 'Vehicle Rental & Fleet Management System'}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Area -->
          <tr>
            <td style="padding:32px 32px 28px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td style="padding:24px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0 0 6px;color:#64748b;font-size:12px;font-weight:600;">
                DriveFleet Operations & Customer Support
              </p>
              <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.5;">
                ${footerNote || 'This is an automated notification from the DriveFleet platform. Please do not reply directly to this email.'}
              </p>
              <p style="margin:12px 0 0;color:#cbd5e1;font-size:11px;">
                © ${new Date().getFullYear()} DriveFleet Inc. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 1. CUSTOMER BOOKING EMAIL BUILDER (HTML + PLAIN TEXT)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Builds the Customer confirmation / request acknowledgement email
 */
const buildCustomerBookingEmail = ({ booking, vehicle, customer, clientUrl = 'http://localhost:5173' }) => {
  const bookingId = booking._id?.toString() || booking.id || 'N/A';
  const customerName = customer?.name || booking.customerName || 'Valued Customer';
  const vehicleName = vehicle?.name || booking.vehicleName || 'Reserved Vehicle';
  const vehicleType = vehicle?.type || booking.vehicleType || 'Vehicle';
  const vehicleBrand = vehicle?.brand || 'DriveFleet';
  const regNo = vehicle?.registrationNo ? ` (${vehicle.registrationNo})` : '';

  const isPending = booking.status === 'Pending';
  const statusLabel = isPending ? 'Pending Approval' : (booking.status || 'Confirmed');
  const statusBadgeBg = isPending ? '#fef3c7' : '#dcfce7';
  const statusBadgeColor = isPending ? '#92400e' : '#166534';
  const statusBadgeBorder = isPending ? '#fcd34d' : '#86efac';

  const pickupLocation = booking.pickupLocation || 'DriveFleet Main Station';
  const destination = booking.destination || booking.pickupLocation || 'Return to Pickup Location';
  const submissionTime = formatSubmissionTime(booking.createdAt || booking.bookingDate);

  const subject = isPending
    ? `Your DriveFleet Booking Request | ${vehicleName} | ${bookingId}`
    : `Your DriveFleet Booking Confirmation | ${vehicleName} | ${bookingId}`;

  const headerTitle = isPending
    ? 'Booking Request Received'
    : 'Your Reservation is Confirmed!';

  const headerSubtitle = `Booking Reference: ${bookingId}`;

  const nextStepMessage = isPending
    ? `Thank you for choosing DriveFleet. Your booking request for <strong>${vehicleName}</strong> has been successfully submitted and is currently <strong>awaiting fleet manager approval</strong>. Your booking reference is <strong>${bookingId}</strong>. You can check the latest status anytime from your DriveFleet account.`
    : `Thank you for choosing DriveFleet. Your booking for <strong>${vehicleName}</strong> has been successfully confirmed. Your booking reference is <strong>${bookingId}</strong>. You can check the latest status and manage your rental directly from your DriveFleet account.`;

  const dashboardUrl = `${clientUrl}/dashboard`;

  const contentHtml = `
    <!-- Greeting -->
    <div style="margin-bottom:20px;">
      <h2 style="margin:0 0 8px;color:#0f172a;font-size:18px;font-weight:700;">
        Hello ${customerName},
      </h2>
      <p style="margin:0;color:#334155;font-size:14px;line-height:1.6;">
        ${nextStepMessage}
      </p>
    </div>

    <!-- Status Banner -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:14px 18px;background-color:${statusBadgeBg};border:1px solid ${statusBadgeBorder};border-radius:12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="color:${statusBadgeColor};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
                Booking Status
              </td>
              <td align="right" style="color:${statusBadgeColor};font-size:14px;font-weight:800;">
                ● ${statusLabel}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Booking Summary Card -->
    <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin-bottom:24px;">
      <h3 style="margin:0 0 16px;color:#1e293b;font-size:15px;font-weight:700;border-bottom:1px solid #e2e8f0;padding-bottom:10px;">
        📋 Reservation Summary
      </h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;">
        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;width:40%;">Booking ID</td>
          <td style="padding:6px 0;color:#0f172a;font-weight:700;font-family:monospace;font-size:13px;">${bookingId}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;">Vehicle</td>
          <td style="padding:6px 0;color:#0f172a;font-weight:700;">${vehicleName}${regNo}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;">Category / Brand</td>
          <td style="padding:6px 0;color:#334155;">${vehicleBrand} • ${vehicleType}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;">Submitted On</td>
          <td style="padding:6px 0;color:#334155;">${submissionTime}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;">Pickup Date</td>
          <td style="padding:6px 0;color:#2563eb;font-weight:700;">${formatDate(booking.pickupDate)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;">Return Date</td>
          <td style="padding:6px 0;color:#2563eb;font-weight:700;">${formatDate(booking.returnDate)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;">Rental Duration</td>
          <td style="padding:6px 0;color:#334155;font-weight:600;">${booking.days || 1} Day(s)</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;">Pickup / Start Location</td>
          <td style="padding:6px 0;color:#334155;">${pickupLocation}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;">Destination</td>
          <td style="padding:6px 0;color:#334155;">${destination}</td>
        </tr>
        ${booking.notes ? `
        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;">Special Notes</td>
          <td style="padding:6px 0;color:#334155;font-style:italic;">${booking.notes}</td>
        </tr>` : ''}
        <tr>
          <td colspan="2" style="padding-top:12px;border-top:1px dashed #cbd5e1;"></td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#0f172a;font-weight:800;font-size:14px;">Total Amount</td>
          <td style="padding:6px 0;color:#16a34a;font-weight:800;font-size:17px;">${formatINR(booking.totalAmount)}</td>
        </tr>
      </table>
    </div>

    <!-- Call to Action -->
    <div style="text-align:center;margin:30px 0 10px;">
      <a href="${dashboardUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;letter-spacing:0.3px;box-shadow:0 4px 12px rgba(37,99,235,0.25);">
        Log In to View Your Booking →
      </a>
      <p style="margin:12px 0 0;color:#64748b;font-size:12px;">
        Need to change your reservation? Sign in to your DriveFleet account.
      </p>
    </div>
  `;

  const html = wrapInEmailLayout({
    previewText: `${subject} - Reference ${bookingId}`,
    headerTitle,
    headerSubtitle,
    contentHtml,
    footerNote: 'DriveFleet Customer Care • Dedicated 24/7 Roadside Assistance',
  });

  // Plain-text Fallback
  const text = `DRIVEFLEET — ${headerTitle.toUpperCase()}
==================================================
Booking Reference: ${bookingId}
Status: ${statusLabel}

Dear ${customerName},

${isPending
  ? `Thank you for choosing DriveFleet. Your booking request for ${vehicleName} has been successfully submitted. Your booking reference is ${bookingId}. The request is currently awaiting Fleet Manager approval. You can check the latest status from your DriveFleet account.`
  : `Thank you for choosing DriveFleet. Your booking for ${vehicleName} has been successfully confirmed. Your booking reference is ${bookingId}. You can check the latest status and manage your rental from your DriveFleet account.`}

RESERVATION DETAILS:
--------------------------------------------------
• Booking ID:          ${bookingId}
• Vehicle:             ${vehicleName}${regNo}
• Brand & Category:    ${vehicleBrand} (${vehicleType})
• Submitted On:        ${submissionTime}
• Pickup Date:         ${formatDate(booking.pickupDate)}
• Return Date:         ${formatDate(booking.returnDate)}
• Duration:            ${booking.days || 1} Day(s)
• Pickup Location:     ${pickupLocation}
• Destination:         ${destination}
${booking.notes ? `• Special Notes:       ${booking.notes}\n` : ''}• Total Amount:        ${formatINR(booking.totalAmount)}
• Booking Status:      ${statusLabel}

VIEW YOUR RESERVATION:
To view or manage your booking, visit: ${dashboardUrl}

Thank you for choosing DriveFleet!
Vehicle Rental & Fleet Management System
`;

  return { subject, html, text };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. FLEET MANAGER BOOKING EMAIL BUILDER (HTML + PLAIN TEXT)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Builds the Fleet Manager operational notification email
 */
const buildFleetManagerBookingEmail = ({ booking, vehicle, manager, customer, clientUrl = 'http://localhost:5173' }) => {
  const bookingId = booking._id?.toString() || booking.id || 'N/A';
  const managerName = manager?.name || 'Fleet Manager';
  const vehicleName = vehicle?.name || booking.vehicleName || 'Fleet Vehicle';
  const vehicleBrand = vehicle?.brand || 'DriveFleet';
  const vehicleType = vehicle?.type || booking.vehicleType || 'Vehicle';
  const regNo = vehicle?.registrationNo ? ` [Reg: ${vehicle.registrationNo}]` : '';

  const customerName = customer?.name || booking.customerName || 'Registered Customer';
  const customerEmail = customer?.email || booking.customerEmail || 'N/A';
  const customerPhone = customer?.phone || booking.customerPhone || 'N/A';
  const customerId = customer?._id?.toString() || booking.customerId || 'N/A';

  const pickupLocation = booking.pickupLocation || 'Station Bay';
  const destination = booking.destination || booking.pickupLocation || 'Return to Base';
  const submissionTime = formatSubmissionTime(booking.createdAt || booking.bookingDate);
  const statusLabel = booking.status || 'Pending';

  const subject = `New Booking Request | ${vehicleName} | ${bookingId}`;
  const headerTitle = 'A New Booking Request Requires Your Attention';
  const headerSubtitle = 'Fleet Operations Alert';

  const dashboardUrl = `${clientUrl}/dashboard`;

  const contentHtml = `
    <!-- Operations Heading -->
    <div style="margin-bottom:20px;">
      <h2 style="margin:0 0 8px;color:#0f172a;font-size:18px;font-weight:700;">
        Attention: ${managerName},
      </h2>
      <p style="margin:0;color:#334155;font-size:14px;line-height:1.6;">
        A new booking request has been submitted for <strong>${vehicleName}</strong>${regNo}. Please review the reservation schedule and take the appropriate action through your DriveFleet operations dashboard.
      </p>
    </div>

    <!-- Alert / Action Box -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;background-color:#eff6ff;border-left:4px solid #2563eb;border-radius:8px;">
          <p style="margin:0;color:#1e40af;font-size:13px;font-weight:600;line-height:1.5;">
            🔔 <strong>Action Required:</strong> Review vehicle availability, verify customer details, and update the schedule.
          </p>
        </td>
      </tr>
    </table>

    <!-- Two-Column Operational Summary -->
    <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin-bottom:24px;">
      <h3 style="margin:0 0 16px;color:#1e293b;font-size:15px;font-weight:700;border-bottom:1px solid #e2e8f0;padding-bottom:10px;">
        🚗 Booking &amp; Customer Information
      </h3>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;">
        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;width:38%;">Booking ID</td>
          <td style="padding:6px 0;color:#0f172a;font-weight:700;font-family:monospace;">${bookingId}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;">Assigned Vehicle</td>
          <td style="padding:6px 0;color:#0f172a;font-weight:700;">${vehicleName}${regNo}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;">Brand / Type</td>
          <td style="padding:6px 0;color:#334155;">${vehicleBrand} (${vehicleType})</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;">Current Status</td>
          <td style="padding:6px 0;color:#d97706;font-weight:800;">● ${statusLabel}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;">Submission Timestamp</td>
          <td style="padding:6px 0;color:#334155;">${submissionTime}</td>
        </tr>

        <!-- Customer Section Divider -->
        <tr>
          <td colspan="2" style="padding-top:10px;border-top:1px dashed #cbd5e1;"></td>
        </tr>

        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;">Customer Name</td>
          <td style="padding:6px 0;color:#0f172a;font-weight:700;">${customerName}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;">Customer ID</td>
          <td style="padding:6px 0;color:#334155;font-family:monospace;">${customerId}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;">Customer Email</td>
          <td style="padding:6px 0;color:#2563eb;font-weight:600;">${customerEmail}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;">Contact Phone</td>
          <td style="padding:6px 0;color:#334155;">${customerPhone}</td>
        </tr>

        <!-- Schedule Section Divider -->
        <tr>
          <td colspan="2" style="padding-top:10px;border-top:1px dashed #cbd5e1;"></td>
        </tr>

        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;">Pickup Date</td>
          <td style="padding:6px 0;color:#2563eb;font-weight:700;">${formatDate(booking.pickupDate)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;">Return Date</td>
          <td style="padding:6px 0;color:#2563eb;font-weight:700;">${formatDate(booking.returnDate)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;">Duration</td>
          <td style="padding:6px 0;color:#334155;font-weight:600;">${booking.days || 1} Day(s)</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;">Pickup Location</td>
          <td style="padding:6px 0;color:#334155;">${pickupLocation}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;">Destination</td>
          <td style="padding:6px 0;color:#334155;">${destination}</td>
        </tr>
        ${booking.notes ? `
        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;">Customer Notes</td>
          <td style="padding:6px 0;color:#334155;font-style:italic;">${booking.notes}</td>
        </tr>` : ''}

        <tr>
          <td colspan="2" style="padding-top:10px;border-top:1px dashed #cbd5e1;"></td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#0f172a;font-weight:800;font-size:14px;">Total Expected Revenue</td>
          <td style="padding:6px 0;color:#16a34a;font-weight:800;font-size:17px;">${formatINR(booking.totalAmount)}</td>
        </tr>
      </table>
    </div>

    <!-- Call to Action -->
    <div style="text-align:center;margin:30px 0 10px;">
      <a href="${dashboardUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#1e3a8a,#2563eb);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;letter-spacing:0.3px;box-shadow:0 4px 12px rgba(30,58,138,0.25);">
        Open Fleet Operations Dashboard →
      </a>
      <p style="margin:12px 0 0;color:#64748b;font-size:12px;">
        Sign in to review, assign technicians, or update reservation status.
      </p>
    </div>
  `;

  const html = wrapInEmailLayout({
    previewText: `${subject} - Customer: ${customerName}`,
    headerTitle,
    headerSubtitle,
    contentHtml,
    footerNote: 'DriveFleet Fleet Management & Operations Dispatch',
  });

  // Plain-text Fallback
  const text = `DRIVEFLEET OPERATIONS — NEW BOOKING REQUEST
==================================================
Booking Reference: ${bookingId}
Vehicle:           ${vehicleName}${regNo}
Status:            ${statusLabel}

Attention: ${managerName},

A new booking request has been submitted for ${vehicleName}.
Please review the booking details below and take the appropriate action through your DriveFleet account.

BOOKING & CUSTOMER DETAILS:
--------------------------------------------------
• Booking ID:          ${bookingId}
• Vehicle:             ${vehicleName}${regNo}
• Brand & Category:    ${vehicleBrand} (${vehicleType})
• Status:              ${statusLabel}
• Submitted On:        ${submissionTime}
• Customer Name:       ${customerName}
• Customer ID:         ${customerId}
• Customer Email:      ${customerEmail}
• Customer Phone:      ${customerPhone}
• Pickup Date:         ${formatDate(booking.pickupDate)}
• Return Date:         ${formatDate(booking.returnDate)}
• Duration:            ${booking.days || 1} Day(s)
• Pickup Location:     ${pickupLocation}
• Destination:         ${destination}
${booking.notes ? `• Customer Notes:      ${booking.notes}\n` : ''}• Total Amount:        ${formatINR(booking.totalAmount)}

ACTION REQUIRED:
Sign in to your DriveFleet account to review this request:
${dashboardUrl}

DriveFleet Fleet Management & Operations
`;

  return { subject, html, text };
};

// ═══════════════════════════════════════════════════════════════════════════════
// SENDING METHODS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Send email helper with safe error handling and non-blocking telemetry
 */
const sendMailRaw = async ({ to, subject, html, text }) => {
  const config = getSmtpConfig();
  const transport = getTransporter();

  if (!transport) {
    console.log(`📧 [Email] Skipped (SMTP not configured): "${subject}" → ${to}`);
    return { success: false, reason: 'Email not configured', skipped: true };
  }

  const sender = config.senderAddress || `"DriveFleet Notifications" <${config.user || 'no-reply@drivefleet.com'}>`;

  try {
    const info = await transport.sendMail({
      from: sender,
      to,
      subject,
      html,
      text,
    });

    console.log(`📧 [Email] Successfully sent: "${subject}" → ${to} (MessageID: ${info.messageId || 'mock-id'})`);
    return {
      success: true,
      messageId: info.messageId || 'delivered',
    };
  } catch (err) {
    // Safe error logging — never log passwords or credentials
    console.error(`❌ [Email] Failed to send: "${subject}" → ${to} — Error: ${err.message}`);
    return {
      success: false,
      reason: err.message,
    };
  }
};

/**
 * Sends the automatic customer booking confirmation email
 */
const sendCustomerBookingEmail = async ({ booking, vehicle, customer, clientUrl }) => {
  const recipient = customer?.email || booking?.customerEmail;
  if (!recipient) {
    console.warn('⚠️  [Email] Cannot send customer email — no email address available.');
    return { success: false, reason: 'Missing customer email' };
  }

  const { subject, html, text } = buildCustomerBookingEmail({ booking, vehicle, customer, clientUrl });
  return sendMailRaw({ to: recipient, subject, html, text });
};

/**
 * Sends the automatic fleet manager booking notification email
 */
const sendFleetManagerBookingEmail = async ({ booking, vehicle, manager, customer, clientUrl }) => {
  const recipient = manager?.email;
  if (!recipient) {
    console.warn('⚠️  [Email] Cannot send fleet manager email — no manager email address provided.');
    return { success: false, reason: 'Missing fleet manager email' };
  }

  const { subject, html, text } = buildFleetManagerBookingEmail({ booking, vehicle, manager, customer, clientUrl });
  return sendMailRaw({ to: recipient, subject, html, text });
};

/**
 * Legacy generic email sender (preserved for backward compatibility with notificationService)
 */
const sendEmail = async ({ to, subject, title, message, details, ctaText, ctaUrl }) => {
  if (!to) return { success: false, reason: 'No recipient provided' };

  const detailRows = details
    ? details
        .map(
          (d) => `
        <tr>
          <td style="padding:8px 12px;font-weight:600;color:#475569;border-bottom:1px solid #f1f5f9;width:140px;">${d.label}</td>
          <td style="padding:8px 12px;color:#1e293b;border-bottom:1px solid #f1f5f9;">${d.value}</td>
        </tr>`
        )
        .join('')
    : '';

  const contentHtml = `
    <h2 style="margin:0 0 12px;color:#1e293b;font-size:20px;font-weight:700;">${title || subject}</h2>
    <p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.6;">${message || ''}</p>
    ${detailRows ? `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;overflow:hidden;margin-bottom:24px;">${detailRows}</table>` : ''}
    ${ctaText && ctaUrl ? `<div style="text-align:center;margin-top:20px;"><a href="${ctaUrl}" style="display:inline-block;padding:12px 32px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">${ctaText}</a></div>` : ''}
  `;

  const html = wrapInEmailLayout({
    previewText: subject,
    headerTitle: title || 'DriveFleet Notification',
    contentHtml,
  });

  const text = `${title || subject}\n\n${message || ''}\n\n${details ? details.map(d => `${d.label}: ${d.value}`).join('\n') : ''}`;

  return sendMailRaw({ to, subject, html, text });
};

module.exports = {
  sendCustomerBookingEmail,
  sendFleetManagerBookingEmail,
  sendEmail,
  buildCustomerBookingEmail,
  buildFleetManagerBookingEmail,
  getSmtpConfig,
  getTransporter,
  setTestTransporter,
  resetTransporter,
};
