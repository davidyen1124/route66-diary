import { Pause, Play } from "lucide-react";

export default function AudioToggleIcon() {
  return (
    <span className="entry-audio-player__toggle-icons" aria-hidden="true">
      <Play className="entry-audio-player__icon entry-audio-player__icon--play" size={16} strokeWidth={2.4} />
      <Pause
        className="entry-audio-player__icon entry-audio-player__icon--pause"
        size={16}
        strokeWidth={2.4}
      />
    </span>
  );
}
