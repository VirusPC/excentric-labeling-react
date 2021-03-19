import * as d3 from 'd3'
import data from "../data/cars.json"

export default function renderD3(rootElem, width, fontSize, lensRadius) {

  let height = width * 0.6;

  // fields to bin
  const keys = ['Cylinders', 'Displacement', 'Weight_in_lbs', 'Acceleration']; // Can choosen from one of the properties.


  // fields of scatter plot
  const fieldX = "Horsepower";
  const fieldY = "Miles_per_Gallon";
  const fieldColor = "Origin"

  // layout
  const margin = { top: 50, right: 100, bottom: 10, left: 150 }
  width = width - margin.left - margin.right;
  height= height - margin.top - margin.bottom;


  const svg = d3.select(rootElem)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("viewbox", `0 0 ${width} ${height}`)
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)
  renderScatterPlot(g, width, height, data, fieldX, fieldY, fieldColor, {fontSize: fontSize, lensRadius: lensRadius});
}

function renderScatterPlot(root, width, height, data, fieldX, fieldY, fieldColor, variableParams) {
  // settings
  const radius = 3;
  const colorHidden = "#ddd";
  const tooltipFields = ['Miles_per_Gallon', 'Cylinders', 'Displacement', 'Horsepower', 'Weight_in_lbs', 'Acceleration', 'Name'];

  // layout
  const margin = { top: 10, right: 100, bottom: 50, left: 50 };
  width -= margin.left + margin.right;
  height -= margin.top + margin.bottom;

  // data manipulation
  data = data.filter((d) => !!(d[fieldX] && d[fieldY]))
  const extentX = [0, d3.max(data, d => d[fieldX])];
  const extentY = [0, d3.max(data, d => d[fieldY])];
  const valuesColorSet = new Set();
  for (const datum of data) {
    valuesColorSet.add(datum[fieldColor]);
  }
  const valuesColor = Array.from(valuesColorSet);

  // scales
  const scaleX = d3.scaleLinear()
    .domain(extentX)
    .range([0, width])
    .nice()
    .clamp(true);
  const scaleY = d3.scaleLinear()
    .domain(extentY)
    .range([height, 0])
    .nice()
    .clamp(true);
  const scaleColor = d3.scaleOrdinal()
    .domain(valuesColor)
    .range(d3.schemeTableau10);

  const coordinatesWithInfo = data.map(d => ({
    x: scaleX(d[fieldX]),
    y: scaleY(d[fieldY]),
    color: scaleColor(d[fieldColor]),
    label: d["Name"],
  }))

  // groups
  const groupAxisX = root.append("g")
    .attr("class", "groupAxisX")
    .attr("transform", `translate(${margin.left}, ${margin.top + height})`);
  const groupAxisY = root.append("g")
    .attr("class", "groupAxisY")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)
  const groupMarks = root.append("g")
    .attr("class", "groupMarks")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)
  const groupForeground = root.append("g")
    .attr("class", "groupForeground")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)
  const groupLegends = root.append("g")
    .attr("class", "groupLegends")
    .attr("transform", `translate(${margin.left + width}, ${margin.top})`)
  const groupTooltip = root.append("g")
    .attr("class", "tooltip")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)
  //.attr("display", "none")

  // draw
  groupAxisX.call(d3.axisBottom(scaleX))
    .call(g =>
      g.selectAll(".tick line")
        .clone()
        .attr("stroke-opacity", 0.1)
        .attr("y2", -height)
    );
  groupAxisY.call(d3.axisLeft(scaleY))
    .call(g =>
      g.selectAll(".tick line")
        .clone()
        .attr("stroke-opacity", 0.1)
        .attr("x2", width)
    );
  groupMarks.selectAll("circle")
    .data(coordinatesWithInfo)
    .join("circle")
    .attr("fill", "none")
    .attr("stroke-width", 2)
    .attr("stroke", d => d["color"])
    .attr("cx", d => d["x"])
    .attr("cy", d => d["y"])
    .attr("r", radius)
  groupLegends.call(renderLegends, margin.right, height + margin.top + margin.left, fieldColor, scaleColor);
  groupForeground.call(renderOverlay, width, height, coordinatesWithInfo, variableParams);
}

