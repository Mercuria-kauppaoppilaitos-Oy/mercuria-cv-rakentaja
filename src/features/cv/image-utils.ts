export const maxOriginalImageBytes = 5 * 1024 * 1024;
export const maxProcessedImageBytes = 400 * 1024;
const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];

export function validateImageFile(file: File): void {
  if (!acceptedTypes.includes(file.type)) throw new Error('Valitse JPEG-, PNG- tai WebP-kuva.');
  if (file.size > maxOriginalImageBytes) throw new Error('Kuva on liian suuri. Enimmäiskoko on 5 Mt.');
  if (file.size === 0) throw new Error('Kuvatiedosto on tyhjä tai rikkinäinen.');
}
async function verifySignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const matches = file.type === 'image/jpeg' ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    : file.type === 'image/png' ? [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte)
    : String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  if (!matches) throw new Error('Kuvatiedosto on rikkinäinen tai sen sisältö ei vastaa tiedostotyyppiä.');
}
export async function processPhoto(file: File): Promise<string> {
  validateImageFile(file);
  await verifySignature(file);
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw new Error('Kuvaa ei voitu avata. Valitse ehjä JPEG-, PNG- tai WebP-kuva.'); }
  try {
    if (!bitmap.width || !bitmap.height) throw new Error('Kuva on rikkinäinen.');
    const crop = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = Math.min(512, crop);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Selain ei tue kuvan käsittelyä.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, (bitmap.width - crop) / 2, (bitmap.height - crop) / 2, crop, crop, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.88, 0.75, 0.6, 0.45]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
      if (blob && blob.size <= maxProcessedImageBytes) {
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Kuvaa ei voitu lukea.'));
          reader.readAsDataURL(blob);
        });
      }
    }
    throw new Error('Kuvaa ei voitu pienentää riittävästi. Valitse toinen kuva.');
  } finally { bitmap.close(); }
}
