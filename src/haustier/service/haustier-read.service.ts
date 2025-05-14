/**
 * Das Modul besteht aus der Klasse {@linkcode HaustierReadService}.
 * @packageDocumentation
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getLogger } from '../../logger/logger.js';
import { HaustierFile } from '../entity/haustierFile.entity.js';
import { Haustier } from '../entity/haustier.entity.js';
import { type Pageable } from './pageable.js';
import { type Slice } from './slice.js';
import { QueryBuilder } from './query-builder.js';
import { type Suchkriterien } from './suchkriterien.js';

/**
 * Typdefinition für `findById`
 */
export type FindByIdParams = {
    /** ID des gesuchten Haustiers */
    readonly id: number;
    /** Sollen die Fotos mitgeladen werden? */
    readonly mitFotos?: boolean;
};

/**
 * Die Klasse `HaustierReadService` implementiert das Lesen für Haustiere und greift
 * mit _TypeORM_ auf eine relationale DB zu.
 */
@Injectable()
export class HaustierReadService {
    static readonly ID_PATTERN = /^[1-9]\d{0,10}$/u;

    readonly #haustierProps: string[];

    readonly #queryBuilder: QueryBuilder;

    readonly #fileRepo: Repository<HaustierFile>;

    readonly #logger = getLogger(HaustierReadService.name);

    constructor(
        queryBuilder: QueryBuilder,
        @InjectRepository(HaustierFile) fileRepo: Repository<HaustierFile>,
    ) {
        const haustierDummy = new Haustier();
        this.#haustierProps = Object.getOwnPropertyNames(haustierDummy);
        this.#queryBuilder = queryBuilder;
        this.#fileRepo = fileRepo;
    }

    // Rueckgabetyp Promise bei asynchronen Funktionen
    //    ab ES2015
    //    vergleiche Task<> bei C#
    // Status eines Promise:
    //    Pending: das Resultat ist noch nicht vorhanden, weil die asynchrone
    //             Operation noch nicht abgeschlossen ist
    //    Fulfilled: die asynchrone Operation ist abgeschlossen und
    //               das Promise-Objekt hat einen Wert
    //    Rejected: die asynchrone Operation ist fehlgeschlagen and das
    //              Promise-Objekt wird nicht den Status "fulfilled" erreichen.
    //              Im Promise-Objekt ist dann die Fehlerursache enthalten.

