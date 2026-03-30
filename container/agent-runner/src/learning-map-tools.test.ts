/**
 * Schema validation tests for Learning Map MCP tools.
 * Tests the zod schemas used by the MCP tools without importing the server module.
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Replicate the add_resource schema from ipc-mcp-stdio.ts
const addResourceSchema = z.object({
  title: z.string(),
  description: z.string(),
  resource_type: z.string(),
  tags: z.array(z.string()).optional(),
  source_url: z.string().optional(),
  extracted_text: z.string().optional(),
  objective_texts: z.array(z.string()).optional(),
  image_base64: z.string().optional(),
  added_by: z.string().default('agent'),
});

// Replicate the record_interaction schema
const recordInteractionSchema = z.object({
  objective_text: z.string(),
  interaction_type: z.enum(['practice', 'exposure', 'assessment']),
  outcome: z.object({}).passthrough(),
  student_id: z.string().optional(),
});

// Replicate the search_resources schema
const searchResourcesSchema = z.object({
  query: z.string(),
  resource_type: z.string().optional(),
  limit: z.number().optional(),
});

describe('add_resource schema', () => {
  it('accepts full payload with all fields', () => {
    const result = addResourceSchema.safeParse({
      title: 'Lego Technic Simple Machines Set',
      description: 'Building set with gears, pulleys, levers',
      resource_type: 'toy',
      tags: ['lego', 'stem', 'building'],
      source_url: 'https://lego.com/product/9686',
      extracted_text: 'Contains 204 elements including gears and pulleys',
      objective_texts: ['simple machines', 'mechanical advantage'],
      image_base64: 'iVBORw0KGgoAAAANSUhEUg==',
      added_by: 'agent',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.image_base64).toBe('iVBORw0KGgoAAAANSUhEUg==');
      expect(result.data.added_by).toBe('agent');
    }
  });

  it('accepts minimal payload with only required fields', () => {
    const result = addResourceSchema.safeParse({
      title: 'Math worksheet',
      description: 'Fractions practice',
      resource_type: 'homework',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.added_by).toBe('agent'); // default
      expect(result.data.image_base64).toBeUndefined();
      expect(result.data.tags).toBeUndefined();
    }
  });

  it('defaults added_by to agent when not provided', () => {
    const result = addResourceSchema.safeParse({
      title: 'Test',
      description: 'Test',
      resource_type: 'other',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.added_by).toBe('agent');
    }
  });

  it('allows added_by override', () => {
    const result = addResourceSchema.safeParse({
      title: 'Test',
      description: 'Test',
      resource_type: 'book_page',
      added_by: 'parent',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.added_by).toBe('parent');
    }
  });

  it('rejects missing title', () => {
    const result = addResourceSchema.safeParse({
      description: 'Test',
      resource_type: 'homework',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing description', () => {
    const result = addResourceSchema.safeParse({
      title: 'Test',
      resource_type: 'homework',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing resource_type', () => {
    const result = addResourceSchema.safeParse({
      title: 'Test',
      description: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('accepts any string for resource_type (API validates)', () => {
    const result = addResourceSchema.safeParse({
      title: 'Test',
      description: 'Test',
      resource_type: 'lego_set',
    });
    expect(result.success).toBe(true);
  });

  it('accepts large image_base64 strings', () => {
    const largeBase64 = 'A'.repeat(100000);
    const result = addResourceSchema.safeParse({
      title: 'Photo',
      description: 'Big photo',
      resource_type: 'photo',
      image_base64: largeBase64,
    });
    expect(result.success).toBe(true);
  });
});

describe('record_interaction schema', () => {
  it('accepts valid interaction with outcome', () => {
    const result = recordInteractionSchema.safeParse({
      objective_text: 'Understanding fractions',
      interaction_type: 'practice',
      outcome: { score: 0.8, notes: 'Good work' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid interaction_type', () => {
    const result = recordInteractionSchema.safeParse({
      objective_text: 'Test',
      interaction_type: 'invalid',
      outcome: {},
    });
    expect(result.success).toBe(false);
  });

  it('accepts outcome with arbitrary fields (passthrough)', () => {
    const result = recordInteractionSchema.safeParse({
      objective_text: 'Test',
      interaction_type: 'exposure',
      outcome: { score: 0.5, notes: 'Watched video', custom_field: true },
    });
    expect(result.success).toBe(true);
  });
});

describe('search_resources schema', () => {
  it('accepts query-only search', () => {
    const result = searchResourcesSchema.safeParse({ query: 'fractions' });
    expect(result.success).toBe(true);
  });

  it('accepts search with type filter', () => {
    const result = searchResourcesSchema.safeParse({
      query: 'building',
      resource_type: 'toy',
      limit: 10,
    });
    expect(result.success).toBe(true);
  });
});
