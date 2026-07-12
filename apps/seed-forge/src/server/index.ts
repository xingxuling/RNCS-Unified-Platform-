// THE SEED v2.0 - HTTP Server
// Express.js server for AGI Backend Framework

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { apiGateway } from '../lib/backend/APIGateway';
import { GenerationInput } from '../lib/forge/UniverseForge';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message,
    },
    metadata: {
      timestamp: Date.now(),
      path: req.path,
    },
  });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: Date.now(),
      version: '2.0',
    },
  });
});

// ==================== IAL API ====================

app.post('/api/ial/compile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { source, useWorker } = req.body;
    if (!source) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'source is required' },
      });
    }
    const result = await apiGateway.compileIAL(source, useWorker || false);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

app.post('/api/ial/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { source } = req.body;
    if (!source) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'source is required' },
      });
    }
    const result = apiGateway.validateIAL(source);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

app.post('/api/ial/execute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { compiled } = req.body;
    if (!compiled) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'compiled is required' },
      });
    }
    const result = await apiGateway.executeIAL(compiled);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

app.get('/api/ial/autocomplete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { source, cursor, context } = req.query;
    if (!source) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'source is required' },
      });
    }
    const cursorNum = typeof cursor === 'string' ? parseInt(cursor) : (typeof cursor === 'number' ? cursor : (source as string).length);
    const result = apiGateway.autocompleteIAL(
      source as string,
      cursorNum,
      context ? JSON.parse(context as string) : undefined
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

app.post('/api/ial/worker-compile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { source } = req.body;
    if (!source) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'source is required' },
      });
    }
    const result = await apiGateway.compileIAL(source, true);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// ==================== OSE API ====================

app.post('/api/ose/execute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { compiled, useCache } = req.body;
    if (!compiled) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'compiled is required' },
      });
    }
    const result = await apiGateway.executeOSE(compiled, useCache !== false);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

app.get('/api/ose/state', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const state = apiGateway.getOSEState();
    res.json({ success: true, data: state });
  } catch (error) {
    next(error);
  }
});

app.post('/api/ose/nine-core', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { compiled, state } = req.body;
    if (!compiled) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'compiled is required' },
      });
    }
    const result = await apiGateway.processNineCore(compiled, state);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

app.post('/api/ose/fate-convergence', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { state } = req.body;
    const result = await apiGateway.calculateFateConvergence(state);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

app.post('/api/ose/structure-jump', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentGraph, targetLevel } = req.body;
    if (!currentGraph || targetLevel === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'currentGraph and targetLevel are required' },
      });
    }
    // Note: performStructureJump is not yet implemented in APIGateway
    // This endpoint is reserved for future implementation
    res.status(501).json({
      success: false,
      error: { code: 'NOT_IMPLEMENTED', message: 'Structure jump not yet implemented' },
    });
  } catch (error) {
    next(error);
  }
});

// ==================== Universe-Forge API ====================

app.post('/api/forge/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { input, config } = req.body;
    if (!input) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'input is required' },
      });
    }
    const result = await apiGateway.generateUniverse(input as GenerationInput, config);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

app.post('/api/forge/cosmo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { params } = req.body;
    const result = await apiGateway.generateCosmos(params);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

app.post('/api/forge/civilization', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { params } = req.body;
    if (!params) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'params is required' },
      });
    }
    const result = await apiGateway.generateCivilization(params);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

app.post('/api/forge/character', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { params } = req.body;
    if (!params) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'params is required' },
      });
    }
    const result = await apiGateway.generateCharacter(params);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

app.post('/api/forge/fate-structure', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { params } = req.body;
    const result = await apiGateway.generateFateStructure(params || {});
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

app.post('/api/forge/event', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { params } = req.body;
    const result = await apiGateway.generateEvent(params || {});
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

app.post('/api/forge/timeline', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { params } = req.body;
    const result = await apiGateway.generateTimeline(params || {});
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// ==================== SEED-RT API ====================

app.post('/api/runtime/create', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { initialState, config } = req.body;
    const runtimeId = apiGateway.createRuntime(initialState, config);
    res.json({ success: true, data: { runtimeId } });
  } catch (error) {
    next(error);
  }
});

app.post('/api/runtime/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { runtimeId } = req.body;
    if (!runtimeId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'runtimeId is required' },
      });
    }
    await apiGateway.startRuntime(runtimeId);
    res.json({ success: true, data: { message: 'Runtime started' } });
  } catch (error) {
    next(error);
  }
});

