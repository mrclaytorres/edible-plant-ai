const Plant = require("../models/PlantImage");
const { spawn } = require("child_process");
const preprocessImage = require("../utils/preprocessImage");

const handleUpload = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const originalPath = req.file.path;
    // Process predection using PyThorch
    const processedImagePath = await preprocessImage(originalPath);
    const python = spawn("python3", ["predict.py", processedImagePath]);

    let result = "";
    python.stdout.on("data", (data) => {
      result += data.toString();
    });

    python.stderr.on("data", (data) => {
      console.error("Python error:", data.toString());
    });

    const predictionData = await new Promise((resolve, reject) => {
      python.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`Python process exited with code ${code}`));
        } else {
          try {
            resolve(JSON.parse(result));
          } catch (e) {
            reject(new Error("Failed to parse prediction result"));
          }
        }
      });
    });

    const plant = new Plant({
      imagePath: originalPath,
      plantName: predictionData.plant_name,
      scientificName: predictionData.scientific_name,
      identified: true,
      edible: predictionData.edible,
      uploadDate: new Date(),
    });

    await plant.save();
    res.json({
      plant_name: predictionData.plant_name,
      scientific_name: predictionData.scientific_name,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

module.exports = { handleUpload };
