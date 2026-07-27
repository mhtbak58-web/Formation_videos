import { StyleProp, ViewStyle } from "react-native";

type Props = {
  source: string;
  style?: StyleProp<ViewStyle>;
};

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function VideoPlayer({ source, style }: Props) {
  const youtubeId = extractYouTubeId(source);

  if (youtubeId) {
    return (
      <iframe
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        src={`https://www.youtube.com/embed/${youtubeId}`}
        style={{ border: "none", ...(style as React.CSSProperties) }}
        title="video"
      />
    );
  }

  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video controls src={source} style={style as React.CSSProperties} />
  );
}
