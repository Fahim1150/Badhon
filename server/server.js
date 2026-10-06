require("dotenv").config()

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const sanitizeInput = require("./middleware/sanitizeMiddleware");

const app = express();

app.use(helmet());

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8080",
  "https://localhost",
  "https://badhon.mooo.com"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an Origin header
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

app.use(express.json());
app.use(sanitizeInput);
  
app.get("/api", (req, res) => {
  res.json({
    message: "Welcome to JU CSE!",
    project: "BADHON",
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/blood-requests", require("./routes/bloodRequestRoutes"));
app.use("/api/donors", require("./routes/donorRoutes"));
app.use("/api/patients", require("./routes/patientRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
