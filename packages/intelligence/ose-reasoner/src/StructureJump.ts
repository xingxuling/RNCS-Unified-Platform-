// THE SEED v2.0 - OSE Structure Jump Reasoning
// Structure Jump: Movement from one structural graph to higher-order graph

import { OSEState, StructureNode, StructureEdge } from './Core';

/**
 * Structure Graph
 */
export interface StructureGraph {
  nodes: StructureNode[];
  edges: StructureEdge[];
  level: number;           // Graph order level
  complexity: number;      // 0-1
  coherence: number;       // 0-1
}

/**
 * Structure Jump
 */
export interface StructureJump {
  from: StructureGraph;
  to: StructureGraph;
  jumpType: 'abstraction' | 'refinement' | 'transformation' | 'merger';
  confidence: number;      // 0-1
  reasoning: string[];
}

/**
 * Structure Jump Reasoning Engine
 * Performs structure jumps between different abstraction levels
 */
export class StructureJumpEngine {
  /**
   * Perform structure jump
   */
  jump(
    currentGraph: StructureGraph,
    targetLevel: number,
    jumpType?: StructureJump['jumpType']
  ): StructureJump {
    const reasoning: string[] = [];
    
    // Determine jump type if not specified
    if (!jumpType) {
      jumpType = this.determineJumpType(currentGraph, targetLevel);
    }

    reasoning.push(`Performing ${jumpType} jump from level ${currentGraph.level} to level ${targetLevel}`);

    // Perform jump based on type
    let targetGraph: StructureGraph;
    
    switch (jumpType) {
      case 'abstraction':
        targetGraph = this.performAbstraction(currentGraph, targetLevel, reasoning);
        break;
      
      case 'refinement':
        targetGraph = this.performRefinement(currentGraph, targetLevel, reasoning);
        break;
      
      case 'transformation':
        targetGraph = this.performTransformation(currentGraph, targetLevel, reasoning);
        break;
      
      case 'merger':
        targetGraph = this.performMerger(currentGraph, targetLevel, reasoning);
        break;
    }

    const confidence = this.calculateJumpConfidence(currentGraph, targetGraph, jumpType);

    return {
      from: currentGraph,
      to: targetGraph,
      jumpType,
      confidence,
      reasoning,
    };
  }

  /**
   * Determine jump type
   */
  private determineJumpType(
    currentGraph: StructureGraph,
    targetLevel: number
  ): StructureJump['jumpType'] {
    if (targetLevel > currentGraph.level) {
      return 'abstraction';
    } else if (targetLevel < currentGraph.level) {
      return 'refinement';
    } else {
      // Same level: transformation or merger
      return currentGraph.nodes.length > 10 ? 'merger' : 'transformation';
    }
  }

  /**
   * Perform abstraction jump (lower to higher order)
   */
  private performAbstraction(
    currentGraph: StructureGraph,
    targetLevel: number,
    reasoning: string[]
  ): StructureGraph {
    reasoning.push('Abstraction: Grouping nodes into higher-order structures');

    // Group nodes by similarity or connectivity
    const groups = this.groupNodes(currentGraph);
    reasoning.push(`Grouped ${currentGraph.nodes.length} nodes into ${groups.length} groups`);

    // Create abstract nodes from groups
    const abstractNodes: StructureNode[] = groups.map((group, i) => ({
      id: `abstract_${targetLevel}_${i}`,
      type: 'abstract',
      glyph: 'Γ',
      properties: {
        level: targetLevel,
        contains: group.map(n => n.id),
        complexity: group.length,
      },
    }));

    // Create abstract edges
    const abstractEdges: StructureEdge[] = this.createAbstractEdges(groups, currentGraph.edges);

    const complexity = this.calculateComplexity(abstractNodes, abstractEdges);
    const coherence = this.calculateCoherence(abstractNodes, abstractEdges);

    return {
      nodes: abstractNodes,
      edges: abstractEdges,
      level: targetLevel,
      complexity,
      coherence,
    };
  }

  /**
   * Perform refinement jump (higher to lower order)
   */
  private performRefinement(
    currentGraph: StructureGraph,
    targetLevel: number,
    reasoning: string[]
  ): StructureJump['to'] {
    reasoning.push('Refinement: Expanding abstract nodes into detailed structures');

    // Expand each abstract node
    const refinedNodes: StructureNode[] = [];
    const refinedEdges: StructureEdge[] = [];

    for (const node of currentGraph.nodes) {
      if (node.properties.contains) {
        // Expand abstract node
        const expanded = this.expandNode(node, targetLevel);
        refinedNodes.push(...expanded.nodes);
        refinedEdges.push(...expanded.edges);
        reasoning.push(`Expanded node ${node.id} into ${expanded.nodes.length} nodes`);
      } else {
        // Keep concrete node
        refinedNodes.push({ ...node });
      }
    }

    // Add connections between refined nodes
    const additionalEdges = this.connectRefinedNodes(refinedNodes, currentGraph.edges);
    refinedEdges.push(...additionalEdges);

    const complexity = this.calculateComplexity(refinedNodes, refinedEdges);
    const coherence = this.calculateCoherence(refinedNodes, refinedEdges);

    return {
      nodes: refinedNodes,
      edges: refinedEdges,
      level: targetLevel,
      complexity,
      coherence,
    };
  }

