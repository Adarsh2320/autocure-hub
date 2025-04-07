const express = require("express");
const db = require("../db"); // PostgreSQL connection
const multer = require("multer");
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Get all services
router.get("/", async (req, res) => {
  try {
    const { rows: services } = await db.query("SELECT * FROM services");
    if (services.length === 0)
      return res.status(404).json({ message: "No services found" });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: "Error fetching services", error: err.message });
  }
});

// Add a new service (with image)
router.post("/", upload.single("image"), async (req, res) => {
  const { name, price, description, manager_id } = req.body;
  const image = req.file ? req.file.buffer : null;

  try {
    const { rows } = await db.query(
      `INSERT INTO services (service_name, price, description, manager_id, image)
       VALUES ($1, $2, $3, $4, $5) RETURNING service_id`,
      [name, price, description, manager_id, image]
    );

    res.status(201).json({ message: "Service added successfully!", id: rows[0].service_id });
  } catch (err) {
    res.status(500).json({ message: "Error adding service", error: err.message });
  }
});

// Update service (with optional image)
router.put("/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { name, price, description, manager_id } = req.body;
  const image = req.file ? req.file.buffer : null;

  try {
    if (image) {
      await db.query(
        `UPDATE services 
         SET service_name=$1, price=$2, description=$3, manager_id=$4, image=$5 
         WHERE service_id=$6`,
        [name, price, description, manager_id, image, id]
      );
    } else {
      await db.query(
        `UPDATE services 
         SET service_name=$1, price=$2, description=$3, manager_id=$4 
         WHERE service_id=$5`,
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
    await db.query("DELETE FROM services WHERE service_id = $1", [id]);
    res.json({ message: "Service deleted successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting service", error: err.message });
  }
});

// Get service image
router.get("/image/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query("SELECT image FROM services WHERE service_id = $1", [id]);

    if (rows.length === 0 || !rows[0].image) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.set("Content-Type", "image/png"); // Or image/jpeg depending on your upload
    res.send(rows[0].image);
  } catch (err) {
    res.status(500).json({ message: "Error fetching image", error: err.message });
  }
});

module.exports = router;
