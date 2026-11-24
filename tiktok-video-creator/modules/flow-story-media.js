import {
  ALL_FORMATS, AudioBufferSource, BlobSource, BufferTarget, CanvasSource,
  EncodedAudioPacketSource, EncodedPacketSink, EncodedVideoPacketSource,
  Input, Mp4OutputFormat, Output, VideoSampleSink,
} from "../assets/vendor/mediabunny.mjs";

export async function openStoryClip(blob, seconds) {
  const input = new Input({ source: new BlobSource(blob), formats: ALL_FORMATS });
  try {
    const video = await input.getPrimaryVideoTrack();
    if (!video) throw new Error("Flow returned a file without a video track");
    const [start, end, width, height, audio] = await Promise.all([
      video.getFirstTimestamp(), video.computeDuration(), video.getDisplayWidth(), video.getDisplayHeight(), input.getPrimaryAudioTrack(),
    ]);
    if (!Number.isFinite(end - start) || Math.abs(end - start - seconds) > .26 || Math.abs(width / height - 9 / 16) > .03) {
      throw new Error(`Flow returned ${width}×${height}, ${(end - start).toFixed(2)}s. Expected a vertical ${seconds}s clip.`);
    }
    return { input, blob, video, audio, start, end, width, height, seconds };
  } catch (error) {
    input.dispose();
    throw error;
  }
}

export function storyDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function lastStoryFrame({ video, width, height }) {
  const sample = await new VideoSampleSink(video).getSample(Infinity);
  if (!sample) throw new Error("Could not read the last frame of the Flow clip");
  const canvas = new OffscreenCanvas(width, height);
  try {
    sample.draw(canvas.getContext("2d"), 0, 0, width, height);
    return await storyDataUrl(await canvas.convertToBlob({ type: "image/png" }));
  } finally {
    sample.close();
  }
}

function describeConfig(config) {
  if (!config) return "";
  const { description, ...fields } = config;
  const bytes = description && (ArrayBuffer.isView(description)
    ? new Uint8Array(description.buffer, description.byteOffset, description.byteLength)
    : new Uint8Array(description));
  return JSON.stringify([fields, bytes ? Array.from(bytes) : []]);
}

function createMp4() {
  return new Output({ format: new Mp4OutputFormat({ fastStart: "in-memory" }), target: new BufferTarget() });
}

export async function joinStoryClips(clips, signal) {
  const videoConfigs = await Promise.all(clips.map(clip => clip.video.getDecoderConfig()));
  const audioConfigs = await Promise.all(clips.map(clip => clip.audio?.getDecoderConfig()));
  const hasAudio = clips.some(clip => clip.audio);
  const compatible = videoConfigs[0]?.codec?.startsWith("avc1.") && clips.every((clip, index) =>
    describeConfig(videoConfigs[index]) === describeConfig(videoConfigs[0])
    && (!hasAudio || audioConfigs[index]?.codec === "mp4a.40.2" && describeConfig(audioConfigs[index]) === describeConfig(audioConfigs[0]))
    && Math.abs(clip.end - clip.start - clip.seconds) < .003);
  const joined = compatible
    ? await copyStoryTracks(clips, videoConfigs[0], audioConfigs[0], signal)
    : await encodeStoryTracks(clips, hasAudio, signal);
  const result = new Blob([joined.target.buffer], { type: "video/mp4" });
  const expected = clips.reduce((duration, clip) => duration + clip.seconds, 0);
  const verified = await openStoryClip(result, expected);
  try {
    if (Math.abs(verified.end - verified.start - expected) > .05) throw new Error(`Joined video did not finish at ${expected}s`);
    return result;
  } finally {
    verified.input.dispose();
  }
}

async function copyStoryTracks(clips, videoConfig, audioConfig, signal) {
  const output = createMp4();
  const videoSource = new EncodedVideoPacketSource("avc");
  const audioSource = audioConfig ? new EncodedAudioPacketSource("aac") : null;
  output.addVideoTrack(videoSource, { rotation: await clips[0].video.getRotation() });
  if (audioSource) output.addAudioTrack(audioSource);
  await output.start();
  try {
    let offset = 0;
    for (const clip of clips) {
      const videoEnd = clip.end - clip.start;
      const copyTrack = async (track, source, decoderConfig, start, end) => {
        if (!track) return;
        let first = true;
        for await (const packet of new EncodedPacketSink(track).packets()) {
          signal.throwIfAborted();
          const time = packet.timestamp - start;
          if (time < 0 || time >= end) continue;
          await source.add(packet.clone({ timestamp: offset + time, duration: Math.min(packet.duration, end - time) }), first ? { decoderConfig } : undefined);
          first = false;
        }
      };
      await Promise.all([
        copyTrack(clip.video, videoSource, videoConfig, clip.start, videoEnd),
        copyTrack(clip.audio, audioSource, audioConfig, clip.start, videoEnd),
      ]);
      offset += videoEnd;
    }
    videoSource.close();
    audioSource?.close();
    await output.finalize();
    return output;
  } catch (error) {
    await output.cancel();
    throw error;
  }
}

async function encodeStoryTracks(clips, hasAudio, signal) {
  const output = createMp4();
  const canvas = new OffscreenCanvas(720, 1280);
  const context = canvas.getContext("2d");
  const video = new CanvasSource(canvas, { codec: "avc", bitrate: 5_000_000 });
  const audio = hasAudio ? new AudioBufferSource({ codec: "aac", bitrate: 128_000 }) : null;
  const audioContext = audio ? new OfflineAudioContext(2, 1, 48000) : null;
  output.addVideoTrack(video);
  if (audio) output.addAudioTrack(audio);
  await output.start();
  try {
    let offset = 0;
    for (const clip of clips) {
      const scale = clip.seconds / (clip.end - clip.start);
      const writeFrames = async () => {
        for await (const frame of new VideoSampleSink(clip.video).samples(clip.start, clip.end)) {
          try {
            signal.throwIfAborted();
            frame.draw(context, 0, 0, canvas.width, canvas.height);
            await video.add(offset + (frame.timestamp - clip.start) * scale, frame.duration * scale);
          } finally {
            frame.close();
          }
        }
      };
      const writeAudio = async () => {
        if (!audio) return;
        const buffer = audioContext.createBuffer(2, clip.seconds * 48000, 48000);
        if (clip.audio) {
          const decoded = await audioContext.decodeAudioData(await clip.blob.arrayBuffer());
          for (let channel = 0; channel < 2; channel++) {
            buffer.copyToChannel(decoded.getChannelData(Math.min(channel, decoded.numberOfChannels - 1)).subarray(0, buffer.length), channel);
          }
        }
        signal.throwIfAborted();
        await audio.add(buffer);
      };
      await Promise.all([writeFrames(), writeAudio()]);
      offset += clip.seconds;
    }
    video.close();
    audio?.close();
    await output.finalize();
    return output;
  } catch (error) {
    await output.cancel();
    throw error;
  }
}
