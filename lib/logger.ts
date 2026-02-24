type LogMeta = Record<string, unknown>;

function write(level: "INFO" | "WARN" | "ERROR", message: string, meta?: LogMeta) {
  const timestamp = new Date().toISOString();
  if (meta) {
    console[level === "ERROR" ? "error" : level === "WARN" ? "warn" : "log"](
      `[${timestamp}] [${level}] ${message}`,
      meta,
    );
    return;
  }

  console[level === "ERROR" ? "error" : level === "WARN" ? "warn" : "log"](
    `[${timestamp}] [${level}] ${message}`,
  );
}

export const logger = {
  info: (message: string, meta?: LogMeta) => write("INFO", message, meta),
  warn: (message: string, meta?: LogMeta) => write("WARN", message, meta),
  error: (message: string, meta?: LogMeta) => write("ERROR", message, meta),
};
