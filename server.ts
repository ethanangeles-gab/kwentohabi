import dotenv from "dotenv";
dotenv.config({ path: [".env.local", ".env"] });
if (process.argv.includes("--production")) process.env.NODE_ENV = "production";
// Load environment before modules that read server configuration.
await import("./server/app");
