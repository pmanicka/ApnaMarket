import { Platform } from 'react-native';
import { supabase } from './supabase';

/**
 * Compresses (native only) and uploads an image to the Supabase listing-photos bucket.
 * Returns the public URL of the uploaded image.
 *
 * On web:   ImagePicker gives a blob: URI → fetch it as a Blob → upload directly.
 * On native: use expo-image-manipulator + expo-file-system for compress + base64 upload.
 */
export async function uploadListingImage(localUri: string, userId: string): Promise<string> {
  const fileExt = 'jpeg';
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  if (Platform.OS === 'web') {
    // ── Web path ──────────────────────────────────────────────────────────────
    // expo-image-picker on web gives a blob: or data: URI — fetch it as a Blob.
    const response = await fetch(localUri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from('listing-photos')
      .upload(fileName, blob, {
        contentType: `image/${fileExt}`,
        upsert: false,
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from('listing-photos')
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } else {
    // ── Native path ───────────────────────────────────────────────────────────
    // Lazy-import native-only modules so they are never evaluated on web
    const ImageManipulator = await import('expo-image-manipulator');
    const FileSystem = await import('expo-file-system/legacy');
    const { decode } = await import('base64-arraybuffer');

    // 1. Compress: resize to max 1080px wide, 70% JPEG quality
    const manipResult = await ImageManipulator.manipulateAsync(
      localUri,
      [{ resize: { width: 1080 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    // 2. Read as base64
    const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
      encoding: 'base64',
    });

    // 3. Convert to ArrayBuffer
    const buffer = decode(base64);

    // 4. Upload
    const { data, error } = await supabase.storage
      .from('listing-photos')
      .upload(fileName, buffer, {
        contentType: `image/${fileExt}`,
        upsert: false,
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from('listing-photos')
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  }
}
