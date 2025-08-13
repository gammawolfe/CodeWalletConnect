import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "../db";

const PostgresSessionStore = connectPg(session);

export const sessionStore = new PostgresSessionStore({
  pool,
  createTableIfMissing: true,
});


