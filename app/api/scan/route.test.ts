import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { createDefaultStorage } from '@/lib/storage';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Integration tests for /api/scan route
 * 
 * Tests:
 * 1. Demo mode returns mock data without API calls
 * 2. Invalid request returns 400 error
 * 3. Live mode requires API key
 * 4. Draft pack is saved to storage
 */

describe('/api/scan route', () => {
  const storage = createDefaultStorage();
  const testPackIds: string[] = [];
  
  // Clean up test data after each test
  afterEach(async () => {
    for (const packId of testPackIds) {
      try {
        await storage.deleteContextPack(packId);
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
    testPackIds.length = 0;
  });
  
  describe('Demo mode', () => {
    it('should return mock data for demo mode request', async () => {
      const request = new NextRequest('http://localhost:3000/api/scan', {
        method: 'POST',
        body: JSON.stringify({
          companyUrl: 'https://acmesaas.example.com',
          demoMode: true,
        }),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('packId');
      expect(data).toHaveProperty('draftPack');
      expect(data).toHaveProperty('scrapedPages');
      expect(data).toHaveProperty('errors');
      
      expect(data.draftPack.version).toBe('v0');
      expect(data.draftPack.companyName).toBe('Acme SaaS');
      expect(data.scrapedPages).toBeGreaterThan(0);
      
      testPackIds.push(data.packId);
    });
    
    it('should save draft pack to storage in demo mode', async () => {
      const request = new NextRequest('http://localhost:3000/api/scan', {
        method: 'POST',
        body: JSON.stringify({
          companyUrl: 'https://techstart.example.com',
          companyName: 'TechStart',
          demoMode: true,
        }),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      testPackIds.push(data.packId);
      
      // Wait a bit for async save to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify pack was saved
      const savedPack = await storage.getContextPack(data.packId);
      expect(savedPack).not.toBeNull();
      expect(savedPack?.id).toBe(data.packId);
      expect(savedPack?.companyName).toBe('TechStart');
    });
  });
  
  describe('Request validation', () => {
    it('should return 400 for invalid request (missing companyUrl)', async () => {
      const request = new NextRequest('http://localhost:3000/api/scan', {
        method: 'POST',
        body: JSON.stringify({
          demoMode: true,
        }),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });
    
    it('should return 400 for invalid URL format', async () => {
      const request = new NextRequest('http://localhost:3000/api/scan', {
        method: 'POST',
        body: JSON.stringify({
          companyUrl: 'not-a-valid-url',
          demoMode: true,
        }),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });
  });
  
  describe('Live mode', () => {
    it('should return error when API key is not configured', async () => {
      // Save original API key
      const originalApiKey = process.env.OPENAI_API_KEY;
      
      // Remove API key
      delete process.env.OPENAI_API_KEY;
      
      const request = new NextRequest('http://localhost:3000/api/scan', {
        method: 'POST',
        body: JSON.stringify({
          companyUrl: 'https://example.com',
          demoMode: false,
        }),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toContain('API key');
      
      // Restore API key
      if (originalApiKey) {
        process.env.OPENAI_API_KEY = originalApiKey;
      }
    });
  });
  
  describe('Draft pack structure', () => {
    it('should create draft pack with correct structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/scan', {
        method: 'POST',
        body: JSON.stringify({
          companyUrl: 'https://acmesaas.example.com',
          companyName: 'Acme SaaS',
          demoMode: true,
        }),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      testPackIds.push(data.packId);
      
      const { draftPack } = data;
      
      // Verify required fields
      expect(draftPack).toHaveProperty('id');
      expect(draftPack).toHaveProperty('companyName');
      expect(draftPack).toHaveProperty('companyUrl');
      expect(draftPack).toHaveProperty('version');
      expect(draftPack).toHaveProperty('createdAt');
      expect(draftPack).toHaveProperty('updatedAt');
      
      // Verify sections
      expect(draftPack).toHaveProperty('vision');
      expect(draftPack).toHaveProperty('mission');
      expect(draftPack).toHaveProperty('values');
      expect(draftPack).toHaveProperty('icp');
      expect(draftPack).toHaveProperty('businessModel');
      expect(draftPack).toHaveProperty('product');
      expect(draftPack).toHaveProperty('decisionRules');
      expect(draftPack).toHaveProperty('engineeringKPIs');
      expect(draftPack).toHaveProperty('summary');
      
      // Verify version is v0
      expect(draftPack.version).toBe('v0');
      
      // Verify confidence scores exist
      expect(draftPack.vision).toHaveProperty('confidence');
      expect(draftPack.vision.confidence).toHaveProperty('value');
      expect(draftPack.vision.confidence.value).toBeGreaterThanOrEqual(0);
      expect(draftPack.vision.confidence.value).toBeLessThanOrEqual(1);
      
      // Verify citations exist
      expect(draftPack.vision).toHaveProperty('citations');
      expect(Array.isArray(draftPack.vision.citations)).toBe(true);
    });
  });
});
