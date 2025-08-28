import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import {GoButton, GoCard, GoHeader} from '../components/GoStyle';
import {GoTheme} from '../theme/GoTheme';
import {locationService, SavedLocation, LocationSearchResult} from '../services/api/locationService';

export interface FavoriteLocationsScreenProps {
  navigation: any;
}

interface LocationFormData {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: 'home' | 'work' | 'favorite';
  icon: string;
}

export const FavoriteLocationsScreen: React.FC<FavoriteLocationsScreenProps> = ({navigation}) => {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    type: 'favorite',
    icon: '📍',
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // 場所一覧取得
  const loadLocations = useCallback(async () => {
    try {
      const response = await locationService.getSavedLocations();
      
      if (response.success && response.data) {
        // タイプ別にソート
        const sortedLocations = response.data.sort((a, b) => {
          const typeOrder = {'home': 0, 'work': 1, 'favorite': 2, 'recent': 3};
          if (a.type !== b.type) {
            return typeOrder[a.type] - typeOrder[b.type];
          }
          return b.usage_count - a.usage_count;
        });
        setLocations(sortedLocations);
      } else {
        // フォールバック用モックデータ
        setLocations([
          {
            id: '1',
            name: '自宅',
            address: '東京都港区青山1-1-1',
            latitude: 35.6762,
            longitude: 139.7533,
            type: 'home',
            icon: '🏠',
            usage_count: 25,
            is_primary: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            last_used: '2024-01-15T10:00:00Z',
          },
          {
            id: '2',
            name: '職場',
            address: '東京都千代田区丸の内1-1-1',
            latitude: 35.6812,
            longitude: 139.7671,
            type: 'work',
            icon: '🏢',
            usage_count: 30,
            is_primary: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            last_used: '2024-01-14T18:00:00Z',
          },
          {
            id: '3',
            name: 'よく行くカフェ',
            address: '東京都渋谷区表参道5-5-5',
            latitude: 35.6654,
            longitude: 139.7107,
            type: 'favorite',
            icon: '☕',
            usage_count: 12,
            is_primary: false,
            created_at: '2024-01-05T00:00:00Z',
            updated_at: '2024-01-05T00:00:00Z',
            last_used: '2024-01-12T15:00:00Z',
          },
        ]);
      }
    } catch (error) {
      console.error('Locations loading error:', error);
      Alert.alert('エラー', '場所の読み込みに失敗しました');
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await loadLocations();
    setLoading(false);
  }, [loadLocations]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLocations();
    setRefreshing(false);
  }, [loadLocations]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 場所検索
  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await locationService.searchLocations({
        query,
        limit: 10,
      });

      if (response.success && response.data) {
        setSearchResults(response.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // 検索結果選択
  const handleSearchResultSelect = (result: LocationSearchResult) => {
    setFormData({
      name: result.name,
      address: result.address,
      latitude: result.latitude,
      longitude: result.longitude,
      type: 'favorite',
      icon: getIconForPlaceType(result.place_type),
    });
    setSearchResults([]);
    setSearchQuery(result.name);
  };

  // 場所保存
  const handleSaveLocation = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const response = await locationService.saveLocation({
        name: formData.name.trim(),
        address: formData.address.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        type: formData.type,
        icon: formData.icon,
      });

      if (response.success) {
        Alert.alert('成功', '場所を保存しました');
        setShowAddForm(false);
        resetForm();
        loadLocations();
      } else {
        Alert.alert('エラー', response.error || '場所の保存に失敗しました');
      }
    } catch (error) {
      console.error('Save location error:', error);
      Alert.alert('エラー', '場所の保存中にエラーが発生しました');
    }
  };

  // フォームバリデーション
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = '場所名を入力してください';
    }

    if (!formData.address.trim()) {
      newErrors.address = '住所を入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // フォームリセット
  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      latitude: 0,
      longitude: 0,
      type: 'favorite',
      icon: '📍',
    });
    setSearchQuery('');
    setSearchResults([]);
    setErrors({});
  };

  // 場所削除
  const handleDeleteLocation = (location: SavedLocation) => {
    Alert.alert(
      '場所を削除',
      `「${location.name}」を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await locationService.deleteLocation(location.id);
              
              if (response.success) {
                Alert.alert('成功', '場所を削除しました');
                loadLocations();
              } else {
                Alert.alert('エラー', response.error || '場所の削除に失敗しました');
              }
            } catch (error) {
              Alert.alert('エラー', '場所の削除中にエラーが発生しました');
            }
          }
        }
      ]
    );
  };

  // メイン場所設定（ホーム・職場）
  const handleSetPrimary = async (location: SavedLocation) => {
    if (location.type === 'home' || location.type === 'work') {
      try {
        const response = await locationService.setPrimaryLocation(location.id, location.type);
        
        if (response.success) {
          Alert.alert('成功', 'メイン場所を設定しました');
          loadLocations();
        } else {
          Alert.alert('エラー', response.error || 'メイン場所の設定に失敗しました');
        }
      } catch (error) {
        Alert.alert('エラー', 'メイン場所の設定中にエラーが発生しました');
      }
    }
  };

  // 場所選択（予約で使用）
  const handleUseLocation = async (location: SavedLocation) => {
    try {
      // 使用回数を更新
      await locationService.incrementLocationUsage(location.id);
      
      // 呼び出し元の画面にデータを返す
      navigation.navigate('TaxiBooking', {
        selectedLocation: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          name: location.name,
        },
      });
    } catch (error) {
      console.error('Use location error:', error);
    }
  };

  // プレースタイプからアイコン取得
  const getIconForPlaceType = (placeType: string): string => {
    switch (placeType) {
      case 'address': return '📍';
      case 'poi': return '🏪';
      case 'station': return '🚉';
      case 'landmark': return '🗼';
      default: return '📍';
    }
  };

  // タイプ名取得
  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'home': return '自宅';
      case 'work': return '職場';
      case 'favorite': return 'お気に入り';
      case 'recent': return '最近使用';
      default: return 'その他';
    }
  };

  // タイプアイコン取得
  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'home': return '🏠';
      case 'work': return '🏢';
      case 'favorite': return '⭐';
      case 'recent': return '🕐';
      default: return '📍';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <GoHeader
          title="お気に入りの場所"
          showBack={true}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GoTheme.colors.primary} />
          <Text style={styles.loadingText}>場所を読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <GoHeader
        title="お気に入りの場所"
        showBack={true}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        
        {/* 追加ボタン */}
        <View style={styles.addButtonContainer}>
          <GoButton
            variant="primary"
            size="medium"
            onPress={() => setShowAddForm(true)}
            fullWidth={false}>
            + 新しい場所を追加
          </GoButton>
        </View>

        {/* 場所追加フォーム */}
        {showAddForm && (
          <GoCard style={styles.addFormCard}>
            <Text style={styles.addFormTitle}>新しい場所を追加</Text>
            
            {/* 検索 */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>場所を検索</Text>
              <TextInput
                style={styles.textInput}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  handleSearch(text);
                }}
                placeholder="住所や場所名で検索..."
                placeholderTextColor={GoTheme.colors.textSecondary}
                autoCapitalize="none"
              />
              {searchLoading && (
                <ActivityIndicator 
                  size="small" 
                  color={GoTheme.colors.primary} 
                  style={styles.searchLoader}
                />
              )}
            </View>

            {/* 検索結果 */}
            {searchResults.length > 0 && (
              <View style={styles.searchResultsContainer}>
                {searchResults.map((result, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.searchResultItem}
                    onPress={() => handleSearchResultSelect(result)}>
                    <Text style={styles.searchResultIcon}>
                      {getIconForPlaceType(result.place_type)}
                    </Text>
                    <View style={styles.searchResultInfo}>
                      <Text style={styles.searchResultName}>{result.name}</Text>
                      <Text style={styles.searchResultAddress}>{result.address}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* 場所名 */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>場所名 *</Text>
              <TextInput
                style={[styles.textInput, errors.name && styles.textInputError]}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({...prev, name: text}))}
                placeholder="例: 自宅、職場、よく行くカフェ"
                placeholderTextColor={GoTheme.colors.textSecondary}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* 住所 */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>住所 *</Text>
              <TextInput
                style={[styles.textInput, errors.address && styles.textInputError]}
                value={formData.address}
                onChangeText={(text) => setFormData(prev => ({...prev, address: text}))}
                placeholder="東京都港区青山1-1-1"
                placeholderTextColor={GoTheme.colors.textSecondary}
                multiline
              />
              {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </View>

            {/* タイプ選択 */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>種類</Text>
              <View style={styles.typeSelection}>
                {[
                  { value: 'home', label: '自宅', icon: '🏠' },
                  { value: 'work', label: '職場', icon: '🏢' },
                  { value: 'favorite', label: 'お気に入り', icon: '⭐' },
                ].map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeOption,
                      formData.type === type.value && styles.typeOptionSelected,
                    ]}
                    onPress={() => setFormData(prev => ({
                      ...prev, 
                      type: type.value as any,
                      icon: type.icon,
                    }))}>
                    <Text style={styles.typeOptionIcon}>{type.icon}</Text>
                    <Text style={[
                      styles.typeOptionText,
                      formData.type === type.value && styles.typeOptionTextSelected,
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ボタン */}
            <View style={styles.formButtons}>
              <GoButton
                variant="secondary"
                size="medium"
                onPress={() => {
                  setShowAddForm(false);
                  resetForm();
                }}>
                キャンセル
              </GoButton>
              <GoButton
                variant="primary"
                size="medium"
                onPress={handleSaveLocation}>
                保存
              </GoButton>
            </View>
          </GoCard>
        )}

        {/* 場所一覧 */}
        {locations.length === 0 ? (
          <GoCard style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📍</Text>
            <Text style={styles.emptyTitle}>お気に入りの場所がありません</Text>
            <Text style={styles.emptyText}>
              よく行く場所を登録すると、予約時に簡単に選択できます
            </Text>
          </GoCard>
        ) : (
          locations.map((location) => (
            <GoCard key={location.id} style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <View style={styles.locationIcon}>
                  <Text style={styles.locationIconText}>
                    {location.icon || getTypeIcon(location.type)}
                  </Text>
                </View>
                <View style={styles.locationInfo}>
                  <View style={styles.locationTitleRow}>
                    <Text style={styles.locationName}>{location.name}</Text>
                    {location.is_primary && (
                      <View style={styles.primaryBadge}>
                        <Text style={styles.primaryBadgeText}>メイン</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.locationAddress}>{location.address}</Text>
                  <View style={styles.locationMeta}>
                    <Text style={styles.locationMetaText}>
                      {getTypeLabel(location.type)} • 使用回数: {location.usage_count}回
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.locationActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleUseLocation(location)}>
                  <Text style={styles.actionButtonText}>使用</Text>
                </TouchableOpacity>
                
                {(location.type === 'home' || location.type === 'work') && !location.is_primary && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleSetPrimary(location)}>
                    <Text style={styles.actionButtonText}>メイン設定</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteLocation(location)}>
                  <Text style={styles.deleteButtonText}>削除</Text>
                </TouchableOpacity>
              </View>
            </GoCard>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GoTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.textSecondary,
    marginTop: GoTheme.spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  addButtonContainer: {
    paddingHorizontal: GoTheme.spacing.md,
    paddingTop: GoTheme.spacing.md,
    alignItems: 'center',
  },
  addFormCard: {
    marginHorizontal: GoTheme.spacing.md,
    marginTop: GoTheme.spacing.md,
  },
  addFormTitle: {
    ...GoTheme.typography.h4,
    color: GoTheme.colors.text,
    marginBottom: GoTheme.spacing.md,
    fontWeight: 'bold',
  },
  formGroup: {
    marginBottom: GoTheme.spacing.md,
  },
  formLabel: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.text,
    marginBottom: GoTheme.spacing.xs,
    fontWeight: '600',
  },
  textInput: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.text,
    backgroundColor: GoTheme.colors.surface,
    borderWidth: 1,
    borderColor: GoTheme.colors.border,
    borderRadius: GoTheme.borderRadius.sm,
    paddingHorizontal: GoTheme.spacing.md,
    paddingVertical: GoTheme.spacing.sm,
    minHeight: 48,
  },
  textInputError: {
    borderColor: GoTheme.colors.error,
  },
  errorText: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.error,
    marginTop: GoTheme.spacing.xs,
  },
  searchLoader: {
    position: 'absolute',
    right: GoTheme.spacing.md,
    top: 36,
  },
  searchResultsContainer: {
    backgroundColor: GoTheme.colors.surface,
    borderRadius: GoTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: GoTheme.colors.border,
    maxHeight: 200,
    marginBottom: GoTheme.spacing.md,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GoTheme.spacing.md,
    paddingVertical: GoTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: GoTheme.colors.divider,
  },
  searchResultIcon: {
    fontSize: 20,
    marginRight: GoTheme.spacing.sm,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.text,
    fontWeight: '600',
  },
  searchResultAddress: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.textSecondary,
  },
  typeSelection: {
    flexDirection: 'row',
    gap: GoTheme.spacing.sm,
  },
  typeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: GoTheme.spacing.md,
    borderWidth: 1,
    borderColor: GoTheme.colors.border,
    borderRadius: GoTheme.borderRadius.sm,
  },
  typeOptionSelected: {
    backgroundColor: GoTheme.colors.primary,
    borderColor: GoTheme.colors.primary,
  },
  typeOptionIcon: {
    fontSize: 24,
    marginBottom: GoTheme.spacing.xs,
  },
  typeOptionText: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.text,
  },
  typeOptionTextSelected: {
    color: GoTheme.colors.textOnPrimary,
    fontWeight: '600',
  },
  formButtons: {
    flexDirection: 'row',
    gap: GoTheme.spacing.md,
    marginTop: GoTheme.spacing.md,
  },
  emptyCard: {
    marginHorizontal: GoTheme.spacing.md,
    marginTop: GoTheme.spacing.md,
    alignItems: 'center',
    paddingVertical: GoTheme.spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: GoTheme.spacing.md,
  },
  emptyTitle: {
    ...GoTheme.typography.h4,
    color: GoTheme.colors.text,
    marginBottom: GoTheme.spacing.sm,
    fontWeight: 'bold',
  },
  emptyText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.textSecondary,
    textAlign: 'center',
  },
  locationCard: {
    marginHorizontal: GoTheme.spacing.md,
    marginTop: GoTheme.spacing.md,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: GoTheme.spacing.md,
  },
  locationIcon: {
    width: 48,
    height: 48,
    backgroundColor: GoTheme.colors.primaryLight + '20',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: GoTheme.spacing.md,
  },
  locationIconText: {
    fontSize: 24,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationName: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.text,
    fontWeight: 'bold',
    flex: 1,
  },
  primaryBadge: {
    backgroundColor: GoTheme.colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  primaryBadgeText: {
    ...GoTheme.typography.caption,
    color: GoTheme.colors.textOnPrimary,
    fontWeight: '600',
  },
  locationAddress: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.textSecondary,
    marginBottom: 8,
  },
  locationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationMetaText: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.textSecondary,
  },
  locationActions: {
    flexDirection: 'row',
    gap: GoTheme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: GoTheme.spacing.sm,
    backgroundColor: GoTheme.colors.surface,
    borderWidth: 1,
    borderColor: GoTheme.colors.border,
    borderRadius: GoTheme.borderRadius.sm,
    alignItems: 'center',
  },
  actionButtonText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.primary,
    fontWeight: '600',
  },
  deleteButton: {
    borderColor: GoTheme.colors.error,
    maxWidth: 80,
  },
  deleteButtonText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.error,
    fontWeight: '600',
  },
});