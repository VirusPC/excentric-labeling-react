import * as d3 from "d3";
import _, { update } from "lodash";
import excentricLabeling from "excentric-labeling";



/**
 * Add excentric labeling interaction to the root element. 
 * 
 * @typedef {Object} Point - point
 * @property {number} points.x - used for calculate position information.
 * @property {number} points.y - used for calculate position information.
 * @property {string} points.label - used for set the label text content.
 * @property {string} points.color - used for set the color of labels corresponding lines.
 * 
 * @typedef {Object} RawInfo - object passed to excentric labeling computer
 * @property {number} points.x - used for calculate position information.
 * @property {number} points.y - used for calculate position information.
 * @property {number} labelWidth - width of the corresponding label
 * @property {number} labelHeight - height of the corresponding label
 * 
 * @param {SVGGElement} root svg group element to mount
 * @param {number} width 
 * @param {number} height 
 * 
 * @param {Point[]} points
 * @param {object} interactionParams some parameters can be adjusted.
 * @param {string | number} interactionParams.lensRadius the radius of lens.
 iiｉ* @param {string | number} interactionParams.fontSize the font size of all texts.
 * @param {string | number} interactionParams.maxLabelsNum how many labels can be showed at ones at most. 
 * @param {boolean} interactionParams.shouldVerticallyCoherent open the function: vertically coherent labeling.
 * @param {boolean} interactionParams.shouldHorizontallyCoherent open the function: horizontally coherent labeling.
 * 
 * @param {object} setStateFuncs some setState functions, which can produce some side effects.
 * @param {(currentlabel: string) => void} setStateFuncs.setCurLabel 
 * @param {(randowmLabel: string) => void} setStateFuncs.setRandomLabel
 */
export default function addExcentricLabelingInteraction(
  root,
  width,
  height,
  points,
  interactionParams,
  setStateFuncs
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

  console.log("lens", groupLabels.node());

  // const {lensRadius, fontSize, maxLabelsNum, shouldHorizontallyCoherent, shouldVerticallyCoherent} = interactionParams;
  const computer = excentricLabeling();
  computer.radius(lensRadius);
  computer.maxLabelsNum(maxLabelsNum);
  computer.horizontallyCoherent(shouldHorizontallyCoherent);
  computer.verticallyCoherent(shouldVerticallyCoherent);

  const rawInfos = getRawInfos(points, groupLabels, fontSize);

  // .verticallyCoherent(shouldHorizontallyCoherent)
  // computer.shouldHorizontallyCoherent(shouldHorizontallyCoherent)
  // computer.shouldVerticallyCoherent(shouldVerticallyCoherent)

  function onMouseenter(e) {
    groupTooltip.style("visibility", "visible");
  }

  function onMousemove(e) {
    const [x, y] = d3.pointer(e, groupOverlay.node());
    // const mouseCoordinate = { x: mousePosition[0], y: mousePosition[1] };

    const layoutInfos = computer(rawInfos, x, y);

    groupLabels.selectAll("*").remove();
    updateLens({x, y, itemNum: computer.elementsNumInLens()});
    renderLines(groupLabels, layoutInfos);
    renderBBoxs(groupLabels, layoutInfos);
    renderTexts(groupLabels, layoutInfos, fontSize);
    // groupTooltip.attr("transform", `translate(${mouseCoordinate.x}, ${mouseCoordinate.y})`)
    // groupLabels.selectAll("*").remove();
    // renderLabels(groupLabels, groupedLines, fontSize);
    // computeTranslatedControlPoint(groupLabels);
    // translateLabels(groupLabels);
    // renderLines(groupLabels, groupedLines);

    /** @type {Point[]} */
    const selectedPoints = layoutInfos.map(li => li.rawInfo);
    const np = nearestPoint({x,y}, selectedPoints);
    const rp = randomPoint(selectedPoints);
    // side effects
    if(setCurLabel) setCurLabel(np?.label ?? "")
    if(setRandomLabel) setRandomLabel(rp?.label ?? "")
  }

  function onMouseleave(e) {
    groupTooltip.style("visibility", "hidden");
  }
}

/**
 * 
 * @param {Point[]} points 
 * @param {d3.Selection} root 
 * @param {number} fontSize
 * @returns {RawInfo[]}
 */
function getRawInfos(points, root, fontSize) {
  const rawInfos = points.map((point) => {
    return {
      ...point,
      labelWidth: 0,
      labelHeight: 0,
    };
  });
  computeSizeOfLabels(rawInfos, root, fontSize);
  return rawInfos;
}

function computeSizeOfLabels(rawInfos, root, fontSize) {
  const tempInfoAttr = "labelText";
  const tempClass = "temp" + String(new Date().getMilliseconds());
  //const tempMountPoint = d3.create("svg:g").attr("class", tempClass);
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
  root.node().appendChild(tempMountPoint.node());
  rawInfos.forEach((rawInfo) => {
    const labelBBox = rawInfo[tempInfoAttr].getBBox();
    rawInfo.labelWidth = labelBBox.width;
    rawInfo.labelHeight = labelBBox.height;
  });
  root.select("." + tempClass).remove();
  rawInfos.forEach((rawInfo) => delete rawInfo[tempInfoAttr]);
}