function renderLegends(root, width, height, field, scaleColor) {
  console.log(width)
  console.log(height)
  // settings
  const radius = 4;

  // layout
  const margin = { top: 10, right: 50, bottom: height / 6 * 5, left: 10 };
  width -= margin.left + margin.right;
  height -= margin.top + margin.bottom;

  // data manipulation
  const domain = scaleColor.domain();

  //scale
  const scaleY = d3.scalePoint()
    .domain(domain)
    .range([height, 0]);

  // groups
  const groupTitle = root.append("g")
    .attr("class", "groupTitle")
    .attr("transform", `translate(${margin.left + width}, ${5})`)
  const groupAxisY = root.append("g")
    .attr("class", "groupAxisY")
    .attr("transform", `translate(${margin.left + width}, ${margin.top * 2})`)
  const groupMarks = root.append("g")
    .attr("class", "groupMarks")
    .attr("transform", `translate(${margin.left}, ${margin.top * 2})`)


  // draw
  groupTitle.append("text")
    .attr("text-anchor", "middle")
    .text(field);
  groupAxisY.call(d3.axisRight(scaleY))
    .call(g =>
      g.selectAll(".domain").remove()
    );
  groupMarks.selectAll("circle")
    .data(domain)
    .join("circle")
    .attr("fill", "none")
    .attr("stroke-width", 2)
    .attr("stroke", d => scaleColor(d))
    .attr("cx", width / 2)
    .attr("cy", d => scaleY(d))
    .attr("r", radius);
}

function renderOverlay(root, width, height, coordinates, variableParams) {
  const radius = variableParams.lensRadius,//20,
    fontSize = variableParams.fontSize,//10,
    strokeColor = "green",
    //countLabelHeight = 15,
    countLabelWidth = 30,
    countLabelDistance = 20;

    console.log(radius);
    console.log(fontSize);

  const text = root.append("text")
  const labelHeight = text
    .text("test")
    .attr("font-size", fontSize)
    .node()
    .getBoundingClientRect()
    .height;
  text.remove();

  const groupTooltip = root.append("g")
    .attr("class", "groupTooltip ")
    .attr("visibility", "hidden");
  const groupLabels = root.append("g")
    .attr("class", "groupLabels")
  const groupOverlay = root.append("g")
    .attr("class", "groupOverlay ")
  const groupLens = groupTooltip.append("g")
    .attr("class", "groupLens");
  //.attr("transform", `translate(${offsetX}, ${offsetY})`)

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
    .attr("r", radius)
    .attr("fill", "none")
    .attr("stroke", strokeColor)
    .attr("stroke-width", "2px")
  groupLens.append("rect")
    .attr("stroke", strokeColor)
    .attr("stroke-width", "2px")
    .attr("fill", "none")
    .attr("x", - countLabelWidth / 2)
    .attr("y", - (radius + labelHeight + countLabelDistance))
    .attr("width", countLabelWidth)
    .attr("height", labelHeight);
  const countLabel = groupLens
    .append("text")
    .attr("class", "countLabel")
    .attr("font-size", fontSize)
    .attr("y", - (radius + countLabelDistance + 4))
    .attr("text-anchor", "middle")
    .attr("stroke", strokeColor)
  groupLens.append("line")
    .attr("stroke", strokeColor)
    .attr("stroke-width", "2px")
    .attr("y1", -radius)
    .attr("y2", -(radius + countLabelDistance))


  function onMouseenter(e) {
    //debugger
    const rect = root.node().getBoundingClientRect();
    groupTooltip.style("visibility", "visible")
  }

  function onMousemove(e) {
    const mousePosition = d3.pointer(e, groupOverlay.node());
    const mouseCoordinate = { x: mousePosition[0], y: mousePosition[1] };

    const filteredCoords = extractLabelAndPosition(coordinates, mouseCoordinate, radius);
    const lineCoords = computeInitialPosition(filteredCoords.slice(0, 10), mouseCoordinate, radius);
    const orderedLineCoords = computeOrdering(lineCoords);
    const groupedLineCoords = assignLabelToLeftOrRight(orderedLineCoords);
    stackAccordingToOrder(groupedLineCoords, mouseCoordinate, labelHeight);

    countLabel.text(filteredCoords.length);
    groupTooltip.attr("transform", `translate(${mouseCoordinate.x}, ${mouseCoordinate.y})`)
    groupLabels.selectAll("*").remove();
    renderLabels(groupLabels, mouseCoordinate, groupedLineCoords, labelHeight, fontSize);
  }

  function onMouseleave(e) {
    groupTooltip.style("visibility", "hidden")
  }

}

