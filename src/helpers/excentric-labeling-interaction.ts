import * as d3 from "d3";
import excentricLabeling from "excentric-labeling";
import { renderLens, renderBBoxs, renderTexts, renderLines } from "./render";
import { computeSizeOfLabels, nearestPoint } from "./helpers";

type InteractionParams = {
  lensRadius: number,  // the radius of lens
  fontSize: number,  // the font size of all texts
  maxLabelsNum: number,  // how many labels can be showed at ones at most
  shouldHorizontallyCoherent: boolean,  //  enable vertically coherent labeling
  shouldVerticallyCoherent: boolean //  enable horizontally coherent labeling
}

type RawInfo = {
  x: number,
  y: number,
  color: string,
  label: string,
  labelWidth: number,
  labelHeight: number,
}

type RootSelection = d3.Selection<SVGElement, unknown, any, unknown>

export default function addExcentricLabelingInteraction(
  root: RootSelection,
  width: number,
  height: number,
  points: RawInfo[],
  interactionParams: InteractionParams,
  listeners: {
    onMove?: (selectedRawInfos: RawInfo[], nearest: RawInfo|undefined) => void;
  } = {}
) {
  const {
    lensRadius,
    fontSize,
    maxLabelsNum,
    shouldVerticallyCoherent,
    shouldHorizontallyCoherent,
  } = interactionParams;
  const { onMove } = listeners;

  const groupTooltip = root
    .append("g")
    .attr("class", "groupTooltip ")
    .attr("visibility", "hidden");
  const groupLabels = groupTooltip.append("g").attr("class", "groupLabels");
  const groupOverlay = root.append("g").attr("class", "groupOverlay ");
  const groupLens = groupTooltip.append("g").attr("class", "groupLens");

  groupOverlay
    .append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("opacity", 0)
    .on("mouseenter", onMouseenter)
    .on("mousemove", onMousemove)
    .on("mouseleave", onMouseleave);

  const updateLens = renderLens(groupLens, 0, 0, lensRadius, fontSize);


  const computer = excentricLabeling();
  computer.radius(lensRadius);
  computer.maxLabelsNum(maxLabelsNum);
  computer.horizontallyCoherent(shouldHorizontallyCoherent);
  computer.verticallyCoherent(shouldVerticallyCoherent);

  function onMouseenter(e: MouseEvent) {
    groupTooltip.style("visibility", "visible");
  }

  function onMousemove(e: MouseEvent) {
    const [x, y] = d3.pointer(e, groupOverlay.node());

    const layoutInfos = computer(points, x, y);
    console.log(layoutInfos);

    groupLabels.selectAll("*").remove();
    updateLens({ x, y, itemNum: computer.elementsNumInLens() });
    renderLines(groupLabels, layoutInfos);
    renderBBoxs(groupLabels, layoutInfos);
    renderTexts(groupLabels, layoutInfos, fontSize);

    /** @type {PointWithInfo[]} */
    const selectedPoints = layoutInfos.map(li => li.rawInfo) as RawInfo[];
    const np = nearestPoint({ x, y }, selectedPoints) as RawInfo|undefined;
    // side effects
    onMove && onMove(selectedPoints, np);
  }

  function onMouseleave(e: MouseEvent) {
    groupTooltip.style("visibility", "hidden");
  }

  // Todo: add listener
  // function on(eventName: string, listener: () => void){

  // }
  // return {
  //   on
  // }
}