app.post('/api/runtime/stop', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { runtimeId } = req.body;
    if (!runtimeId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'runtimeId is required' },
      });
    }
    apiGateway.stopRuntime(runtimeId);
    res.json({ success: true, data: { message: 'Runtime stopped' } });
  } catch (error) {
    next(error);
  }
});

app.post('/api/runtime/cycle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { runtimeId } = req.body;
    if (!runtimeId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'runtimeId is required' },
      });
    }
    const result = await apiGateway.executeCycle(runtimeId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

app.post('/api/runtime/cycles', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { runtimeId, count } = req.body;
    if (!runtimeId || !count) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'runtimeId and count are required' },
      });
    }
    const results = await apiGateway.executeCycles(runtimeId, count);
    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
});

app.get('/api/runtime/state', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { runtimeId } = req.query;
    if (!runtimeId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'runtimeId is required' },
      });
    }
    const state = apiGateway.getRuntimeState(runtimeId as string);
    res.json({ success: true, data: state });
  } catch (error) {
    next(error);
  }
});

app.get('/api/runtime/timelines', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { runtimeId } = req.query;
    if (!runtimeId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'runtimeId is required' },
      });
    }
    const timelines = apiGateway.getTimelines(runtimeId as string);
    res.json({ success: true, data: timelines });
  } catch (error) {
    next(error);
  }
});

app.post('/api/runtime/timeline/branch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { runtimeId, timelineId, nodeId } = req.body;
    if (!runtimeId || !timelineId || !nodeId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'runtimeId, timelineId, and nodeId are required' },
      });
    }
    const result = apiGateway.branchTimeline(runtimeId, timelineId, nodeId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

app.post('/api/runtime/timeline/merge', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { runtimeId, timelineIds, mergePoint } = req.body;
    if (!runtimeId || !timelineIds || !mergePoint) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'runtimeId, timelineIds, and mergePoint are required' },
      });
    }
    const result = apiGateway.mergeTimelines(runtimeId, timelineIds, mergePoint);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

app.post('/api/runtime/timeline/collapse', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { runtimeId, timelineId, reason } = req.body;
    if (!runtimeId || !timelineId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'runtimeId and timelineId are required' },
      });
    }
    const result = apiGateway.collapseTimeline(runtimeId, timelineId, reason || 'Structural inconsistency');
    res.json({ success: true, data: { collapsed: result } });
  } catch (error) {
    next(error);
  }
});

app.get('/api/runtime/convergence', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { runtimeId } = req.query;
    if (!runtimeId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'runtimeId is required' },
      });
    }
    const convergence = apiGateway.getConvergence(runtimeId as string);
    res.json({ success: true, data: convergence });
  } catch (error) {
    next(error);
  }
});

// ==================== AI Assistant API ====================

app.post('/api/ai/nlp-to-ial', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'text is required' },
      });
    }
    const result = await apiGateway.nlpToIAL(text);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

app.post('/api/ai/generate-content', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt, type } = req.body;
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'prompt is required' },
      });
    }
    const result = await apiGateway.generateContent(prompt, type || 'description');
    res.json({ success: true, data: { content: result } });
  } catch (error) {
    next(error);
  }
});

app.post('/api/ai/generate-dialogue', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { context } = req.body;
    if (!context) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'context is required' },
      });
    }
    const result = await apiGateway.generateDialogue(context);
    res.json({ success: true, data: { dialogue: result } });
  } catch (error) {
    next(error);
  }
});

app.post('/api/ai/smart-completion', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { source, cursor, context } = req.body;
    if (!source || cursor === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'source and cursor are required' },
      });
    }
    const result = await apiGateway.smartCompletion(source, cursor, context);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

app.post('/api/ai/validate-fix', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ial } = req.body;
    if (!ial) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'ial is required' },
      });
    }
    const result = await apiGateway.validateAndFix(ial);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    metadata: {
      timestamp: Date.now(),
    },
  });
});

// Start server
export function startServer(port: number | string = PORT): void {
  const portNum = typeof port === 'string' ? parseInt(port) : port;
  app.listen(portNum, () => {
    console.log(`🚀 THE SEED AGI Backend Server running on http://localhost:${portNum}`);
    console.log(`📚 API Documentation: http://localhost:${portNum}/health`);
  });
}

// Export app for testing
export { app };

