import { BlurView } from 'expo-blur';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { track } from '../../analytics';
import { strings } from '../../i18n/strings';
import { spacing } from '../../theme/spacing';
import { useTheme } from '../../theme/ThemeProvider';
import { typography } from '../../theme/typography';
import { EmptyState } from '../../components/EmptyState';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { isValidIsbn, normalizeIsbn } from '../../lib/isbn';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'BarcodeScanner'>;

const FRAME_WIDTH = 280;
const FRAME_HEIGHT = 160;
const CORNER = 28;
const CORNER_THICKNESS = 4;

function CornerBracket({ style }: { style: object }) {
  return <View style={[styles.corner, style]} />;
}

export function BarcodeScannerScreen({ navigation }: Props) {
  const { colors } = useTheme();
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
        containerStyle={{ backgroundColor: colors.groupedBackground }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'upc_a', 'code128', 'code39'],
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
                navigation.replace('SearchResult', {
                  isbn,
                });
              }
        }
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.helpPillWrapper}>
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          <Text style={styles.helpText}>{strings.scanner.helpText}</Text>
        </View>

        <View style={styles.scanFrame}>
          <CornerBracket style={styles.cornerTopLeft} />
          <CornerBracket style={styles.cornerTopRight} />
          <CornerBracket style={styles.cornerBottomLeft} />
          <CornerBracket style={styles.cornerBottomRight} />
        </View>
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
  helpPillWrapper: {
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xl,
  },
  helpText: {
    ...typography.subhead,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
  scanFrame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: '#ffffff',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 8,
  },
});
