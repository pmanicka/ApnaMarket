import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface ImagePickerGridProps {
  images: string[]; // local URIs
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImagePickerGrid({ images, onChange, maxImages = 6 }: ImagePickerGridProps) {
  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      Alert.alert('Limit reached', `You can only upload up to ${maxImages} images.`);
      return;
    }

    // Launch picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      quality: 0.8, // Initial quality, will compress later
    });

    if (!result.canceled) {
      const newUris = result.assets.map((asset) => asset.uri);
      // Combine with existing, ensuring we don't exceed maxImages
      const combined = [...images, ...newUris].slice(0, maxImages);
      onChange(combined);
    }
  };

  const removeImage = (indexToRemove: number) => {
    const updated = images.filter((_, index) => index !== indexToRemove);
    onChange(updated);
  };

  return (
    <View style={styles.container}>
      {images.map((uri, index) => (
        <View key={`${uri}-${index}`} style={styles.imageWrapper}>
          <Image source={{ uri }} style={styles.image} />
          <TouchableOpacity 
            style={styles.deleteBtn}
            onPress={() => removeImage(index)}
          >
            <Text style={styles.deleteBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      {images.length < maxImages && (
        <TouchableOpacity style={styles.addButton} onPress={pickImage}>
          <Text style={styles.addIcon}>+</Text>
          <Text style={styles.addText}>Add Photo</Text>
          <Text style={styles.addLimit}>({images.length}/{maxImages})</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  deleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  addButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#2D2D44',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    color: '#FF6B35',
    fontSize: 24,
    fontWeight: '300',
  },
  addText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  addLimit: {
    color: '#6B7280',
    fontSize: 10,
    marginTop: 2,
  },
});
