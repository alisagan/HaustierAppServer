import { Foto } from './foto.entity.js';
import { Haustier } from './haustier.entity.js';
import { HaustierFile } from './haustierFile.entity.js';
import { Beschreibung } from './beschreibung.entity.js';

// erforderlich in src/config/db.ts und src/haustier/haustier.module.ts
export const entities = [Foto, Haustier, HaustierFile, Beschreibung];
