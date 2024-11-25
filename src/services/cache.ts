import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Incident } from '../types';
import { logger } from '../lib/logger';

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface MapCacheDB extends DBSchema {
  incidents: {
    key: string;
    value: {
      data: Incident[];
      timestamp: number;
      bounds: MapBounds;
    };
  };
}

const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
const DB_NAME = 'map-cache';
const DB_VERSION = 1;

class MapCache {
  private db: IDBPDatabase<MapCacheDB> | null = null;

  async init() {
    try {
      this.db = await openDB<MapCacheDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          db.createObjectStore('incidents');
        },
      });
    } catch (error) {
      logger.error(error, 'cache_init');
    }
  }

  private getBoundsKey(bounds: MapBounds): string {
    return `${bounds.north.toFixed(4)},${bounds.south.toFixed(4)},${bounds.east.toFixed(4)},${bounds.west.toFixed(4)}`;
  }

  async getCachedIncidents(bounds: MapBounds): Promise<Incident[] | null> {
    try {
      if (!this.db) await this.init();
      if (!this.db) return null;

      const key = this.getBoundsKey(bounds);
      const cached = await this.db.get('incidents', key);

      if (!cached) return null;
      if (Date.now() - cached.timestamp > CACHE_DURATION) {
        await this.db.delete('incidents', key);
        return null;
      }

      return cached.data;
    } catch (error) {
      logger.error(error, 'cache_get');
      return null;
    }
  }

  async cacheIncidents(bounds: MapBounds, incidents: Incident[]) {
    try {
      if (!this.db) await this.init();
      if (!this.db) return;

      const key = this.getBoundsKey(bounds);
      await this.db.put('incidents', {
        data: incidents,
        timestamp: Date.now(),
        bounds,
      }, key);
    } catch (error) {
      logger.error(error, 'cache_put');
    }
  }

  async clearCache() {
    try {
      if (!this.db) await this.init();
      if (!this.db) return;

      await this.db.clear('incidents');
    } catch (error) {
      logger.error(error, 'cache_clear');
    }
  }
}

export const mapCache = new MapCache();