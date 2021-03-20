import * as d3 from 'd3'
import data from "../data/cars.json"
import addExcenricLabelingInteraction  from "./excentric-labeling"

export default function renderUsingD3(rootElem, width, fontSize, lensRadius, setCurLabel, setRandomLabel) {

  let height = width * 0.6;

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
  renderScatterPlot(g, width, height, data, fieldX, fieldY, fieldColor, {fontSize: fontSize, lensRadius: lensRadius, setCurLabel: setCurLabel, setRandomLabel: setRandomLabel});
}

function renderScatterPlot(root, width, height, data, fieldX, fieldY, fieldColor, variableParams) {
  // settings
  const radius = 3;

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
    .attr("stroke-width", 1)
    .attr("stroke", d => d["color"])
    .attr("cx", d => d["x"])
    .attr("cy", d => d["y"])
    .attr("r", radius)
  groupLegends.call(renderLegends, margin.right, height + margin.top + margin.left, fieldColor, scaleColor);
  groupForeground.call(addExcenricLabelingInteraction, width, height, coordinatesWithInfo, variableParams);
}

function renderLegends(root, width, height, field, scaleColor) {
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
    .attr("cx", width >> 1)
    .attr("cy", d => scaleY(d))
    .attr("r", radius);
}

