// Mock Base44 Client for Google Apps Script (GAS) Migration

const callGasMethod = (methodName, ...args) => {
  return new Promise((resolve, reject) => {
    if (typeof google === 'undefined' || !google.script || !google.script.run) {
      console.warn(`Mocking GAS call to ${methodName} with args:`, args);
      // In local dev without GAS environment, you could return mock data here.
      // For now, resolve with a generic empty array/object depending on the method.
      if (methodName.endsWith('_list') || methodName.endsWith('_filter')) resolve([]);
      else resolve({});
      return;
    }

    google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
      [methodName](...args);
  });
};

const createGasEntityMock = (entityName) => {
  return {
    list: (...args) => callGasMethod(`${entityName}_list`, ...args),
    get: (...args) => callGasMethod(`${entityName}_get`, ...args),
    filter: (...args) => callGasMethod(`${entityName}_filter`, ...args),
    create: (...args) => callGasMethod(`${entityName}_create`, ...args),
    update: (...args) => callGasMethod(`${entityName}_update`, ...args),
    delete: (...args) => callGasMethod(`${entityName}_delete`, ...args),
  };
};

export const base44 = {
  auth: {
    me: async () => ({
      id: 'mock-user-1',
      name: 'Mock User',
      email: 'mock@example.com',
      role: 'admin',
    }),
    logout: () => {
      console.log('Mock user logout');
    },
    redirectToLogin: () => {
      console.log('Mock redirect to login');
    }
  },
  entities: {
    Game: createGasEntityMock('Game'),
    Team: createGasEntityMock('Team'),
    Player: createGasEntityMock('Player'),
    User: createGasEntityMock('User'),
    GameEvent: createGasEntityMock('GameEvent'),
    Season: createGasEntityMock('Season'),
    Division: createGasEntityMock('Division'),
    RSVP: createGasEntityMock('RSVP'),
  },
  integrations: {
    Core: {
      SendEmail: (params) => callGasMethod('Core_SendEmail', params),
    }
  }
};
