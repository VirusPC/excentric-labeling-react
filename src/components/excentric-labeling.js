import * as d3 from "d3";
import _ from "lodash";

/**
 * Add excentric labeling interaction to the root element. 
 * 
 * @param {SVGGElement} root svg group element to mount
 * @param {number} width 
 * @param {number} height 
 * 
 * @param {object} points
 * @param {number} points.x used for calculate position information.
 * @param {number} points.y used for calculate position information.
 * @param {string} points.label used for set the label text content.
 * @param {string} points.color used for set the color of labels corresponding lines.
 * 
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
export default function addExcentricLabelingInteraction(root, width, height, points, interactionParams, setStateFuncs) {
  const { lensRadius, fontSize, maxLabelsNum, shouldVerticallyCoherent, shouldHorizontallyCoherent } = interactionParams;
  const { setCurLabel, setRandomLabel} = setStateFuncs;
  const strokeColor = "green",
    strokeWidth = "1px",
    countLabelWidth = 30,
    countLabelDistance = 20;

  const groupTooltip = root.append("g")
    .attr("class", "groupTooltip ")
    .attr("visibility", "hidden");
  const groupLabels = groupTooltip.append("g")
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

    const lines = points
      .map((point) => transformDataFormat(point, mouseCoordinate))
    let { filteredLines, nearestLabel, randomLabel } = extractLabelAndPosition(lines, lensRadius);
    countLabel.text(filteredLines.length);
    filteredLines = filteredLines.slice(0, +maxLabelsNum);

    let orderedLines
    if (shouldVerticallyCoherent) {
      orderedLines = computeOrderingAccordingToY(filteredLines);
    } else {
      filteredLines.forEach((line) => computeRad(line));
      computeInitialPosition(filteredLines, lensRadius);
      orderedLines = computeOrderingAccordingToRad(filteredLines);
    }
    const groupedLines = assignLabelToLeftOrRight(orderedLines);
    stackAccordingToOrder(groupedLines, countLabelBoundingClientRect.height);

    if (shouldHorizontallyCoherent) {
      moveHorizontallyAccordingToXCoord(groupedLines)
    }


    groupTooltip.attr("transform", `translate(${mouseCoordinate.x}, ${mouseCoordinate.y})`)
    groupLabels.selectAll("*").remove();
    renderLabels(groupLabels, groupedLines, fontSize);
    computeTranslatedControlPoint(groupLabels);
    translateLabels(groupLabels);
    renderLines(groupLabels, groupedLines);

    // side effects
    if(setCurLabel) setCurLabel(nearestLabel)
    if(setRandomLabel) setRandomLabel(randomLabel)
  }

  function onMouseleave(e) {
    groupTooltip.style("visibility", "hidden")
  }

}

/*
 * step 1
 */
function extractLabelAndPosition(lines, radius) {
  const distance = (coordinate1, coordinate2) => Math.sqrt((coordinate1.x - coordinate2.x) ** 2 + (coordinate1.y - coordinate2.y) ** 2);

  let nearestLabel = "";
  let minDist = Number.MAX_VALUE;
  const centerPoint = { x: 0, y: 0 };

  const filteredLines =lines 
    .filter((line) => {
      const dist = distance(centerPoint, line.controlPoints[0])
      if (dist > radius) {
        return false;
      }
      if (dist < minDist) {
        minDist = dist;
        nearestLabel = line.label;
      }
      return true;
    });

  let randomLabel = "";
  if (filteredLines.length > 0) {
    randomLabel = filteredLines[Math.floor(Math.random() * (filteredLines.length - 1))].label
  };

  return { filteredLines: filteredLines, nearestLabel: nearestLabel, randomLabel: randomLabel };
}

/**
 * Add control points to store the points on the path
 * Move the center point of the coordinate system to mouse position.
 * @param {*} point 
 * @param {*} mouseCoordinate 
 * @returns 
 */
function transformDataFormat(point, mouseCoordinate) {
  return {
    label: point.label,
    color: point.color,
    controlPoints: [
      {
        x: point.x - mouseCoordinate.x,
        y: point.y - mouseCoordinate.y,
      }
    ]
  }
}

