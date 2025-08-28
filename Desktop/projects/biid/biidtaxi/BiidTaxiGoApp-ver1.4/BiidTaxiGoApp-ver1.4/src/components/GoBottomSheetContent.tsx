import React, {useState, useMemo, useCallback, memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ViewStyle,
  ScrollView,
} from 'react-native';
import {BottomSheetState} from './GoThreeStageBottomSheet';
import {GoTheme} from '../theme/GoTheme';

export interface GoBottomSheetContentProps {
  state: BottomSheetState;
  style?: ViewStyle;
  currentLocation?: {
    address: string;
  };
  onNextPress?: () => void;
}

// GO仕様: 候補データ（メモ化）
const RECENT_DESTINATIONS = [
  {
    id: '1',
    emoji: '🏢',
    title: '東京オフィス',
    address: '東京都千代田区丸の内1-1-1',
    distance: '2.3km'
  },
  {
    id: '2',
    emoji: '🛍️',
    title: '銀座ショッピングモール',
    address: '東京都中央区銀座4-6-16',
    distance: '1.8km'
  },
  {
    id: '3',
    emoji: '🍽️',
    title: 'レストラン山田',
    address: '東京都港区六本木3-2-1',
    distance: '3.1km'
  }
];

// GO仕様: 候補アイテム（メモ化コンポーネント）
const SuggestionItem = memo<{item: typeof RECENT_DESTINATIONS[0]; onPress: (item: typeof RECENT_DESTINATIONS[0]) => void}>(({item, onPress}) => (
  <TouchableOpacity 
    style={styles.suggestionItem}
    onPress={() => onPress(item)}
    activeOpacity={0.7}>
    <View style={styles.suggestionIcon}>
      <Text style={styles.suggestionEmoji}>{item.emoji}</Text>
    </View>
    <View style={styles.suggestionContent}>
      <Text style={styles.suggestionMain}>{item.title}</Text>
      <Text style={styles.suggestionSub}>{item.address}</Text>
    </View>
    <Text style={styles.suggestionDistance}>{item.distance}</Text>
  </TouchableOpacity>
));


