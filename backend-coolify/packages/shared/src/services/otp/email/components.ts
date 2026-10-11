import { getEmailOtpVariables } from "../variables";

type AppInfo = ReturnType<typeof getEmailOtpVariables>["appInfo"];

/**
 * Renders the global layout container wrapper for email templates.
 */
export function EmailLayout({ content }: { content: string }): string {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Confirm Verification Code</title>
    <style>
      body {
        margin: 0;
        padding: 20px 0;
        background-color: transparent;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      .container-card {
        background-color: #f7f8fb;
        border-radius: 16px;
        padding: 0;
        max-width: 600px;
        box-sizing: border-box;
        width: 100%;
        margin: 0 auto;
        overflow: hidden;
      }

       .content-container {
        padding: 0 30px 30px 30px;
        box-sizing: border-box;
      }

      /* Header Container */
      .header-container {
        display: block;
        background:rgb(18, 23, 47);
        padding: 36px;
        margin-bottom: 24px;
      }

       /* Branding logo */
      .brand-logo {
        display: block;
        border: 0;
        height: 44px;
        width: auto;
      }

      /* Typography */
      .heading-title {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
        color: #28303c;
        letter-spacing: -0.3px;
      }
      .text-body {
        font-size: 15px;
        line-height: 24px;
        color: #28303c;
      }
    
      .bold {
       font-weight:600
      }

      /* Spacing Helpers */
      .p-40 { padding: 40px; }
      .pb-16 { padding-bottom: 16px; }
      .pb-20 { padding-bottom: 20px; }
      .pb-24 { padding-bottom: 24px; }
      .pb-28 { padding-bottom: 28px; }
      .pb-32 { padding-bottom: 32px; }
      .pt-16 { padding-top: 16px; }
      .pt-24 { padding-top: 24px; }
      .pt-40 { padding-top: 40px; }
      .mb-32 { margin-bottom: 32px; }

      /* Single Box OTP Container */
      .otp-digit-box {
        display: inline-block;
        width: -webkit-fill-available;
        padding: 14px 28px;
        border-radius: 12px;
        text-align: center;
        font-size: 28px;
        font-weight: 700;
        letter-spacing: 6px;
        color: #0a0e17;
        background-color: #e7e9ee;
      }

      /* Action Button */
      .btn-primary {
        display: inline-block;
        padding: 12px 28px;
        font-size: 16px;
        font-weight: 500;
        color: #ffffff!important;
        background-color: #5865F2;
        text-decoration: none;
        border-radius: 500px;
      }

      /* App Download Badges */
      .store-badge {
        display: inline-block;
        border: 0;
        height: 46px;
        width: auto;
        border-radius: 8px;
        background-color: #111213;
        padding: 4px;
        margin-right: 10px;
        vertical-align: middle;
      }

      /* Footer Links, Social Icons & Credits */
      .footer-container {
        border-top: 1px solid #e5e7eb;
        font-size: 13px;
        line-height: 20px;
        color: #6b7280;
      }
      .footer-link-primary {
        color: #5865F2;
        text-decoration: none;
      }
      .footer-link-underline {
        color: #5865F2;
        text-decoration: underline;
      }
      .social-link {
        text-decoration: none;
      }
      .social-icon {
        display: inline-block;
        border: 0;
        width: 20px;
        height: 20px;
        margin-right: 16px;
        vertical-align: middle;
      }
      .footer-copyright {
        font-size: 14px;
        color: #6b7280;
      }
    </style>
  </head>
   <body>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" class="container-card">
      ${content}
    </table>
  </body>
</html>
  `;
}

/**
 * Renders the top brand header logo section.
 */
export function EmailHeader({ appInfo }: { appInfo: AppInfo }): string {
  return `
    <tr>
      <td class="header-container mb-32" align="center">
        <img src="${appInfo.logoUrl}" alt="${appInfo.appName}" class="brand-logo" />
      </td>
    </tr>
  `;
}

/**
 * Renders full verification code string inside a single unified container box.
 */
export function OtpDigitsBox({ code }: { code: string }): string {
  return `
    <tr>
      <td class="pb-28" align="left">
        <div class="otp-digit-box">${code}</div>
      </td>
    </tr>
  `;
}

/**
 * Renders a primary action button link.
 */
export function EmailButton({
  label,
  url,
}: {
  label: string;
  url: string;
}): string {
  return `
    <tr>
      <td class="pb-32" align="left">
        <a href="${url}" target="_blank" class="btn-primary">
          ${label}
        </a>
      </td>
    </tr>
  `;
}

/**
 * Renders Play Store and App Store application download badges.
 */
export function AppStoreBadges({ appInfo }: { appInfo: AppInfo }): string {
  return `
    <tr>
      <td class="text-body pb-16" align="left">
        Download our app for Mobile App from Google Play &amp; App Store.
      </td>
    </tr>
    <tr>
      <td class="pb-32" align="left">
        <a href="${appInfo.playStoreUrl}" target="_blank">
          <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" class="store-badge" />
        </a>
        <a href="${appInfo.appStoreUrl}" target="_blank">
          <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="Download on the App Store" class="store-badge" />
        </a>
      </td>
    </tr>
  `;
}

/**
 * Renders social media links, support email contacts, and copyright information.
 */
export function EmailFooter({ appInfo }: { appInfo: AppInfo }): string {
  return `
    <tr>
      <td class="footer-container pt-24" align="left">
        <div class="pb-20">
          <a href="${appInfo.facebookUrl}" target="_blank" class="social-link">
            <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" class="social-icon" />
          </a>
          <a href="${appInfo.twitterUrl}" target="_blank" class="social-link">
            <img src="https://cdn-icons-png.flaticon.com/512/5969/5969020.png" alt="X" class="social-icon" />
          </a>
          <a href="${appInfo.instagramUrl}" target="_blank" class="social-link">
            <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" class="social-icon" />
          </a>
          <a href="${appInfo.linkedinUrl}" target="_blank" class="social-link">
            <img src="https://cdn-icons-png.flaticon.com/512/3536/3536505.png" alt="LinkedIn" class="social-icon" />
          </a>
        </div>

        Contact us at <a href="mailto:${appInfo.supportEmail}" class="footer-link-primary">${appInfo.supportEmail}</a>.
        Don't want any more emails from ${appInfo.appName}?
        <a href="${appInfo.unsubscribeUrl}" class="footer-link-underline">Unsubscribe</a>.
      </td>
    </tr>
    <tr>
      <td class="footer-copyright pt-16" align="left">&copy; ${appInfo.appName} ${appInfo.currentYear}.</td>
    </tr>
  `;
}
