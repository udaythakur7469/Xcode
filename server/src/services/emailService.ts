import { MailtrapClient } from "mailtrap";

const mailtrap = new MailtrapClient({
  token: process.env.MAILTRAP_TOKEN!,
  testInboxId: Number(process.env.MAILTRAP_INBOX_ID),
});

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
): Promise<void> => {
  await mailtrap.testing.send({
    from: { email: "hello@demomailtrap.com", name: "Xcode" },
    to: [{ email: to }],
    subject,
    html,
  });
};