function computeRad(line) {
  const firstControlPoint = _.head(line.controlPoints);
  const rad = Math.atan2(firstControlPoint.y, firstControlPoint.x);
  line.rad = rad;
}

/**
 * project dots to the nearest position on lens.
 * @param {*} points 
 * @param {*} radius 
 */
function computeInitialPosition(lines, radius) {
  for (let i = 0; i < lines.length; i++) {
    const line= lines[i];
    line.controlPoints.push({
      x: radius * Math.cos(line.rad),
      y: radius * Math.sin(line.rad),
    });
  }
}

/**
 * sort lines according to the position projected to lens
 * @param {*} lines 
 * @returns 
 */
function computeOrderingAccordingToRad(lines) {
  const fullRad = 2 * Math.PI;
  const quarterRad = 0.5 * Math.PI;

  const negativeToPositive = rad => rad < 0 ? rad + fullRad : rad;
  const reverse = rad => -rad;
  const rotateAQuarter = rad => rad - quarterRad;

  lines.forEach((line) => {
    const [radAjusted] = _.chain([line.rad])
      .map(negativeToPositive)
      .map(reverse)
      .map(negativeToPositive)
      .map(rotateAQuarter)
      .map(negativeToPositive)
      .value();
    line.radAjusted = radAjusted;
  });
  const comparator = (line1, line2) => {
    return line1.radAjusted - line2.radAjusted;
  }

  return lines.sort(comparator);
}

/**
 * sort lines according to the original point y position
 * @param {*} lines 
 * @returns 
 */
function computeOrderingAccordingToY(lines) {
  const comparator = (line1, line2) => {
    const point1 = line1.controlPoints[0];
    const point2 = line2.controlPoints[0];
    const product = point1.x * point2.x;
    if(product < 0) {
      return point1.x < 0 ? -1 : 1;
    } else if(product > 0) {
      return point1.x < 0 ? point1.y - point2.y : point2.y - point1.y;
    } else {
      return point1.y < 0 
        ? -1 
        : point2.x < 0
          ? -1
          : 1;
    }
  }
  return lines.sort(comparator);
}

/**
 * Divided line coords to left and right
 * @param {*} lines 
 * @returns 
 */
function assignLabelToLeftOrRight(lines) {
  const groupedLines = [[], []];
  for (const line of lines) {
    line.controlPoints[0].x < 0
      ? groupedLines[0].push(line)
      : groupedLines[1].push(line);
  }
  return groupedLines;
}

/**
 * Determine the final y coordinate of lables
 * @param {*} groupedLines 
 * @param {*} labelHeight 
 */
function stackAccordingToOrder(groupedLines, labelHeight) {
  console.log(groupedLines);
  const horizontalMargin = 60;
  const verticalMargin = 1;
  labelHeight = labelHeight + (verticalMargin >> 1);
  const halfLabelHeight = labelHeight >> 1;

  groupedLines.forEach((lines, i) => {
    const stackHeight = lines.length * labelHeight;
    const direction = i === 0 ? -1 : 1;
    const startX = direction * horizontalMargin;
    const startY = direction * (stackHeight >> 1);
    lines.forEach((line, i) => line.controlPoints.push({
      x: startX,
      y: startY - direction * ((i * labelHeight) + halfLabelHeight),
    }));
  });
}

/**
 * Labels are aligned left, move them horizontally according to the x coordination of dots.
 * @param {*} groupedLines 
 */
function moveHorizontallyAccordingToXCoord(groupedLines) {
  const spaceToMove = 20;
  const comparator = (line1, line2) => line1.controlPoints[0].x - line2.controlPoints[0].x;
  const sortedgroupedLines = groupedLines.map(lines => lines.sort(comparator));
  const [stepNumLeft, stepNumRight] = sortedgroupedLines.map(
    lines => _.sortedUniq(lines.map(line => line.controlPoints[0].x)).length
  );
  const stepLeft = spaceToMove / stepNumLeft;
  const stepRight = spaceToMove / stepNumRight;

  let i = -1;
  let xBefore;
  for (const line of sortedgroupedLines[0]) {
    const controlPoints = line.controlPoints;
    const firstPoint = _.head(controlPoints);
    const lastPoint = _.last(controlPoints);
    if (firstPoint.x !== xBefore) {
      xBefore = firstPoint.x;
      i++;
    }
    lastPoint.x += stepLeft * i;
  }

  i = stepNumRight;
  xBefore = undefined;
  for (const line of sortedgroupedLines[1]) {
    const controlPoints = line.controlPoints;
    const firstPoint = _.head(controlPoints);
    const lastPoint = _.last(controlPoints);
    if (firstPoint.x !== xBefore) {
      xBefore = firstPoint.x;
      i--;
    }
    //const newPoint = {x: lastPoint.x + stepRight* i, y: lastPoint.y};
    lastPoint.x -= i * stepRight;
  }
}


