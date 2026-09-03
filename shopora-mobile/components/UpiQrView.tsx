import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import QRCode from 'qrcode';

interface UpiQrViewProps {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
}

export const UpiQrView: React.FC<UpiQrViewProps> = ({
  value,
  size = 220,
  color = '#000000',
  backgroundColor = '#ffffff',
}) => {
  const { pathData, viewBoxSize } = useMemo(() => {
    try {
      if (!value) return { pathData: '', viewBoxSize: 21 };
      
      // Generate standard ISO/IEC 18004 QR Code Matrix
      const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
      const mSize = qr.modules.size;
      const margin = 4; // Standard 4-module quiet zone for fast camera detection
      const totalSize = mSize + margin * 2;
      
      let d = '';
      for (let r = 0; r < mSize; r++) {
        for (let c = 0; c < mSize; c++) {
          if (qr.modules.get(r, c)) {
            // Draw 1x1 square module
            d += `M${c + margin},${r + margin}h1v1h-1z `;
          }
        }
      }
      return { pathData: d, viewBoxSize: totalSize };
    } catch (e) {
      console.warn('QRCode generation failed:', e);
      return { pathData: '', viewBoxSize: 21 };
    }
  }, [value]);

  if (!pathData) {
    return <View style={{ width: size, height: size, backgroundColor }} />;
  }

  return (
    <View style={[styles.container, { width: size, height: size, backgroundColor }]}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      >
        <Rect width={viewBoxSize} height={viewBoxSize} fill={backgroundColor} />
        <Path d={pathData} fill={color} />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 12,
  },
});
