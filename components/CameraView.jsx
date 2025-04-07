import React, { useState, useRef } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const CameraViewComponent = ({onCapture}) => {
  const cameraRef = useRef(null);
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();

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
      onCapture(photo.uri);
    }
  };

  return (
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
  );
}

const styles = StyleSheet.create({
  camera: { flex: 1, width: "100%" },
  buttonContainer: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 20,
    alignItems: "center",
  },
  captureButton: { backgroundColor: "#fff", padding: 15, borderRadius: 50 },
  buttonText: { fontSize: 18, fontWeight: "bold" },
  button: {
    backgroundColor: "#4CAF50",
    padding: 10,
    margin: 10,
    borderRadius: 5,
  },
});

export default CameraViewComponent;