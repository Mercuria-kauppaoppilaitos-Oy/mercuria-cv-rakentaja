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

// A fixed synthetic JPEG with the same colored regions, usable in the PDF tests.
writeFileSync(new URL('cropped-photo.jpg', import.meta.url), Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCABAAEADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDj6KKK/az++Ar0OvPK9Dry8d9n5/ofw/8ASY/5k/8A3H/9whRRRXln8PhRRRQB55RRRX1B/uAFeh155XodeXjvs/P9D+H/AKTH/Mn/AO4//uEKKKK8s/h8KKKKAPPKKKK+oP8AcAK9DrzyvQ68vHfZ+f6H8P8A0mP+ZP8A9x//AHCFFFFeWfw+FFFFAHnlFFFfUH+4AV6HXnleh15eO+z8/wBD+H/pMf8AMn/7j/8AuEKKKK8s/h8KKKKAP//Z', 'base64'));
