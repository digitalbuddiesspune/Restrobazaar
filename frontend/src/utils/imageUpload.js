import axios from 'axios';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

/**
 * Upload an image file to AWS S3 and return the URL
 * @param {File} file - The image file to upload
 * @param {string} folder - The folder name in S3 (e.g., 'products', 'categories')
 * @param {string} token - Authentication token (optional for public uploads)
 * @returns {Promise<string>} - The URL of the uploaded image
 */
export const uploadImageToS3 = async (file, folder = 'products', token = null) => {
  try {
    // Step 1: Get signed URL from backend
    const fileName = file.name;
    const fileType = file.type;

    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.post(
      `${baseUrl}/upload-url`,
      {
        fileName,
        fileType,
        folder,
      },
      { headers }
    );

    const { uploadUrl, fileUrl } = response.data;

    // Step 2: Upload file directly to S3 using the signed URL
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': fileType,
      },
    });

    // Step 3: Return the file URL
    return fileUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error(
      error.response?.data?.message || 
      'Failed to upload image. Please try again.'
    );
  }
};
