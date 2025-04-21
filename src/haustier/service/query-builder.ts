/**
 * Das Modul besteht aus der Klasse {@linkcode QueryBuilder}.
 * @packageDocumentation
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { typeOrmModuleOptions } from '../../config/typeormOptions.js';
import { getLogger } from '../../logger/logger.js';
import { Foto } from '../entity/foto.entity.js';
import { Haustier } from '../entity/haustier.entity.js';
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from './pageable.js';
import { type Pageable } from './pageable.js';
import { Beschreibung } from '../entity/beschreibung.entity.js';
import { type Suchkriterien } from './suchkriterien.js';

/** Typdefinitionen für die Suche mit der Haustier-ID. */
export type BuildIdParams = {
    /** ID des gesuchten Haustiers. */
    readonly id: number;
    /** Sollen die Fotos mitgeladen werden? */
    readonly mitFotos?: boolean;
};
/**
 * Die Klasse `QueryBuilder` implementiert das Lesen für Haustiere und greift
 * mit _TypeORM_ auf eine relationale DB zu.
 */
@Injectable()
export class QueryBuilder {
    readonly #haustierAlias = `${Haustier.name
        .charAt(0)
        .toLowerCase()}${Haustier.name.slice(1)}`;

    readonly #beschreibungAlias = `${Beschreibung.name
        .charAt(0)
        .toLowerCase()}${Beschreibung.name.slice(1)}`;

    readonly #fotoAlias = `${Foto.name
        .charAt(0)
        .toLowerCase()}${Foto.name.slice(1)}`;

    readonly #repo: Repository<Haustier>;

    readonly #logger = getLogger(QueryBuilder.name);

    constructor(@InjectRepository(Haustier) repo: Repository<Haustier>) {
        this.#repo = repo;
    }

    /**
     * Ein Haustier mit der ID suchen.
     * @param id ID des gesuchten Haustiers
     * @returns QueryBuilder
     */
    buildId({ id, mitFotos: mitFotos = false }: BuildIdParams) {
        // QueryBuilder "haustier" fuer Repository<Haustier>
        const queryBuilder = this.#repo.createQueryBuilder(this.#haustierAlias);

        // Fetch-Join: aus QueryBuilder "haustier" die Property "beschreibung" ->  Tabelle "beschreibung"
        queryBuilder.innerJoinAndSelect(
            `${this.#haustierAlias}.beschreibung`,
            this.#beschreibungAlias,
        );

        if (mitFotos) {
            // Fetch-Join: aus QueryBuilder "haustier" die Property "fotos" -> Tabelle "foto"
            queryBuilder.leftJoinAndSelect(
                `${this.#haustierAlias}.fotos`,
                this.#fotoAlias,
            );
        }

        queryBuilder.where(`${this.#haustierAlias}.id = :id`, { id: id }); 
        return queryBuilder;
    }

    /**
     * Haustiere asynchron suchen.
     * @param suchkriterien JSON-Objekt mit Suchkriterien. Bei "beschreibung" wird mit
     * einem Teilstring gesucht, bei "alter" mit einem Mindestwert, bei "gewicht"
     * mit der Obergrenze.
     * @param pageable Maximale Anzahl an Datensätzen und Seitennummer.
     * @returns QueryBuilder
     */
    // z.B. { beschreibung: 'a', alter: 5, groesse: 22.5, verspielt: true }
    build(
        {
            // NOSONAR
            beschreibung,
            alter,
            gewicht,
            verspielt,
            ruhig,
            ...restProps
        }: Suchkriterien,
        pageable: Pageable,
    ) {
        this.#logger.debug(
            'build: beschreibung=%s, alter=%s, gewicht=%s, verspielt=%s, ruhig=%s, restProps=%o, pageable=%o',
            beschreibung,
            alter,
            gewicht,
            verspielt,
            ruhig,
            restProps,
            pageable,
        );

        let queryBuilder = this.#repo.createQueryBuilder(this.#haustierAlias);
        queryBuilder.innerJoinAndSelect(`${this.#haustierAlias}.beschreibung`, 'beschreibung');

        // z.B. { beschreibung: 'a', alter: 5, verspielt: true }
        // const { beschreibung, verspielt, ruhig, ...otherProps } = suchkriterien;

        let useWhere = true;

        // Beschreibung in der Query: Teilstring der Beschreibung und "case insensitive"
        if (beschreibung !== undefined && typeof beschreibung === 'string') {
            const ilike =
                typeOrmModuleOptions.type === 'postgres' ? 'ilike' : 'like';
            queryBuilder = queryBuilder.where(
                `${this.#beschreibungAlias}.beschreibung ${ilike} :beschreibung`,
                { beschreibung: `%${beschreibung}%` },
            );
            useWhere = false;
        }

        if (alter !== undefined) {
            const alterNumber =
                typeof alter === 'string' ? parseInt(alter) : alter;
            if (!isNaN(alterNumber)) {
                queryBuilder = queryBuilder.where(
                    `${this.#haustierAlias}.alter >= ${alterNumber}`,
                );
                useWhere = false;
            }
        }

        if (gewicht !== undefined && typeof gewicht === 'string') {
            const gewichtNumber = Number(gewicht);
            queryBuilder = queryBuilder.where(
                `${this.#haustierAlias}.gewicht <= ${gewichtNumber}`,
            );
            useWhere = false;
        }

        if (verspielt === 'true') {
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#haustierAlias}.schlagwoerter like '%VERSPIELT%'`,
                  )
                : queryBuilder.andWhere(
                      `${this.#haustierAlias}.schlagwoerter like '%VERSPIELT'`,
                  );
            useWhere = false;
        }

        if (ruhig === 'true') {
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#haustierAlias}.schlagwoerter like '%RUHIG%'`,
                  )
                : queryBuilder.andWhere(
                      `${this.#haustierAlias}.schlagwoerter like '%RUHIG%'`,
                  );
            useWhere = false;
        }

        // Restliche Properties als Key-Value-Paare: Vergleiche auf Gleichheit
        Object.entries(restProps).forEach(([key, value]) => {
            const param: Record<string, any> = {};
            param[key] = value; 
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#haustierAlias}.${key} = :${key}`,
                      param,
                  )
                : queryBuilder.andWhere(
                      `${this.#haustierAlias}.${key} = :${key}`,
                      param,
                  );
            useWhere = false;
        });

        this.#logger.debug('build: sql=%s', queryBuilder.getSql());

        if (pageable?.size === 0) {
            return queryBuilder;
        }
        const size = pageable?.size ?? DEFAULT_PAGE_SIZE;
        const number = pageable?.number ?? DEFAULT_PAGE_NUMBER;
        const skip = number * size;
        this.#logger.debug('take=%s, skip=%s', size, skip);
        return queryBuilder.take(size).skip(skip);
    }
}
