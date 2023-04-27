import * as d3 from 'd3'
import data from "../data/cars.json"
import addExcentricLabelingInteraction  from "../helpers/excentric-labeling-interaction"
import { renderAxes, renderLegends } from './render-helper';
import { computeSizeOfLabels } from '../helpers/helpers';

/**
 * 

 * 
 * @param {HTMLDivElement} rootElem
 * @param {number} width 
 * @param {number} height 
 * @param {import('../helpers/excentric-labeling-interaction').InteractionParams} interactionParams
 * @param {object} setStateFuncs some React.js setState functions, which can set take effect outsides.
 * @param {(currentlabel: string) => void} setStateFuncs.setCurLabel 
 * @param {(randowmLabel: string) => void} setStateFuncs.setRandomLabel
 */
export default function renderUsingD3(rootElem, width, height, interactionParams, setStateFuncs) {
  // fields of scatter plot
  const fieldX = "Horsepower";
  const fieldY = "Miles_per_Gallon";
  const fieldColor = "Origin"

  // layout
  const margin = { top: 50, right: 100, bottom: 10, left: 150 }
  width = width - margin.left - margin.right;
  height= height - margin.top - margin.bottom;


  const svg = d3.select(rootElem)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("viewbox", `0 0 ${width} ${height}`)
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)
  const {mainLayer, coordinatesWithInfo} = renderScatterPlotWithExcentricLabeling(g, width, height, data, fieldX, fieldY, fieldColor, interactionParams, setStateFuncs);
  // interaction
  const rawInfos = getRawInfos(coordinatesWithInfo, svg, interactionParams.fontSize);
  addExcentricLabelingInteraction(mainLayer, width, height, rawInfos, interactionParams, setStateFuncs);
}

/**
 * 
 * @param {d3.Selection} root 
 * @param {number} width 
 * @param {number} height 
 * @param {*} data 
 * @param {string} fieldX 
 * @param {string} fieldY 
 * @param {string} fieldColor 
 * @param {import('../helpers/excentric-labeling-interaction').InteractionParams} interactionParams 
 * @param {*} setStateFuncs 
 * @returns {object} layer
 */
function renderScatterPlotWithExcentricLabeling(root, width, height, data, fieldX, fieldY, fieldColor, interactionParams, setStateFuncs) {
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

  // layers
  const mainLayer = root.append("g")
    .attr("class", "mainLayer")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)
  // const overlayLayer = mainLayer.clone();
  // const overlayLayer = root.append("g")
    // .attr("class", "overlayLayer")
    // .attr("transform", `translate(${margin.left}, ${margin.top})`)
  const axesLayer = root.append("g")
    .attr("class", "axesLayer");
  const legendsLayer = root.append("g")
    .attr("class", "legendsLayer")
    .attr("transform", `translate(${margin.left + width}, ${margin.top})`)
  

  // rendering
  mainLayer.selectAll("circle")
    .data(coordinatesWithInfo)
    .join("circle")
    .attr("fill", "none")
    .attr("opacity", 0.7)
    .attr("stroke-width", 1)
    .attr("stroke", d => d["color"])
    .attr("cx", d => d["x"])
    .attr("cy", d => d["y"])
    .attr("r", radius)
  axesLayer.call(renderAxes, width, height, margin, scaleX, scaleY);
  legendsLayer.call(renderLegends, margin.right, height + margin.top + margin.left, fieldColor, scaleColor);

  return {mainLayer, coordinatesWithInfo};
}


/**
 * 
 * @param {PointWithInfo[]} points 
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

