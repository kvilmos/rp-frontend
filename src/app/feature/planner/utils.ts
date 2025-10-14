import { array } from 'three/src/nodes/TSL.js';

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/*
export function removeValue(array: any, value: any) {
  for (let tI = array.length - 1; tI >= 0; tI--) {
    if (array[tI] === value) {
      array.splice(tI, 1);
    }
  }
}
  */

export function pointDistanceFromLine(
  x: number,
  y: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  var tPoint = closestPointOnLine(x, y, x1, y1, x2, y2);
  var tDx = x - tPoint.x;
  var tDy = y - tPoint.y;
  return Math.sqrt(tDx * tDx + tDy * tDy);
}

export function closestPointOnLine(
  x: number,
  y: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { x: number; y: number } {
  // Inspired by: http://stackoverflow.com/a/6853926
  const tA = x - x1;
  const tB = y - y1;
  const tC = x2 - x1;
  const tD = y2 - y1;

  const tDot = tA * tC + tB * tD;
  const tLenSq = tC * tC + tD * tD;
  const tParam = tDot / tLenSq;

  let tXx, tYy;

  if (tParam < 0 || (x1 === x2 && y1 === y2)) {
    tXx = x1;
    tYy = y1;
  } else if (tParam > 1) {
    tXx = x2;
    tYy = y2;
  } else {
    tXx = x1 + tParam * tC;
    tYy = y1 + tParam * tD;
  }

  return {
    x: tXx,
    y: tYy,
  };
}

export function angle2pi(x1: number, y1: number, x2: number, y2: number): number {
  let tTheta = getAngle(x1, y1, x2, y2);
  if (tTheta < 0) {
    tTheta += 2 * Math.PI;
  }
  return tTheta;
}

export function getAngle(x1: number, y1: number, x2: number, y2: number): number {
  const tDot = x1 * x2 + y1 * y2;
  const tDet = x1 * y2 - y1 * x2;
  const tAngle = -Math.atan2(tDet, tDot);
  return tAngle;
}

export function cycle(arr: any[], shift: any) {
  var tReturn = arr.slice(0);
  for (var tI = 0; tI < shift; tI++) {
    var tmp = tReturn.shift();
    tReturn.push(tmp);
  }
  return tReturn;
}

export function cycle_OnTest<T>(arr: T[], shift: number): T[] {
  const effectiveShift = shift % array.length;
  if (effectiveShift === 0) {
    return [...arr];
  }

  const partToMove = arr.slice(0, effectiveShift);
  const remainingPart = arr.slice(effectiveShift);
  return [...remainingPart, ...partToMove];
}

export function map(array: any[], func: any) {
  var tResult: any[] = [];
  array.forEach((element) => {
    tResult.push(func(element));
  });
  return tResult;
}

export function removeIf(array: any[], func: any) {
  var tResult: any[] = [];
  array.forEach((element) => {
    if (!func(element)) {
      tResult.push(element);
    }
  });
  return tResult;
}

export function isClockwise(points: any[][]): boolean {
  // make positive
  let tSubX = Math.min(
    0,
    Math.min.apply(
      null,
      map(points, function (p: { x: any }) {
        return p.x;
      })
    )
  );
  let tSubY = Math.min(
    0,
    Math.min.apply(
      null,
      map(points, function (p: { x: any }) {
        return p.x;
      })
    )
  );

  var tNewPoints = map(points, function (p: { x: number; y: number }) {
    return {
      x: p.x - tSubX,
      y: p.y - tSubY,
    };
  });

  // determine CW/CCW, based on:
  // http://stackoverflow.com/questions/1165647
  var tSum = 0;
  for (var tI = 0; tI < tNewPoints.length; tI++) {
    var tC1 = tNewPoints[tI];
    var tC2: any;
    if (tI === tNewPoints.length - 1) {
      tC2 = tNewPoints[0];
    } else {
      tC2 = tNewPoints[tI + 1];
    }
    tSum += (tC2.x - tC1.x) * (tC2.y + tC1.y);
  }
  return tSum >= 0;
}

export function hasValue<T>(array: T[], value: T): boolean {
  for (var tI = 0; tI < array.length; tI++) {
    if (array[tI] === value) {
      return true;
    }
  }
  return false;
}

export function cmToMeasure(cm: number): string {
  return '' + Math.round(10 * cm) / 1000 + ' m';
}
