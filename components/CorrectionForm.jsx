import React, { useState } from "react";
import { View, TextInput, Button, Text, Switch, Image } from "react-native";

const CorrectionForm = ({ imageId, plantImage, onSubmitted }) => {
  const [plantName, setPlantName] = useState("");
  const [scientificName, setScientificName] = useState("");
  const [edible, setEdible] = useState(false);
  const submitCorrection = async () => {
    console.log('data',{
      imageId,
      plantName,
      scientificName,
      edible
    })
    
    try {
      const res = await fetch("http://192.168.1.9:5000/api/plants/correct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: imageId,
          plantName,
          scientificName,
          edible,
        }),
      });

      const data = await res.json();
      if (data.message) {
        alert("Correction submitted successfully!");
        onSubmitted(); // Hide form or refresh
      } else {
        alert("Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting correction.");
    }
  };

  return (
    <View style={{ marginTop: 20 }}>
      <Text>Submit Correct Plant Info:</Text>
      {plantImage && (
        <Image source={{ uri: plantImage }} style={{ width: 200, height: 200, marginBottom: 10 }} />
      )}
      <TextInput placeholder="Plant Name" value={plantName} onChangeText={setPlantName} />
      <TextInput placeholder="Scientific Name" value={scientificName} onChangeText={setScientificName} />
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text>Edible: </Text>
        <Switch value={edible} onValueChange={setEdible} />
      </View>
      <Button title="Submit Correction" onPress={submitCorrection} />
    </View>
  );
};

export default CorrectionForm;
