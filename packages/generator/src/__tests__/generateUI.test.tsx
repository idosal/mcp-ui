import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { generateUI, JSONSchema } from '../index.js';

describe('generateUI', () => {
  const schema: JSONSchema = {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'Name' },
      age: { type: 'number', title: 'Age' },
      color: { type: 'string', enum: ['red', 'green'], title: 'Color' },
    },
  };

  it('renders form fields based on schema', () => {
    render(generateUI(schema));

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Age')).toBeInTheDocument();
    expect(screen.getByLabelText('Color')).toBeInTheDocument();
  });

  it('updates value on user input', () => {
    render(generateUI(schema));

    const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Alice' } });
    expect(nameInput.value).toBe('Alice');

    const ageInput = screen.getByLabelText('Age') as HTMLInputElement;
    fireEvent.change(ageInput, { target: { value: '30' } });
    expect(ageInput.value).toBe('30');

    const colorSelect = screen.getByLabelText('Color') as HTMLSelectElement;
    fireEvent.change(colorSelect, { target: { value: 'green' } });
    expect(colorSelect.value).toBe('green');
  });
});
