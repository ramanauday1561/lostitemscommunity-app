import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, shadow, spacing } from '@/theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export type TabItem = { name: string; icon: IconName; label: string };

/**
 * Typed structurally rather than from @react-navigation/bottom-tabs, which
 * is not a dependency of this project - expo-router carries its own
 * navigator. Only the two fields this bar reads are declared.
 */
type NavigatorProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: never) => void };
};

/**
 * The prototype's bottom nav, transcribed from its own style objects
 * rather than approximated:
 *
 *   wrapper  padding 8 / 16 / 24
 *   bar      row, gap 2, #fff, radius 28, padding 6
 *   pill     flex 1, minWidth 0, minHeight 52, radius 16, gap 3,
 *            padding 0 4, overflow hidden
 *   active   fill #F2F2F0 (the canvas colour), icon and label #0B6BCB,
 *            label goes from 600 to 700
 *   idle     #9A9EA4
 *   icon     23    label  10
 *   centre   52x52, radius 20, margin 0 2 - inline in the row, not raised
 *
 * This is a custom bar rather than React Navigation's because that one
 * sizes its icon slot to the icon and adds its own padding, top-aligned:
 * tabBarItemStyle cannot reach far enough in to place a 52pt pill on the
 * bar's axis, which is what left the row misaligned before.
 */
export function TabBar({
  state,
  navigation,
  items,
  fabRoute,
}: NavigatorProps & { items: TabItem[]; fabRoute?: string }) {
  const activeName = state.routes[state.index]?.name;
  // The centre action sits between the two halves of the row.
  const fabAt = fabRoute ? Math.ceil(items.length / 2) : -1;

  return (
    <View style={s.wrap} pointerEvents="box-none">
      <View style={s.bar}>
        {items.map((item, i) => {
          const focused = item.name === activeName;
          const tint = focused ? colors.primary : colors.tabIdle;
          return (
            <React.Fragment key={item.name}>
              {i === fabAt && (
                <Pressable
                  style={s.fab}
                  onPress={() => navigation.navigate(fabRoute as never)}
                  accessibilityRole="button"
                  accessibilityLabel="Report an item"
                >
                  <Ionicons name="add" size={27} color={colors.white} />
                </Pressable>
              )}
              <Pressable
                style={[s.pill, focused && s.pillActive]}
                onPress={() => navigation.navigate(item.name as never)}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={item.label}
              >
                <Ionicons name={item.icon} size={23} color={tint} />
                <Text
                  style={[s.label, { color: tint }, focused && s.labelActive]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </Pressable>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: 24,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    padding: 6,
    borderRadius: radius.hero,
    backgroundColor: colors.card,
    ...shadow.floating,
  },
  pill: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 4,
    borderRadius: 16,
  },
  pillActive: { backgroundColor: colors.bg },
  // flexShrink: 0 keeps the label at its natural width. numberOfLines
  // compiles to -webkit-line-clamp on web, whose box collapses under flex
  // shrink when nothing gives it a definite width, ellipsising labels that
  // had room; the pill's overflow does the clipping instead.
  label: { fontFamily: font.semibold, fontSize: 10, letterSpacing: 0.1, flexShrink: 0 },
  labelActive: { fontFamily: font.bold, color: colors.primary },
  fab: {
    width: 52,
    height: 52,
    marginHorizontal: 2,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.85,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
});
