import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { track } from '../../analytics';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { EmptyState } from '../../components/EmptyState';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { isValidIsbn, normalizeIsbn } from '../../lib/isbn';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'BarcodeScanner'>;

export function BarcodeScannerScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = useState(false);

  if (!permission) {
    return <LoadingOverlay label="正在檢查相機權限…" />;
  }

  if (!permission.granted) {
    return (
      <EmptyState
        icon="camera"
        title="需要相機權限"
        description="請允許相機存取，才能直接掃描書本背面的 ISBN 條碼。"
        actionLabel="允許相機權限"
        onAction={() => void requestPermission()}
        containerStyle={styles.container}
      />
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        barcodeScannerSettings={{
          barcodeTypes: ['ean13'],
        }}
        facing="back"
        onBarcodeScanned={
          hasScanned
            ? undefined
            : ({ data }) => {
                const isbn = normalizeIsbn(data);

                if (!isValidIsbn(isbn)) {
                  track('barcode_scanner_invalid_barcode');
                  return;
                }

                setHasScanned(true);
                track('barcode_scanner_valid_barcode', { isbnLength: isbn.length });
                navigation.replace('SearchResult', { isbn });
              }
        }
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.overlay} pointerEvents="none">
        <Text style={styles.helpText}>請將國際標準書號 (ISBN 碼) 放進掃描框內。</Text>
        <View style={styles.scanFrame} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  helpText: {
    ...typography.body,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  scanFrame: {
    width: 280,
    height: 112,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.accentSoft,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
});
