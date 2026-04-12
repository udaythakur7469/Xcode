import { wrapEmail, colors, font } from "./emailStyles.js";
export const forgotPasswordEmail = ({ resetUrl, name, }) => {
    const greeting = name ? `Hi ${name},` : "Hi,";
    const body = `
    <!-- Heading -->
    <h1 style="
      margin: 0 0 8px;
      font-size: 22px;
      font-weight: 600;
      color: ${colors.textPrimary};
      font-family: ${font.family};
      letter-spacing: -0.3px;
    ">Reset your password</h1>

    <p style="
      margin: 0 0 20px;
      font-size: ${font.sizeBase};
      color: ${colors.textSecondary};
      font-family: ${font.family};
      line-height: ${font.lineHeight};
    ">${greeting}</p>

    <p style="
      margin: 0 0 28px;
      font-size: ${font.sizeBase};
      color: ${colors.textSecondary};
      font-family: ${font.family};
      line-height: ${font.lineHeight};
    ">
      We received a request to reset the password for your Xcode account.
      Click the button below to choose a new password.
    </p>

    <!-- CTA button -->
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="
          background-color: ${colors.accent};
          border-radius: 8px;
        ">
          <a href="${resetUrl}" style="
            display: inline-block;
            padding: 13px 28px;
            font-size: ${font.sizeBase};
            font-weight: 600;
            color: ${colors.white};
            text-decoration: none;
            font-family: ${font.family};
            letter-spacing: 0.01em;
          ">Reset my password</a>
        </td>
      </tr>
    </table>

    <!-- Expiry + security notice -->
    <table cellpadding="0" cellspacing="0" border="0" style="
      background-color: ${colors.surface};
      border-radius: 8px;
      border: 1px solid ${colors.border};
      margin-bottom: 28px;
      width: 100%;
    ">
      <tr>
        <td style="padding: 16px;">
          <p style="
            margin: 0 0 10px;
            font-size: ${font.sizeSmall};
            font-weight: 600;
            color: ${colors.textPrimary};
            font-family: ${font.family};
          ">Important</p>

          <!-- Row 1 -->
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:8px;">
            <tr>
              <td width="6" valign="top" style="padding-top:4px;">
                <div style="width:5px;height:5px;border-radius:50%;background-color:${colors.warning};"></div>
              </td>
              <td style="padding-left:10px;">
                <p style="margin:0;font-size:${font.sizeSmall};color:${colors.textSecondary};font-family:${font.family};line-height:1.6;">
                  This link expires in <strong style="color:${colors.textPrimary};">30 minutes</strong>.
                </p>
              </td>
            </tr>
          </table>

          <!-- Row 2 -->
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:8px;">
            <tr>
              <td width="6" valign="top" style="padding-top:4px;">
                <div style="width:5px;height:5px;border-radius:50%;background-color:${colors.warning};"></div>
              </td>
              <td style="padding-left:10px;">
                <p style="margin:0;font-size:${font.sizeSmall};color:${colors.textSecondary};font-family:${font.family};line-height:1.6;">
                  It can only be used <strong style="color:${colors.textPrimary};">once</strong>.
                  After reset, the link becomes invalid immediately.
                </p>
              </td>
            </tr>
          </table>

          <!-- Row 3 -->
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="6" valign="top" style="padding-top:4px;">
                <div style="width:5px;height:5px;border-radius:50%;background-color:${colors.accent};"></div>
              </td>
              <td style="padding-left:10px;">
                <p style="margin:0;font-size:${font.sizeSmall};color:${colors.textSecondary};font-family:${font.family};line-height:1.6;">
                  If you didn't request this, <strong style="color:${colors.textPrimary};">ignore this email</strong> —
                  your password will not change.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Raw link fallback -->
    <p style="
      margin: 0 0 6px;
      font-size: ${font.sizeTiny};
      color: ${colors.textMuted};
      font-family: ${font.family};
    ">If the button doesn't work, copy this link into your browser:</p>
    <p style="
      margin: 0;
      font-size: ${font.sizeTiny};
      color: ${colors.accent};
      font-family: monospace;
      word-break: break-all;
      background-color: ${colors.surface};
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid ${colors.border};
    ">${resetUrl}</p>
  `;
    return wrapEmail(body, `Reset your Xcode password — link expires in 30 minutes`);
};