function renderLabels(root, groupedLines, fontSize) {
  const strokeWidth = "1px";

  const groupLeft = root.append('g').attr("class", "left")
  const groupRight = root.append('g').attr("class", "right")

  groupLeft.selectAll("g")
    .data(groupedLines[0])
    .join("g")
    .attr("class", d => d.label)
    .each(function (d, i) {
      const g = d3.select(this);
      const text = g.append("text")
        .text(d.label)
        .attr("fill", d.color)
        .attr("font-size", fontSize)
        .attr("text-anchor", "end")
      const clientRect = text.node().getBoundingClientRect();
      g.append("rect")
        .attr('x', - clientRect.width)
        .attr('y', - ((clientRect.height >> 1) + 3))
        .attr("width", clientRect.width)
        .attr("height", clientRect.height)
        .attr("stroke", d.color)
        .attr("stroke-width", strokeWidth)
        .attr("fill", "none");
    })

  groupRight.selectAll("g")
    .data(groupedLines[1])
    .join("g")
    .attr("class", d => d.label)
    .each(function (d, i) {
      const g = d3.select(this);

      const text = g.append("text")
        .text(d.label)
        .attr("fill", d.color)
        .attr("font-size", fontSize)
        .attr("text-anchor", "start")
      const clientRect = text.node().getBoundingClientRect();
      g.append("rect")
        .attr("y", -((clientRect.height >> 1) + 3))
        .attr("width", clientRect.width)
        .attr("height", clientRect.height)
        .attr("stroke", d.color)
        .attr("stroke-width", strokeWidth)
        .attr("fill", "none")
    })
}

/**
 * Align labels left (if `moveHorizontallyAccordingToXCoord()` not be called)
 * @param {*} root 
 */
function computeTranslatedControlPoint(root) {
  const groupLeft = root.select(".left");
  const groupItems = groupLeft.selectAll(":scope>g");
  const texts = groupItems.selectAll(":scope>text")
  let maxLabelWidth = 0;
  const widths = [];
  texts.each(function () {
    const curWidth = this.getBoundingClientRect().width;
    widths.push(curWidth);
    if (curWidth > maxLabelWidth) maxLabelWidth = curWidth;
  });
  groupItems.each(function (d, i) {
    const g = d3.select(this);
    const text = g.select("text")
    const { width} = text.node().getBoundingClientRect();
    const offset = width - maxLabelWidth
    const lastControlPoint = d.controlPoints[d.controlPoints.length - 1];
    const newControlPoint = { x: lastControlPoint.x + offset, y: lastControlPoint.y };
    d.controlPoints.push(newControlPoint);
  });
}

function translateLabels(root) {
  [root.selectAll(".left g"), root.selectAll(".right g")]
    .forEach(
      g => g.each(function (d) {
        const lastControlPoint = d.controlPoints[d.controlPoints.length - 1];
        d3.select(this).attr("transform", `translate(${lastControlPoint.x}, ${lastControlPoint.y})`)
      })
    );

}

function renderLines(root, groupedLines) {
  const strokeWidth = "1px";

  const lineGenerator = d3.line().x(d => d.x).y(d => d.y);
  const groupLeft = root.select(".left");
  const groupRight = root.select(".right");

  [groupLeft, groupRight].map(
    (g, i) => g.selectAll("path")
      .data(groupedLines[i])
      .join("g")
      .attr("class", d => d.label)
      .each(function (d, i) {
        const g = d3.select(this);
        g.append("path")
          .attr("d", lineGenerator(d.controlPoints))
          .attr("stroke", d.color)
          .attr("stroke-width", strokeWidth)
          .attr("fill", "none")
      }))

}