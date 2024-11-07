import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, Image, Text, View } from 'react-native';

const CLOUD_NAME = 'dlv0huexi';
const UPLOAD_PRESET = 'ml_default';
const API_KEY = '521287911183471';
const API_SECRET = 'wTsGBA23-CJNBtq3GnRdSsT-IdI';

export default function HomeScreen() {
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);

  // Função para listar as imagens na pasta "Home"
  console.log('Cloud name:', CLOUD_NAME);
  console.log('API Key:', API_KEY);
  console.log('API Secret:', API_SECRET);

  const listImages = async () => {
    try {
      const response = await fetch(`https://cors-anywhere.herokuapp.com/https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image/folder/Home`, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${btoa(`${API_KEY}:${API_SECRET}`)}`
        },
      });
      const result = await response.json();
      if (result.resources) {
        setUploadedImages(result.resources.map((resource) => resource.secure_url));
      } else {
        Alert.alert("Failed to fetch images");
      }
    } catch (error) {
      console.error("Error listing images:", error);
      Alert.alert("An error occurred while fetching images.");
    }
  };

  useEffect(() => {
    listImages();
  }, []);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access gallery is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage({ uri: result.assets[0].uri });
    }
  };

  const uploadImage = async () => {
    if (!image) {
      Alert.alert("Please select an image first");
      return;
    }

    setUploading(true);

    try {
      const response = await fetch(image.uri);
      const blob = await response.blob();

      const data = new FormData();
      data.append('file', blob, 'upload.jpg');
      data.append('upload_preset', UPLOAD_PRESET);
      data.append('folder', 'Home');

      const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: data,
      });
      const result = await cloudinaryResponse.json();

      if (result.secure_url) {
        setUploadedImages((prevImages) => [...prevImages, result.secure_url]);
        setImage(null);
        Alert.alert("Upload Successful");
      } else {
        Alert.alert("Upload Failed", "Please try again.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      {image && <Image source={{ uri: image.uri }} style={{ width: 200, height: 200, marginBottom: 20 }} />}
      <Button title="Pick an Image" onPress={pickImage} />
      <Button title="Upload Image" onPress={uploadImage} disabled={uploading} />
      {uploading && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />}

      {uploadedImages.length > 0 && (
        <View style={{ marginTop: 20, width: '100%' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Uploaded Images:</Text>
          <FlatList
            data={uploadedImages}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={{ marginTop: 10, alignItems: 'center' }}>
                <Image source={{ uri: item }} style={{ width: 100, height: 100, marginBottom: 10 }} />
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}
