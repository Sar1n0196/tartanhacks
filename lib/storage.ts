import { promises as fs } from 'fs';
import path from 'path';
import { ContextPack, StorageConfig } from './types';
import { ContextPackSchema } from './schemas';
import { z } from 'zod';

/**
 * Storage class for persisting Context Packs as JSON files
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */
export class Storage {
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  /**
   * Save a Context Pack to storage
   * Requirements: 14.2, 14.6
   * 
   * @param pack - The Context Pack to save
   * @throws Error if validation fails or file write fails
   */
  async saveContextPack(pack: ContextPack): Promise<void> {
    try {
      // Validate pack against schema
      const validatedPack = ContextPackSchema.parse(pack);
      
      // Ensure data directory exists
      await this.ensureDataDirExists();
      
      // Construct file path
      const filePath = this.getFilePath(validatedPack.id);
      
      // Serialize to JSON with pretty printing
      const jsonContent = JSON.stringify(validatedPack, null, 2);
      
      // Write to file atomically (write to temp file, then rename)
      const tempFilePath = `${filePath}.tmp`;
      await fs.writeFile(tempFilePath, jsonContent, 'utf-8');
      await fs.rename(tempFilePath, filePath);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Context Pack validation failed: ${error.message}`);
      }
      if (error instanceof Error) {
        throw new Error(`Failed to save Context Pack: ${error.message}`);
      }
      throw new Error('Failed to save Context Pack: Unknown error');
    }
  }

  /**
   * Retrieve a Context Pack from storage by ID
   * Requirements: 14.3, 14.7
   * 
   * @param id - The ID of the Context Pack to retrieve
   * @returns The Context Pack if found, null otherwise
   */
  async getContextPack(id: string): Promise<ContextPack | null> {
    try {
      const filePath = this.getFilePath(id);
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        // File doesn't exist
        return null;
      }
      
      // Read file content
      const fileContent = await fs.readFile(filePath, 'utf-8');
      
      // Parse JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(fileContent);
      } catch (error) {
        // Invalid JSON - log and return null
        console.error(`Failed to parse JSON for Context Pack ${id}:`, error);
        return null;
      }
      
      // Validate against schema
      try {
        const validatedPack = ContextPackSchema.parse(parsed);
        return validatedPack;
      } catch (error) {
        // Schema validation failed - log and return null
        console.error(`Schema validation failed for Context Pack ${id}:`, error);
        return null;
      }
      
    } catch (error) {
      // Unexpected error - log and return null
      console.error(`Error retrieving Context Pack ${id}:`, error);
      return null;
    }
  }

  /**
   * List all Context Packs in storage
   * Requirements: 14.5
   * 
   * @returns Array of all Context Packs
   */
  async listContextPacks(): Promise<ContextPack[]> {
    try {
      // Ensure data directory exists
      await this.ensureDataDirExists();
      
      // Read directory contents
      const files = await fs.readdir(this.config.dataDir);
      
      // Filter for JSON files
      const jsonFiles = files.filter(file => file.endsWith('.json') && !file.endsWith('.tmp'));
      
      // Load each Context Pack
      const packs: ContextPack[] = [];
      for (const file of jsonFiles) {
        const id = path.basename(file, '.json');
        const pack = await this.getContextPack(id);
        if (pack) {
          packs.push(pack);
        }
      }
      
      return packs;
      
    } catch (error) {
      // If directory doesn't exist or can't be read, return empty array
      console.error('Error listing Context Packs:', error);
      return [];
    }
  }

  /**
   * Delete a Context Pack from storage
   * Requirements: 14.5
   * 
   * @param id - The ID of the Context Pack to delete
   * @throws Error if deletion fails (but not if file doesn't exist)
   */
  async deleteContextPack(id: string): Promise<void> {
    try {
      const filePath = this.getFilePath(id);
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        // File doesn't exist - this is not an error
        return;
      }
      
      // Delete the file
      await fs.unlink(filePath);
      
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete Context Pack: ${error.message}`);
      }
      throw new Error('Failed to delete Context Pack: Unknown error');
    }
  }

  /**
   * Ensure the data directory exists, creating it if necessary
   * @private
   */
  private async ensureDataDirExists(): Promise<void> {
    try {
      await fs.mkdir(this.config.dataDir, { recursive: true });
    } catch (error) {
      // Ignore error if directory already exists
      if (error instanceof Error && 'code' in error && error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Get the file path for a Context Pack ID
   * @private
   */
  private getFilePath(id: string): string {
    return path.join(this.config.dataDir, `${id}.json`);
  }
}

/**
 * Create a default Storage instance for the application
 * Uses the data/context-packs directory
 */
export function createDefaultStorage(): Storage {
  return new Storage({
    dataDir: path.join(process.cwd(), 'data', 'context-packs'),
  });
}
