import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

/**
 * Clean, robust image picker for gallery selection (single or multiple).
 */
export async function pickImagesFromGallery(multiple: boolean = true): Promise<string[]> {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to photos to attach images.');
      return [];
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: multiple,
      selectionLimit: multiple ? 5 : 1,
      quality: 0.9,
      exif: false,
      base64: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return [];
    }

    return result.assets.map((a) => a.uri).filter(Boolean);
  } catch (err: unknown) {
    console.error('Gallery picker error:', err);
    const message = err instanceof Error ? err.message : 'Could not open photo gallery';
    Alert.alert('Gallery Error', message);
    return [];
  }
}

/**
 * Capture photo from device camera.
 */
export async function capturePhotoFromCamera(): Promise<string | null> {
  try {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow camera access to take a photo.');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      exif: false,
      base64: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    return result.assets[0]?.uri || null;
  } catch (err: unknown) {
    console.error('Camera error:', err);
    const message = err instanceof Error ? err.message : 'Could not take photo';
    Alert.alert('Camera Error', message);
    return null;
  }
}
