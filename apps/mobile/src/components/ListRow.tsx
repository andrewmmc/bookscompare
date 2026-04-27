import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { List } from 'react-native-paper';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface ListRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
}

export function ListRow({ icon, title, onPress }: ListRowProps) {
  return (
    <List.Item
      onPress={onPress}
      title={title}
      titleStyle={styles.title}
      left={() => (
        <View style={styles.leftIconWrap}>
          <Ionicons color={colors.accent} name={icon} size={20} />
        </View>
      )}
      right={(props) => (
        <Ionicons color={colors.inkMuted} name="chevron-forward" size={20} style={props.style} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  leftIconWrap: {
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.body,
    color: colors.ink,
  },
});
