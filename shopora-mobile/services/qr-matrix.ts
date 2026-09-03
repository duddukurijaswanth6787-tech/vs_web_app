/**
 * Pure TypeScript QR Code generator for React Native SVG.
 * Zero external network dependencies, 100% offline, instantaneous rendering.
 */

// Simple QR Code matrix generator supporting byte encoding (Latin-1/ASCII/UTF-8)
export class QrCodeEncoder {
  private static readonly PAD0 = 0xec;
  private static readonly PAD1 = 0x11;

  // GF(256) log and exp tables for Reed-Solomon error correction
  private static EXP_TABLE = new Uint8Array(256);
  private static LOG_TABLE = new Uint8Array(256);
  private static tablesInitialized = false;

  private static initTables() {
    if (this.tablesInitialized) return;
    let x = 1;
    for (let i = 0; i < 255; i++) {
      this.EXP_TABLE[i] = x;
      this.LOG_TABLE[x] = i;
      x = (x << 1) ^ (x & 0x80 ? 0x11d : 0);
    }
    this.EXP_TABLE[255] = this.EXP_TABLE[0];
    this.tablesInitialized = true;
  }

  private static gmul(a: number, b: number): number {
    if (a === 0 || b === 0) return 0;
    this.initTables();
    return this.EXP_TABLE[(this.LOG_TABLE[a] + this.LOG_TABLE[b]) % 255];
  }

  private static rsPoly(numEc: number): Uint8Array {
    let poly = new Uint8Array([1]);
    for (let i = 0; i < numEc; i++) {
      const next = new Uint8Array(poly.length + 1);
      for (let j = 0; j < poly.length; j++) {
        next[j] ^= this.gmul(poly[j], this.EXP_TABLE[i]);
        next[j + 1] ^= poly[j];
      }
      poly = next;
    }
    return poly;
  }

  private static rsEncode(data: Uint8Array, numEc: number): Uint8Array {
    this.initTables();
    const poly = this.rsPoly(numEc);
    const res = new Uint8Array(data.length + numEc);
    res.set(data, 0);
    for (let i = 0; i < data.length; i++) {
      const coef = res[i];
      if (coef !== 0) {
        for (let j = 0; j < poly.length; j++) {
          res[i + j] ^= this.gmul(poly[j], coef);
        }
      }
    }
    return res.subarray(data.length);
  }

  // Version specs: [version, totalModules, totalDataBytes, ecBytes]
  // We determine version dynamically based on string length (Level M)
  private static getVersionCapacity(length: number): { version: number; size: number; dataBytes: number; ecBytes: number } {
    const capacities = [
      { version: 1, size: 21, dataBytes: 16, ecBytes: 10 },
      { version: 2, size: 25, dataBytes: 28, ecBytes: 16 },
      { version: 3, size: 29, dataBytes: 44, ecBytes: 26 },
      { version: 4, size: 33, dataBytes: 64, ecBytes: 36 },
      { version: 5, size: 37, dataBytes: 86, ecBytes: 48 },
      { version: 6, size: 41, dataBytes: 108, ecBytes: 64 },
      { version: 7, size: 45, dataBytes: 124, ecBytes: 72 },
      { version: 8, size: 49, dataBytes: 154, ecBytes: 88 },
      { version: 9, size: 53, dataBytes: 182, ecBytes: 110 },
      { version: 10, size: 57, dataBytes: 216, ecBytes: 130 },
      { version: 11, size: 61, dataBytes: 242, ecBytes: 150 },
      { version: 12, size: 65, dataBytes: 282, ecBytes: 176 },
    ];
    for (const cap of capacities) {
      if (length + 3 <= cap.dataBytes) {
        return cap;
      }
    }
    return capacities[capacities.length - 1];
  }

