import type { Model } from './schema';

const models: Model[] = [];

export function registerModel(model: Model) {
  const index = models.findIndex(entry => entry.id === model.id);
  if (index >= 0) {
    models[index] = model;
    return;
  }
  models.push(model);
}

export function listModels(): Model[] {
  return [...models];
}

export function findModel(modelId: string): Model | undefined {
  return models.find(model => model.id === modelId);
}
