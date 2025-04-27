/* script.js */
function generateVisualization(pageId, containerId) {
    const data = Array.from({ length: 20 }, () => Math.random() * 100);

    const svg = d3.select(containerId)
        .append("svg")
        .attr("width", 600)
        .attr("height", 400);

    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", (d, i) => i * 30 + 20)
        .attr("cy", 200)
        .attr("r", d => d / 10)
        .attr("fill", "purple")
        .attr("stroke", "black");
}

document.addEventListener("DOMContentLoaded", () => {
    const pageId = document.body.querySelector("div[id^=visualization]").id;
    generateVisualization(pageId, `#${pageId}`);
});
