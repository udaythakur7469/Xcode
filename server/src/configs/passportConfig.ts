import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as CustomStrategy } from "passport-custom";
import axios from "axios";
import { Strategy as DiscordStrategy } from "passport-discord";
import prisma from "../configs/db.js";
import logger from "../configs/loggerConfig.js";

const BACKEND_URL = process.env.BACKEND_URL;

// ─── Google ───────────────────────────────────────────────────────────────────

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("No email from Google"), false);

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName,
              picture: profile.photos?.[0]?.value ?? null,
              provider: "google",
              providerId: profile.id,
            },
          });
        }

        return done(null, user);
      } catch (error) {
        logger.error("Error in Google OAuth strategy", error);
        return done(error, false);
      }
    },
  ),
);

// ─── GitHub ───────────────────────────────────────────────────────────────────

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: `${BACKEND_URL}/api/auth/github/callback`,
      scope: ["user:email"],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email =
          profile.emails?.[0]?.value ?? `${profile.username}@github.local`;

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName || profile.username,
              picture: profile.photos?.[0]?.value ?? null,
              provider: "github",
              providerId: profile.id,
            },
          });
        }

        return done(null, user);
      } catch (error) {
        logger.error("Error in GitHub OAuth strategy", error);
        return done(error, false);
      }
    },
  ),
);

// ─── LinkedIn ─────────────────────────────────────────────────────────────────

passport.use(
  "linkedin",
  new CustomStrategy(async (req: any, done: any) => {
    try {
      const code = req.query.code as string;

      if (!code) return done(new Error("No code from LinkedIn"), false);

      // Step 1 — exchange code for access token
      const tokenRes = await axios.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: `${process.env.BACKEND_URL}/api/auth/linkedin/callback`,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
      );

      const accessToken = tokenRes.data.access_token;

      // Step 2 — fetch user profile from OpenID userinfo endpoint
      const userRes = await axios.get("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const { sub, email, name, picture } = userRes.data;

      if (!email) return done(new Error("No email from LinkedIn"), false);

      let user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: name ?? null,
            picture: picture ?? null,
            provider: "linkedin",
            providerId: sub,
          },
        });
      }

      return done(null, user);
    } catch (error) {
      logger.error("Error in LinkedIn OAuth strategy", error);
      return done(error, false);
    }
  }),
);


// ─── Discord ──────────────────────────────────────────────────────────────────

passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      callbackURL: `${BACKEND_URL}/api/auth/discord/callback`,
      scope: ["identify", "email"],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.email;
        if (!email) return done(new Error("No email from Discord"), false);

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: profile.username,
              picture: profile.avatar
                ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
                : null,
              provider: "discord",
              providerId: profile.id,
            },
          });
        }

        return done(null, user);
      } catch (error) {
        logger.error("Error in Discord OAuth strategy", error);
        return done(error, false);
      }
    },
  ),
);

export default passport;
