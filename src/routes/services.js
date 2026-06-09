const express = require("express");
const router = express.Router();
const services = require("../data/services");

// GET /api/services — barcha xizmatlar
router.get("/", (req, res) => {
  const { category } = req.query;

  if (category) {
    const filtered = services.filter((s) => s.category === category);
    return res.json({ success: true, data: filtered });
  }

  res.json({ success: true, data: services });
});

// GET /api/services/:id — bitta xizmat
router.get("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const service = services.find((s) => s.id === id);

  if (!service) {
    return res.status(404).json({ success: false, message: "Xizmat topilmadi" });
  }

  res.json({ success: true, data: service });
});

module.exports = router;
