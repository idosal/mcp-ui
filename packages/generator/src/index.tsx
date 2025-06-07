import React, { useState } from 'react';

export interface JSONSchemaProperty {
  type: string;
  enum?: (string | number)[];
  title?: string;
}

export interface JSONSchema {
  type: 'object';
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
}

interface GeneratedFormProps {
  schema: JSONSchema;
}

const GeneratedForm: React.FC<GeneratedFormProps> = ({ schema }) => {
  const { properties } = schema;
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const handleChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const renderField = (key: string, prop: JSONSchemaProperty) => {
    if (prop.enum) {
      return (
        <select
          data-testid={`${key}-select`}
          value={(formData[key] as string | undefined) ?? ''}
          onChange={(e) => handleChange(key, e.target.value)}
        >
          <option value="">Select {key}</option>
          {prop.enum.map((option) => (
            <option key={String(option)} value={String(option)}>
              {String(option)}
            </option>
          ))}
        </select>
      );
    }

    switch (prop.type) {
      case 'string':
        return (
          <input
            data-testid={`${key}-input`}
            type="text"
            value={(formData[key] as string | undefined) ?? ''}
            onChange={(e) => handleChange(key, e.target.value)}
          />
        );
      case 'number':
      case 'integer':
        return (
          <input
            data-testid={`${key}-input`}
            type="number"
            value={formData[key] ?? ''}
            onChange={(e) => handleChange(key, Number(e.target.value))}
          />
        );
      default:
        return null;
    }
  };

  return (
    <form>
      {Object.entries(properties).map(([key, prop]) => (
        <div key={key}>
          <label>
            {prop.title || key}
            {renderField(key, prop)}
          </label>
        </div>
      ))}
    </form>
  );
};

export const generateUI = (schema: JSONSchema): React.ReactElement => {
  return <GeneratedForm schema={schema} />;
};

export { GeneratedForm };
