import sharp from 'sharp';

// Generate thumbnail from image buffer
export async function generateThumbnail(
  imageBuffer: Buffer,
  width: number = 300,
  height: number = 300,
  quality: number = 80
): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(width, height, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality })
    .toBuffer();
}

// Generate multiple thumbnail sizes
export async function generateThumbnailSizes(imageBuffer: Buffer) {
  const sizes = [
    { name: 'small', width: 150, height: 150 },
    { name: 'medium', width: 300, height: 300 },
    { name: 'large', width: 600, height: 600 },
  ];
  
  const thumbnails: { [key: string]: Buffer } = {};
  
  for (const size of sizes) {
    thumbnails[size.name] = await generateThumbnail(
      imageBuffer,
      size.width,
      size.height
    );
  }
  
  return thumbnails;
}

// Extract image metadata
export async function extractImageMetadata(imageBuffer: Buffer) {
  const metadata = await sharp(imageBuffer).metadata();
  
  return {
    format: metadata.format,
    width: metadata.width,
    height: metadata.height,
    channels: metadata.channels,
    density: metadata.density,
    hasProfile: !!metadata.icc,
    hasAlpha: metadata.hasAlpha,
    orientation: metadata.orientation,
    size: imageBuffer.length,
  };
}

// Optimize image for web
export async function optimizeImageForWeb(
  imageBuffer: Buffer,
  maxWidth: number = 1920,
  quality: number = 85
): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(maxWidth, undefined, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality, progressive: true })
    .toBuffer();
}

// Convert image to different format
export async function convertImageFormat(
  imageBuffer: Buffer,
  format: 'jpeg' | 'png' | 'webp',
  options?: any
): Promise<Buffer> {
  const processor = sharp(imageBuffer);
  
  switch (format) {
    case 'jpeg':
      return processor.jpeg(options || { quality: 85 }).toBuffer();
    case 'png':
      return processor.png(options || { compressionLevel: 6 }).toBuffer();
    case 'webp':
      return processor.webp(options || { quality: 85 }).toBuffer();
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}