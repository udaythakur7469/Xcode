// Shared inline style constants for all Xcode transactional emails.
// Email clients strip external CSS — everything must be inline.
// Color palette sourced from globals.css light theme.
export const colors = {
    background: "#ffffff",
    surface: "#f2f2f5",
    border: "#e6e6e6",
    textPrimary: "#1c1c1e",
    textSecondary: "#74747b",
    textMuted: "#a3a3b3",
    accent: "#e63946", // --destructive from globals.css
    accentHover: "#c0392b",
    success: "#27ae60",
    warning: "#f0ad4e",
    white: "#ffffff",
};
export const font = {
    family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    sizeBase: "14px",
    sizeSmall: "12px",
    sizeTiny: "11px",
    lineHeight: "1.7",
};
// Wraps every email in a consistent outer shell with header + footer
export const wrapEmail = (bodyHtml, previewText = "") => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <title>Xcode</title>
</head>
<body style="
  margin: 0;
  padding: 0;
  background-color: ${colors.surface};
  font-family: ${font.family};
  -webkit-font-smoothing: antialiased;
">

  ${previewText ? `<span style="display:none;max-height:0;overflow:hidden;">${previewText}</span>` : ""}

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${colors.surface};">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <!-- Email card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
          max-width: 520px;
          background-color: ${colors.background};
          border-radius: 12px;
          border: 1px solid ${colors.border};
          overflow: hidden;
        ">

          <!-- Header bar -->
          <tr>
            <td style="
              background-color: ${colors.textPrimary};
              padding: 20px 32px;
            ">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <!-- Logo mark -->
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="
                          background-color: ${colors.accent};
                          border-radius: 6px;
                          width: 28px;
                          height: 28px;
                          text-align: center;
                          vertical-align: middle;
                          padding: 0 6px;
                        ">
                          <span style="
                            color: ${colors.white};
                            font-size: 13px;
                            font-weight: 700;
                            font-family: ${font.family};
                            letter-spacing: -0.5px;
                          ">&lt;/&gt;</span>
                        </td>
                        <td style="padding-left: 10px;">
                          <span style="
                            color: ${colors.white};
                            font-size: 16px;
                            font-weight: 600;
                            font-family: ${font.family};
                            letter-spacing: 0.08em;
                          ">XCODE</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 32px 28px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="
              border-top: 1px solid ${colors.border};
              padding: 20px 32px;
              background-color: ${colors.surface};
            ">
              <p style="
                margin: 0 0 4px;
                font-size: ${font.sizeTiny};
                color: ${colors.textMuted};
                font-family: ${font.family};
                line-height: 1.6;
              ">
                You received this email because an action was taken on your Xcode account.
                If this wasn't you, you can safely ignore this email.
              </p>
              <p style="
                margin: 0;
                font-size: ${font.sizeTiny};
                color: ${colors.textMuted};
                font-family: ${font.family};
              ">
                &copy; ${new Date().getFullYear()} Xcode. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
        <!-- End email card -->

      </td>
    </tr>
  </table>

</body>
</html>
`;
