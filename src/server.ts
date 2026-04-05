import "dotenv/config";
import app from "./app";
import { connectDB, disconnectDB } from "./config/database";

const PORT = Number(process.env.PORT) || 5000;

async function startServer(): Promise<void> {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
    console.log(`Environment : ${process.env.NODE_ENV ?? "development"}`);
  });

  // ── Graceful shutdown ───────────────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n ${signal} received — shutting down…`);
    server.close(async () => {
      await disconnectDB();
      console.log("Server closed");
      process.exit(0);
    });
    setTimeout(() => {
      console.error("Forced exit after timeout");
      process.exit(1);
    }, 10_000);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection:", reason);
    void shutdown("unhandledRejection");
  });
}

void startServer();
