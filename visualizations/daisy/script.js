const margin = { top: 30, right: 150, bottom: 40, left: 60 },
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

const svg = d3.select("#chart")
  .append("svg")
  .attr("viewBox", [0, 0, width + margin.left + margin.right + 150, height + margin.top + margin.bottom])
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#chart")
  .append("div")
  .style("position", "absolute")
  .style("visibility", "hidden")
  .style("background", "white")
  .style("color", "#111")
  .style("border", "1px solid #ccc")
  .style("padding", "6px")
  .style("border-radius", "4px")
  .style("font-size", "12px");

d3.json("./data/apparition_yearly.json").then(data => {
  const keys = Object.keys(data[0]).filter(k => k !== "Year");

  const stackedData = d3.stack().keys(keys)(data);

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.Year))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(stackedData[stackedData.length - 1], d => d[1])])
    .range([height, 0]);

  const color = d3.scaleOrdinal()
    .domain(keys)
    .range(d3.schemeCategory10);

  const area = d3.area()
    .curve(d3.curveBasis)
    .x(d => x(d.data.Year))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]));

  svg.selectAll("path")
    .data(stackedData)
    .join("path")
    .attr("fill", d => color(d.key))
    .attr("d", area)
    .on("mouseover", function(event, d) {
      tooltip.style("visibility", "visible")
             .html(`<strong>${d.key}</strong>`);
    })
    .on("mousemove", function(event) {
      tooltip
        .style("top", (event.pageY - 10) + "px")
        .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", () => tooltip.style("visibility", "hidden"));

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")))
    .selectAll("text")
    .style("fill", "white");

  svg.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("fill", "white");

  svg.selectAll(".domain, .tick line").attr("stroke", "#777");

  // Add legend
  const legend = svg.append("g")
    .attr("transform", `translate(${width + 20}, 0)`);

  keys.forEach((key, i) => {
    const row = legend.append("g")
      .attr("transform", `translate(0, ${i * 20})`);

    row.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", color(key));

    row.append("text")
      .attr("x", 16)
      .attr("y", 10)
      .text(key)
      .style("fill", "white")
      .style("font-size", "10px");
  });
});
