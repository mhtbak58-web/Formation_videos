import { StyleProp, ViewStyle } from "react-native";

type Props = {
  source: string;
  style?: StyleProp<ViewStyle>;
};

export function VideoPlayer({ source, style }: Props) {
  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video controls src={source} style={style as React.CSSProperties} />
  );
}
