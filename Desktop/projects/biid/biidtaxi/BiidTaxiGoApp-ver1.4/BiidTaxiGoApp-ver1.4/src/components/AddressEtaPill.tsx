import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import {GoTheme} from '../theme/GoTheme';
import {useTheme} from '../contexts/ThemeContext';

export interface AddressEtaPillProps {
  address: string;
  fromLocation?: {latitude: number; longitude: number};
  toLocation?: {latitude: number; longitude: number};
  mode?: 'taxi' | 'ship';
  showEta?: boolean;
  showDistance?: boolean;
  onPress?: () => void;
  onEtaCalculated?: (eta: number, distance: number) => void;
  style?: ViewStyle;
}

interface EtaResult {
  eta: number;
  distance: number;
  duration: string;
}

export const AddressEtaPill: React.FC<AddressEtaPillProps> = ({
  address,
  fromLocation,
  toLocation,
  mode = 'taxi',
  showEta = true,
  showDistance = false,
  onPress,
  onEtaCalculated,
  style,
}) => {
  const {currentMode, getAccentColor} = useTheme();
  const [etaResult, setEtaResult] = useState<EtaResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const calculateClientSideEta = (
    from: {latitude: number; longitude: number},
    to: {latitude: number; longitude: number},
    transportMode: 'taxi' | 'ship'
  ): EtaResult => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371;
    
    const dLat = toRad(to.latitude - from.latitude);
    const dLon = toRad(to.longitude - from.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    const avgSpeed = transportMode === 'ship' ? 25 : 20;
    const delayFactor = transportMode === 'ship' ? 1.3 : 1.4;
    const etaMinutes = Math.round((distance / avgSpeed) * 60 * delayFactor);
    
    return {
      eta: etaMinutes,
      distance: Math.round(distance * 10) / 10,
      duration: `約${etaMinutes}分`,
    };
  };

  const calculateServerSideEta = async (
    from: {latitude: number; longitude: number},
    to: {latitude: number; longitude: number},
    transportMode: 'taxi' | 'ship'
  ): Promise<EtaResult> => {
    try {
      // GO仕様: /taxi/api/pricing/estimate/ エンドポイント使用
      const endpoint = transportMode === 'ship' ? '/boat/api/estimate' : '/taxi/api/pricing/estimate/';
      
      const response = await fetch(`https://taxiboat.hokkomarina.com${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pickup_lat: from.latitude,
          pickup_lng: from.longitude,
          dropoff_lat: to.latitude,
          dropoff_lng: to.longitude,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Server ETA calculation failed');
      }
      
      const data = await response.json();
      
      // GO仕様: 2-4分刻み丸め表示
      const etaMinutes = data.estimated_time_minutes || data.eta_minutes || 0;
      const roundedEta = Math.ceil(etaMinutes / 2) * 2; // 2分刻みに切り上げ
      
      return {
        eta: roundedEta,
        distance: data.distance_km || data.distance || 0,
        duration: `約${roundedEta}分`,
      };
    } catch (error) {
      console.warn('Server ETA calculation failed, falling back to client-side:', error);
      return calculateClientSideEta(from, to, transportMode);
    }
  };

  const performEtaCalculation = async () => {
    if (!fromLocation || !toLocation) return;
    
    setIsCalculating(true);
    setError(null);
    
    try {
      const result = await calculateServerSideEta(fromLocation, toLocation, mode);
      
      setEtaResult(result);
      onEtaCalculated?.(result.eta, result.distance);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ETA計算に失敗しました';
      setError(errorMessage);
      
      try {
        const fallbackResult = calculateClientSideEta(fromLocation, toLocation, mode);
        setEtaResult(fallbackResult);
        onEtaCalculated?.(fallbackResult.eta, fallbackResult.distance);
      } catch (fallbackErr) {
        console.error('Both server and client ETA calculation failed:', fallbackErr);
      }
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    if (showEta && fromLocation && toLocation) {
      const timer = setTimeout(() => {
        performEtaCalculation();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [fromLocation, toLocation, mode, showEta]);

  const getModeIcon = () => {
    return currentMode === 'ship' ? '⚓' : '🚗';
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.touchable}
        onPress={onPress}
        activeOpacity={0.8}>
        
        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={styles.address} numberOfLines={2}>
              {address}
            </Text>
            
            {showEta && (
              <View style={styles.etaContainer}>
                {isCalculating ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.etaText}>計算中...</Text>
                  </View>
                ) : etaResult ? (
                  <Text style={styles.etaText}>
                    {etaResult.duration}
                  </Text>
                ) : error ? (
                  <Text style={styles.errorText}>計算失敗</Text>
                ) : null}
              </View>
            )}
          </View>
        </View>
        
        {/* 三角ポインタ */}
        <View style={styles.trianglePointer} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // GO仕様: 中央マップピンの12dp上に配置
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  
  touchable: {
    backgroundColor: '#0A3A67', // GO仕様: ネイビー
    borderRadius: 14, // GO仕様: 角丸14
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 180,
    maxWidth: 280,
    // GO仕様: elevation 8 (ピル用影設定)
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  
  content: {
    alignItems: 'center',
  },
  
  textContainer: {
    alignItems: 'center',
  },
  
  address: {
    // GO仕様: 2行テキスト対応、白文字
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
  },
  
  etaContainer: {
    alignItems: 'center',
  },
  
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  etaText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.9,
    marginLeft: 4,
  },
  
  errorText: {
    fontSize: 11,
    color: '#FFB3B3',
    fontStyle: 'italic',
    opacity: 0.8,
  },
  
  // GO仕様: 三角ポインタ（ピル下部の矢印）
  trianglePointer: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#0A3A67', // ピル本体と同じネイビー
  },
});

export default AddressEtaPill;