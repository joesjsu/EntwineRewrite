import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'; // Use simpler import for jest-dom
import { Logo } from './logo'; // Use named import

describe('Logo Component', () => {
  it('should render the logo image', () => {
    render(<Logo />);

    // Find the text element within the logo component
    const logoTextElement = screen.getByText('Entwine');

    expect(logoTextElement).toBeInTheDocument();
  });

  // Add more tests later if needed, e.g., for different sizes or variants
});