/**
 *
 * @param {d3.Selection} root
 * @param {number} x
 * @param {number} y
 * @param {number} lensRadius
 * @param {number} fontSize
 */
function renderLens(root, x, y, lensRadius, fontSize) {
  const strokeColor = "green",
    strokeWidth = "1px",
    countLabelWidth = 30,
    countLabelDistance = 20;

  root
    .append("circle")
    .attr("class", "lens")
    .attr("cx", 0)
    .attr("cx", 0)
    .attr("r", lensRadius)
    .attr("fill", "none")
    .attr("stroke", strokeColor)
    .attr("stroke-width", strokeWidth);
  root
    .append("line")
    .attr("stroke", strokeColor)
    .attr("stroke-width", strokeWidth)
    .attr("y1", -lensRadius)
    .attr("y2", -(lensRadius + countLabelDistance));
  const countLabel = root
    .append("text")
    .text("0")
    .attr("class", "lensLabelText")
    .attr("font-size", fontSize)
    .attr("y", -(lensRadius + countLabelDistance + 4))
    .attr("text-anchor", "middle")
    .attr("fill", strokeColor);
  const countLabelBoundingClientRect = countLabel
    .node()
    .getBoundingClientRect();
  root
    .append("rect")
    .attr("class", "lensLabelBorder")
    .attr("stroke", strokeColor)
    .attr("stroke-width", strokeWidth)
    .attr("fill", "none")
    .attr("x", -countLabelWidth >> 1)
    .attr(
      "y",
      -(lensRadius + countLabelBoundingClientRect.height + countLabelDistance)
    )
    .attr("width", countLabelWidth)
    .attr("height", countLabelBoundingClientRect.height);
  /**
   * 
   * @param {object} params 
   * @param {number=} params.x
   * @param {number=} params.y
   * @param {number=} params.itemNum
   */
  function updateLens(params) {
    const {x, y, itemNum} = params;
    if(itemNum !== undefined) {
      countLabel.text(itemNum);
    }
    if(x !== undefined && y !== undefined) {
      root.attr("transform", `translate(${x??0}, ${y??0})`)
    }
  }
  return updateLens;
}

function renderLines(root, layoutInfos) {
  const lineGroup = root.append("g").attr("class", "exentric-labeling-line");
  const lineGenerator = d3
    .line()
    .x((d) => d.x)
    .y((d) => d.y);
  lineGroup
    .selectAll("path")
    .data(layoutInfos)
    .join("path")
    .attr("fill", "none")
    .attr("stroke", (layoutInfo) => layoutInfo.rawInfo.color)
    .attr("d", (layoutInfo) => lineGenerator(layoutInfo.controlPoints));
}

function renderBBoxs(root, layoutInfos) {
  const bboxGroup = root.append("g").attr("class", "exentric-labeling-bbox");
  bboxGroup
    .selectAll("rect")
    .data(layoutInfos)
    .join("rect")
    .attr("class", "labelBBox")
    .attr("fill", "none")
    .attr("stroke", (layoutInfo) => layoutInfo.rawInfo.color)
    .attr("x", (layoutInfo) => layoutInfo.labelBBox.x)
    .attr("y", (layoutInfo) => layoutInfo.labelBBox.y)
    .attr("width", (layoutInfo) => layoutInfo.labelBBox.width)
    .attr("height", (layoutInfo) => layoutInfo.labelBBox.height);
}

function renderTexts(root, layoutInfos, fontSize) {
  const textGroup = root.append("g").attr("class", "exentric-labeling-text");
  textGroup
    .selectAll("text")
    .data(layoutInfos)
    .join("text")
    .attr("font-size", fontSize)
    .attr("stroke", (layoutInfo) => layoutInfo.rawInfo.color)
    .attr("x", (layoutInfo) => layoutInfo.labelBBox.x)
    .attr("y", (layoutInfo) => layoutInfo.labelBBox.y)
    .attr("dominant-baseline", "hanging")
    .text((layoutInfo) => layoutInfo.rawInfo.label);
}

/**
 * 
 * @param {object} center 
 * @param {number} center.x
 * @param {number} center.y
 * @param {Point[]} points
 * @returns 
 */
function nearestPoint(center, points) {
  if(points.length <=0) return;
  const distance = (point1, point2) => Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2);

  /** @type {Point} */
  let nearestPoint;
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

/**
 * @param {Point[]} points
 * @returns 
 */
function randomPoint(points){
  if(points.length <=0) return;
  const randomIndex = getRandomIntInclusive(0, points.length-1);
  return points[randomIndex];
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}