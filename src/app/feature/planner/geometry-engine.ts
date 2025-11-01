import { Injectable } from '@angular/core';
import { Corner } from './corner';
import { angle2pi, cycle_OnTest, isClockwise, map, removeIf } from './utils';

@Injectable({ providedIn: 'root' })
export class GeometryEngine {
  public findRooms(corners: Corner[]): Corner[][] {
    const loops: Corner[][] = [];
    corners.forEach((firstCorner) => {
      firstCorner.adjacentCorners().forEach((secondCorner) => {
        loops.push(this.findTightestCycle(firstCorner, secondCorner));
      });
    });

    const uniqueLoops = this.removeDuplicateRooms(loops);
    const uniqueCCWLoops = removeIf(uniqueLoops, isClockwise);

    return uniqueCCWLoops;
  }

  private findTightestCycle(firstCorner: Corner, secondCorner: Corner): Corner[] {
    const stack: {
      corner: Corner;
      previousCorners: Corner[];
    }[] = [];

    let next: { corner: Corner; previousCorners: Corner[] } | undefined;
    next = {
      corner: secondCorner,
      previousCorners: [firstCorner],
    };

    const visited: { [key: string]: boolean } = {};
    visited[firstCorner.id] = true;

    while (next) {
      const currentCorner = next.corner;
      visited[currentCorner.id] = true;

      if (next.corner === firstCorner && currentCorner !== secondCorner) {
        return next.previousCorners;
      }

      const addToStack: Corner[] = [];
      const adjacentCorners = next.corner.adjacentCorners();
      for (let i = 0; i < adjacentCorners.length; i++) {
        const nextCorner = adjacentCorners[i];

        if (
          nextCorner.id in visited &&
          !(nextCorner === firstCorner && currentCorner !== secondCorner)
        ) {
          continue;
        }

        addToStack.push(nextCorner);
      }

      const previousCorners = next.previousCorners.slice(0);
      previousCorners.push(currentCorner);
      if (addToStack.length > 1) {
        // visit the ones with smallest theta first
        const previousCorner = next.previousCorners[next.previousCorners.length - 1];
        addToStack.sort((a, b) => {
          return (
            this.calculateTheta(previousCorner, currentCorner, b) -
            this.calculateTheta(previousCorner, currentCorner, a)
          );
        });
      }

      if (addToStack.length > 0) {
        for (let i = 0; i < addToStack.length; i++) {
          stack.push({
            corner: addToStack[i],
            previousCorners: previousCorners,
          });
        }
      }

      next = stack.pop();
    }
    return [];
  }

  private calculateTheta(previousCorner: Corner, currentCorner: Corner, nextCorner: Corner) {
    const theta = angle2pi(
      previousCorner.x - currentCorner.x,
      previousCorner.y - currentCorner.y,
      nextCorner.x - currentCorner.x,
      nextCorner.y - currentCorner.y
    );
    return theta;
  }

  private removeDuplicateRooms(roomArray: Corner[][]): Corner[][] {
    const results: Corner[][] = [];
    const lookup: { [key: string]: boolean } = {};
    const hashFunc = function (corner: Corner) {
      return corner.id;
    };
    const sep = '-';
    for (let i = 0; i < roomArray.length; i++) {
      // rooms are cycles, shift it around to check uniqueness
      const room = roomArray[i];
      let add = true;
      let str;
      for (var j = 0; j < room.length; j++) {
        const roomShift = cycle_OnTest(room, j);
        str = map(roomShift, hashFunc).join(sep);
        if (lookup.hasOwnProperty(str)) {
          add = false;
        }
      }
      if (add && str) {
        results.push(roomArray[i]);
        lookup[str] = true;
      }
    }
    return results;
  }
}
