import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { WordCloud } from './wordcloud.js';  

const regions = [
    { id: "northeast", file: "northeast_wordcloud_d3.json", title: "Northeast" },
    { id: "midwest",   file: "midwest_wordcloud_d3.json",   title: "Midwest" },
    { id: "south",     file: "south_wordcloud_d3.json",     title: "South" },
    { id: "west",      file: "west_wordcloud_d3.json",      title: "West" }
  ];
  

regions.forEach(({ id, file, title }) => {
  d3.json(file).then(data => {
    const chart = WordCloud(data, {
      width: 800,
      height: 500,
      rotate: 0,
      padding: 0.5
    });

    const container = d3.select(`#${id}`);
    container.append("h2").text(`Top Haunted Objects – ${title}`);
    container.node().appendChild(chart);
  });
});
