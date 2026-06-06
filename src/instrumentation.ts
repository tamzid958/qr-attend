export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const cron = await import("node-cron")
    const { runMarkAbsent } = await import("@/lib/cron/mark-absent")
    cron.schedule("0 * * * *", () => {
      void runMarkAbsent()
    })
  }
}
