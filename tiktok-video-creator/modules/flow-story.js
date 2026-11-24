export function buildFlowStoryPrompts(brief, parts, seconds, script = "") {
  const outline = script || brief;
  const timeToSeconds = value => value.split(":").reduce((total, unit) => total * 60 + Number(unit), 0);
  const timedBeats = [...outline.matchAll(/^\s*(?:[-*]\s*)?\[?(\d+(?::\d{2})?)\s*s?\s*[-–—]\s*(\d+(?::\d{2})?)\s*s?\]?\s*[:：–—-]\s*(.+)$/gim)]
    .map(([, from, to, text]) => ({ from: timeToSeconds(from), to: timeToSeconds(to), text }));
  const scenes = [...outline.matchAll(/^\s*(?:[-*]\s*)?(?:#{1,6}\s*)?(?:scene|part|shot|ซีน|ฉาก)\s*\d+\s*(?:\([^\r\n]*?\))?\s*[:：–—-]\s*(.+)$/gim)].map(match => match[1]);
  const shotLine = script ? "" : outline.split("\n").find(line => line.startsWith("OMNI 10-SECOND MULTI-SHOT OVERRIDE:")) || "";
  const inlineShots = [...shotLine.matchAll(/\bShot \d+ \([^)]*\):\s*([^.!?]+)/gi)].map(match => match[1].trim());
  const paragraphs = script.trim().split(/\n\s*\n/).map(text => text.trim()).filter(Boolean);
  const beats = [scenes, inlineShots, paragraphs].find(items => items.length > 1) || [];
  const plan = Array.from({ length: parts }, (_, index) => {
    const first = Math.floor(index * beats.length / parts);
    const last = Math.floor((index + 1) * beats.length / parts);
    const start = index * seconds;
    const end = (index + 1) * seconds;
    const beat = timedBeats.length > 0
      ? timedBeats.filter(cue => cue.from < end && cue.to > start).map(cue => `${cue.from}–${cue.to}s: ${cue.text}`).join(" ")
      : beats.slice(first, last).join(" ");
    const stage = index === 0 ? "Begin the story without resolving it."
      : index === parts - 1 ? "Complete the remaining action and resolve the story once."
      : "Advance the action in order. Leave the resolution for the final part.";
    return { start, end, beat, stage };
  });
  const timeline = plan.map(({ start, end, beat, stage }) => `${start}–${end}s: ${beat || stage}`).join("\n");
  const sharedBrief = brief.split("\n").filter(line =>
    !/^(?:SPEECH TIMING:|10-SECOND CONTINUOUS DELIVERY:|OMNI 10-SECOND MULTI-SHOT OVERRIDE:)/i.test(line)).join("\n");
  return plan.map(({ start, end, beat, stage }, index) => [
    `ONE CONTINUOUS STORY, PART ${index + 1} OF ${parts}. Render only master time ${start}–${end}s as one ${seconds}-second vertical clip.`,
    index === 0 ? "Start the shared story." : "The uploaded Start frame is the exact last frame from the previous clip. Start on that frame. Preserve its character, outfit, product, scale, position, lighting, environment and camera direction. Continue the motion from that moment without a reset or cutaway.",
    `${stage} Use only the action and narration assigned to this time window. Keep the same speaker, tone and audio setup. No repeated hook, greeting, recap, line of dialogue, or new ending. If the source supplies exact dialogue, speak only the lines for this portion in their original order. Speak at a natural pace and finish this part's line before its end. Follow any no-speech direction.`,
    beat ? `THIS PART ONLY: ${beat}` : "",
    `MASTER TIMELINE FOR CONTEXT:\n${timeline}`,
    `SHARED SCRIPT AND VISUAL RULES:\n${sharedBrief}`,
    `FINAL DIRECTION: Output only Part ${index + 1}, ${start}–${end}s of the timeline. The shared brief's timing and closing beats apply to the whole story, so only render this window.`,
  ].filter(Boolean).join("\n\n"));
}

export async function generateFlowStory({ phase, prompt, imageUrl, options, onProgress, openClip, downloadClip, media, signal }) {
  const { flowStoryParts: parts, videoDuration: seconds, flowStoryScript } = options;
  const prompts = typeof prompt === "string" ? { imagePrompt: prompt, videoPrompt: prompt } : prompt;
  const story = buildFlowStoryPrompts(prompts.videoPrompt, parts, seconds, flowStoryScript);
  const openingStill = `Make one opening frame for Part 1 of a continuous story. Use only the initial setting, cast, and moment before the first action.\n\n${prompts.imagePrompt}`;
  const clipOptions = { ...options, videoCount: 1, videoRefMode: "frames", flowStorySequence: true };
  delete clipOptions.flowStoryScript;
  const clips = [];
  let result;
  let imgUrl;
  let imgTileId;
  let frame = imageUrl || options.imageUrls?.[0] || "";
  try {
    for (const [index, videoPrompt] of story.entries()) {
      signal.throwIfAborted();
      onProgress?.(`Google Flow · Generating part ${index + 1}/${parts} (${seconds}s)`);
      const combined = index === 0 && phase === "combined";
      const source = combined ? imageUrl : frame;
      const resultPhase = combined ? "combined" : "video";
      const requestOptions = combined ? clipOptions : {
        ...clipOptions, imageUrls: source ? [source] : [], noImage: !source, flowStartFrame: Boolean(source),
      };
      result = await openClip(resultPhase, combined ? { imagePrompt: openingStill, videoPrompt } : videoPrompt, source, requestOptions);
      imgUrl ||= result.imgUrl;
      imgTileId ||= result.imgTileId;
      signal.throwIfAborted();
      const blob = await downloadClip(result.resultUrl, result.flowTabId, result.mediaLabel);
      const clip = await media.openStoryClip(blob, seconds);
      clips.push(clip);
      if (index < parts - 1) frame = await media.lastStoryFrame(clip);
    }
    signal.throwIfAborted();
    onProgress?.(`Google Flow · Joining ${parts} clips into one ${parts * seconds}s MP4`);
    const resultUrl = await media.storyDataUrl(await media.joinStoryClips(clips, signal));
    signal.throwIfAborted();
    return { ...result, resultUrl, imgUrl, imgTileId, duration: parts * seconds };
  } catch (error) {
    if (imgUrl) {
      error.imgUrl ||= imgUrl;
      error.imgTileId ||= imgTileId;
    }
    if ((result?.resultUrl || result?.tileId) && !signal.aborted) error.code = "FLOW_STORY_INCOMPLETE";
    throw error;
  } finally {
    for (const clip of clips) clip.input.dispose();
  }
}
