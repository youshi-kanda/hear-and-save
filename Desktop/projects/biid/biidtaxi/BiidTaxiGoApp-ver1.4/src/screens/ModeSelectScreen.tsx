import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {GoButton, GoCard} from '../components/GoStyle';
import {GoTheme} from '../theme/GoTheme';

const {width, height} = Dimensions.get('window');

export interface ModeSelectScreenProps {
  navigation: any;
}

export const ModeSelectScreen: React.FC<ModeSelectScreenProps> = ({navigation}) => {
  const handleTaxiSelect = () => {
    // TaxiSelectionに進む前にTaxiBookingで乗車地・目的地を設定
    navigation.navigate('TaxiBooking');
  };

  const handleShipSelect = () => {
    navigation.navigate('ShipBooking');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>サービス選択</Text>
        <Text style={styles.headerSubtitle}>ご利用になるサービスを選択してください</Text>
      </View>

      {/* メインコンテンツ */}
      <View style={styles.content}>
        
        {/* タクシーカード */}
        <GoCard style={styles.serviceCard}>
          <TouchableOpacity style={styles.serviceButton} onPress={handleTaxiSelect}>
            <View style={styles.serviceIcon}>
              <Text style={styles.iconText}>🚕</Text>
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>タクシー</Text>
              <Text style={styles.serviceDescription}>
                陸上移動・空港送迎・市内観光
              </Text>
              <View style={styles.serviceFeatures}>
                <Text style={styles.featureText}>• 即時配車可能</Text>
                <Text style={styles.featureText}>• ドライバー選択</Text>
                <Text style={styles.featureText}>• リアルタイム追跡</Text>
              </View>
            </View>
            <View style={styles.arrowIcon}>
              <Text style={styles.arrow}>→</Text>
            </View>
          </TouchableOpacity>
        </GoCard>

        {/* 船舶カード */}
        <GoCard style={styles.serviceCard}>
          <TouchableOpacity style={styles.serviceButton} onPress={handleShipSelect}>
            <View style={styles.serviceIcon}>
              <Text style={styles.iconText}>🚢</Text>
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>船舶</Text>
              <Text style={styles.serviceDescription}>
                離島移動・フェリー・高速船
              </Text>
              <View style={styles.serviceFeatures}>
                <Text style={styles.featureText}>• 時刻表対応</Text>
                <Text style={styles.featureText}>• 座席予約</Text>
                <Text style={styles.featureText}>• 運行状況確認</Text>
              </View>
            </View>
            <View style={styles.arrowIcon}>
              <Text style={styles.arrow}>→</Text>
            </View>
          </TouchableOpacity>
        </GoCard>
      </View>

      {/* フッター */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← 戻る</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GoTheme.colors.background,
  },
  header: {
    paddingHorizontal: GoTheme.spacing.lg,
    paddingTop: GoTheme.spacing.xl,
    paddingBottom: GoTheme.spacing.lg,
    alignItems: 'center',
  },
  headerTitle: {
    ...GoTheme.typography.h2,
    color: GoTheme.colors.text,
    fontWeight: 'bold',
    marginBottom: GoTheme.spacing.sm,
  },
  headerSubtitle: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.textSecondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: GoTheme.spacing.lg,
    justifyContent: 'center',
  },
  serviceCard: {
    marginBottom: GoTheme.spacing.lg,
    padding: 0,
    overflow: 'hidden',
  },
  serviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: GoTheme.spacing.lg,
    minHeight: 120,
  },
  serviceIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: GoTheme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: GoTheme.spacing.md,
  },
  iconText: {
    fontSize: 28,
  },
  serviceInfo: {
    flex: 1,
    paddingRight: GoTheme.spacing.md,
  },
  serviceName: {
    ...GoTheme.typography.h3,
    color: GoTheme.colors.text,
    fontWeight: 'bold',
    marginBottom: GoTheme.spacing.xs,
  },
  serviceDescription: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.textSecondary,
    marginBottom: GoTheme.spacing.sm,
  },
  serviceFeatures: {
    marginTop: GoTheme.spacing.xs,
  },
  featureText: {
    ...GoTheme.typography.caption,
    color: GoTheme.colors.textSecondary,
    lineHeight: 16,
  },
  arrowIcon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 20,
    color: GoTheme.colors.primary,
    fontWeight: 'bold',
  },
  footer: {
    paddingHorizontal: GoTheme.spacing.lg,
    paddingBottom: GoTheme.spacing.xl,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: GoTheme.spacing.md,
  },
  backButtonText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.textSecondary,
    fontSize: 16,
  },
});