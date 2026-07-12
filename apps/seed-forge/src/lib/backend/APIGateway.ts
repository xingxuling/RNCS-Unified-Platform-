// THE SEED v2.0 - AGI Backend - API Gateway
// Main API gateway for all backend services

import { IALService } from './services/IALService';
import { OSEService } from './services/OSEService';
import { UniverseForgeService } from './services/UniverseForgeService';
import { SEEDRTService } from './services/SEEDRTService';
import { AIAssistantService } from './services/AIAssistantService';

/**
 * API Gateway
 * Main entry point for all API requests
 */
export class APIGateway {
  private ialService: IALService;
  private oseService: OSEService;
  private forgeService: UniverseForgeService;
  private rtService: SEEDRTService;
  private aiService: AIAssistantService;

  constructor() {
    this.ialService = new IALService();
    this.oseService = new OSEService();
    this.forgeService = new UniverseForgeService();
    this.rtService = new SEEDRTService();
    this.aiService = new AIAssistantService();
  }

  // IAL API
  async compileIAL(source: string, useWorker: boolean = false) {
    return await this.ialService.compile(source, useWorker);
  }

  async validateIAL(source: string) {
    return this.ialService.validate(source);
  }

  async executeIAL(compiled: any[]) {
    return await this.ialService.execute(compiled);
  }

  async autocompleteIAL(source: string, cursor: number, context?: any) {
    return this.ialService.getAutocomplete(source, cursor, context);
  }

  // OSE API
  async executeOSE(compiled: any, useCache: boolean = true) {
    return await this.oseService.execute(compiled, useCache);
  }

  async getOSEState() {
    return this.oseService.getState();
  }

  async processNineCore(compiled: any, state?: any) {
    return await this.oseService.processNineCore(compiled, state);
  }

  async calculateFateConvergence(state?: any) {
    return await this.oseService.calculateFateConvergence(state);
  }

  // Universe-Forge API
  async generateUniverse(input: any, config?: any) {
    return await this.forgeService.generateUniverse(input, config);
  }

  async generateCosmos(params?: any) {
    return await this.forgeService.generateCosmos(params);
  }

  async generateCivilization(params: any) {
    return await this.forgeService.generateCivilization(params);
  }

  async generateCharacter(params: any) {
    return await this.forgeService.generateCharacter(params);
  }

  async generateFateStructure(params: any) {
    return await this.forgeService.generateFateStructure(params);
  }

  async generateEvent(params: any) {
    return await this.forgeService.generateEvent(params);
  }

  async generateTimeline(params: any) {
    return await this.forgeService.generateTimeline(params);
  }

  // SEED-RT API
  async createRuntime(initialState?: any, config?: any) {
    return this.rtService.createRuntime(initialState, config);
  }

  async startRuntime(runtimeId: string) {
    return await this.rtService.startRuntime(runtimeId);
  }

  async stopRuntime(runtimeId: string) {
    return this.rtService.stopRuntime(runtimeId);
  }

  async executeCycle(runtimeId: string) {
    return await this.rtService.executeCycle(runtimeId);
  }

  async executeCycles(runtimeId: string, count: number) {
    return await this.rtService.executeCycles(runtimeId, count);
  }

  async getRuntimeState(runtimeId: string) {
    return this.rtService.getState(runtimeId);
  }

  async getTimelines(runtimeId: string) {
    return this.rtService.getTimelines(runtimeId);
  }

  async branchTimeline(runtimeId: string, timelineId: string, nodeId: string) {
    return this.rtService.branchTimeline(runtimeId, timelineId, nodeId);
  }

  async mergeTimelines(runtimeId: string, timelineIds: string[], mergePoint: string) {
    return this.rtService.mergeTimelines(runtimeId, timelineIds, mergePoint);
  }

  async collapseTimeline(runtimeId: string, timelineId: string, reason: string) {
    return this.rtService.collapseTimeline(runtimeId, timelineId, reason);
  }

  async getConvergence(runtimeId: string) {
    return this.rtService.getConvergence(runtimeId);
  }

  // AI Assistant API
  async nlpToIAL(text: string) {
    return await this.aiService.nlpToIAL(text);
  }

  async generateContent(prompt: string, type: string) {
    return await this.aiService.generateContent(prompt, type as any);
  }

  async generateDialogue(context: any) {
    return await this.aiService.generateDialogue(context);
  }

  async smartCompletion(source: string, cursor: number, context?: any) {
    return await this.aiService.smartCompletion(source, cursor, context);
  }

  async validateAndFix(ial: string) {
    return await this.aiService.validateAndFix(ial);
  }
}

// Create singleton instance
export const apiGateway = new APIGateway();