  /**
   * Perform transformation jump (same level, different structure)
   */
  private performTransformation(
    currentGraph: StructureGraph,
    targetLevel: number,
    reasoning: string[]
  ): StructureGraph {
    reasoning.push('Transformation: Restructuring graph while maintaining level');

    // Transform structure by reorganizing connections
    const transformedNodes = currentGraph.nodes.map(node => ({
      ...node,
      properties: {
        ...node.properties,
        transformed: true,
      },
    }));

    const transformedEdges = this.reorganizeEdges(currentGraph.edges, transformedNodes);
    reasoning.push(`Reorganized ${transformedEdges.length} edges`);

    const complexity = this.calculateComplexity(transformedNodes, transformedEdges);
    const coherence = this.calculateCoherence(transformedNodes, transformedEdges);

    return {
      nodes: transformedNodes,
      edges: transformedEdges,
      level: targetLevel,
      complexity,
      coherence,
    };
  }

  /**
   * Perform merger jump (combining multiple structures)
   */
  private performMerger(
    currentGraph: StructureGraph,
    targetLevel: number,
    reasoning: string[]
  ): StructureGraph {
    reasoning.push('Merger: Combining structures into unified graph');

    // Merge similar nodes
    const mergedNodes = this.mergeSimilarNodes(currentGraph.nodes);
    reasoning.push(`Merged ${currentGraph.nodes.length} nodes into ${mergedNodes.length} nodes`);

    // Merge edges
    const mergedEdges = this.mergeEdges(currentGraph.edges, mergedNodes);
    reasoning.push(`Merged ${currentGraph.edges.length} edges into ${mergedEdges.length} edges`);

    const complexity = this.calculateComplexity(mergedNodes, mergedEdges);
    const coherence = this.calculateCoherence(mergedNodes, mergedEdges);

    return {
      nodes: mergedNodes,
      edges: mergedEdges,
      level: targetLevel,
      complexity,
      coherence,
    };
  }

  // Helper methods

  private groupNodes(graph: StructureGraph): StructureNode[][] {
    // Simple grouping: group by type or connectivity
    const groups: StructureNode[][] = [];
    const visited = new Set<string>();

    for (const node of graph.nodes) {
      if (visited.has(node.id)) continue;

      const group = [node];
      visited.add(node.id);

      // Find connected nodes
      for (const edge of graph.edges) {
        if (edge.from === node.id && !visited.has(edge.to)) {
          const targetNode = graph.nodes.find(n => n.id === edge.to);
          if (targetNode) {
            group.push(targetNode);
            visited.add(targetNode.id);
          }
        }
      }

      groups.push(group);
    }

    return groups;
  }

  private createAbstractEdges(
    groups: StructureNode[][],
    originalEdges: StructureEdge[]
  ): StructureEdge[] {
    const abstractEdges: StructureEdge[] = [];
    const groupMap = new Map<string, number>();

    groups.forEach((group, i) => {
      group.forEach(node => groupMap.set(node.id, i));
    });

    // Create edges between groups
    const groupConnections = new Set<string>();
    for (const edge of originalEdges) {
      const fromGroup = groupMap.get(edge.from);
      const toGroup = groupMap.get(edge.to);
      
      if (fromGroup !== undefined && toGroup !== undefined && fromGroup !== toGroup) {
        const key = `${fromGroup}-${toGroup}`;
        if (!groupConnections.has(key)) {
          abstractEdges.push({
            id: `abstract_edge_${fromGroup}_${toGroup}`,
            from: `abstract_${fromGroup}`,
            to: `abstract_${toGroup}`,
            type: 'abstract',
            weight: 1,
          });
          groupConnections.add(key);
        }
      }
    }

    return abstractEdges;
  }

