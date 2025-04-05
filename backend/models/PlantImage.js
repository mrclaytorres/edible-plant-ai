const mongoose = require("mongoose");

const PlantImageSchema = new mongoose.Schema({
  imagePath: String,
  uploadDate: { type: Date, default: Date.now },
  plantName: String, // optional
  identified: { type: Boolean, default: false },
});

module.exports = mongoose.model("PlantImage", PlantImageSchema);
