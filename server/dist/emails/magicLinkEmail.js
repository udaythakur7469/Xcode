import { wrapEmail, colors, font } from "./emailStyles.js";
export const magicLinkEmail = ({ magicLinkUrl, email, }) => {
    const body = `
    <!-- Heading -->
    <h1 style="
      margin: 0 0 8px;
      font-size: 22px;
      font-weight: 600;
      color: ${colors.textPrimary};
      font-family: ${font.family};
      letter-spacing: -0.3px;
    ">Your sign-in link</h1>

    <p style="
      margin: 0 0 28px;
      font-size: ${font.sizeBase};
      color: ${colors.textSecondary};
      font-family: ${font.family};
      line-height: ${font.lineHeight};
    ">
      We received a request to sign in to Xcode using this email address.
      Click the button below — no password needed.
    </p>

    <!-- CTA button -->
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="
          background-color: ${colors.accent};
          border-radius: 8px;
        ">
          <a href="${magicLinkUrl}" style="
            display: inline-block;
            padding: 13px 28px;
            font-size: ${font.sizeBase};
            font-weight: 600;
            color: ${colors.white};
            text-decoration: none;
            font-family: ${font.family};
            letter-spacing: 0.01em;
          ">Sign in to Xcode</a>
        </td>
      </tr>
    </table>

    <!-- Expiry notice -->
    <table cellpadding="0" cellspacing="0" border="0" style="
      background-color: ${colors.surface};
      border-radius: 8px;
      border: 1px solid ${colors.border};
      margin-bottom: 28px;
      width: 100%;
    ">
      <tr>
        <td style="padding: 12px 16px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="6" valign="top" style="padding-top: 1px;">
                <div style="
                  width: 6px;
                  height: 6px;
                  border-radius: 50%;
                  background-color: ${colors.warning};
                  margin-top: 5px;
                "></div>
              </td>
              <td style="padding-left: 10px;">
                <p style="
                  margin: 0;
                  font-size: ${font.sizeSmall};
                  color: ${colors.textSecondary};
                  font-family: ${font.family};
                  line-height: 1.6;
                ">
                  This link expires in <strong style="color:${colors.textPrimary};">15 minutes</strong>
                  and can only be used once. After it expires, simply request a new one.
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
    ">${magicLinkUrl}</p>
  `;
    return wrapEmail(body, `Your Xcode sign-in link — expires in 15 minutes`);
};
