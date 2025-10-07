import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const FlightRequestSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://example.com/schemas/FlightRequest.json",
  title: "FlightRequest",
  type: "object",
  additionalProperties: false,
  properties: {
    originCity: {
      type: "string",
      description: "Origin city for the flight.",
      minLength: 3,
      default: "JFK"
    },
    destinationCity: {
      type: "string",
      description: "Destination city for the flight.",
      minLength: 3,
      default: "LAX"
    },
    dateOfTravel: {
      type: "string",
      format: "date",
      description: "Travel date (YYYY-MM-DD), mapping from Apex Date.",
      default: "2025-11-01"
    },
    filters: {
      type: "object",
      title: "FlightRequestFilter",
      additionalProperties: false,
      properties: {
        price: {
          type: "integer",
          description: "Maximum price in the smallest currency unit (maps from Apex Long).",
          default: 250
        },
        discountPercentage: {
          type: "number",
          description: "Desired discount percentage (maps from Apex Double).",
          default: 0
        }
      },
      required: ["price", "discountPercentage"]
    }
  },
  required: ["originCity", "destinationCity", "dateOfTravel", "filters"]
};

const FlightResponseSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://example.com/schemas/FlightResponse.json",
  title: "FlightResponse",
  type: "object",
  additionalProperties: false,
  properties: {
    flights: {
      type: "array",
      description: "List of available flights.",
      items: {
        type: "object",
        title: "Flight",
        additionalProperties: false,
        properties: {
          flightId: {
            type: "string",
            description: "Unique identifier for the flight."
          },
          numLayovers: {
            type: "integer",
            description: "Number of layovers for the flight."
          },
          isPetAllowed: {
            type: "boolean",
            description: "Indicates whether pets are allowed."
          },
          price: {
            type: "integer",
            description: "Price of the flight in the smallest currency unit (maps from Apex Long)."
          },
          discountPercentage: {
            type: "number",
            description: "Discount percentage applied to the price."
          },
          durationInMin: {
            type: "integer",
            description: "Duration of the flight in minutes."
          }
        },
        required: [
          "flightId",
          "numLayovers",
          "isPetAllowed",
          "price",
          "discountPercentage",
          "durationInMin"
        ]
      }
    }
  },
  required: ["flights"]
};

// TODO Converting this from JSON Schema to Zod raw shape was not straightforward
function getFlightRequestSchemaAsZod() {
  const inputSchema = {
    originCity: z.string().min(3, "Origin city must be at least 3 characters").default("JFK"),
    destinationCity: z.string().min(3, "Destination city must be at least 3 characters").default("LAX"),
    dateOfTravel: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Travel date must be in YYYY-MM-DD format").default("2025-11-01"),
    filters: z.object({
      price: z.number().int().min(0, "Price must be a non-negative integer").default(250),
      discountPercentage: z.number().min(0).max(100, "Discount percentage must be between 0 and 100").default(0)
    })
  };

  console.log("Input Schema:", getZodAsString(inputSchema, "FlightRequestSchema"));
  return inputSchema;
}

function getFlightResponseSchemaAsZod() {
  const outputSchema = {
    flights: z.array(z.object({
      flightId: z.string(),
      numLayovers: z.number().int().min(0, "Number of layovers must be a non-negative integer"),
      isPetAllowed: z.boolean(),
      price: z.number().int().min(0, "Price must be a non-negative integer"),
      discountPercentage: z.number().min(0).max(100, "Discount percentage must be between 0 and 100"),
      durationInMin: z.number().int().min(0, "Duration must be a non-negative integer")
    }))
  };
  console.log("Output Schema %s", getZodAsString(outputSchema, "FlightResponseSchema"));
  return outputSchema;
}

function getZodAsString(schema: any, name: string): string {
  const zodSchema = z.object(schema);
  const jsonSchema = zodToJsonSchema(zodSchema, { 
    name: name,
    $refStrategy: "none" 
  });
  return JSON.stringify(jsonSchema, null, 2);
}

export {
  getFlightRequestSchemaAsZod,
  getFlightResponseSchemaAsZod
};