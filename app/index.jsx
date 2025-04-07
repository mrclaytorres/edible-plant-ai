import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, BackHandler, Animated } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import axios from "axios";
import CameraViewComponent from "../components/CameraView"; // Import the CameraView component

const PlantCamera = () => {
  const [image, setImage] = useState(null);
  
  // Animated values for fading and sliding animations
  const fadingOut = useRef(new Animated.Value(1)).current; // for fade-out animation
  const position = useRef(new Animated.Value(0)).current; // for slide-out animation

  // Handle back button press to cancel image preview
  // and return to camera view
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (image) {
          setImage(null); // Cancel image preview
          return true;     // Prevent default back behavior
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, [image]);

  const pickImage = async () => {
    console.log("Picking image from gallery...");
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!image) return;
    console.log("Uploading image...", image);
    let formData = new FormData();
    formData.append("file", {
      uri: image,
      name: "plant.jpg",
      type: "image/jpeg",
    });
    console.log("FormData:", formData);

    try {
      console.log("Sending request to server...");
      const response = await axios.post(
        "http://192.168.1.2:5000/api/plants/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log(response.data);
      alert(
        `🌿 Plant Identified: ${response.data.plant_name}\n` +
        `🔬 Scientific Name: ${response.data.scientific_name}\n` +
        `🍽️ Edible: ${response.data.edible ? "Yes" : "No"}`
      );
      // Reset image after successful upload
      cancelImagePreview();
    } catch (error) {
      console.error("Upload Error:", error);
      alert(
        `❌ Error Identifying Plant\n` +
        `Please try again or upload a clearer image.`
      );
    }
  };

  // Animation for image preview
  const cancelImagePreview = () => {
    // Fade and slide out animation
    Animated.parallel([
      Animated.timing(fadingOut, {
        toValue: 0, // Fade out
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(position, {
        toValue: 200, // Slide out of view
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setImage(null); // Reset image after animation
      fadingOut.setValue(1); // Reset fade
      position.setValue(0); // Reset position
    });
  };

  // This gets called by the child to send the image URI up
  const handleCapture = (uri) => {
    setImage(uri);
  };

  return (
    <View style={styles.container}>
      {!image ? (
        <CameraViewComponent onCapture={handleCapture} />
      ) : (
        <Animated.View
          style={[
            styles.previewContainer,
            {
              opacity: fadingOut,
              transform: [{ translateY: position }],
            },
          ]}
        >
          <Image source={{ uri: image }} style={styles.preview} />
          <TouchableOpacity onPress={cancelImagePreview} style={styles.cancelButton}>
            <Text style={styles.buttonText}>❌</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity onPress={pickImage} style={styles.button}>
          <Text style={styles.buttonText}>📁 Choose from Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={uploadImage} style={styles.button}>
          <Text style={styles.buttonText}>🌿 Identify Plant</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  previewContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontSize: 18, fontWeight: "bold" },
  preview: { width: "100%", height: 400, resizeMode: "contain" },
  actions: { flexDirection: "row", marginTop: 20 },
  button: {
    backgroundColor: "#4CAF50",
    padding: 10,
    margin: 10,
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: "transparent",
    padding: 10,
    margin: 10,
    borderRadius: 5,
  },
});

export default PlantCamera;
