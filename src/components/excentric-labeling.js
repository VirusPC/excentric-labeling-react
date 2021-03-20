import * as d3 from "d3";
import { text } from "d3";

/**
 * Add excentric labeling interaction to the root element. 
 * 
 * @param {SVGGElement} root svg group element to mount
 * @param {number} width 
 * @param {number} height 
 * 
 * @param {object} coordinates
 * @param {number} coordinates.x
 * @param {number} coordinates.y
 * @param {string} coordinates.label
 * @param {string} coordinates.color
 * 
 * @param {object} interactionParams 
 * @param {string | number} interactionParams.lensRadius 
 * @param {string | number} interactionParams.fontSize
 * @param {Function} interactionParams.setCurLabel
 * @param {Function} interactionParams.setRandomLabel
 */
export default function addExcenricLabelingInteraction(root, width, height, coordinates, interactionParams) {
  const { lensRadius, fontSize, setCurLabel, setRandomLabel } = interactionParams;
  const strokeColor = "green",
    strokeWidth = "1px",
    countLabelWidth = 30,
    countLabelDistance = 20;

  const groupTooltip = root.append("g")
    .attr("class", "groupTooltip ")
    .attr("visibility", "hidden");
  const groupLabels = root.append("g")
    .attr("class", "groupLabels")
  const groupOverlay = root.append("g")
    .attr("class", "groupOverlay ")
  const groupLens = groupTooltip.append("g")
    .attr("class", "groupLens");

  groupOverlay.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("opacity", 0)
    .on("mouseenter", onMouseenter)
    .on("mousemove", onMousemove)
    .on("mouseleave", onMouseleave)
  groupLens.append("circle")
    .attr("class", "lens")
    .attr("cx", 0)
    .attr("cx", 0)
    .attr("r", lensRadius)
    .attr("fill", "none")
    .attr("stroke", strokeColor)
    .attr("stroke-width", strokeWidth)
  groupLens.append("line")
    .attr("stroke", strokeColor)
    .attr("stroke-width", strokeWidth)
    .attr("y1", -lensRadius)
    .attr("y2", -(lensRadius + countLabelDistance))
  const countLabel = groupLens
    .append("text")
    .text("0")
    .attr("class", "lensLabelText")
    .attr("font-size", fontSize)
    .attr("y", - (lensRadius + countLabelDistance + 4))
    .attr("text-anchor", "middle")
    .attr("fill", strokeColor);
  const countLabelBoundingClientRect = countLabel.node().getBoundingClientRect();
  groupLens.append("rect")
    .attr("class", "lensLabelBorder")
    .attr("stroke", strokeColor)
    .attr("stroke-width", strokeWidth)
    .attr("fill", "none")
    .attr("x", - countLabelWidth >> 1)
    .attr("y", - (lensRadius + countLabelBoundingClientRect.height + countLabelDistance))
    .attr("width", countLabelWidth)
    .attr("height", countLabelBoundingClientRect.height);


  function onMouseenter(e) {
    groupTooltip.style("visibility", "visible")
  }

  function onMousemove(e) {
    const mousePosition = d3.pointer(e, groupOverlay.node());
    const mouseCoordinate = { x: mousePosition[0], y: mousePosition[1] };

    const { filteredCoords, nearestLabel, randomLabel } = extractLabelAndPosition(coordinates, mouseCoordinate, lensRadius);
    const lineCoords = computeInitialPosition(filteredCoords.slice(0, 10), mouseCoordinate, lensRadius);
    const orderedLineCoords = computeOrdering(lineCoords);
    const groupedLineCoords = assignLabelToLeftOrRight(orderedLineCoords);
    stackAccordingToOrder(groupedLineCoords, mouseCoordinate, countLabelBoundingClientRect.height);

    countLabel.text(filteredCoords.length);
    groupTooltip.attr("transform", `translate(${mouseCoordinate.x}, ${mouseCoordinate.y})`)
    groupLabels.selectAll("*").remove();
    renderLabels(groupLabels, groupedLineCoords, fontSize);
    translateLables(groupLabels);

    setCurLabel(nearestLabel)
    setRandomLabel(randomLabel)
  }

  function onMouseleave(e) {
    groupTooltip.style("visibility", "hidden")
  }

}

