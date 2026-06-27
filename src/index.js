require("dotenv").config();
const express = require("express");
const cors = require("cors");

const servicesRouter = require("./routes/services");
const applicationsRouter = require("./routes/applications");
const reviewsRouter = require("./routes/reviews");

const app = express();
const PORT = process.env.PORT || 5000;

const frontendUrl = (process.env.FRONTEND_URL || "")
  .replace(/^FRONTEND_URL=/, "")
  .replace(/\/$/, "");

const allowedOrigins = new Set([
  "http://localhost:3000",
  "https://eco-nur.vercel.app",
  "https://econur.uz",
  "https://www.econur.uz",
  ...(frontendUrl ? [frontendUrl] : []),
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, origin || frontendUrl || "http://localhost:3000");
    } else {
      callback(null, false);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ success: true, message: "Eco Nur API ishlayapti", version: "1.0.0" });
});

// Routes
app.use("/api/services", servicesRouter);
app.use("/api/applications", applicationsRouter);
app.use("/api/reviews", reviewsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route topilmadi" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Server xatosi" });
});

app.listen(PORT, () => {
  console.log(`Eco Nur backend http://localhost:${PORT} da ishlamoqda`);
});