  /**
   * Generates a 2D matrix of boolean (true = black, false = white)
   */
  public static encode(text: string): boolean[][] {
    const utf8Bytes = new TextEncoder().encode(text);
    const spec = this.getVersionCapacity(utf8Bytes.length);
    const size = spec.size;

    const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
    const isReserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

    // 1. Position detection patterns (top-left, top-right, bottom-left)
    const drawFinder = (r0: number, c0: number) => {
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          const row = r0 + r;
          const col = c0 + c;
          if (row >= 0 && row < size && col >= 0 && col < size) {
            isReserved[row][col] = true;
            if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
              if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
                matrix[row][col] = true;
              } else {
                matrix[row][col] = false;
              }
            } else {
              matrix[row][col] = false;
            }
          }
        }
      }
    };
    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    // 2. Alignment patterns (version >= 2)
    if (spec.version >= 2) {
      const alignCoords = this.getAlignmentPatternPositions(spec.version);
      for (const ar of alignCoords) {
        for (const ac of alignCoords) {
          if (isReserved[ar][ac]) continue;
          for (let r = -2; r <= 2; r++) {
            for (let c = -2; c <= 2; c++) {
              const row = ar + r;
              const col = ac + c;
              isReserved[row][col] = true;
              matrix[row][col] = Math.max(Math.abs(r), Math.abs(c)) !== 1;
            }
          }
        }
      }
    }

    // 3. Timing patterns
    for (let i = 8; i < size - 8; i++) {
      if (!isReserved[6][i]) {
        matrix[6][i] = i % 2 === 0;
        isReserved[6][i] = true;
      }
      if (!isReserved[i][6]) {
        matrix[i][6] = i % 2 === 0;
        isReserved[i][6] = true;
      }
    }

    // Dark module
    matrix[4 * spec.version + 9][8] = true;
    isReserved[4 * spec.version + 9][8] = true;

    // Reserve format info areas
    for (let i = 0; i < 9; i++) {
      if (i < size) {
        isReserved[8][i] = true;
        isReserved[i][8] = true;
        isReserved[8][size - 1 - i] = true;
        isReserved[size - 1 - i][8] = true;
      }
    }

    // 4. Data bitstream: Byte mode (0100) + 8-bit length + data + terminator + pad
    const bits: number[] = [];
    // Mode: Byte = 0100
    bits.push(0, 1, 0, 0);
    // Char count (8 bits for v1-9, 16 bits for v10+)
    const charCountBits = spec.version < 10 ? 8 : 16;
    for (let i = charCountBits - 1; i >= 0; i--) {
      bits.push((utf8Bytes.length >> i) & 1);
    }
    // Data bytes
    for (const b of utf8Bytes) {
      for (let i = 7; i >= 0; i--) {
        bits.push((b >> i) & 1);
      }
    }
    // Terminator (up to 4 zeroes)
    const totalDataBits = spec.dataBytes * 8;
    const termLength = Math.min(4, totalDataBits - bits.length);
    for (let i = 0; i < termLength; i++) bits.push(0);

    // Pad to byte boundary
    while (bits.length % 8 !== 0) bits.push(0);

    // Byte padding (0xEC, 0x11)
    const dataBytesArray = new Uint8Array(spec.dataBytes);
    let byteIdx = 0;
    for (let i = 0; i < bits.length; i += 8) {
      let byteVal = 0;
      for (let b = 0; b < 8; b++) {
        byteVal = (byteVal << 1) | bits[i + b];
      }
      dataBytesArray[byteIdx++] = byteVal;
    }
    let pad = 0;
    while (byteIdx < spec.dataBytes) {
      dataBytesArray[byteIdx++] = pad % 2 === 0 ? this.PAD0 : this.PAD1;
      pad++;
    }

    // Error correction
    const ecData = this.rsEncode(dataBytesArray, spec.ecBytes);
    const finalCodewords = new Uint8Array(dataBytesArray.length + ecData.length);
    finalCodewords.set(dataBytesArray, 0);
    finalCodewords.set(ecData, dataBytesArray.length);

    // Convert codewords to bits
    const finalBits: number[] = [];
    for (const cw of finalCodewords) {
      for (let i = 7; i >= 0; i--) {
        finalBits.push((cw >> i) & 1);
      }
    }

    // 5. Place data bits (right to left, zig-zag)
    let bitIndex = 0;
    let upwards = true;
    for (let right = size - 1; right > 0; right -= 2) {
      if (right === 6) right--; // Skip vertical timing pattern
      for (let vert = 0; vert < size; vert++) {
        const row = upwards ? size - 1 - vert : vert;
        for (let colOffset = 0; colOffset < 2; colOffset++) {
          const col = right - colOffset;
          if (!isReserved[row][col]) {
            let bit = 0;
            if (bitIndex < finalBits.length) {
              bit = finalBits[bitIndex++];
            }
            // Mask pattern 0: (row + col) % 2 === 0
            const mask = (row + col) % 2 === 0;
            matrix[row][col] = (bit === 1) !== mask;
          }
        }
      }
      upwards = !upwards;
    }

    // 6. Draw format information (Mask 0, EC Level M = 00)
    // Precalculated format bits for EC=M, Mask=0 with BCH: 101010000010010
    const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
    for (let i = 0; i < 6; i++) matrix[8][i] = formatBits[i] === 1;
    matrix[8][7] = formatBits[6] === 1;
    matrix[8][8] = formatBits[7] === 1;
    matrix[7][8] = formatBits[8] === 1;
    for (let i = 0; i < 6; i++) matrix[5 - i][8] = formatBits[9 + i] === 1;

    for (let i = 0; i < 8; i++) matrix[size - 1 - i][8] = formatBits[i] === 1;
    for (let i = 0; i < 7; i++) matrix[8][size - 7 + i] = formatBits[8 + i] === 1;

    return matrix;
  }

  private static getAlignmentPatternPositions(version: number): number[] {
    if (version === 1) return [];
    const positions: Record<number, number[]> = {
      2: [6, 18],
      3: [6, 22],
      4: [6, 26],
      5: [6, 30],
      6: [6, 34],
      7: [6, 22, 38],
      8: [6, 24, 42],
      9: [6, 26, 46],
      10: [6, 28, 50],
      11: [6, 30, 54],
      12: [6, 32, 58],
    };
    return positions[version] || [6, 4 * version + 10];
  }
}
