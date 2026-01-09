import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";

export default function SankeyPathway({ scenario, events }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!events || events.length === 0) return;

    const width = 600;
    const height = 500;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const nodeNames = [];
    const links = [];

    // Build nodes
    events.forEach((e) => {
      nodeNames.push(e.title);
      nodeNames.push(e.type);
      nodeNames.push(e.location);
    });

    const uniqueNodes = [...new Set(nodeNames)].map((name) => ({ name }));

    // Build links (Event → Type → Location)
    events.forEach((e) => {
      links.push({
        source: uniqueNodes.findIndex((n) => n.name === e.title),
        target: uniqueNodes.findIndex((n) => n.name === e.type),
        value: 1
      });

      links.push({
        source: uniqueNodes.findIndex((n) => n.name === e.type),
        target: uniqueNodes.findIndex((n) => n.name === e.location),
        value: 1
      });
    });

    const sankeyLayout = sankey()
      .nodeWidth(20)
      .nodePadding(20)
      .extent([[1, 1], [width - 1, height - 6]]);

    const graph = sankeyLayout({
      nodes: uniqueNodes.map((d) => ({ ...d })),
      links: links.map((d) => ({ ...d }))
    });

    // Draw links
    svg
      .append("g")
      .selectAll("path")
      .data(graph.links)
      .enter()
      .append("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke", "#4F46E5")
      .attr("stroke-width", (d) => Math.max(1, d.width))
      .attr("fill", "none")
      .attr("opacity", 0.4);

    // Draw nodes
    const node = svg
      .append("g")
      .selectAll("rect")
      .data(graph.nodes)
      .enter()
      .append("g");

    node
      .append("rect")
      .attr("x", (d) => d.x0)
      .attr("y", (d) => d.y0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("width", (d) => d.x1 - d.x0)
      .attr("fill", "#1E3A8A")
      .attr("opacity", 0.8);

    node
      .append("text")
      .attr("x", (d) => d.x0 - 6)
      .attr("y", (d) => (d.y1 + d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .text((d) => d.name)
      .style("font-size", "10px")
      .style("fill", "#111");

  }, [events]);

  return (
    <div className="p-4 bg-white rounded-xl shadow border">
      <h2 className="text-lg font-bold mb-4">
        Sankey Diagram — {scenario.name}
      </h2>
      <svg ref={svgRef} width={900} height={500}></svg>
    </div>
  );
}
