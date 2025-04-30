const margin = { top: 50, right: 180, bottom: 60, left: 90 },
      width = 1800 - margin.left - margin.right,
      height = 900 - margin.top - margin.bottom;

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
  .style("font-size", "14px")
  .style("pointer-events", "none");

d3.json("./data/apparition_yearly.json").then(data => {
  const keys = Object.keys(data[0]).filter(k => k !== "Year");
  let activeKey = null;

  const stackedData = d3.stack().keys(keys)(data);

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.Year))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(stackedData[stackedData.length - 1], d => d[1])])
    .range([height, 0]);

  const color = d3.scaleOrdinal()
    .domain(keys)
    .range(d3.schemeTableau10);

  const area = d3.area()
    .curve(d3.curveBasis)
    .x(d => x(d.data.Year))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]));

  const paths = svg.selectAll("path")
    .data(stackedData)
    .join("path")
    .attr("class", d => "layer layer-" + d.key.replace(/\\s+/g, '-'))
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

  const legend = svg.append("g")
    .attr("transform", `translate(${width + 30}, 0)`)
    .attr("class", "legend");

  keys.forEach((key, i) => {
    const safeKey = key.replace(/\\s+/g, '-');

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
});
