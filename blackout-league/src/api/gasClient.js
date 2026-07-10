const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const createMockEntityAPI = (entityName) => {
  let data = [];
  let nextId = 1;

  return {
    list: async (sort, limit) => {
      await sleep(100);
      let result = [...data];
      if (sort) {
        const isDesc = sort.startsWith('-');
        const key = isDesc ? sort.substring(1) : sort;
        result.sort((a, b) => {
          if (a[key] < b[key]) return isDesc ? 1 : -1;
          if (a[key] > b[key]) return isDesc ? -1 : 1;
          return 0;
        });
      }
      if (limit) {
        result = result.slice(0, limit);
      }
      return result;
    },
    get: async (id) => {
      await sleep(100);
      return data.find(item => item.id === id) || null;
    },
    create: async (item) => {
      await sleep(100);
      const newItem = { id: nextId++, ...item };
      data.push(newItem);
      return newItem;
    },
    update: async (id, updates) => {
      await sleep(100);
      const index = data.findIndex(item => item.id === id);
      if (index !== -1) {
        data[index] = { ...data[index], ...updates };
        return data[index];
      }
      return null;
    },
    delete: async (id) => {
      await sleep(100);
      data = data.filter(item => item.id !== id);
      return true;
    },
    filter: async (filters, sort, limit) => {
      await sleep(100);
      let result = data.filter(item => {
        for (const key in filters) {
          if (item[key] !== filters[key]) return false;
        }
        return true;
      });
      if (sort) {
        const isDesc = sort.startsWith('-');
        const key = isDesc ? sort.substring(1) : sort;
        result.sort((a, b) => {
          if (a[key] < b[key]) return isDesc ? 1 : -1;
          if (a[key] > b[key]) return isDesc ? -1 : 1;
          return 0;
        });
      }
      if (limit) {
        result = result.slice(0, limit);
      }
      return result;
    }
  };
};

export const gasClient = {
  auth: {
    me: async () => {
      await sleep(100);
      return { id: 1, full_name: 'Admin User', email: 'admin@blackout.com' };
    },
    loginViaEmailPassword: async (email, password) => {
      await sleep(500);
      if (email && password) return true;
      throw new Error("Invalid credentials");
    },
    loginWithProvider: (provider, redirectUrl) => {
       console.log(`Mock login with ${provider}, redirect to ${redirectUrl}`);
    },
    logout: (redirectUrl) => {
      console.log(`Mock logout, redirect to ${redirectUrl}`);
      if (redirectUrl) window.location.href = redirectUrl;
    },
    register: async ({email, password}) => {
      await sleep(500);
      return true;
    },
    verifyOtp: async ({email, otpCode}) => {
      await sleep(500);
      return { access_token: "mock-token-123" };
    },
    resendOtp: async (email) => {
      await sleep(500);
      return true;
    },
    setToken: (token) => {
      console.log("Mock setToken", token);
    },
    resetPasswordRequest: async (email) => {
       await sleep(500);
       return true;
    },
    resetPassword: async ({resetToken, newPassword}) => {
       await sleep(500);
       return true;
    }
  },
  entities: {
    Season: createMockEntityAPI('Season'),
    Division: createMockEntityAPI('Division'),
    Team: createMockEntityAPI('Team'),
    Player: createMockEntityAPI('Player'),
    Game: createMockEntityAPI('Game'),
    GameEvent: createMockEntityAPI('GameEvent'),
    RSVP: createMockEntityAPI('RSVP'),
  }
};
