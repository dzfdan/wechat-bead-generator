function createSessionStore() {
  let current = null;

  return {
    get() {
      return current;
    },
    set(value) {
      current = value;
    },
    clear() {
      current = null;
    }
  };
}

module.exports = {
  createSessionStore
};