  private expandNode(node: StructureNode, targetLevel: number): {
    nodes: StructureNode[];
    edges: StructureEdge[];
  } {
    const nodes: StructureNode[] = [];
    const edges: StructureEdge[] = [];

    const containedIds = node.properties.contains as string[] || [];
    const count = Math.max(2, containedIds.length);

    // Create expanded nodes
    for (let i = 0; i < count; i++) {
      nodes.push({
        id: `${node.id}_expanded_${i}`,
        type: 'refined',
        glyph: 'Γ',
        properties: {
          level: targetLevel,
          original: node.id,
        },
      });
    }

    // Create edges between expanded nodes
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        id: `refined_edge_${i}_${i + 1}`,
        from: nodes[i].id,
        to: nodes[i + 1].id,
        type: 'refined',
        weight: 1,
      });
    }

    return { nodes, edges };
  }

  private connectRefinedNodes(
    nodes: StructureNode[],
    originalEdges: StructureEdge[]
  ): StructureEdge[] {
    // Create connections based on original edges
    const edges: StructureEdge[] = [];
    const nodeMap = new Map<string, StructureNode[]>();

    // Group nodes by original
    for (const node of nodes) {
      const original = node.properties.original as string;
      if (original) {
        if (!nodeMap.has(original)) {
          nodeMap.set(original, []);
        }
        nodeMap.get(original)!.push(node);
      }
    }

    // Create edges between refined nodes
    for (const edge of originalEdges) {
      const fromNodes = nodeMap.get(edge.from) || [];
      const toNodes = nodeMap.get(edge.to) || [];

      if (fromNodes.length > 0 && toNodes.length > 0) {
        edges.push({
          id: `refined_${edge.id}`,
          from: fromNodes[0].id,
          to: toNodes[0].id,
          type: 'refined',
          weight: edge.weight,
        });
      }
    }

    return edges;
  }

  private reorganizeEdges(
    edges: StructureEdge[],
    nodes: StructureNode[]
  ): StructureEdge[] {
    // Reorganize by creating new connections
    const reorganized: StructureEdge[] = [];
    const nodeIds = nodes.map(n => n.id);

    for (let i = 0; i < Math.min(edges.length, nodeIds.length - 1); i++) {
      reorganized.push({
        id: `reorganized_${i}`,
        from: nodeIds[i],
        to: nodeIds[i + 1],
        type: 'transformed',
        weight: 1,
      });
    }

    return reorganized;
  }

  private mergeSimilarNodes(nodes: StructureNode[]): StructureNode[] {
    const merged: StructureNode[] = [];
    const mergedMap = new Map<string, StructureNode>();

    for (const node of nodes) {
      const key = `${node.type}_${node.glyph}`;
      
      if (mergedMap.has(key)) {
        // Merge into existing
        const existing = mergedMap.get(key)!;
        existing.properties.count = (existing.properties.count || 1) + 1;
      } else {
        // Create new merged node
        const mergedNode = {
          ...node,
          properties: {
            ...node.properties,
            count: 1,
            merged: true,
          },
        };
        merged.push(mergedNode);
        mergedMap.set(key, mergedNode);
      }
    }

    return merged;
  }

  private mergeEdges(
    edges: StructureEdge[],
    mergedNodes: StructureNode[]
  ): StructureEdge[] {
    const nodeMap = new Map<string, string>();
    
    // Map original nodes to merged nodes
    for (const node of mergedNodes) {
      if (node.properties.original) {
        nodeMap.set(node.properties.original as string, node.id);
      }
    }

    const merged: StructureEdge[] = [];
    const edgeSet = new Set<string>();

    for (const edge of edges) {
      const from = nodeMap.get(edge.from) || edge.from;
      const to = nodeMap.get(edge.to) || edge.to;
      const key = `${from}-${to}`;

      if (!edgeSet.has(key) && from !== to) {
        merged.push({
          id: `merged_${key}`,
          from,
          to,
          type: 'merged',
          weight: edge.weight,
        });
        edgeSet.add(key);
      }
    }

    return merged;
  }

  private calculateComplexity(nodes: StructureNode[], edges: StructureEdge[]): number {
    const nodeComplexity = nodes.length / 100; // Normalize to 0-1
    const edgeComplexity = edges.length / 200; // Normalize to 0-1
    return Math.min(1.0, (nodeComplexity + edgeComplexity) / 2);
  }

  private calculateCoherence(nodes: StructureNode[], edges: StructureEdge[]): number {
    if (nodes.length === 0) return 0.5;
    
    const connectivity = edges.length / Math.max(1, nodes.length - 1);
    return Math.min(1.0, connectivity);
  }

  private calculateJumpConfidence(
    from: StructureGraph,
    to: StructureGraph,
    jumpType: StructureJump['jumpType']
  ): number {
    // Confidence based on:
    // - Graph coherence
    // - Jump type appropriateness
    // - Complexity change

    const coherenceDiff = Math.abs(from.coherence - to.coherence);
    const complexityDiff = Math.abs(from.complexity - to.complexity);

    let baseConfidence = 0.7;

    // Adjust based on jump type
    switch (jumpType) {
      case 'abstraction':
        if (to.nodes.length < from.nodes.length) baseConfidence += 0.1;
        break;
      case 'refinement':
        if (to.nodes.length > from.nodes.length) baseConfidence += 0.1;
        break;
      case 'transformation':
        if (coherenceDiff < 0.2) baseConfidence += 0.1;
        break;
      case 'merger':
        if (to.nodes.length < from.nodes.length) baseConfidence += 0.1;
        break;
    }

    // Penalize large coherence/complexity changes
    if (coherenceDiff > 0.5 || complexityDiff > 0.5) {
      baseConfidence -= 0.2;
    }

    return Math.max(0, Math.min(1.0, baseConfidence));
  }

  /**
   * Convert OSE state to structure graph
   */
  stateToGraph(oseState: OSEState): StructureGraph {
    return {
      nodes: oseState.blue.nodes,
      edges: oseState.blue.edges,
      level: 0, // Base level
      complexity: this.calculateComplexity(oseState.blue.nodes, oseState.blue.edges),
      coherence: this.calculateCoherence(oseState.blue.nodes, oseState.blue.edges),
    };
  }
}

