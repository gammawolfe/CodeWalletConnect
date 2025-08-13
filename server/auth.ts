import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET must be set');
  }
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // CSRF token setup endpoint
  app.get("/api/csrf-token", (req: any, res) => {
    if (!req.session.csrfToken) {
      req.session.csrfToken = randomBytes(32).toString("hex");
    }
    res.json({ csrfToken: req.session.csrfToken });
  });

  function requireCsrf(req: any, res: any, next: any) {
    const headerToken = req.headers["x-csrf-token"] as string | undefined;
    const sessionToken = req.session?.csrfToken as string | undefined;
    if (!sessionToken) {
      return res.status(403).json({ message: "CSRF token not initialized" });
    }
    if (!headerToken || headerToken !== sessionToken) {
      return res.status(403).json({ message: "Invalid CSRF token" });
    }
    next();
  }

  passport.use(
    new LocalStrategy(
      { usernameField: 'email' }, // Use email instead of username
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: 'Invalid credentials' });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", requireCsrf, async (req, res, next) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const usernameExists = await storage.getUserByUsername(validatedData.username);
      if (usernameExists) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        ...validatedData,
        password: await hashPassword(validatedData.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt
        });
      });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.post("/api/login", requireCsrf, (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || 'Authentication failed' });
      }
      
      req.login(user, (err: any) => {
        if (err) return next(err);
        res.json({
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", requireCsrf, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json({
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      createdAt: req.user.createdAt
    });
  });
}

// Middleware to require authentication
export function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}

// Middleware for API key authentication
export function requireApiKey(req: any, res: any, next: any) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ message: 'API key required' });
  }

  // In a real implementation, validate the API key against a database
  // For now, just check against environment variable
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ message: 'Invalid API key' });
  }

  next();
}
