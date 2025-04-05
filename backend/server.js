const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const plantRoutes = require("./routes/plantRoutes");
const app = express();

const corsOptions = {
  origin: '*', // allow all origins
  methods: ['GET', 'POST', 'OPTIONS'], // allow GET, POST, and OPTIONS
};

app.use(cors(corsOptions));
app.use(express.json());
app.use("/api/plants", plantRoutes);

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/plantAI", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"));

app.listen(5000, '0.0.0.0', () => console.log("Server running on port 5000"));