const Plant = require('../models/PlantImage');

const handleUpload = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const imagePath = req.file.path;

  // TODO: AI processing / TensorFlow Lite later
  const fakePrediction = 'Bamboo';

  const plant = new Plant({
    imagePath,
    plantName: fakePrediction,
    uploadDate: new Date(),
  });

  await plant.save();
  res.json({ plant_name: fakePrediction });
};

module.exports = { handleUpload };