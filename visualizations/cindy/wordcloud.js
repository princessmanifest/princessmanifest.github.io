export function WordCloud(words, {
    width = 800,
    height = 500,
    fontFamily = "Impact",
    fontScale = 1,
    rotate = 0,
    padding = 0.5,
    invalidation
  } = {}) {
    const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height + 80])
      .attr("width", width)
      .attr("height", height + 80)
      .attr("style", "max-width: 100%; height: auto; display: block; margin: auto;")
      .attr("text-anchor", "middle")
      .attr("font-family", fontFamily);
  
    const verticalOffset = 40; 

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2 + verticalOffset})`);
    
    words.forEach(d => {
      d.size = d.frequency;
    });
  
    const sizeExtent = d3.extent(words, d => +d.size);
    console.log("Size extent:", sizeExtent);
    const fontSizeScale = d3.scalePow()
      .exponent(1.5)
      .domain(sizeExtent)
      .range([20, 80]); 
  
    const scoreExtent = d3.extent(words, d => +d.score);
    const colorScale = d3.scaleSequential()
      .domain(scoreExtent)
      .interpolator(d3.interpolateYlOrRd)
      .clamp(true);
  
    const cloud = d3.layout.cloud()
        .size([width * 1, height * 1])
        .words(words.sort((a, b) => b.frequency - a.frequency))
        .padding(padding)
        .rotate(rotate)
        .font(fontFamily)
        .fontSize(d => fontSizeScale(+d.size)) 
        .random(() => 0.5)
        .on("end", draw);  

    cloud.start();
    if (invalidation) invalidation.then(() => cloud.stop());
  
    function draw(words) {
        g.selectAll("text")
          .data(words)
          .enter().append("text")
          .attr("font-size", d => d.size)  
          .attr("fill", d => colorScale(d.score))
          .attr("transform", d => `translate(${d.x},${d.y}) rotate(${d.rotate})`)
          .text(d => d.text);
      }
    
    const defs = svg.append("defs");
    const gradientId = "color-gradient";
    const linearGradient = defs.append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%")
      .attr("x2", "100%");
  
    const numStops = 10;
    const stopScale = d3.scaleLinear().domain([0, numStops - 1]).range(scoreExtent);
    for (let i = 0; i < numStops; i++) {
      linearGradient.append("stop")
        .attr("offset", `${(i / (numStops - 1)) * 100}%`)
        .attr("stop-color", colorScale(stopScale(i)));
    }
  
    const legend = svg.append("g")
      .attr("transform", `translate(${width / 2 - 100}, ${height + 30})`);
  
    legend.append("rect")
      .attr("width", 200)
      .attr("height", 12)
      .style("fill", `url(#${gradientId})`);
  
    legend.append("text")
      .attr("x", 0)
      .attr("y", 26)
      .attr("font-size", 10)
      .attr("text-anchor", "start")
      .text(scoreExtent[0].toFixed(3));
  
    legend.append("text")
      .attr("x", 200)
      .attr("y", 26)
      .attr("font-size", 10)
      .attr("text-anchor", "end")
      .text(scoreExtent[1].toFixed(3));
  
    return svg.node();
  }
  