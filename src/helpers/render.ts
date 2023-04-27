import * as d3 from "d3";

type LayoutInfo = {
  x: number,
  y: number,
  left: boolean,  // indicate if label on the left or right
  controlPoints: { x:number, y: number}[],
  labelBBox: {
      x: number,
      y: number,
      width: number,
      height: number
  },
  rawInfo: any 
};

type RootSelection = d3.Selection<SVGGElement, unknown, any, unknown>

/**
 *
 * @param {d3.Selection} root
 * @param {number} x
 * @param {number} y
 * @param {number} lensRadius
 * @param {number} fontSize
 */
export function renderLens(root: RootSelection, x: number, y: number, lensRadius: number, fontSize: number) {
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
    .node()!  
    .getBoundingClientRect();
  root
    .append("rect")
    .attr("class", "lensLabelBorder")
    .attr("stroke", strokeColor)
    .attr("stroke-width", strokeWidth)
    .attr("fill", "none")
    .attr("transform", `translate(${x??0}, ${y??0})`)
    .attr("x", -countLabelWidth >> 1)
    .attr(
      "y",
      -(lensRadius + countLabelBoundingClientRect.height + countLabelDistance)
    )
    .attr("width", countLabelWidth)
    .attr("height", countLabelBoundingClientRect.height);

  function updateLens(params: {
    x: number,
    y: number,
    itemNum: number
  }) {
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


export function renderLines(root: RootSelection, layoutInfos: LayoutInfo[]) {
  const lineGroup = root.append("g").attr("class", "exentric-labeling-line");
  const lineGenerator = (d3
    .line() as d3.Line<LayoutInfo["controlPoints"][0]>)
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

/**
 * 
 * @param {d3.Selection} root 
 * @param {*} layoutInfos 
 */
export function renderBBoxs(root: RootSelection, layoutInfos: LayoutInfo[]) {
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

/**
 * 
 * @param {d3.Selection} root 
 * @param {*} layoutInfos 
 * @param {*} fontSize 
 */
export function renderTexts(root: RootSelection, layoutInfos: LayoutInfo[], fontSize: number) {
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
