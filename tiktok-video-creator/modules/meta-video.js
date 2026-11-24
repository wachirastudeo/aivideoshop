// Read the MP4 headers directly, including codecs Chrome cannot preview.
export function readMp4VideoMetadata(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (offset) => String.fromCharCode(...bytes.subarray(offset, offset + 4));
  function* boxes(start, end) {
    for (let offset = start; offset + 8 <= end;) {
      const type = tag(offset + 4);
      let size = view.getUint32(offset);
      let header = 8;
      if (size === 1 && offset + 16 <= end) {
        size = Number(view.getBigUint64(offset + 8));
        header = 16;
      } else if (size === 0) {
        size = end - offset;
      }
      if (size < header || size > end - offset) throw new Error('Invalid MP4 box size');
      yield { type, start: offset + header, end: offset + size };
      offset += size;
    }
  }
  const children = (box) => box ? [...boxes(box.start, box.end)] : [];
  const root = [...boxes(0, bytes.length)];
  const movie = children(root.find(box => box.type === 'moov'));
  const hasMedia = root.some(box => box.type === 'mdat' && box.end > box.start);
  const movieHeader = movie.find(box => box.type === 'mvhd');
  if (!hasMedia || !movieHeader) throw new Error('Missing MP4 movie or video data');
  const isVersion1 = bytes[movieHeader.start] === 1;
  const timescaleOffset = movieHeader.start + (isVersion1 ? 20 : 12);
  if (timescaleOffset + (isVersion1 ? 12 : 8) > movieHeader.end) throw new Error('Invalid MP4 movie header');
  const timescale = view.getUint32(timescaleOffset);

  for (const track of movie.filter(box => box.type === 'trak')) {
    const entries = children(track);
    const handler = children(entries.find(box => box.type === 'mdia')).find(box => box.type === 'hdlr');
    if (!handler || handler.end - handler.start < 12 || tag(handler.start + 8) !== 'vide') continue;
    const header = entries.find(box => box.type === 'tkhd');
    if (!header) continue;
    const longTrack = bytes[header.start] === 1;
    const durationOffset = header.start + (longTrack ? 28 : 20);
    if (header.end - header.start < (longTrack ? 96 : 84)) throw new Error('Invalid MP4 video track header');
    const trackDuration = longTrack ? Number(view.getBigUint64(durationOffset)) : view.getUint32(durationOffset);
    return {
      duration: trackDuration / timescale,
      width: view.getUint32(header.end - 8) / 65536,
      height: view.getUint32(header.end - 4) / 65536,
    };
  }
  throw new Error('Missing MP4 video track');
}
