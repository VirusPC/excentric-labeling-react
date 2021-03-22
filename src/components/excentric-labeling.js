import { convertLegacyProps } from "antd/lib/button/button";
import * as d3 from "d3";
import _, { filter, first, forEach, last } from "lodash";

export const OPTIONS = [
  "Vertically Coherent Labeling",
  "Horizontally Coherent Labeling"
];

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
 * @param {string | number} interactionParams.maxLabelsNum
 * @param {string[]} interactionParams.checkedOptions
 * @param {Function} interactionParams.setCurLabel
 * @param {Function} interactionParams.setRandomLabel
 */
export default function addExcenricLabelingInteraction(root, width, height, coordinates, interactionParams) {
  const { lensRadius, fontSize, maxLabelsNum, setCurLabel, setRandomLabel, checkedOptions } = interactionParams;
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

    const paths = coordinates
      .map((coord) => transformDataFormat(coord, mouseCoordinate))
    let { filteredCoords, nearestLabel, randomLabel } = extractLabelAndPosition(paths, lensRadius);
    countLabel.text(filteredCoords.length);
    filteredCoords = filteredCoords.slice(0, +maxLabelsNum);

    let orderedLineCoords
    if (checkedOptions.find(option => option === OPTIONS[0])) {
      orderedLineCoords = computeOrderingAccordingToY(filteredCoords);
    } else {
      filteredCoords.forEach((coord) => computeRad(coord));
      computeInitialPosition(filteredCoords, lensRadius);
      orderedLineCoords = computeOrderingAccordingToRad(filteredCoords);
    }
    const groupedLineCoords = assignLabelToLeftOrRight(orderedLineCoords);
    stackAccordingToOrder(groupedLineCoords, countLabelBoundingClientRect.height);

    if (checkedOptions.find(option => option === OPTIONS[1])) {
      moveHorizontallyAccordingToXCoord(groupedLineCoords)
    }


    groupTooltip.attr("transform", `translate(${mouseCoordinate.x}, ${mouseCoordinate.y})`)
    groupLabels.selectAll("*").remove();
    renderLabels(groupLabels, groupedLineCoords, fontSize);
    computeTranslatedControlPoint(groupLabels);
    translateLabels(groupLabels);
    renderLines(groupLabels, groupedLineCoords);


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
function extractLabelAndPosition(coordinates, radius) {
  const distance = (coordinate1, coordinate2) => Math.sqrt((coordinate1.x - coordinate2.x) ** 2 + (coordinate1.y - coordinate2.y) ** 2);

  let nearestLabel = "";
  let minDist = Number.MAX_VALUE;
  const centerPoint = { x: 0, y: 0 };

  const filteredCoords = coordinates
    .filter((coordinateDot) => {
      const dist = distance(centerPoint, coordinateDot.controlPoints[0])
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

  console.log(filteredCoords)
  return { filteredCoords: filteredCoords, nearestLabel: nearestLabel, randomLabel: randomLabel };
}

/**
 * Add control points to store the points on the path
 * Move the center point of the coordinate system to mouse position.
 * @param {*} coordinate 
 * @param {*} mouseCoordinate 
 * @returns 
 */
function transformDataFormat(coordinate, mouseCoordinate) {
  return {
    label: coordinate.label,
    color: coordinate.color,
    controlPoints: [
      {
        x: coordinate.x - mouseCoordinate.x,
        y: coordinate.y - mouseCoordinate.y,
      }
    ]
  }
}

function computeRad(coordinate) {
  const firstControlPoint = coordinate.controlPoints[0];
  const rad = Math.atan2(firstControlPoint.y, firstControlPoint.x);
  coordinate.rad = rad;
}

/**
 * project dots to the nearest position on lens.
 * @param {*} coordinates 
 * @param {*} radius 
 */
function computeInitialPosition(coordinates, radius) {
  for (let i = 0; i < coordinates.length; i++) {
    const coordinate = coordinates[i];
    coordinate.controlPoints.push({
      x: radius * Math.cos(coordinate.rad),
      y: radius * Math.sin(coordinate.rad),
    });
  }
}

/**
 * sort lines according to the position projected to lens
 * @param {*} lineCoordinates 
 * @returns 
 */
function computeOrderingAccordingToRad(lineCoordinates) {
  const fullRad = 2 * Math.PI;
  const quarterRad = 0.5 * Math.PI;

  const negativeToPositive = rad => rad < 0 ? rad + fullRad : rad;
  const reverse = rad => -rad;
  const rotateAQuarter = rad => rad - quarterRad;

  lineCoordinates.forEach((line) => {
    [line.rad]
      .map(negativeToPositive)
      .map(reverse)
      .map(negativeToPositive)
      .map(rotateAQuarter)
      .map(negativeToPositive);
  });
  const comparator = (line1, line2) => {
    return line1.radAjusted - line2.radAjusted;
  }

  return lineCoordinates.sort(comparator);
}

/**
 * sort lines according to the original point y position
 * @param {*} lineCoordinates 
 * @returns 
 */
function computeOrderingAccordingToY(lineCoordinates) {
  const comparator = (line1, line2) => {
    return line1.controlPoints[0].y - line2.controlPoints[0].y
  }
  return lineCoordinates.sort(comparator);
}

/**
 * Divided line coords to left and right
 * @param {*} lineCoordinates 
 * @returns 
 */
function assignLabelToLeftOrRight(lineCoordinates) {
  const groupedLineCoords = [[], []];
  for (const lineCoord of lineCoordinates) {
    lineCoord.controlPoints[0].x < 0
      ? groupedLineCoords[0].push(lineCoord)
      : groupedLineCoords[1].push(lineCoord);
  }
  return groupedLineCoords;
}

/**
 * Determine the final y coordinate of lables
 * @param {*} groupedLineCoords 
 * @param {*} labelHeight 
 */
function stackAccordingToOrder(groupedLineCoords, labelHeight) {
  const horizontalMargin = 60;
  const verticalMargin = 1;
  labelHeight = labelHeight + (verticalMargin >> 1);
  const halfLabelHeight = labelHeight >> 1;

  const leftCoords = groupedLineCoords[0];
  const leftStackHeight = leftCoords.length * labelHeight;
  const leftX = - horizontalMargin;
  const leftStartY = - (leftStackHeight >> 1);
  for (let i = 0; i < leftCoords.length; i++) {
    const coord = leftCoords[i];
    coord.controlPoints.push({
      x: leftX,
      y: leftStartY + i * labelHeight + halfLabelHeight,
    });
  }

  const rightCoords = groupedLineCoords[1];
  const rightStackHeight = rightCoords.length * labelHeight;
  const rightX = horizontalMargin;
  const rightStartY = (rightStackHeight >> 1);
  for (let i = 0; i < rightCoords.length; i++) {
    const coord = rightCoords[i];
    coord.controlPoints.push({
      x: rightX,
      y: rightStartY - i * labelHeight - halfLabelHeight,
    });
  }
}

/**
 * Labels are aligned left, move them horizontally according to the x coordination of dots.
 * @param {*} groupedLineCoords 
 */
function moveHorizontallyAccordingToXCoord(groupedLineCoords) {
  const spaceToMove = 20;
  const comparator = (line1, line2) => line1.controlPoints[0].x - line2.controlPoints[0].x;
  const sortedGroupedLineCoords = groupedLineCoords.map(lineCoords => lineCoords.sort(comparator));
  const [stepNumLeft, stepNumRight] = sortedGroupedLineCoords.map(
    lineCoords => _.uniq(lineCoords.map(lineCoord => lineCoord.controlPoints[0].x)).length
  );
  const stepLeft = spaceToMove / stepNumLeft;
  const stepRight = spaceToMove / stepNumRight;
  console.log("s", sortedGroupedLineCoords);

  let i = -1;
  let xBefore;
  for (const lineCoord of sortedGroupedLineCoords[0]) {
    const controlPoints = lineCoord.controlPoints;
    const firstPoint = controlPoints[0];
    const lastPoint = controlPoints[controlPoints.length - 1];
    if (firstPoint.x !== xBefore) {
      xBefore = firstPoint.x;
      i++;
    }
    lastPoint.x += stepLeft * i;
  }

  i = stepNumRight;
  xBefore = undefined;
  for (const lineCoord of sortedGroupedLineCoords[1]) {
    const controlPoints = lineCoord.controlPoints;
    const firstPoint = controlPoints[0];
    const lastPoint = controlPoints[controlPoints.length - 1];
    if (firstPoint.x !== xBefore) {
      xBefore = firstPoint.x;
      i--;
    }
    //const newPoint = {x: lastPoint.x + stepRight* i, y: lastPoint.y};
    lastPoint.x -= i * stepRight;
  }
}


function renderLabels(root, groupedLineCoords, fontSize) {
  const strokeWidth = "1px";

  const groupLeft = root.append('g').attr("class", "left")
  const groupRight = root.append('g').attr("class", "right")

  groupLeft.selectAll("g")
    .data(groupedLineCoords[0])
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
    .data(groupedLineCoords[1])
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
    const { width, height } = text.node().getBoundingClientRect();
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

function renderLines(root, groupedLineCoords) {
  const strokeWidth = "1px";

  const lineGenerator = d3.line().x(d => d.x).y(d => d.y);
  const groupLeft = root.select(".left");
  const groupRight = root.select(".right");

  [groupLeft, groupRight].map(
    (g, i) => g.selectAll("path")
      .data(groupedLineCoords[i])
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