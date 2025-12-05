import { SimulationConfig } from '../types';

const STORAGE_KEYS = {
  ACTIVE_SIMULATION: 'cryptosim_active_simulation',
  SIMULATION_HISTORY: 'cryptosim_history',
};

export const storage = {
  // Save active simulation
  saveSimulation: (config: SimulationConfig) => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SIMULATION, JSON.stringify(config));
  },

  // Get active simulation
  getSimulation: (): SimulationConfig | null => {
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_SIMULATION);
    return data ? JSON.parse(data) : null;
  },

  // Clear active simulation
  clearSimulation: () => {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SIMULATION);
  },

  // Save completed simulation to history log
  archiveSimulation: (config: SimulationConfig) => {
    const historyJson = localStorage.getItem(STORAGE_KEYS.SIMULATION_HISTORY);
    const history: SimulationConfig[] = historyJson ? JSON.parse(historyJson) : [];
    history.push(config);
    localStorage.setItem(STORAGE_KEYS.SIMULATION_HISTORY, JSON.stringify(history));
  },

  // Get all past simulations
  getArchivedSimulations: (): SimulationConfig[] => {
    const historyJson = localStorage.getItem(STORAGE_KEYS.SIMULATION_HISTORY);
    return historyJson ? JSON.parse(historyJson) : [];
  }
};