    /**
     * Ein Haustier asynchron anhand seiner ID suchen
     * @param id ID des gesuchten Haustiers
     * @returns Das gefundene Haustier in einem Promise aus ES2015.
     * @throws NotFoundException falls kein Haustier mit der ID existiert
     */
    async findById({
        id,
        mitFotos: mitFotos = false,
    }: FindByIdParams): Promise<Readonly<Haustier>> {
        this.#logger.debug('findById: id=%d', id);

        // Das Resultat ist undefined, falls kein Datensatz gefunden
        // Lesen: Keine Transaktion erforderlich
        const haustier = await this.#queryBuilder
            .buildId({ id, mitFotos: mitFotos })
            .getOne();
        if (haustier === null) {
            throw new NotFoundException(
                `Es gibt kein Haustier mit der ID ${id}.`,
            );
        }
        if (haustier.schlagwoerter === null) {
            haustier.schlagwoerter = [];
        }

        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug(
                'findById: haustier=%s, beschreibung=%o',
                haustier.toString(),
                haustier.beschreibung,
            );
            if (mitFotos) {
                this.#logger.debug('findById: fotos=%o', haustier.fotos);
            }
        }
        return haustier;
    }

    /**
     * Binärdatei zu einem Haustier suchen.
     * @param haustierId ID des zugehörigen Haustiers.
     * @returns Binärdatei oder undefined als Promise.
     */
    async findFileByHaustierId(
        haustierId: number,
    ): Promise<Readonly<HaustierFile> | undefined> {
        this.#logger.debug('findFileByHaustierId: haustierId=%s', haustierId);
        const haustierFile = await this.#fileRepo
            .createQueryBuilder('haustier_file')
            .where('haustier_id = :id', { id: haustierId })
            .getOne();
        if (haustierFile === null) {
            this.#logger.debug('findFileByHaustierId: Keine Datei gefunden');
            return;
        }

        this.#logger.debug(
            'findFileByHaustierId: filename=%s',
            haustierFile.filename,
        );
        return haustierFile;
    }

    /**
     * Haustiere asynchron suchen.
     * @param suchkriterien JSON-Objekt mit Suchkriterien.
     * @param pageable Maximale Anzahl an Datensätzen und Seitennummer.
     * @returns Ein JSON-Array mit den gefundenen Haustieren.
     * @throws NotFoundException falls keine Haustiere gefunden wurden.
     */
    async find(
        suchkriterien: Suchkriterien | undefined,
        pageable: Pageable,
    ): Promise<Slice<Haustier>> {
        this.#logger.debug(
            'find: suchkriterien=%o, pageable=%o',
            suchkriterien,
            pageable,
        );

        // Keine Suchkriterien?
        if (suchkriterien === undefined) {
            return await this.#findAll(pageable);
        }
        const keys = Object.keys(suchkriterien);
        if (keys.length === 0) {
            return await this.#findAll(pageable);
        }

        // Falsche Namen fuer Suchkriterien?
        if (!this.#checkKeys(keys) || !this.#checkEnums(suchkriterien)) {
            throw new NotFoundException('Ungueltige Suchkriterien');
        }

        // Das Resultat ist eine leere Liste, falls nichts gefunden
        // Lesen: Keine Transaktion erforderlich
        const queryBuilder = this.#queryBuilder.build(suchkriterien, pageable);
        const haustiere = await queryBuilder.getMany();
        if (haustiere.length === 0) {
            this.#logger.debug('find: Keine Haustiere gefunden');
            throw new NotFoundException(
                `Keine Haustiere gefunden: ${JSON.stringify(suchkriterien)}, Seite ${pageable.number}}`,
            );
        }
        const totalElements = await queryBuilder.getCount();
        return this.#createSlice(haustiere, totalElements);
    }

    async #findAll(pageable: Pageable) {
        const queryBuilder = this.#queryBuilder.build({}, pageable);
        const haustiere = await queryBuilder.getMany();
        if (haustiere.length === 0) {
            throw new NotFoundException(
                `Ungueltige Seite "${pageable.number}"`,
            );
        }
        const totalElements = await queryBuilder.getCount();
        return this.#createSlice(haustiere, totalElements);
    }

    #createSlice(haustiere: Haustier[], totalElements: number) {
        haustiere.forEach((haustier) => {
            if (haustier.schlagwoerter === null) {
                haustier.schlagwoerter = [];
            }
        });
        const haustierSlice: Slice<Haustier> = {
            content: haustiere,
            totalElements,
        };
        this.#logger.debug('createSlice: haustierSlice=%o', haustierSlice);
        return haustierSlice;
    }

    #checkKeys(keys: string[]) {
        this.#logger.debug('#checkKeys: keys=%s', keys);
        // Ist jedes Suchkriterium auch eine Property von Haustier oder "schlagwoerter"?
        let validKeys = true;
        keys.forEach((key) => {
            if (
                !this.#haustierProps.includes(key) &&
                key !== 'verspielt' &&
                key !== 'ruhig'
            ) {
                this.#logger.debug(
                    '#checkKeys: ungueltiges Suchkriterium "%s"',
                    key,
                );
                validKeys = false;
            }
        });

        return validKeys;
    }

    #checkEnums(suchkriterien: Suchkriterien) {
        const { art } = suchkriterien;
        this.#logger.debug('#checkEnums: Suchkriterium "art=%s"', art);
        return (
            art === undefined ||
            art === 'HUND' ||
            art === 'KATZE' ||
            art === 'KLEINTIER'
        );
    }
}
