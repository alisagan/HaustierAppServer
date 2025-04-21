/**
 * Das Modul besteht aus der Klasse {@linkcode Suchkriterien}.
 * @packageDocumentation
 */

import { type HaustierArt } from '../entity/haustier.entity.js';

/**
 * Typdefinition für `find` in `haustier-read.service` und `QueryBuilder.build()`.
 */
export interface Suchkriterien {
    readonly name?: string;
    readonly alter?: number | string;
    readonly art?: HaustierArt;
    readonly gewicht?: number;
    readonly groesse?: number;
    readonly vermittelt?: boolean;
    readonly aufnahmedatum?: string;
    readonly rasse?: string;
    readonly verspielt?: string;
    readonly ruhig?: string;
    readonly beschreibung?: string;
}