/*
 * step 1
 */
function extractLabelAndPosition(coordinates, coordinateMouse, radius) {
  const distance = (coordinate1, coordinate2) => Math.sqrt((coordinate1.x - coordinate2.x) ** 2 + (coordinate1.y - coordinate2.y) ** 2);

  let nearestLabel = "";
  let minDist = Number.MAX_VALUE;

  const filteredCoords = coordinates
    .filter((coordinateDot) => {
      const dist = distance(coordinateMouse, coordinateDot)
      if (dist > radius) {
        return false;
      }
      if (dist < minDist) {
        minDist = dist;
        nearestLabel = coordinateDot.label;
      }
      return true;
    });

  let randomLabel = "";
  if (filteredCoords.length > 0) {
    randomLabel = filteredCoords[Math.floor(Math.random() * (filteredCoords.length - 1))].label
  };

  return { filteredCoords: filteredCoords, nearestLabel: nearestLabel, randomLabel: randomLabel };

}


/*
 * step 2
 * project dot to the most recently position on lens circle.
 */
function computeInitialPosition(coordinates, mouseCoordinate, radius) {
  const lineCoordinates = [];
  for (let i = 0; i < coordinates.length; i++) {
    const coordinate = coordinates[i];
    const rad = Math.atan2(coordinate.y - mouseCoordinate.y, coordinate.x - mouseCoordinate.x);
    lineCoordinates.push({
      label: coordinate.label,
      color: coordinate.color,
      rad: rad,
      controlPoints: [
        {
          x: coordinate.x,
          y: coordinate.y
        }, // origin position
        {
          x: radius * Math.cos(rad) + mouseCoordinate.x,
          y: radius * Math.sin(rad) + mouseCoordinate.y
        }, // position prejected on circumference
      ],
    });
  }
  return lineCoordinates;
}

/*
 * step 3
 */
function computeOrdering(lineCoordinates) {
  const fullRad = 2 * Math.PI;
  const quarterRad = 0.5 * Math.PI;

  const negativeToPositive = rad => rad < 0 ? rad + fullRad : rad;
  const reverse = rad => -rad;
  const rotateAQuarter = rad => rad - quarterRad;

  lineCoordinates.forEach((line) => {
    const [rad] = [line.rad]
      .map(negativeToPositive)
      .map(reverse)
      .map(negativeToPositive)
      .map(rotateAQuarter)
      .map(negativeToPositive);
    line.radAjusted = rad;
  });
  const comparator = (line1, line2) => {
    return line1.radAjusted - line2.radAjusted;
  }
  return lineCoordinates.sort(comparator);
}

/*
 * step 4
 */
function assignLabelToLeftOrRight(lineCoordinates) {
  const groupedLineCoords = {
    left: [],
    right: [],
  }
  const halfRad = Math.PI;
  for (const lineCoord of lineCoordinates) {
    lineCoord.radAjusted < halfRad
      ? groupedLineCoords.left.push(lineCoord)
      : groupedLineCoords.right.push(lineCoord);
  }
  return groupedLineCoords;
}

/*
 * step 5
 */
function stackAccordingToOrder(groupedLineCoords, mouseCoordinate, labelHeight) {
  const horizontalMargin = 50;
  const verticalMargin = 1;
  labelHeight = labelHeight + (verticalMargin >> 1);
  const halfLabelHeight = labelHeight >> 1;

  const leftCoords = groupedLineCoords.left;
  const leftStackHeight = leftCoords.length * labelHeight;
  const leftX = mouseCoordinate.x - horizontalMargin;
  const leftStartY = mouseCoordinate.y - (leftStackHeight >> 1);
  for (let i = 0; i < leftCoords.length; i++) {
    const coord = leftCoords[i];
    coord.controlPoints.push({
      x: leftX,
      y: leftStartY + i * labelHeight + halfLabelHeight,
    });
  }

  const rightCoords = groupedLineCoords.right;
  const rightStackHeight = rightCoords.length * labelHeight;
  const rightX = mouseCoordinate.x + horizontalMargin;
  const rightStartY = mouseCoordinate.y + (rightStackHeight >> 1);
  for (let i = 0; i < rightCoords.length; i++) {
    const coord = rightCoords[i];
    coord.controlPoints.push({
      x: rightX,
      y: rightStartY - i * labelHeight - halfLabelHeight,
    });
  }
}

