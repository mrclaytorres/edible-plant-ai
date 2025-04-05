const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

// Setup multer for file storage
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Upload image route
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const imagePath = req.file.path;
    // Save metadata to MongoDB if needed
    console.log("Image uploaded:", imagePath);
    res.status(200).json({ message: "Image uploaded", imagePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;