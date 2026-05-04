import { wrapEmail, colors, font } from "./emailStyles.js";

interface SharedChatEmailOptions {
  shareUrl: string;
  chatTitle?: string | null;
}

export const sharedChatEmail = ({
  shareUrl,
  chatTitle,
}: SharedChatEmailOptions): string => {
  const displayTitle = chatTitle?.trim() || "a Nova AI chat";

  const body = `
    <!-- Heading -->
    <h1 style="
      margin: 0 0 8px;
      font-size: 22px;
      font-weight: 600;
      color: ${colors.textPrimary};
      font-family: ${font.family};
      letter-spacing: -0.3px;
    ">Someone shared a chat with you</h1>

    <p style="
      margin: 0 0 28px;
      font-size: ${font.sizeBase};
      color: ${colors.textSecondary};
      font-family: ${font.family};
      line-height: ${font.lineHeight};
    ">
      You've been sent a link to ${displayTitle} on Nova AI.
      Click the button below to open and read the full conversation.
    </p>

    <!-- CTA button -->
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="
          background-color: ${colors.accent};
          border-radius: 8px;
        ">
          <a href="${shareUrl}" style="
            display: inline-block;
            padding: 13px 28px;
            font-size: ${font.sizeBase};
            font-weight: 600;
            color: ${colors.white};
            text-decoration: none;
            font-family: ${font.family};
            letter-spacing: 0.01em;
          ">View Chat</a>
        </td>
      </tr>
    </table>

    <!-- Chat info card -->
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
          ">Shared content</p>

          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="
                font-size: ${font.sizeSmall};
                color: ${colors.textMuted};
                font-family: ${font.family};
                padding-bottom: 6px;
                width: 80px;
              ">Title</td>
              <td style="
                font-size: ${font.sizeSmall};
                color: ${colors.textPrimary};
                font-family: ${font.family};
                padding-bottom: 6px;
                font-weight: 500;
              ">${displayTitle}</td>
            </tr>
            <tr>
              <td style="
                font-size: ${font.sizeSmall};
                color: ${colors.textMuted};
                font-family: ${font.family};
                padding-bottom: 6px;
              ">Platform</td>
              <td style="
                font-size: ${font.sizeSmall};
                color: ${colors.textPrimary};
                font-family: ${font.family};
                padding-bottom: 6px;
              ">Nova AI</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Info notice -->
    <table cellpadding="0" cellspacing="0" border="0" style="
      background-color: ${colors.surface};
      border-radius: 8px;
      border: 1px solid ${colors.border};
      margin-bottom: 8px;
      width: 100%;
    ">
      <tr>
        <td style="padding: 14px 16px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="6" valign="top" style="padding-top: 3px;">
                <div style="
                  width: 6px;
                  height: 6px;
                  border-radius: 50%;
                  background-color: ${colors.warning};
                  margin-top: 4px;
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
                  This is a read-only snapshot. You can also
                  <strong style="color: ${colors.textPrimary};">fork this chat</strong>
                  to continue the conversation in your own Nova AI account.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Raw link fallback -->
    <p style="
      margin: 16px 0 6px;
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
    ">${shareUrl}</p>
  `;

  return wrapEmail(body, `Someone shared a Nova AI chat with you`);
};