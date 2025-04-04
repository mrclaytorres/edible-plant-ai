import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, BackHandler, Animated } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from 'expo-image-picker';
import axios from "axios";

const PlantCamera = () => {
  const [image, setImage] = useState(null);
  const cameraRef = useRef(null);
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();

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

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setImage(photo.uri);
    }
  };

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

    let formData = new FormData();
    formData.append("file", {
      uri: image,
      name: "plant.jpg",
      type: "image/jpeg",
    });

    try {
      const response = await axios.post(
        "https://your-backend-url.com/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      alert(`Plant Identified: ${response.data.plant_name}`);
    } catch (error) {
      console.error("Upload Error:", error);
      alert("Error identifying plant.");
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

  return (
    <View style={styles.container}>
      {!image ? (
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={takePicture} style={styles.captureButton}>
              <Text style={styles.buttonText}>📸</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
              <Text style={styles.text}>Flip Camera</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
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
          <TouchableOpacity onPress={() => setImage(null)} style={styles.cancelButton}>
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
  camera: { flex: 1, width: "100%" },
  buttonContainer: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 20,
    alignItems: "center",
  },
  previewContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  captureButton: { backgroundColor: "#fff", padding: 15, borderRadius: 50 },
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
