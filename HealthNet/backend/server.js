const express = require("express");
const cors = require("cors");

const env = require("./src/config/env");
const connectDatabase = require("./src/db");
const authRouter = require("./src/routes/auth");
const adminRouter = require("./src/routes/admin");
const hospitalAuthRoutes = require("./src/routes/hospitalAuthRoutes");
const hospitalAdminRouter = require("./src/routes/hospitalAdmin");
const staffAuthRoutes = require("./src/routes/staffAuthRoutes");
const doctorDashboardRoutes = require("./src/routes/doctorDashboard");
const receptionistRoutes = require("./src/routes/receptionist");
const patientRoutes = require("./src/routes/patient");
const aiRouter = require("./src/routes/ai");
const paymentRouter = require("./src/routes/payment");
const { ensureSystemAdmin } = require("./src/utils/bootstrapAdmin");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/auth/hospital", hospitalAuthRoutes);
app.use("/api/hospital-admin", hospitalAdminRouter);
app.use("/api/staff-auth", staffAuthRoutes);
app.use("/api/doctor", doctorDashboardRoutes);
app.use("/api/receptionist", receptionistRoutes);
app.use("/api", patientRoutes);
app.use("/api/ai", aiRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/department-resources", require("./src/routes/departmentResourcesRoute"));

app.get("/api/health", async (_req, res) => {
  const mongoose = require("mongoose");
  const dbConnected = mongoose.connection.readyState === 1;

  return res.json({
    status: "ok",
    message: "HealthNet API is running",
    database: {
      status: dbConnected ? "connected" : "disconnected",
      name: dbConnected ? mongoose.connection.name : null,
    },
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);

  // Provide friendly upload errors for multipart/resource CSV flows.
  if (err?.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, message: "Uploaded file is too large." });
    }
    return res.status(400).json({ success: false, message: err.message || "File upload failed." });
  }

  return res.status(500).json({ success: false, message: `Server error: ${err.message}` });
});

const start = async () => {
  try {
    await connectDatabase();
    await ensureSystemAdmin();
    const server = app.listen(env.port, "0.0.0.0", () => {
      console.log(`HealthNet Backend running on http://127.0.0.1:${env.port}`);
      
      // Automatically start the Flask Python backend
      try {
        const { spawn } = require("child_process");
        const path = require("path");
        const pythonScript = path.join(__dirname, "src", "app.py");
        console.log(`[HealthNet] Auto-starting Flask backend: python "${pythonScript}"`);
        
        const flaskProcess = spawn("python", [pythonScript], {
          stdio: "inherit",
          shell: true
        });
        
        flaskProcess.on("error", (err) => {
          console.error("[HealthNet] Failed to auto-start Flask backend. Make sure Python is in your PATH:", err.message);
        });
        
        process.on("exit", () => {
          flaskProcess.kill();
        });
      } catch (e) {
        console.error("[HealthNet] Error starting Flask backend process:", e.message);
      }
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`[HealthNet] Port ${env.port} is already in use. Stop the running instance or change PORT in backend/.env.`);
        process.exit(1);
      }
      console.error("Server failed to start:", error.message);
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to start backend:", error.message);
    process.exit(1);
  }
};

start();
