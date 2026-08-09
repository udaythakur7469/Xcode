import { wrapEmail, colors, font } from "./emailStyles.js";

interface ContestReminderEmailOptions {
  contestTitle: string;
  contestUrl: string;
  timeUntilStartLabel: string; // e.g. "1 hour", "24 hours", "30 minutes"
  startTimeLabel: string; // human-readable, e.g. "Sunday, Aug 3 at 8:00 PM"
}

export const contestReminderEmail = ({
  contestTitle,
  contestUrl,
  timeUntilStartLabel,
  startTimeLabel,
}: ContestReminderEmailOptions): string => {
  const body = `
    <!-- Heading -->
    <h1 style="
      margin: 0 0 8px;
      font-size: 22px;
      font-weight: 600;
      color: ${colors.textPrimary};
      font-family: ${font.family};
      letter-spacing: -0.3px;
    ">Starts in ${timeUntilStartLabel}</h1>

    <p style="
      margin: 0 0 28px;
      font-size: ${font.sizeBase};
      color: ${colors.textSecondary};
      font-family: ${font.family};
      line-height: ${font.lineHeight};
    ">
      You're registered for <strong style="color:${colors.textPrimary};">${contestTitle}</strong>,
      starting ${startTimeLabel}. Head over a few minutes early to get settled in.
    </p>

    <!-- CTA button -->
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="
          background-color: ${colors.accent};
          border-radius: 8px;
        ">
          <a href="${contestUrl}" style="
            display: inline-block;
            padding: 13px 28px;
            font-size: ${font.sizeBase};
            font-weight: 600;
            color: ${colors.white};
            text-decoration: none;
            font-family: ${font.family};
            letter-spacing: 0.01em;
          ">Open ${contestTitle}</a>
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
    ">${contestUrl}</p>
  `;

  return wrapEmail(body, `${contestTitle} starts in ${timeUntilStartLabel}`);
};
