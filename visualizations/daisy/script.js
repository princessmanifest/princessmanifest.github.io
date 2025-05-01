const margin = { top: 30, right: 180, bottom: 60, left: 90 },
      width = 1400 - margin.left - margin.right,
      height = 700 - margin.top - margin.bottom;

let allData;

const svg = d3.select("#chart")
  .append("svg")
  .attr("viewBox", [0, 0, width + margin.left + margin.right + 200, height + margin.top + margin.bottom])
  .style("width", "100%")
  .style("height", "auto")
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#chart")
  .append("div")
  .style("position", "absolute")
  .style("visibility", "hidden")
  .style("background", "white")
  .style("color", "#111")
  .style("border", "1px solid #ccc")
  .style("padding", "8px")
  .style("border-radius", "5px")
  .style("font-size", "14px");

const color = d3.scaleOrdinal(d3.schemeTableau10);
let activeKey = null;

d3.json("./data/apparition_yearly.json").then(data => {
  allData = data;
  const keys = Object.keys(data[0]).filter(k => k !== "Year");
  color.domain(keys);

  drawChart(data, keys);
  addBrush(d3.extent(data, d => d.Year), keys);
});

function drawChart(data, keys) {
  svg.selectAll("*").remove();

  const stackedData = d3.stack().keys(keys)(data);

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.Year))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(stackedData[stackedData.length - 1], d => d[1])])
    .range([height, 0]);

  const area = d3.area()
    .curve(d3.curveBasis)
    .x(d => x(d.data.Year))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]));

  const paths = svg.selectAll("path")
    .data(stackedData)
    .join("path")
    .attr("fill", d => color(d.key))
    .attr("d", area)
    .style("opacity", 0.85)
    .on("mouseover", function(event, d) {
      tooltip.style("visibility", "visible").html(`<strong>${d.key}</strong>`);
    })
    .on("mousemove", function(event) {
      tooltip
        .style("top", (event.pageY + 10) + "px")
        .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", () => tooltip.style("visibility", "hidden"));

  // Axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")))
    .selectAll("text")
    .style("fill", "white")
    .style("font-size", "14px");

  svg.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("fill", "white")
    .style("font-size", "14px");

  svg.selectAll(".domain, .tick line").attr("stroke", "#777");

  // Legend
  const legend = svg.append("g")
    .attr("transform", `translate(${width + 30}, 200)`)
    .attr("class", "legend");

  keys.forEach((key, i) => {
    const row = legend.append("g")
      .attr("transform", `translate(0, ${i * 25})`)
      .style("cursor", "pointer")
      .on("click", function () {
        if (activeKey === key) {
          activeKey = null;
          paths.transition().duration(300).style("opacity", 0.85);
        } else {
          activeKey = key;
          paths.transition().duration(300)
            .style("opacity", d => d.key === key ? 1 : 0.1);
        }
      });

    row.append("rect")
      .attr("width", 14)
      .attr("height", 14)
      .attr("fill", color(key));

    row.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(key)
      .style("fill", "white")
      .style("font-size", "14px");
  });
}

// Add the brush slider below chart
function addBrush(yearExtent, keys) {
  const sliderSvg = d3.select("#slider")
    .append("g")
    .attr("transform", `translate(${margin.left},10)`);

  const x = d3.scaleLinear()
    .domain(yearExtent)
    .range([0, width]);

  sliderSvg.append("g")
    .attr("transform", `translate(0,30)`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  const brush = d3.brushX()
    .extent([[0, 0], [width, 30]])
    .on("end", (event) => {
      if (!event.selection) return;

      const [x0, x1] = event.selection.map(x.invert);
      const filtered = allData.filter(d => d.Year >= x0 && d.Year <= x1);
      drawChart(filtered, keys);
    });

  sliderSvg.append("g")
    .attr("class", "brush")
    .call(brush)
    .call(brush.move, x.range()); // default to full range
}
