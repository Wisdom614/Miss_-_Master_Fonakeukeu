export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
  formData.append('cloud_name', import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export const getCloudinaryImage = (publicId, options = {}) => {
  const { width, height, crop = 'fill', quality = 'auto' } = options;
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  
  if (!publicId) return null;
  
  let url = `https://res.cloudinary.com/${cloudName}/image/upload`;
  
  if (width || height) {
    url += `/c_${crop}`;
    if (width) url += `,w_${width}`;
    if (height) url += `,h_${height}`;
    url += `/q_${quality}`;
  }
  
  url += `/${publicId}`;
  return url;
};