//function minimizeVerticalDistance() { }

//function addLines() { }

// with bug
function renderLabels(root, groupedLineCoords, fontSize) {
  const strokeWidth = "1px";

  const lineGenerator = d3.line().x(d => d.x).y(d => d.y);

  const groupLeft = root.append('g').attr("class", "left")
  const groupRight = root.append('g').attr("class", "right")

  groupLeft.selectAll("g")
    .data(groupedLineCoords.left)
    .join("g")
    .attr("class", d => d.label)
    .each(function (d, i) {
      const g = d3.select(this);


      const endPoint = {
        x: d.controlPoints[d.controlPoints.length - 1].x,
        y: d.controlPoints[d.controlPoints.length - 1].y,
      }
      g.append("path")
        .attr("d", lineGenerator(d.controlPoints))
        .attr("stroke", d.color)
        .attr("stroke-width", strokeWidth)
        .attr("fill", "none")

      let clientRect;
      g.append("text")
        .text(d.label)
        .attr("fill", d.color)
        .attr("font-size", fontSize)
        .attr("text-anchor", "end")
        .attr("x", endPoint.x)
        .attr("y", function () {
          clientRect = this.getBoundingClientRect()
          return endPoint.y + (clientRect.height >> 1);
        })

      g.append("rect")
        .attr('x', endPoint.x - clientRect.width)
        .attr('y', endPoint.y - (clientRect.height >> 1) + 3)
        .attr("width", clientRect.width)
        .attr("height", clientRect.height)
        .attr("stroke", d.color)
        .attr("stroke-width", strokeWidth)
        .attr("fill", "none");
    })

  groupRight.selectAll("g")
    .data(groupedLineCoords.right)
    .join("g")
    .attr("class", d => d.label)
    .each(function (d, i) {
      const g = d3.select(this);

      const endPoint = {
        x: d.controlPoints[d.controlPoints.length - 1].x,
        y: d.controlPoints[d.controlPoints.length - 1].y,
      }
      g.append("path")
        .attr("d", lineGenerator(d.controlPoints))
        .attr("stroke", d.color)
        .attr("stroke-width", strokeWidth)
        .attr("fill", "none")

      let clientRect;
      g.append("text")
        .text(d.label)
        .attr("fill", d.color)
        .attr("font-size", fontSize)
        .attr("text-anchor", "start")
        .attr("x", endPoint.x)
        .attr("y", function () {
          clientRect = this.getBoundingClientRect()
          return endPoint.y + (clientRect.height >> 1);
        })

      g.append("rect")
        .attr('x', endPoint.x)
        .attr('y', endPoint.y - (clientRect.height >> 1) + 3)
        .attr("width", clientRect.width)
        .attr("height", clientRect.height)
        .attr("stroke", d.color)
        .attr("stroke-width", strokeWidth)
        .attr("fill", "none")
    })
}

function translateLables(root) {
  const groupLeft = root.select(".left");
  const groupItems = groupLeft.selectAll(":scope>g");
  const texts = groupItems.selectAll(":scope>text")
  //const rects = groupItems.selectAll(":scope>rect")
  let maxLabelWidth = 0;
  const widths = [];
  texts.each(function () {
    const curWidth = this.getBoundingClientRect().width;
    widths.push(curWidth);
    if (curWidth > maxLabelWidth) maxLabelWidth = curWidth;
  });
  groupItems.each(function(){
    const g = d3.select(this);
    const text  = g.select("text")
    const { width, height } = text.node().getBoundingClientRect();
    const offset = width-maxLabelWidth
    text.attr("transform", `translate(${offset}, 0)`)
    const rect = g.select("rect");

    rect.attr("transform", `translate(${offset}, 0)`)
    console.log(+text.attr("y") + height/2)
    const line = g.append("line")
      .attr("x1", text.attr("x"))
      .attr("y1", +text.attr("y") - height/2)
      .attr("x2", +text.attr("x") + offset)
      .attr("y2", +text.attr("y") - height/2)
      .attr("stroke", text.attr("fill"))
  });
}
