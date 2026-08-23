// Shared domain errors.

export class DuplicateFeedbackError extends Error {
  constructor() {
    super('Feedback already submitted for this product');
    this.name = 'DuplicateFeedbackError';
  }
}
