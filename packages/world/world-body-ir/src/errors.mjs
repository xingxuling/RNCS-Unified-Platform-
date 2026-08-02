export class WorldBodyValidationError extends Error {
  constructor(code, path, message, details = undefined) {
    super(`${code} at ${path}: ${message}`);
    this.name = 'WorldBodyValidationError';
    this.code = code;
    this.path = path;
    this.details = details;
  }

  toJSON() {
    return {
      code: this.code,
      path: this.path,
      message: this.message,
      ...(this.details === undefined ? {} : { details: this.details }),
    };
  }
}

export function diagnostic(code, path, message, details = undefined) {
  return {
    code,
    path,
    message,
    ...(details === undefined ? {} : { details }),
  };
}
