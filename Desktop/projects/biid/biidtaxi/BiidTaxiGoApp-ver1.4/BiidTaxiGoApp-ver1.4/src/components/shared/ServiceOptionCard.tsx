import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {GoTheme} from '../../theme/GoTheme';

export interface ServiceOptionCardProps {
  type?: string;
  name: string;
  description: string;
  price?: string;
  eta?: string;
  onSelect: () => void;
  selected: boolean;
}

export const ServiceOptionCard: React.FC<ServiceOptionCardProps> = ({
  name,
  description,
  price,
  eta,
  onSelect,
  selected,
}) => (
  <TouchableOpacity
    style={[styles.optionCard, selected && styles.optionCardSelected]}
    onPress={onSelect}
    accessibilityRole="button"
    accessibilityLabel={`${name}, ${description}${price ? `, 料金: ${price}` : ''}${eta ? `, 到着時間: ${eta}` : ''}`}
    accessibilityState={{selected}}>
    <View style={styles.optionInfo}>
      <Text style={styles.optionName}>{name}</Text>
      <Text style={styles.optionDescription}>{description}</Text>
    </View>
    {(price || eta) && (
      <View style={styles.optionPrice}>
        {price && <Text style={styles.priceAmount}>{price}</Text>}
        {eta && <Text style={styles.etaText}>{eta}</Text>}
      </View>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: GoTheme.colors.surface,
    borderRadius: GoTheme.borderRadius.md,
    padding: GoTheme.spacing.md,
    marginVertical: GoTheme.spacing.xs,
    borderWidth: 1,
    borderColor: GoTheme.colors.border,
    ...GoTheme.shadows.small,
  },
  optionCardSelected: {
    borderColor: GoTheme.colors.primary,
    backgroundColor: GoTheme.colors.primaryLight + '10',
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    ...GoTheme.typography.h3,
    color: GoTheme.colors.text,
    marginBottom: 4,
  },
  optionDescription: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.textSecondary,
  },
  optionPrice: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    ...GoTheme.typography.h3,
    color: GoTheme.colors.text,
    fontWeight: 'bold',
  },
  etaText: {
    ...GoTheme.typography.caption,
    color: GoTheme.colors.textSecondary,
    marginTop: 2,
  },
});