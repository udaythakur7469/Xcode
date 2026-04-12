import { wrapEmail, colors, font } from "./emailStyles.js";

interface PasswordResetSuccessEmailOptions {
  name: string | null;
}

export const passwordResetSuccessEmail = ({ name }: PasswordResetSuccessEmailOptions): string => {
  const greeting = name ? `Hi ${name},` : "Hi,";

  const now = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

  const body = `
    <!-- Success icon -->
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="
          background-color: #eaf3de;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          text-align: center;
          vertical-align: middle;
        ">
          <span style="
            font-size: 22px;
            line-height: 48px;
            display: block;
          ">&#10003;</span>
        </td>
      </tr>
    </table>

    <!-- Heading -->
    <h1 style="
      margin: 0 0 8px;
      font-size: 22px;
      font-weight: 600;
      color: ${colors.textPrimary};
      font-family: ${font.family};
      letter-spacing: -0.3px;
    ">Password updated</h1>

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
      Your Xcode account password was successfully changed. You can now sign in
      with your new password.
    </p>

    <!-- Event summary card -->
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
            margin: 0 0 12px;
            font-size: ${font.sizeSmall};
            font-weight: 600;
            color: ${colors.textPrimary};
            font-family: ${font.family};
          ">Change details</p>

          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="
                font-size: ${font.sizeSmall};
                color: ${colors.textMuted};
                font-family: ${font.family};
                padding-bottom: 6px;
                width: 90px;
              ">Action</td>
              <td style="
                font-size: ${font.sizeSmall};
                color: ${colors.textPrimary};
                font-family: ${font.family};
                padding-bottom: 6px;
                font-weight: 500;
              ">Password reset</td>
            </tr>
            <tr>
              <td style="
                font-size: ${font.sizeSmall};
                color: ${colors.textMuted};
                font-family: ${font.family};
                padding-bottom: 6px;
              ">Time</td>
              <td style="
                font-size: ${font.sizeSmall};
                color: ${colors.textPrimary};
                font-family: ${font.family};
                padding-bottom: 6px;
              ">${now} IST</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Security warning -->
    <table cellpadding="0" cellspacing="0" border="0" style="
      background-color: #fff5f5;
      border-radius: 8px;
      border: 1px solid #ffd0d0;
      margin-bottom: 8px;
      width: 100%;
    ">
      <tr>
        <td style="padding: 14px 16px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="6" valign="top" style="padding-top:3px;">
                <div style="width:6px;height:6px;border-radius:50%;background-color:${colors.accent};margin-top:3px;"></div>
              </td>
              <td style="padding-left:10px;">
                <p style="
                  margin: 0;
                  font-size: ${font.sizeSmall};
                  color: #a32d2d;
                  font-family: ${font.family};
                  line-height: 1.6;
                ">
                  <strong>Didn't do this?</strong> Your account may be compromised.
                  Contact support immediately or reset your password again.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  return wrapEmail(body, `Your Xcode password has been changed`);
};