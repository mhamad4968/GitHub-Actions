const DECIMAL_PATTERN = /^([+-]?)(\d+)(?:\.(\d*))?$/;

function pow10(exponent) {
  return 10n ** BigInt(exponent);
}

function parse(value) {
  if (typeof value !== "string") {
    throw new TypeError("Decimal values must be strings");
  }
  // kintone / 移行データに千区切り（634,200）が混入しても受理する。
  const text = value.trim().replace(/[,，]/g, "");
  const match = DECIMAL_PATTERN.exec(text);
  if (!match) {
    throw new TypeError(`Invalid decimal: ${value}`);
  }
  const fraction = match[3] ?? "";
  const sign = match[1] === "-" ? -1n : 1n;
  return normalizeParts(sign * BigInt(`${match[2]}${fraction}`), fraction.length);
}

function normalizeParts(coefficient, scale) {
  if (coefficient === 0n) return { coefficient: 0n, scale: 0 };
  let normalized = coefficient;
  let normalizedScale = scale;
  while (normalizedScale > 0 && normalized % 10n === 0n) {
    normalized /= 10n;
    normalizedScale -= 1;
  }
  return { coefficient: normalized, scale: normalizedScale };
}

function format({ coefficient, scale }) {
  if (coefficient === 0n) return "0";
  const negative = coefficient < 0n;
  const digits = (negative ? -coefficient : coefficient).toString();
  if (scale === 0) return `${negative ? "-" : ""}${digits}`;
  const padded = digits.padStart(scale + 1, "0");
  const split = padded.length - scale;
  return `${negative ? "-" : ""}${padded.slice(0, split)}.${padded.slice(split)}`;
}

function align(left, right) {
  const scale = Math.max(left.scale, right.scale);
  return {
    left: left.coefficient * pow10(scale - left.scale),
    right: right.coefficient * pow10(scale - right.scale),
    scale,
  };
}

function roundIntegerDivision(numerator, denominator) {
  if (denominator === 0n) throw new RangeError("Division by zero");
  const negative = (numerator < 0n) !== (denominator < 0n);
  const absoluteNumerator = numerator < 0n ? -numerator : numerator;
  const absoluteDenominator = denominator < 0n ? -denominator : denominator;
  let quotient = absoluteNumerator / absoluteDenominator;
  const remainder = absoluteNumerator % absoluteDenominator;
  if (remainder * 2n >= absoluteDenominator) quotient += 1n;
  return negative ? -quotient : quotient;
}

export function canonical(value) {
  return format(parse(value));
}

export function add(leftValue, rightValue) {
  const aligned = align(parse(leftValue), parse(rightValue));
  return format(normalizeParts(aligned.left + aligned.right, aligned.scale));
}

export function subtract(leftValue, rightValue) {
  const aligned = align(parse(leftValue), parse(rightValue));
  return format(normalizeParts(aligned.left - aligned.right, aligned.scale));
}

export function multiply(leftValue, rightValue) {
  const left = parse(leftValue);
  const right = parse(rightValue);
  return format(
    normalizeParts(left.coefficient * right.coefficient, left.scale + right.scale),
  );
}

export function sum(values) {
  return values.reduce((total, value) => add(total, value), "0");
}

export function round(value, decimalPlaces = 0) {
  if (!Number.isSafeInteger(decimalPlaces) || decimalPlaces < 0) {
    throw new RangeError("decimalPlaces must be a non-negative safe integer");
  }
  const decimal = parse(value);
  if (decimal.scale <= decimalPlaces) return format(decimal);
  const divisor = pow10(decimal.scale - decimalPlaces);
  return format(
    normalizeParts(
      roundIntegerDivision(decimal.coefficient, divisor),
      decimalPlaces,
    ),
  );
}

export function divideAndRound(
  numeratorValue,
  denominatorValue,
  decimalPlaces,
) {
  if (!Number.isSafeInteger(decimalPlaces) || decimalPlaces < 0) {
    throw new RangeError("decimalPlaces must be a non-negative safe integer");
  }
  const numerator = parse(numeratorValue);
  const denominator = parse(denominatorValue);
  const scaledNumerator =
    numerator.coefficient * pow10(denominator.scale + decimalPlaces);
  const scaledDenominator =
    denominator.coefficient * pow10(numerator.scale);
  return format(
    normalizeParts(
      roundIntegerDivision(scaledNumerator, scaledDenominator),
      decimalPlaces,
    ),
  );
}

export function compare(leftValue, rightValue) {
  const aligned = align(parse(leftValue), parse(rightValue));
  return aligned.left < aligned.right ? -1 : aligned.left > aligned.right ? 1 : 0;
}
