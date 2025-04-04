const express = require("express");
const db = require("../db");
const multer = require("multer"); // For handling file uploads
const router = express.Router();

// Configure multer to handle file uploads
const storage = multer.memoryStorage(); // Stores the file in memory as a Buffer
const upload = multer({ storage: storage });

// Get all services
router.get("/", async (req, res) => {
  try {
    const [services] = await db.query("SELECT * FROM services");
    if (services.length === 0) return res.status(404).json({ message: "No services found" });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: "Error fetching services", error: err.message });
  }
});

// Add a new service (with image)
router.post("/", upload.single("image"), async (req, res) => {
  const { name, price, description, manager_id } = req.body;
  const image = req.file ? req.file.buffer : null; // Convert image to buffer

  try {
    const [result] = await db.query(
      "INSERT INTO services (service_name, price, description, manager_id, image) VALUES (?, ?, ?, ?, ?)",
      [name, price, description, manager_id, image]
    );
    res.status(201).json({ message: "Service added successfully!", id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: "Error adding service", error: err.message });
  }
});

// Update service (with optional image update)
router.put("/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { name, price, description, manager_id } = req.body;
  const image = req.file ? req.file.buffer : null;

  try {
    if (image) {
      await db.query(
        "UPDATE services SET service_name=?, price=?, description=?, manager_id=?, image=? WHERE service_id=?",
        [name, price, description, manager_id, image, id]
      );
    } else {
      await db.query(
        "UPDATE services SET service_name=?, price=?, description=?, manager_id=? WHERE service_id=?",
        [name, price, description, manager_id, id]
      );
    }

    res.json({ message: "Service updated successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Error updating service", error: err.message });
  }
});

// Delete a service
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM services WHERE service_id=?", [id]);
    res.json({ message: "Service deleted successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting service", error: err.message });
  }
});

// Get service image
router.get("/image/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT image FROM services WHERE service_id=?", [id]);
    
    if (rows.length === 0 || !rows[0].image) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.set("Content-Type", "image/png"); // Adjust content type if needed
    res.send(rows[0].image);
  } catch (err) {
    res.status(500).json({ message: "Error fetching image", error: err.message });
  }
});

module.exports = router;
