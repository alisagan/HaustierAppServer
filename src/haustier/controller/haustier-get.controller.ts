/**
 * Das Modul besteht aus der Controller-Klasse für Lesen an der REST-Schnittstelle.
 * @packageDocumentation
 */

// eslint-disable-next-line max-classes-per-file
import {
    Controller,
    Get,
    Headers,
    HttpStatus,
    NotFoundException,
    Param,
    ParseIntPipe,
    Query,
    Req,
    Res,
    StreamableFile,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiHeader,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiProperty,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from 'nest-keycloak-connect';
import { Readable } from 'node:stream';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { type Haustier, type HaustierArt } from '../entity/haustier.entity.js';
import { HaustierReadService } from '../service/haustier-read.service.js';
import { type Suchkriterien } from '../service/suchkriterien.js';
import { createPage } from './page.js';
import { createPageable } from '../service/pageable.js';
import { getLogger } from '../../logger/logger.js';
import { paths } from '../../config/paths.js';

/**
 * Klasse für `HaustierGetController`, um Queries in _OpenAPI_ bzw. Swagger zu
 * formulieren. `HaustierController` hat dieselben Properties wie die Basisklasse
 * `Haustier` - allerdings mit dem Unterschied, dass diese Properties beim Ableiten
 * so überschrieben sind, dass sie auch nicht gesetzt bzw. undefined sein
 * dürfen, damit die Queries flexibel formuliert werden können. Deshalb ist auch
 * immer der zusätzliche Typ undefined erforderlich.
 * Außerdem muss noch `string` statt `Date` verwendet werden, weil es in OpenAPI
 * den Typ Date nicht gibt.
 */
export class HaustierQuery implements Suchkriterien {
    @ApiProperty({ required: false })
    declare readonly name?: string;

    @ApiProperty({ required: false })
    declare readonly alter?: number;

    @ApiProperty({ required: false })
    declare readonly art?: HaustierArt;

    @ApiProperty({ required: false })
    declare readonly gewicht?: number;

    @ApiProperty({ required: false })
    declare readonly groesse?: number;

    @ApiProperty({ required: false })
    declare readonly vermittelt?: boolean;

    @ApiProperty({ required: false })
    declare readonly aufnahmedatum?: string;

    @ApiProperty({ required: false })
    declare readonly rasse?: string;

    @ApiProperty({ required: false })
    declare readonly verspielt?: string;

    @ApiProperty({ required: false })
    declare readonly ruhig?: string;

    @ApiProperty({ required: false })
    declare readonly beschreibung?: string;

    @ApiProperty({ required: false })
    declare size?: string;

    @ApiProperty({ required: false })
    declare page?: string;
}

/**
 * Die Controller-Klasse für die Verwaltung von Haustieren.
 */
@Controller(paths.rest)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Haustier REST-API')
// @ApiBearerAuth()
export class HaustierGetController {
    readonly #service: HaustierReadService;

    readonly #logger = getLogger(HaustierGetController.name);

    constructor(service: HaustierReadService) {
        this.#service = service;
    }

    /**
     * Ein Haustier wird asynchron anhand seiner ID als Pfadparameter gesucht.
     *
     * Falls es ein solches Haustier gibt und `If-None-Match` im Request-Header
     * auf die aktuelle Version des Haustiers gesetzt war, wird der Statuscode
     * `304` (`Not Modified`) zurückgeliefert. Falls `If-None-Match` nicht
     * gesetzt ist oder eine veraltete Version enthält, wird das gefundene
     * Haustier im Rumpf des Response als JSON-Datensatz mit Atom-Links für HATEOAS
     * und dem Statuscode `200` (`OK`) zurückgeliefert.
     *
     * Falls es kein Haustier zur angegebenen ID gibt, wird der Statuscode `404`
     * (`Not Found`) zurückgeliefert.
     *
     * @param id Pfad-Parameter `id`
     * @param req Request-Objekt von Express mit Pfadparameter, Query-String,
     *            Request-Header und Request-Body.
     * @param version Versionsnummer im Request-Header bei `If-None-Match`
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Get(':id')
    @Public()
    @ApiOperation({ summary: 'Suche mit der Haustier-ID' })
    @ApiParam({
        name: 'id',
        description: 'Z.B. 1',
    })
    @ApiHeader({
        name: 'If-None-Match',
        description: 'Header für bedingte GET-Requests, z.B. "0"',
        required: false,
    })
    @ApiOkResponse({ description: 'Das Haustier wurde gefunden' })
    @ApiNotFoundResponse({ description: 'Kein Haustier zur ID gefunden' })
    @ApiResponse({
        status: HttpStatus.NOT_MODIFIED,
        description: 'Das Haustier wurde bereits heruntergeladen',
    })
    async getById(
        @Param(
            'id',
            new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND }),
        )
        id: number,
        @Req() req: Request,
        @Headers('If-None-Match') version: string | undefined,
        @Res() res: Response,
    ): Promise<Response<Haustier | undefined>>{
        this.#logger.debug('getById: id=%s, version=%s', id, version);

        if (req.accepts(['json', 'html']) === false) {
            this.#logger.debug('getById: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const haustier = await this.#service.findById({ id });
        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug('getById(): haustier=%s', haustier.toString());
            this.#logger.debug('getById(): beschreibung=%o', haustier.beschreibung);
        }

        // ETags
        const versionDb = haustier.version;
        if (version === `"${versionDb}"`) {
            this.#logger.debug('getById: NOT_MODIFIED');
            return res.sendStatus(HttpStatus.NOT_MODIFIED);
        }
        this.#logger.debug('getById: versionDb=%s', versionDb);
        res.header('ETag', `"${versionDb}"`);

        this.#logger.debug('getById: haustier=%o', haustier);
        return res.json(haustier);
    }

    /**
     * Haustiere werden mit Query-Parametern asynchron gesucht. Falls es mindestens
     * ein solches Haustier gibt, wird der Statuscode `200` (`OK`) gesetzt. Im Rumpf
     * des Response ist das JSON-Array mit den gefundenen Haustieren, die jeweils
     * um Atom-Links für HATEOAS ergänzt sind.
     *
     * Falls es kein Haustier zu den Suchkriterien gibt, wird der Statuscode `404`
     * (`Not Found`) gesetzt.
     *
     * Falls es keine Query-Parameter gibt, werden alle Haustiere ermittelt.
     *
     * @param query Query-Parameter von Express.
     * @param req Request-Objekt von Express.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Get()
    @Public()
    @ApiOperation({ summary: 'Suche mit Suchkriterien' })
    @ApiOkResponse({ description: 'Eine evtl. leere Liste mit Haustieren' })
    async get(
        @Query() query: HaustierQuery,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response<Haustier[] | undefined>> {
        this.#logger.debug('get: query=%o', query);

        if (req.accepts(['json', 'html']) === false) {
            this.#logger.debug('get: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const { page, size } = query;
        delete query['page'];
        delete query['size'];
        this.#logger.debug('get: page=%s, size=%s', page, size);

        const keys = Object.keys(query) as (keyof HaustierQuery)[];
        keys.forEach((key) => {
            if (query[key] === undefined) {
                delete query[key];
            }
        });
        this.#logger.debug('get: query=%o', query);

        const pageable = createPageable({ number: page, size });
        const haustiereSlice = await this.#service.find(query, pageable);
        const haustierPage = createPage(haustiereSlice, pageable);
        this.#logger.debug('get: haustierPage=%o', haustierPage);

        return res.json(haustierPage).send();
    }

    @Get('/file/:id')
    @Public()
    @ApiOperation({ description: 'Suche nach Datei mit der Haustier-ID' })
    @ApiParam({
        name: 'id',
        description: 'Z.B. 1',
    })
    @ApiNotFoundResponse({ description: 'Keine Datei zur Haustier-ID gefunden' })
    @ApiOkResponse({ description: 'Die Datei wurde gefunden' })
    async getFileById(
        @Param('id') idStr: number,
        @Res({ passthrough: true }) res: Response,
    ) {
        this.#logger.debug('getFileById: haustierId:%s', idStr);

        const id = Number(idStr);
        if (!Number.isInteger(id)) {
            this.#logger.debug('getById: not isInteger()');
            throw new NotFoundException(`Die Haustier-ID ${idStr} ist ungueltig.`);
        }

        const haustierFile = await this.#service.findFileByHaustierId(id);
        if (haustierFile?.data === undefined) {
            throw new NotFoundException('Keine Datei gefunden.');
        }

        const stream = Readable.from(haustierFile.data);
        res.contentType(haustierFile.mimetype ?? 'image/png').set({
            'Content-Disposition': `inline; filename="${haustierFile.filename}"`, 
        });

        return new StreamableFile(stream);
    }
}
