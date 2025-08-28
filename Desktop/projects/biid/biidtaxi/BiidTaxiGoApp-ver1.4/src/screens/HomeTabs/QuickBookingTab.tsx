import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { GoStyleMap } from '../../components/Map/GoStyleMap';
import { GoButton } from '../../components/GoStyle/GoButton';
import { GoCard } from '../../components/GoStyle/GoCard';
import { logger } from '../../config/environment';

const { width: screenWidth } = Dimensions.get('window');

interface QuickBookingTabProps {
  currentMode: 'taxi' | 'ship';
  navigation?: any;
}

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

export const QuickBookingTab: React.FC<QuickBookingTabProps> = ({ 
  currentMode, 
  navigation 
}) => {
  const [currentLocation, setCurrentLocation] = useState<LocationData>({
    latitude: 34.6851,
    longitude: 135.5136,
    address: '大阪市中央区南船場4丁目5-10'
  });
  
  const [destination, setDestination] = useState<LocationData | null>(null);
  const [estimatedTime, setEstimatedTime] = useState('1-4');

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      logger.log('Getting current location...');
      
      // モック位置情報（東京駅周辺）
      const mockLocation = {
        latitude: 35.6762,
        longitude: 139.6503,
        address: '東京駅丸の内南口'
      };
      
      setCurrentLocation(mockLocation);
      
    } catch (error) {
      logger.error('Location error:', error);
      Alert.alert('位置情報エラー', '現在地を取得できませんでした');
    }
  };

  const handleNext = () => {
    if (currentMode === 'taxi') {
      // タクシー予約画面へ遷移
      if (navigation) {
        navigation.navigate('TaxiSelection', {
          pickup: currentLocation,
          destination: destination,
        });
      } else {
        Alert.alert('タクシー予約', 'タクシー予約画面への遷移を実行します');
      }
    } else {
      // 船舶予約画面へ遷移
      if (navigation) {
        navigation.navigate('ShipBooking');
      } else {
        Alert.alert('船舶予約', '船舶予約画面への遷移を実行します');
      }
    }
  };

  const handleDestinationSearch = () => {
    // 目的地検索のモック実装
    const mockDestination = {
      latitude: 35.6586,
      longitude: 139.7454,
      address: '新宿駅南口'
    };
    setDestination(mockDestination);
    Alert.alert('目的地設定', '新宿駅南口を目的地に設定しました');
  };

  return (
    <View style={styles.container}>
      {/* 地図エリア */}
      <View style={styles.mapContainer}>
        <GoStyleMap
          style={styles.map}
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          markers={[
            {
              id: 'current',
              coordinate: currentLocation,
              title: '現在地',
              description: currentLocation.address
            },
            ...(destination ? [{
              id: 'destination',
              coordinate: destination,
              title: '目的地',
              description: destination.address
            }] : [])
          ]}
        />
        
        {/* 現在地確認カード */}
        <View style={styles.locationCardContainer}>
          <GoCard style={styles.locationCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>
                {currentMode === 'taxi' 
                  ? '乗車地が正しいかご確認ください（GPS精度低下）' 
                  : '乗船地が正しいかご確認ください'
                }
              </Text>
            </View>
            <Text style={styles.locationAddress}>{currentLocation.address}</Text>
            
            {currentMode === 'taxi' && (
              <TouchableOpacity style={styles.etaButton}>
                <Text style={styles.etaButtonText}>約{estimatedTime}分で乗車</Text>
              </TouchableOpacity>
            )}
          </GoCard>
        </View>
      </View>

      {/* ボトムシートエリア */}
      <View style={styles.bottomSheet}>
        {/* 出発地 */}
        <View style={styles.inputContainer}>
          <View style={styles.locationInput}>
            <Text style={styles.locationIcon}>📍</Text>
            <View style={styles.inputTextContainer}>
              <Text style={styles.inputLabel}>
                {currentMode === 'taxi' ? '乗車地' : '乗船地'}
              </Text>
              <Text style={styles.inputText} numberOfLines={1}>
                {currentLocation.address}
              </Text>
            </View>
            <TouchableOpacity style={styles.searchButton} onPress={getCurrentLocation}>
              <Text style={styles.searchIcon}>🔍</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 目的地 */}
        <View style={styles.inputContainer}>
          <TouchableOpacity 
            style={styles.locationInput}
            onPress={handleDestinationSearch}
          >
            <Text style={styles.locationIcon}>🎯</Text>
            <View style={styles.inputTextContainer}>
              <Text style={styles.inputLabel}>
                {currentMode === 'taxi' ? '目的地' : '下船地'}
              </Text>
              <Text style={[styles.inputText, !destination && styles.placeholderText]}>
                {destination ? destination.address : '目的地を選択してください'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* メインアクションボタン */}
        <View style={styles.buttonContainer}>
          <GoButton
            title={currentMode === 'taxi' ? 'タクシーを呼ぶ' : '船舶を予約'}
            onPress={handleNext}
            style={[styles.nextButton, { backgroundColor: '#3b82f6' }]}
            textStyle={styles.nextButtonText}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  locationCardContainer: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    zIndex: 1,
  },
  locationCard: {
    padding: 16,
    backgroundColor: '#ffffff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  warningIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#ef4444',
    lineHeight: 18,
  },
  locationAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  etaButton: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  etaButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 32,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  inputTextContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  inputText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  searchButton: {
    padding: 8,
  },
  searchIcon: {
    fontSize: 18,
  },
  buttonContainer: {
    marginTop: 20,
  },
  nextButton: {
    borderRadius: 25,
    paddingVertical: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});