export const GoBottomSheetContent: React.FC<GoBottomSheetContentProps> = memo(({
  state,
  style,
  currentLocation,
  onNextPress,
}) => {
  const [pickupAddress, setPickupAddress] = useState(currentLocation?.address || '現在地');
  const [destinationAddress, setDestinationAddress] = useState('指定なし');

  // GO仕様: currentLocationの変更を監視してpickupAddressを更新
  React.useEffect(() => {
    if (currentLocation?.address && currentLocation.address !== '現在地を取得中...') {
      setPickupAddress(currentLocation.address);
    }
  }, [currentLocation?.address]);

  // GO仕様: 候補選択ハンドラー（メモ化）
  const handleSuggestionPress = useCallback((item: typeof RECENT_DESTINATIONS[0]) => {
    setDestinationAddress(item.title);
    console.log('Selected destination:', item);
  }, []);

  // GO仕様: FlatListレンダラー（メモ化）
  const renderSuggestionItem = useCallback(({item}: {item: typeof RECENT_DESTINATIONS[0]}) => (
    <SuggestionItem item={item} onPress={handleSuggestionPress} />
  ), [handleSuggestionPress]);

  // GO仕様: FlatListキー抽出（メモ化）
  const keyExtractor = useCallback((item: typeof RECENT_DESTINATIONS[0]) => item.id, []);

  // GO仕様: 半開時コンテンツ（メモ化・最適化）
  const renderHalfContent = useMemo(() => (
    <View style={styles.halfContainer}>
      {/* GO仕様: 乗車地・目的地フォーム */}
      <View style={styles.addressForm}>
        <View style={styles.addressRow}>
          <View style={styles.addressIcon}>
            <View style={styles.pickupDot} />
          </View>
          <TextInput
            style={styles.addressInput}
            value={pickupAddress}
            onChangeText={setPickupAddress}
            placeholder="乗車地を入力"
            placeholderTextColor="#8B9AA8"
            returnKeyType="next"
          />
        </View>
        
        <View style={styles.addressConnector} />
        
        <View style={styles.addressRow}>
          <View style={styles.addressIcon}>
            <View style={styles.destinationDot} />
          </View>
          <TextInput
            style={styles.addressInput}
            value={destinationAddress}
            onChangeText={setDestinationAddress}
            placeholder="目的地を入力"
            placeholderTextColor="#8B9AA8"
            returnKeyType="done"
          />
        </View>
      </View>
    </View>
  ), [pickupAddress, destinationAddress]);

  // GO仕様: 全開時コンテンツ（遅延レンダリング・仮想化リスト）
  const renderFullContent = useMemo(() => (
    <View style={styles.fullContainer}>
      {/* 半開時のコンテンツも含む */}
      {renderHalfContent}
      
      {/* GO仕様: 候補リスト（FlatList仮想化） */}
      <View style={styles.suggestionsList}>
        <Text style={styles.suggestionsTitle}>最近の目的地</Text>
        
        <FlatList
          data={RECENT_DESTINATIONS}
          renderItem={renderSuggestionItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          initialNumToRender={3}
          maxToRenderPerBatch={1}
          windowSize={3}
          removeClippedSubviews={true}
          scrollEventThrottle={32}
          updateCellsBatchingPeriod={100}
          disableIntervalMomentum={true}
          getItemLayout={(_, index) => ({
            length: 70, // 推定アイテム高さ
            offset: 70 * index,
            index,
          })}
        />
      </View>
      
      {/* GO仕様: 「次へすすむ」ボタン */}
      <TouchableOpacity 
        style={[
          styles.nextButton, 
          (!destinationAddress || destinationAddress === '指定なし') && styles.nextButtonDisabled
        ]}
        disabled={!destinationAddress || destinationAddress === '指定なし'}
        onPress={onNextPress}
        activeOpacity={0.8}>
        <Text style={[
          styles.nextButtonText,
          (!destinationAddress || destinationAddress === '指定なし') && styles.nextButtonTextDisabled
        ]}>
          次へすすむ
        </Text>
      </TouchableOpacity>
    </View>
  ), [renderHalfContent, destinationAddress, renderSuggestionItem, keyExtractor]);

  // GO仕様: 縮小時コンテンツ（メモ化）
  const renderCollapsedContent = useMemo(() => (
    <View style={styles.collapsedContainer}>
      {/* ドラッグハンドル */}
      <View style={styles.dragHandle} />
      
      {/* 乗車地・目的地の概要 */}
      <View style={styles.routeSummary}>
        <View style={styles.routeItem}>
          <Text style={styles.routeIcon}>📍</Text>
          <Text style={styles.routeText} numberOfLines={1}>
            {pickupAddress}
          </Text>
        </View>
        <View style={styles.routeArrow}>
          <Text style={styles.arrowText}>→</Text>
        </View>
        <View style={styles.routeItem}>
          <Text style={styles.routeIcon}>🎯</Text>
          <Text style={styles.routeText} numberOfLines={1}>
            {destinationAddress}
          </Text>
        </View>
      </View>
    </View>
  ), [pickupAddress, destinationAddress]);

  // GO仕様: 状態ベースのレンダリング
  const renderContent = () => {
    switch (state) {
      case 'collapsed':
        return renderCollapsedContent;
      case 'half':
        return renderHalfContent;
      case 'full':
        return renderFullContent;
      default:
        return renderHalfContent;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {renderContent()}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // 縮小時コンテナ
  collapsedContainer: {
    paddingHorizontal: GoTheme.spacing.md,
    paddingVertical: GoTheme.spacing.sm,
  },
  
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: GoTheme.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: GoTheme.spacing.sm,
  },
  
  routeSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  routeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  routeIcon: {
    fontSize: 16,
    marginRight: GoTheme.spacing.xs,
  },
  
  routeText: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.text,
    flex: 1,
  },
  
  routeArrow: {
    paddingHorizontal: GoTheme.spacing.sm,
  },
  
  arrowText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.textSecondary,
  },
  
  // 半開時コンテナ（標準化済み）
  halfContainer: {
    flex: 1,
    paddingBottom: GoTheme.spacing.lg, // 24 -> 20から統一
  },
  
  // 全開時コンテナ
  fullContainer: {
    flex: 1,
  },
  
  
  // 住所フォーム（標準化済み）
  addressForm: {
    marginBottom: GoTheme.spacing.lg, // 24 -> 20から統一
  },
  
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: GoTheme.spacing.sm + 4, // 12 -> 標準化
  },
  
  addressIcon: {
    width: 20,
    alignItems: 'center',
    marginRight: GoTheme.spacing.md, // 16 -> 統一
  },
  
  pickupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981', // 緑（出発地）
  },
  
  destinationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444', // 赤（目的地）
  },
  
  addressConnector: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginLeft: 9,
    marginRight: 15,
  },
  
  addressInput: {
    flex: 1,
    fontSize: GoTheme.typography.body.fontSize, // 15 -> 統一
    fontWeight: GoTheme.typography.body.fontWeight, // '500' -> 統一
    color: GoTheme.colors.text, // '#1F2937' -> 統一
    paddingVertical: GoTheme.spacing.sm, // 8 -> 統一
    paddingHorizontal: GoTheme.spacing.sm + 4, // 12 -> 標準化
    backgroundColor: '#F9FAFB',
    borderRadius: GoTheme.borderRadius.sm, // 8 -> 統一
    borderWidth: 1,
    borderColor: GoTheme.colors.border, // '#E5E7EB' -> 統一
  },
  
  
  // 候補リスト（標準化済み）
  suggestionsList: {
    flex: 1,
    marginTop: GoTheme.spacing.md, // 16 -> 統一
  },
  
  suggestionsTitle: {
    fontSize: GoTheme.typography.button.fontSize, // 16 -> 統一
    fontWeight: GoTheme.typography.h3.fontWeight, // '600' -> 統一
    color: GoTheme.colors.text, // '#1F2937' -> 統一
    marginBottom: GoTheme.spacing.md, // 16 -> 統一
  },
  
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: GoTheme.spacing.md, // 16 -> 統一
    borderBottomWidth: 1,
    borderBottomColor: GoTheme.colors.divider, // '#F3F4F6' -> 統一
  },
  
  suggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  
  suggestionEmoji: {
    fontSize: 18,
  },
  
  suggestionContent: {
    flex: 1,
  },
  
  suggestionMain: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  
  suggestionSub: {
    fontSize: 13,
    color: '#6B7280',
  },
  
  suggestionDistance: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8B9AA8',
  },
  
  // GO仕様: 「次へすすむ」ボタン（標準化済み）
  nextButton: {
    backgroundColor: GoTheme.colors.primary, // '#0A3A67' -> 統一
    borderRadius: GoTheme.borderRadius.xl, // 24 -> 統一
    paddingVertical: GoTheme.spacing.md, // 16 -> 統一
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: GoTheme.spacing.lg, // 24 -> 20から統一
    marginBottom: GoTheme.spacing.sm + 2, // 10 -> 標準化
    // GO仕様: 標準化されたボタン影
    ...GoTheme.shadows.small, // 統一された影スタイル
  },
  
  nextButtonDisabled: {
    backgroundColor: GoTheme.colors.border, // '#E5E7EB' -> 統一
  },
  
  nextButtonText: {
    fontSize: GoTheme.typography.button.fontSize, // 16 -> 統一
    fontWeight: GoTheme.typography.button.fontWeight, // '600' -> 統一
    color: GoTheme.colors.textOnPrimary, // '#FFFFFF' -> 統一
  },
  
  nextButtonTextDisabled: {
    color: GoTheme.colors.textTertiary, // '#9CA3AF' -> 統一
  },
});

// GO仕様: デバッグ用displayName設定
GoBottomSheetContent.displayName = 'GoBottomSheetContent';
SuggestionItem.displayName = 'SuggestionItem';

export default GoBottomSheetContent;