/*
 * step 1
 */
function extractLabelAndPosition(coordinates, coordinateMouse, radius) {
  const maxNum = 10;
  const distance = (coordinate1, coordinate2) => Math.sqrt((coordinate1.x - coordinate2.x) ** 2 + (coordinate1.y - coordinate2.y) ** 2);
  return coordinates
    .filter((coordinateDot) => distance(coordinateMouse, coordinateDot) < radius);

}


/*
 * step 2
 */
// function evenlyProject(coordinates, mouseCoordinate, radius) {
//   const comparator = (coord1, coord2) => coord1.x - coord2.x === 0
//     ? coord1.x - coord2.x
//     : coord1.y - coord2.y;

//   const degreeEachLabel = Math.PI * 2 / (coordinatesInCircle.length + 1);
//   const lineCoordinates = [];
//   for (let i = 0; i < coordinates.length; i++) {
//     const coordinate = coordinates[i];
//     let degree = degreeEachLabel * i;
//     if (degree == Math.PI / 2) {
//       i++;
//       degree = degreeEachLabel * i;
//     }
//     const rad = Math.atan2(coordinate.x - mouseCoordinate.x, coordinate.y - mouseCoordinate.y);
//     lineCoordinates.push({
//       //...coordinate,
//       label: coordinate.label,
//       color: coordinate.color,
//       controlPoints: [
//         { x: coordinate.x, y: coordinate.y }, // origin position
//         { x: radius * Math.cos(degree) + mouseCoordinate.x, y: radius * Math.sin(degree) + mouseCoordinate.y },
//       ],
//     });
//   }
//   return lineCoordinates;//.sort(comparator);
// }

// project dot to the most recently position on lens circle.
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
  labelHeight = labelHeight + (verticalMargin << 1);
  const halfLabelHeight = labelHeight / 2;

  const leftCoords = groupedLineCoords.left;
  const leftStackHeight = leftCoords.length * labelHeight;
  const leftX = mouseCoordinate.x - horizontalMargin;
  const leftStartY = mouseCoordinate.y - (leftStackHeight / 2);
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
  const rightStartY = mouseCoordinate.y + (rightStackHeight / 2);
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
function renderLabels(root, mouseCoordinate, groupedLineCoords, labelHeight, fontSize) {
  const strokeWidth = 2;

  const scaleColor1 = d3.scaleSequential().domain([-2, 10]).interpolator(d3.interpolateReds);
  const scaleColor2 = d3.scaleSequential().domain([-2, 10]).interpolator(d3.interpolateBlues);

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
      const path = g.append("path")
        .attr("d", lineGenerator(d.controlPoints))
        .attr("stroke", d.color)
        .attr("stroke-width", "2px")
        .attr("fill", "none")

      let clientRect;
      const text = g
        .append("text")
        .text(d.label)
        .attr("stroke", d.color)
        .attr("stroke-width", 1)
        .attr("font-size", fontSize)
        .attr("text-anchor", "end")
        .attr("x", endPoint.x)
        .attr("y", function () {
          clientRect = this.getBoundingClientRect()
          return endPoint.y + clientRect.height / 2;
        })

      g.append("rect")
        .attr('x', endPoint.x - clientRect.width)
        .attr('y', endPoint.y - clientRect.height / 2 + 3)
        .attr("width", clientRect.width)
        .attr("height", clientRect.height)
        .attr("stroke", d.color)
        .attr("stroke-width", 1)
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
      const path = g.append("path")
        .attr("d", lineGenerator(d.controlPoints))
        .attr("stroke", d.color)
        .attr("stroke-width", "2px")
        .attr("fill", "none")

      let clientRect;
      const text = g
        .append("text")
        .text(d.label)
        .attr("stroke", d.color)
        .attr("stroke-width", 1)
        .attr("font-size", fontSize)
        .attr("text-anchor", "start")
        .attr("x", endPoint.x)
        .attr("y", function () {
          clientRect = this.getBoundingClientRect()
          return endPoint.y + clientRect.height / 2;
        })

      g.append("rect")
        .attr('x', endPoint.x)
        .attr('y', endPoint.y - clientRect.height / 2 + 3)
        .attr("width", clientRect.width)
        .attr("height", clientRect.height)
        .attr("stroke", d.color)
        .attr("stroke-width", 1)
        .attr("fill", "none")
    })
}
