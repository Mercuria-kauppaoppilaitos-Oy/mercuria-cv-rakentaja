// A small synthetic PNG, with no personal information or metadata.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
function chunk(type, data) {
  const bytes = Buffer.concat([Buffer.from(type), data]);
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([length, bytes, checksum]);
}
const header = Buffer.alloc(13); header.writeUInt32BE(192); header.writeUInt32BE(64, 4); header[8] = 8; header[9] = 2;
const pixels = Buffer.alloc(64 * (1 + 192 * 3));
for (let y = 0; y < 64; y++) for (let x = 0; x < 192; x++) {
  const index = y * 577 + 1 + x * 3;
  pixels[index] = x < 24 ? 240 : 30; pixels[index + 1] = x < 24 ? 30 : 180; pixels[index + 2] = 180;
}
writeFileSync(new URL('photo.png', import.meta.url), Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]));
