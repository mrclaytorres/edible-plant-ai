const Plant = require("../models/PlantImage");
require('dotenv').config();

const handleCorrection = async (req, res) => {
  const { id, plantName, scientificName, edible } = req.body;

  try {
    const plant = await Plant.findById(id);
    if (!plant) return res.status(404).json({error: "Image not found"});

    plant.correctedLabel = {
        plantName,
        scientificName,
        edible,
        confirmed: true
    }

    await plant.save();
    res.json({
      plant_name: predictionData.plant_name,
      scientific_name: predictionData.scientific_name,
      edible: predictionData.edible,
      message: "Correction submitted successfully"
    });
  } catch (error) {
    console.error("Correction error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

module.exports = { handleCorrection };
