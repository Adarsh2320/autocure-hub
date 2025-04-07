const express = require("express");
const db = require("../db");
const multer = require("multer");

const router = express.Router();

// Configure Multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Get all gallery images
router.get("/", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT id, image_data FROM gallery");

    const images = rows.map(row => ({
      id: row.id,
      image: `data:image/jpeg;base64,${row.image_data.toString("base64")}`
    }));

    res.json(images);
  } catch (error) {
    res.status(500).json({ message: "Error fetching gallery images", error: error.message });
  }
});

// Add a new gallery image (limit to 30)
router.post("/", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Image file is required" });
  }

  try {
    const { rows } = await db.query("SELECT COUNT(*) AS total FROM gallery");
    if (parseInt(rows[0].total) >= 30) {
      return res.status(403).json({ message: "Gallery can only contain up to 30 images" });
    }

    await db.query("INSERT INTO gallery (image_data) VALUES ($1)", [req.file.buffer]);

    res.status(201).json({ message: "Image added successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error adding image", error: error.message });
  }
});

// Update an existing gallery image
router.put("/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: "Image file is required" });
  }

  try {
    const result = await db.query(
      "UPDATE gallery SET image_data = $1 WHERE id = $2",
      [req.file.buffer, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.json({ message: "Image updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating image", error: error.message });
  }
});

// Delete a gallery image by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query("DELETE FROM gallery WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting image", error: error.message });
  }
});

module.exports = router;
