import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { QrCodeEncoder } from '../services/qr-matrix';

interface UpiQrViewProps {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
}

export const UpiQrView: React.FC<UpiQrViewProps> = ({
  value,
  size = 200,
  color = '#0f172a',
  backgroundColor = '#ffffff',
}) => {
  const { pathData, matrixSize } = useMemo(() => {
    try {
      if (!value) return { pathData: '', matrixSize: 21 };
      const matrix = QrCodeEncoder.encode(value);
      const mSize = matrix.length;
      let d = '';

      for (let r = 0; r < mSize; r++) {
        for (let c = 0; c < mSize; c++) {
          if (matrix[r][c]) {
            // Add square to SVG path
            d += `M${c},${r}h1v1h-1z `;
          }
        }
      }
      return { pathData: d, matrixSize: mSize };
    } catch (e) {
      console.warn('QR matrix encoding fallback:', e);
      return { pathData: '', matrixSize: 21 };
    }
  }, [value]);

  if (!pathData) {
    return <View style={{ width: size, height: size, backgroundColor }} />;
  }

  // Add 2 modules quiet zone margin
  const quietZone = 2;
  const viewBoxSize = matrixSize + quietZone * 2;

  return (
    <View style={[styles.container, { width: size, height: size, backgroundColor }]}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      >
        <Path
          d={pathData}
          fill={color}
          transform={`translate(${quietZone}, ${quietZone})`}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    overflow: 'hidden',
  },
});
