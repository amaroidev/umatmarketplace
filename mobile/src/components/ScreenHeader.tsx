import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

interface ScreenHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

const ScreenHeader = ({ eyebrow, title, subtitle }: ScreenHeaderProps) => {
  return (
    <View style={styles.wrap}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#f4ecdd',
  },
  eyebrow: {
    fontSize: 10,
    color: '#7c6f60',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    fontWeight: '800',
  },
  title: {
    marginTop: 4,
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 4,
    color: '#7b6f61',
    fontSize: 13,
    lineHeight: 18,
  },
});

export default ScreenHeader;
