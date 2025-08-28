import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {GoButton, GoCard, GoHeader} from '../components/GoStyle';
import {GoTheme} from '../theme/GoTheme';
import {apiClient} from '../services/api/client';

export interface NetworkTestScreenProps {
  navigation: any;
}

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  details?: any;
  duration?: number;
}

export const NetworkTestScreen: React.FC<NetworkTestScreenProps> = ({navigation}) => {
  const [tests, setTests] = useState<TestResult[]>([
    {
      name: 'ネットワーク接続',
      status: 'pending',
      message: 'サーバーへの基本接続をテスト',
    },
    {
      name: 'CSRF取得',
      status: 'pending', 
      message: 'Django CSRF認証の動作確認',
    },
    {
      name: 'ログイン試行',
      status: 'pending',
      message: 'ログイン機能のテスト',
    },
    {
      name: 'API通信',
      status: 'pending',
      message: 'タクシーAPI呼び出しテスト',
    },
  ]);
  const [running, setRunning] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(-1);

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? {...test, ...updates} : test
    ));
  };

  const runTest = async (
    testIndex: number,
    testFunction: () => Promise<{success: boolean; message?: string; details?: any}>
  ) => {
    setCurrentTestIndex(testIndex);
    updateTest(testIndex, {status: 'running'});
    
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      updateTest(testIndex, {
        status: result.success ? 'success' : 'error',
        message: result.message || (result.success ? '成功' : '失敗'),
        details: result.details,
        duration,
      });
      
      return result.success;
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTest(testIndex, {
        status: 'error',
        message: error instanceof Error ? error.message : '不明なエラー',
        duration,
      });
      return false;
    }
  };

  const testNetworkConnection = async () => {
    console.log('Testing network connection...');
    
    const result = await apiClient.testConnection();
    
    return {
      success: result.success,
      message: result.success 
        ? `接続成功 (${result.data?.status || 'connected'})` 
        : `接続失敗: ${result.error}`,
      details: result.data,
    };
  };

  const testCSRFFetch = async () => {
    console.log('Testing CSRF token fetch...');
    
    try {
      const success = await apiClient.fetchCSRFToken();
      
      return {
        success,
        message: success 
          ? 'CSRFトークン取得成功'
          : 'CSRFトークン取得失敗',
        details: {
          authenticated: apiClient.isAuthenticated(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `CSRFエラー: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };

  const testLogin = async () => {
    console.log('Testing login...');
    
    // テスト用の認証情報（実際のアプリでは入力フィールドから取得）
    const testUsername = 'test_user';
    const testPassword = 'test_password';
    
    try {
      const result = await apiClient.login(testUsername, testPassword);
      
      return {
        success: result.success,
        message: result.success 
          ? 'ログインテスト成功' 
          : `ログイン失敗: ${result.error}`,
        details: {
          authenticated: apiClient.isAuthenticated(),
          data: result.data,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `ログインエラー: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };

  const testAPICall = async () => {
    console.log('Testing API call...');
    
    try {
      // タクシーのvehicle-types APIをテスト
      const result = await apiClient.get('/taxi/api/vehicle-types/');
      
      return {
        success: result.success,
        message: result.success 
          ? `API呼び出し成功 (${Array.isArray(result.data) ? result.data.length : 'unknown'} items)`
          : `API呼び出し失敗: ${result.error}`,
        details: result.data,
      };
    } catch (error) {
      return {
        success: false,
        message: `APIエラー: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };

  const runAllTests = async () => {
    if (running) return;
    
    setRunning(true);
    setCurrentTestIndex(-1);
    
    // 全テストをリセット
    setTests(prev => prev.map(test => ({
      ...test,
      status: 'pending' as const,
      message: test.name === 'ネットワーク接続' ? 'サーバーへの基本接続をテスト' :
               test.name === 'CSRF取得' ? 'Django CSRF認証の動作確認' :
               test.name === 'ログイン試行' ? 'ログイン機能のテスト' :
               test.name === 'API通信' ? 'タクシーAPI呼び出しテスト' : test.message,
      details: undefined,
      duration: undefined,
    })));
    
    // 各テストを順次実行
    const testFunctions = [
      testNetworkConnection,
      testCSRFFetch,
      testLogin,
      testAPICall,
    ];
    
    for (let i = 0; i < testFunctions.length; i++) {
      const success = await runTest(i, testFunctions[i]);
      
      // 前のテストが失敗した場合、後続のテストはスキップ（ログイン除く）
      if (!success && i === 0) {
        // ネットワーク接続が失敗した場合、後続のテストもエラーにする
        for (let j = i + 1; j < tests.length; j++) {
          updateTest(j, {
            status: 'error',
            message: 'ネットワーク接続失敗のためスキップ',
          });
        }
        break;
      }
      
      // 各テスト間に少し間隔をあける
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setRunning(false);
    setCurrentTestIndex(-1);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return '⏸️';
      case 'running':
        return '▶️';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return GoTheme.colors.textSecondary;
      case 'running':
        return GoTheme.colors.primary;
      case 'success':
        return GoTheme.colors.success;
      case 'error':
        return GoTheme.colors.error;
      default:
        return GoTheme.colors.text;
    }
  };

  const showDetails = (test: TestResult) => {
    if (!test.details) return;
    
    Alert.alert(
      `${test.name} - 詳細`,
      JSON.stringify(test.details, null, 2),
      [
        {text: 'OK'},
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <GoHeader
        title="ネットワーク診断"
        showBack={true}
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content}>
        <GoCard style={styles.infoCard}>
          <Text style={styles.infoTitle}>🔧 Django API 通信テスト</Text>
          <Text style={styles.infoText}>
            「Network request failed」エラーを診断します。{'\n'}
            各ステップを順次実行して問題箇所を特定します。
          </Text>
        </GoCard>

        {tests.map((test, index) => (
          <GoCard key={index} style={styles.testCard}>
            <TouchableOpacity
              style={styles.testHeader}
              onPress={() => test.details && showDetails(test)}
              disabled={!test.details}>
              <View style={styles.testInfo}>
                <Text style={styles.testIcon}>{getStatusIcon(test.status)}</Text>
                <View style={styles.testContent}>
                  <Text style={styles.testName}>{test.name}</Text>
                  <Text style={[styles.testMessage, {color: getStatusColor(test.status)}]}>
                    {test.message}
                  </Text>
                </View>
              </View>
              {test.status === 'running' && (
                <ActivityIndicator size="small" color={GoTheme.colors.primary} />
              )}
            </TouchableOpacity>
            
            {test.duration && (
              <Text style={styles.duration}>⏱️ {test.duration}ms</Text>
            )}
            
            {test.details && (
              <TouchableOpacity onPress={() => showDetails(test)}>
                <Text style={styles.detailsLink}>詳細を表示 →</Text>
              </TouchableOpacity>
            )}
          </GoCard>
        ))}

        <GoCard style={styles.debugCard}>
          <Text style={styles.debugTitle}>🐛 デバッグ情報</Text>
          <Text style={styles.debugText}>
            API Base URL: {__DEV__ ? 'http://10.0.2.2:8000' : 'https://taxiboat.hokkomarina.com'}{'\n'}
            Environment: {__DEV__ ? 'Development' : 'Production'}{'\n'}
            認証状態: {apiClient.isAuthenticated() ? '認証済み' : '未認証'}
          </Text>
        </GoCard>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <GoButton
          variant="primary"
          size="large"
          onPress={runAllTests}
          disabled={running}
          fullWidth>
          {running ? '診断中...' : '診断開始'}
        </GoButton>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GoTheme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: GoTheme.spacing.md,
  },
  infoCard: {
    marginTop: GoTheme.spacing.md,
    backgroundColor: GoTheme.colors.primary + '10',
    borderWidth: 1,
    borderColor: GoTheme.colors.primary + '30',
  },
  infoTitle: {
    ...GoTheme.typography.h4,
    color: GoTheme.colors.primary,
    fontWeight: 'bold',
    marginBottom: GoTheme.spacing.sm,
  },
  infoText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.text,
    lineHeight: 20,
  },
  testCard: {
    marginTop: GoTheme.spacing.md,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  testInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  testIcon: {
    fontSize: 24,
    marginRight: GoTheme.spacing.md,
  },
  testContent: {
    flex: 1,
  },
  testName: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.text,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  testMessage: {
    ...GoTheme.typography.bodySmall,
  },
  duration: {
    ...GoTheme.typography.caption,
    color: GoTheme.colors.textSecondary,
    marginTop: GoTheme.spacing.xs,
    textAlign: 'right',
  },
  detailsLink: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.primary,
    marginTop: GoTheme.spacing.xs,
    textDecorationLine: 'underline',
  },
  debugCard: {
    marginTop: GoTheme.spacing.md,
    marginBottom: GoTheme.spacing.lg,
    backgroundColor: GoTheme.colors.textSecondary + '10',
    borderWidth: 1,
    borderColor: GoTheme.colors.textSecondary + '20',
  },
  debugTitle: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.text,
    fontWeight: 'bold',
    marginBottom: GoTheme.spacing.sm,
  },
  debugText: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.textSecondary,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  buttonContainer: {
    paddingHorizontal: GoTheme.spacing.md,
    paddingVertical: GoTheme.spacing.lg,
    backgroundColor: GoTheme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: GoTheme.colors.divider,
  },
});