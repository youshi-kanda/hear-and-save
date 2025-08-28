import React, {useEffect, useRef} from 'react';
import {View, StyleSheet} from 'react-native';
import WebView from 'react-native-webview';
import {GoTheme} from '../../theme/GoTheme';

export interface MapMarker {
  latitude: number;
  longitude: number;
  type: 'pickup' | 'destination' | 'driver' | 'vehicle';
  title?: string;
  description?: string;
}

export interface LeafletMapProps {
  latitude: number;
  longitude: number;
  markers?: MapMarker[];
  route?: {
    coordinates: [number, number][];
    color?: string;
  };
  onMapPress?: (data: {latitude: number; longitude: number}) => void;
  onMarkerPress?: (marker: MapMarker) => void;
  onMoveStart?: () => void;
  onMoveEnd?: () => void;
  zoom?: number;
  style?: any;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  latitude,
  longitude,
  markers = [],
  route,
  onMapPress,
  onMarkerPress,
  onMoveStart,
  onMoveEnd,
  zoom = 15,
  style,
}) => {
  const webViewRef = useRef<WebView>(null);

  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'pickup':
        return GoTheme.colors.mapPickup;
      case 'destination':
        return GoTheme.colors.mapDestination;
      case 'driver':
      case 'vehicle':
        return GoTheme.colors.primary;
      default:
        return GoTheme.colors.accent;
    }
  };

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case 'pickup':
        return '📍'; // ピックアップ地点
      case 'destination':
        return '🏁'; // 目的地
      case 'driver':
      case 'vehicle':
        return '🚗'; // 車両
      default:
        return '📍';
    }
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
            integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" 
              integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
      <style>
        body, html { margin: 0; padding: 0; height: 100%; }
        #map { 
          height: 100vh; 
          width: 100vw; 
          padding-top: 60px; /* GO-style top padding for header space */
          padding-bottom: 120px; /* GO-style bottom padding for bottom sheet */
        }
        .custom-div-icon {
          background: none;
          border: none;
        }
        .marker-pin {
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          position: relative;
          transform: rotate(-45deg);
          left: 50%;
          top: 50%;
          margin: -15px 0 0 -15px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .marker-content {
          transform: rotate(45deg);
          font-size: 16px;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        // GO仕様: マーカーの色とアイコンを決める関数（グローバルに定義）
        window.getMarkerColor = function(type) {
          switch (type) {
            case 'pickup':
              return '#10B981'; // 緑（出発地）
            case 'destination':
              return '#EF4444'; // 赤（目的地）
            case 'driver':
            case 'vehicle':
              return '#0052A4'; // GO仕様: プライマリブルー
            case 'taxi':
              return '#FFC300'; // タクシー：イエロー系
            case 'ship':
              return '#00D4FF'; // 船舶：シアン系
            default:
              return '#00A9E0'; // GO仕様: アクセントブルー（フォールバック）
          }
        };
        
        window.getMarkerIcon = function(type) {
          switch (type) {
            case 'pickup':
              return '📍'; // ピックアップ地点
            case 'destination':
              return '🏁'; // 目的地
            case 'driver':
            case 'vehicle':
              return '🚗'; // 車両
            case 'taxi':
              return '🚖'; // タクシー
            case 'ship':
              return '🚢'; // 船舶
            default:
              return '📍';
          }
        };

        // エラー防止用のガード関数（より堅牢）
        function safeGetMarkerColor(type) {
          try {
            if (typeof window.getMarkerColor === 'function') {
              return window.getMarkerColor(type);
            }
          } catch (e) {
            console.warn('getMarkerColor error:', e);
          }
          return '#007AFF'; // フォールバック色
        }

        function safeGetMarkerIcon(type) {
          try {
            if (typeof window.getMarkerIcon === 'function') {
              return window.getMarkerIcon(type);
            }
          } catch (e) {
            console.warn('getMarkerIcon error:', e);
          }
          return '📍'; // フォールバックアイコン
        }
        
        // 初期化完了の確認
        console.log('LeafletMap initialized with getMarkerColor:', typeof window.getMarkerColor);

        // GO仕様: 地図の初期化（+/-ズームボタン非表示）
        const map = L.map('map', {
          zoomControl: false, // GO仕様: +/-ズームボタン非表示
          attributionControl: false, // GO仕様: クリーンな外観
          doubleClickZoom: false, // GO仕様: ダブルクリックズーム無効
          scrollWheelZoom: true, // スクロールズームは有効
          touchZoom: true, // タッチズームは有効
          dragging: true, // ドラッグは有効
        }).setView([${latitude}, ${longitude}], ${zoom});
        
        // OpenStreetMapタイル
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // マーカー追加
        const markers = ${JSON.stringify(markers)};
        const markerObjects = [];
        
        markers.forEach((markerData, index) => {
          const color = safeGetMarkerColor(markerData.type);
          const icon = safeGetMarkerIcon(markerData.type);
          
          const customIcon = L.divIcon({
            className: 'custom-div-icon',
            html: \`
              <div class="marker-pin" style="background-color: \${color};">
                <div class="marker-content">\${icon}</div>
              </div>
            \`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });
          
          const marker = L.marker([markerData.latitude, markerData.longitude], {
            icon: customIcon
          }).addTo(map);
          
          if (markerData.title || markerData.description) {
            marker.bindPopup(\`
              <div>
                \${markerData.title ? \`<h3>\${markerData.title}</h3>\` : ''}
                \${markerData.description ? \`<p>\${markerData.description}</p>\` : ''}
              </div>
            \`);
          }
          
          marker.on('click', () => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'markerPress',
              marker: markerData,
              index
            }));
          });
          
          markerObjects.push(marker);
        });

        // ルート描画
        ${route ? `
        const routeCoordinates = ${JSON.stringify(route.coordinates)};
        const routeColor = '${route.color || GoTheme.colors.mapRoute}';
        
        if (routeCoordinates && routeCoordinates.length > 0) {
          const polyline = L.polyline(routeCoordinates, {
            color: routeColor,
            weight: 4,
            opacity: 0.8
          }).addTo(map);
          
          // ルート全体が見えるように地図を調整
          map.fitBounds(polyline.getBounds(), { padding: [20, 20] });
        }
        ` : ''}

        // 地図クリックイベント
        map.on('click', function(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapPress',
            latitude: e.latlng.lat,
            longitude: e.latlng.lng
          }));
        });

        // 地図移動イベント（GO-style map interactions）
        map.on('movestart', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'moveStart'
          }));
        });

        map.on('moveend', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'moveEnd'
          }));
        });

        // マーカー位置更新用関数
        window.updateMarkerPosition = function(index, lat, lng) {
          if (markerObjects[index]) {
            markerObjects[index].setLatLng([lat, lng]);
          }
        };

        // 地図中心変更用関数
        window.setMapCenter = function(lat, lng, zoomLevel = ${zoom}) {
          map.setView([lat, lng], zoomLevel);
        };
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'mapPress':
          if (onMapPress) {
            onMapPress({
              latitude: data.latitude,
              longitude: data.longitude,
            });
          }
          break;
        case 'markerPress':
          if (onMarkerPress) {
            onMarkerPress(data.marker);
          }
          break;
        case 'moveStart':
          if (onMoveStart) {
            onMoveStart();
          }
          break;
        case 'moveEnd':
          if (onMoveEnd) {
            onMoveEnd();
          }
          break;
      }
    } catch (error) {
      console.error('LeafletMap message parse error:', error);
    }
  };

  // マーカー位置更新
  const updateMarkerPosition = (index: number, lat: number, lng: number) => {
    webViewRef.current?.postMessage(
      JSON.stringify({
        action: 'updateMarker',
        index,
        latitude: lat,
        longitude: lng,
      })
    );
  };

  // 地図中心変更
  const setMapCenter = (lat: number, lng: number, zoomLevel?: number) => {
    webViewRef.current?.postMessage(
      JSON.stringify({
        action: 'setCenter',
        latitude: lat,
        longitude: lng,
        zoom: zoomLevel || zoom,
      })
    );
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{html: htmlContent}}
        onMessage={handleMessage}
        style={styles.webView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        scrollEnabled={false}
        bounces={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
});