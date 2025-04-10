const path = require("path");
const Plant = require("../models/PlantImage");
const { spawn } = require("child_process");
require("dotenv").config();

const handleCorrection = async (req, res) => {
  const { id, plantName, scientificName, edible } = req.body;

  try {
    const plant = await Plant.findById(id);
    if (!plant) return res.status(404).json({ error: "Image not found" });

    plant.correctedLabel = {
      plantName,
      scientificName,
      edible,
      confirmed: true,
    };

    await plant.save();

    // Use path.resolve to make sure this is absolute and OS-safe
    const correctionScriptPath = path.resolve(__dirname, "../../ai/retrain.py");

    const python = spawn(process.env.PYTHONPATH, [correctionScriptPath]);

    python.stdout.on("data", (data) =>
      console.log("Retrain:", data.toString())
    );
    python.stderr.on("data", (data) =>
      console.error("Retrain Error:", data.toString())
    );

    python.on("close", (code) => {
      if (code === 0) console.log("Model retrained successfully");
    });

    res.json({
      plant_name: predictionData.plant_name,
      scientific_name: predictionData.scientific_name,
      edible: predictionData.edible,
      message: "Correction submitted successfully",
    });
    
  } catch (error) {
    console.error("Correction error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

module.exports = { handleCorrection };
