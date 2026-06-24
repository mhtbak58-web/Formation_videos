import { StyleProp, ViewStyle } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";

type Props = {
  source: string;
  style?: StyleProp<ViewStyle>;
};

export function VideoPlayer({ source, style }: Props) {
  const player = useVideoPlayer(source, (instance) => {
    instance.loop = false;
  });

  return <VideoView allowsFullscreen allowsPictureInPicture player={player} style={style} />;
}
