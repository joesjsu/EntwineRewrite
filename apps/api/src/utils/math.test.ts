import { add } from './math';

describe('add function', () => {
  it('should correctly add two positive numbers', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('should correctly add a positive number and zero', () => {
    expect(add(5, 0)).toBe(5);
  });

  it('should correctly add two negative numbers', () => {
    expect(add(-2, -3)).toBe(-5);
  });

  it('should correctly add a positive and a negative number', () => {
    expect(add(5, -3)).toBe(2);
  });
});