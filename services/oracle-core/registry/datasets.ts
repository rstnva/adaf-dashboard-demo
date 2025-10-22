import type { Dataset } from './schema';

const datasets: Dataset[] = [];

export function registerDataset(dataset: Dataset) {
  const index = datasets.findIndex(entry => entry.id === dataset.id);
  if (index >= 0) {
    datasets[index] = dataset;
    return;
  }
  datasets.push(dataset);
}

export function listDatasets(): Dataset[] {
  return [...datasets];
}

export function findDataset(datasetId: string): Dataset | undefined {
  return datasets.find(dataset => dataset.id === datasetId);
}
