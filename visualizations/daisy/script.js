d3.json("./data/apparition_yearly.json").then(data => {
  const keys = Object.keys(data[0]).filter(k => k !== "Year");
  const stackedData = d3.stack().keys(keys)(data);

  const margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

  const svg = d3.select("#chart").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
      .x(d => x(d.data.Year))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]));

  svg.selectAll(".layer")
    .data(stackedData)
    .enter().append("path")
      .attr("class", "layer")
      .attr("d", area)
      .style("fill", d => color(d.key));

  svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  svg.append("g")
      .call(d3.axisLeft(y));
});
