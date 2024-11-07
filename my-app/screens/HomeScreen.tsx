import React, { useState, useEffect } from 'react';
import { View, Button, Image, Alert, FlatList, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME; 
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

// Configuração do Axios para autenticação com Admin API
const axiosInstance = axios.create({
  baseURL: `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image`,
  headers: {
    'Authorization': `Basic ${btoa(`${API_KEY}:${API_SECRET}`)}`,
  }
});

export default function HomeScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<{ url: string; public_id: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Função para buscar as imagens do Cloudinary
  const fetchImages = async () => {
    try {
      const response = await axios.get(`https://cors-anywhere.herokuapp.com/https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image/list`, {
        params: { max_results: 20 },
        headers: {
          'Authorization': `Basic ${btoa(`${API_KEY}:${API_SECRET}`)}`,
        },
      });

      console.log('Responda da API:', response.data); // Log da resposta da API

      const images = response.data.resources.map((image) => ({
        url: image.secure_url,
        public_id: image.public_id,
      }));

      console.log('Imagens:', images); // Verifique o que está sendo extraído para renderização

      setUploadedImages(images);
    } catch (error) {
      console.error('Erro ao buscar imagens:', error);
      Alert.alert('Erro', 'Não foi possível carregar as imagens');
    }
  };

  useEffect(() => {
    fetchImages(); // Coleta as imagens ao carregar o componente
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) {
      Alert.alert('Nenhuma imagem selecionada');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('file', selectedImage);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const imageUrl = response.data.secure_url; // URL já inclui a versão
      const publicId = response.data.public_id;
      setUploadedImages([{ url: imageUrl, public_id: publicId }, ...uploadedImages]);
      setSelectedImage(null);
      fetchImages(); // Recarrega as imagens após o upload
    } catch (error) {
      console.error('Erro ao fazer upload para o Cloudinary:', error);
      Alert.alert('Erro', 'Não foi possível fazer upload da imagem');
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (public_id: string) => {
    try {
      const response = await axiosInstance.delete('/destroy', {
        data: {
          public_id: public_id, // ID da imagem que será excluída
        },
      });

      if (response.data.result === 'ok') {
        setUploadedImages(uploadedImages.filter((img) => img.public_id !== public_id));
      } else {
        Alert.alert('Erro', 'Não foi possível excluir a imagem');
      }
    } catch (error) {
      console.error('Erro ao excluir imagem:', error);
      Alert.alert('Erro', 'Erro ao excluir a imagem');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>Escolher Imagem</Text>
      </TouchableOpacity>

      {selectedImage && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
          <TouchableOpacity style={styles.button} onPress={uploadImage} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Enviar</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={uploadedImages}
        keyExtractor={(item) => item.public_id}
        renderItem={({ item }) => (
          <View style={styles.uploadedImageContainer}>
            <Image source={{ uri: item.url }} style={styles.uploadedImage} />
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteImage(item.public_id)}
            >
              <Text style={styles.deleteButtonText}>Excluir</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  selectedImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginVertical: 10,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  uploadedImageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 5,
    paddingHorizontal: 10,
  },
  uploadedImage: {
    width: 80,
    height: 80,
    resizeMode: 'cover',
    borderRadius: 5,
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: '#f44336',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
