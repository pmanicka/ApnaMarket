import { supabase } from './supabase';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

/**
 * Compresses an image and uploads it to the Supabase listing-photos bucket.
 * Returns the public URL of the uploaded image.
 */
export async function uploadListingImage(localUri: string, userId: string): Promise<string> {
  try {
    // 1. Compress Image
    // Resize width to max 1080px, compress quality to 70%
    const manipResult = await ImageManipulator.manipulateAsync(
      localUri,
      [{ resize: { width: 1080 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    // 2. Read as base64
    const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
      encoding: 'base64',
    });

    // 3. Convert base64 to ArrayBuffer using decode
    const buffer = decode(base64);

    // 4. Generate unique filename
    const fileExt = 'jpeg';
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // 5. Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('listing-photos')
      .upload(fileName, buffer, {
        contentType: `image/${fileExt}`,
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // 6. Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from('listing-photos')
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}
