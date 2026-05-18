import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { track } from '../../analytics';
import { featureFlags } from '../../config/featureFlags';
import { strings } from '../../i18n/strings';
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
    return <LoadingOverlay label={strings.scanner.permissionCheckingLabel} />;
  }

  if (!permission.granted) {
    return (
      <EmptyState
        icon="camera"
        title={strings.scanner.permissionRequiredTitle}
        description={strings.scanner.permissionRequiredDescription}
        actionLabel={strings.scanner.permissionRequiredAction}
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
                navigation.replace(
                  featureFlags.enableBookDetailScreen ? 'BookDetail' : 'SearchResult',
                  {
                    isbn,
                  }
                );
              }
        }
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.overlay} pointerEvents="none">
        <Text style={styles.helpText}>{strings.scanner.helpText}</Text>
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
    width: 300,
    height: 100,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
});
