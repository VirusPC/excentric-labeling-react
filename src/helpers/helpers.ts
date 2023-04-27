import { Selection } from "d3";

type Point = {
  x: number;
  y: number;
}
type ItemWithInfo = Point & {
  label: string,
  labelWidth: number,
  labelHeight: number,
  [redundantProp: string]: any;
}
export function computeSizeOfLabels(rawInfos: ItemWithInfo[], root: Selection<SVGElement, unknown, SVGElement, unknown>, fontSize: number) {
  const tempInfoAttr = "labelText";
  const tempClass = "temp" + String(new Date().getMilliseconds());
  const tempMountPoint = root.append("svg:g").attr("class", tempClass);
  rawInfos.forEach(
    (rawInfo) =>
    (rawInfo[tempInfoAttr] = tempMountPoint
      .append("text")
      .attr("opacity", "0")
      .attr("font-size", fontSize)
      .attr("x", -Number.MAX_SAFE_INTEGER)
      .attr("y", -Number.MAX_SAFE_INTEGER)
      .text(rawInfo.label)
      .node())
  );
  root?.node()?.appendChild(tempMountPoint.node() as Node);
  rawInfos.forEach((rawInfo) => {
    const labelBBox = rawInfo[tempInfoAttr].getBBox();
    rawInfo.labelWidth = labelBBox.width;
    rawInfo.labelHeight = labelBBox.height;
  });
  root.select("." + tempClass).remove();
  rawInfos.forEach((rawInfo) => delete rawInfo[tempInfoAttr]);
}



export function nearestPoint(center: Point, points: Point[]) {
  if (points.length <= 0) return;

  /** @type {Point} */
  let nearestPoint = points[0];
  let minDist = Number.MAX_VALUE;
  points.forEach((point) => {
    const dist = distance(center, point);
    if (dist < minDist) {
      minDist = dist;
      nearestPoint = point;
    }
  });
  return nearestPoint;
}

function distance(point1: Point, point2: Point) {
  return Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2);
}