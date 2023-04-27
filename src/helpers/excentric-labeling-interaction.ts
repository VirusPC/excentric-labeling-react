import * as d3 from "d3";
import excentricLabeling from "excentric-labeling";
import { renderLens, renderBBoxs, renderTexts, renderLines } from "./render";
import { computeSizeOfLabels, nearestPoint, randomPoint } from "./helpers";

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
  setStateFuncs: {
    setCurLabel?: (currentlabel: string) => void,
    setRandomLabel?: (randowmLabel: string) => void
  } = {}
) {
  const {
    lensRadius,
    fontSize,
    maxLabelsNum,
    shouldVerticallyCoherent,
    shouldHorizontallyCoherent,
  } = interactionParams;
  const { setCurLabel, setRandomLabel } = setStateFuncs;

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
    // const mouseCoordinate = { x: mousePosition[0], y: mousePosition[1] };

    const layoutInfos = computer(points, x, y, false);

    groupLabels.selectAll("*").remove();
    updateLens({ x, y, itemNum: computer.elementsNumInLens() });
    renderLines(groupLabels, layoutInfos);
    renderBBoxs(groupLabels, layoutInfos);
    renderTexts(groupLabels, layoutInfos, fontSize);

    /** @type {PointWithInfo[]} */
    const selectedPoints = layoutInfos.map(li => li.rawInfo);
    const np = nearestPoint({ x, y }, selectedPoints) as RawInfo;
    const rp = randomPoint(selectedPoints) as RawInfo;
    // side effects
    if (setCurLabel) setCurLabel(np?.label ?? "")
    if (setRandomLabel) setRandomLabel(rp?.label ?? "")
  }

  function onMouseleave(e: MouseEvent) {
    groupTooltip.style("visibility", "hidden");
  }
}


