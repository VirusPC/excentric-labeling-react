import * as d3 from "d3";

/**
 * 
 * @param {d3.Selection} root 
 * @param {number} width 
 * @param {number} height 
 * @param {object} margin 
 * @param {number} margin.top
 * @param {number} margin.right
 * @param {number} margin.bottom
 * @param {number} margin.left
 * @param {d3.ScaleLinear} scaleX 
 * @param {d3.ScaleLinear} scaleY 
 */
export function renderAxes(root, width, height, margin, scaleX, scaleY) {
  const groupAxisX = root
    .append("g")
    .attr("class", "groupAxisX")
    .attr("transform", `translate(${margin.left}, ${margin.top + height})`);
  const groupAxisY = root
    .append("g")
    .attr("class", "groupAxisY")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
  groupAxisX
    .call(d3.axisBottom(scaleX))
    .call((g) =>
      g
        .selectAll(".tick line")
        .clone()
        .attr("stroke-opacity", 0.1)
        .attr("y2", -height)
    );
  groupAxisY
    .call(d3.axisLeft(scaleY))
    .call((g) =>
      g
        .selectAll(".tick line")
        .clone()
        .attr("stroke-opacity", 0.1)
        .attr("x2", width)
    );
}

/**
 *
 * @param {d3.Selection} root
 * @param {number} width
 * @param {number} height
 * @param {string} field
 * @param {d3.ScaleOrdinal} scaleColor
 */
export function renderLegends(root, width, height, field, scaleColor) {
  // settings
  const radius = 4;

  // layout
  const margin = { top: 15, right: 50, bottom: (height / 6) * 5, left: 10 };
  width -= margin.left + margin.right;
  height -= margin.top + margin.bottom;

  // data manipulation
  const domain = scaleColor.domain();

  //scale
  const scaleY = d3.scalePoint().domain(domain).range([height, 0]);

  // groups
  const groupTitle = root
    .append("g")
    .attr("class", "groupTitle")
    .attr("transform", `translate(${margin.left + width}, ${5})`);
  const groupAxisY = root
    .append("g")
    .attr("class", "groupAxisY")
    .attr("transform", `translate(${margin.left + width}, ${margin.top * 2})`);
  const groupMarks = root
    .append("g")
    .attr("class", "groupMarks")
    .attr("transform", `translate(${margin.left}, ${margin.top * 2})`);

  // draw
  groupTitle.append("text").attr("text-anchor", "start").text(field);
  groupAxisY.call(d3.axisRight(scaleY)).call((g) => {
    g.selectAll(".domain").remove();
    g.selectAll("line").remove();
  });
  groupMarks
    .selectAll("circle")
    .data(domain)
    .join("circle")
    .attr("fill", "none")
    .attr("stroke-width", 2)
    .attr("stroke", (d) => scaleColor(d))
    .attr("cx", width - radius)
    .attr("cy", (d) => scaleY(d))
    .attr("r", radius);
}

export function randomPoint(points) {
  if (points.length <= 0) return;
  const randomIndex = getRandomIntInclusive(0, points.length - 1);
  return points[randomIndex];
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}