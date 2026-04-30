const serializeError = (error) => {
  if (!error) {
    return null;
  }
  return {
    message: error.message,
    stack: error.stack
  };
};

export const logInfo = (event, data = {}) => {
  console.info(JSON.stringify({ level: 'info', event, ...data }));
};

export const logError = (event, error, data = {}) => {
  console.error(JSON.stringify({
    level: 'error',
    event,
    ...data,
    error: serializeError(error)
  }));
};
