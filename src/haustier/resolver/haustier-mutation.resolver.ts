import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { IsInt, IsNumberString, Min } from 'class-validator';
import Decimal from 'decimal.js';
import { AuthGuard, Roles } from 'nest-keycloak-connect';
import { getLogger } from '../../logger/logger.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { HaustierDTO } from '../controller/haustierDTO.entity.js';
import { type Foto } from '../entity/foto.entity.js';
import { type Haustier } from '../entity/haustier.entity.js';
import { type Beschreibung } from '../entity/beschreibung.entity.js';
import { HaustierWriteService } from '../service/haustier-write.service.js';
import { type IdInput } from './haustier-query.resolver.js';
import { HttpExceptionFilter } from './http-exception.filter.js';

export type CreatePayload = {
    readonly id: number;
};

export type UpdatePayload = {
    readonly version: number;
};

export class HaustierUpdateDTO extends HaustierDTO {
    @IsNumberString()
    readonly id!: string;

    @IsInt()
    @Min(0)
    readonly version!: number;
}
@Resolver('Haustier')
@UseGuards(AuthGuard)
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ResponseTimeInterceptor)
export class HaustierMutationResolver {
    readonly #service: HaustierWriteService;

    readonly #logger = getLogger(HaustierMutationResolver.name);

    constructor(service: HaustierWriteService) {
        this.#service = service;
    }

    @Mutation()
    @Roles('admin', 'user')
    async create(@Args('input') haustierDTO: HaustierDTO) {
        this.#logger.debug('create: haustierDTO=%o', haustierDTO);

        const haustier = this.#haustierDtoToHaustier(haustierDTO);
        const id = await this.#service.create(haustier);
        this.#logger.debug('createHaustier: id=%d', id);
        const payload: CreatePayload = { id };
        return payload;
    }

    @Mutation()
    @Roles('admin', 'user')
    async update(@Args('input') haustierDTO: HaustierUpdateDTO) {
        this.#logger.debug('update: haustier=%o', haustierDTO);

        const haustier = this.#haustierUpdateDtoToHaustier(haustierDTO);
        const versionStr = `"${haustierDTO.version.toString()}"`;

        const versionResult = await this.#service.update({
            id: Number.parseInt(haustierDTO.id, 10),
            haustier: haustier,
            version: versionStr,
        });
        // TODO BadUserInputError
        this.#logger.debug('updateHaustier: versionResult=%d', versionResult);
        const payload: UpdatePayload = { version: versionResult };
        return payload;
    }

    @Mutation()
    @Roles('admin')
    async delete(@Args() id: IdInput) {
        const idStr = id.id;
        this.#logger.debug('delete: id=%s', idStr);
        const deletePerformed = await this.#service.delete(idStr);
        this.#logger.debug('deleteHaustier: deletePerformed=%s', deletePerformed);
        return deletePerformed;
    }

    #haustierDtoToHaustier(haustierDTO: HaustierDTO): Haustier {
        const beschreibungDTO = haustierDTO.beschreibung;
        const beschreibung: Beschreibung = {
            id: undefined,
            beschreibung: beschreibungDTO.beschreibung,
            haltungshinweise: beschreibungDTO.haltungshinweise,
            haustier: undefined,
        };
        // "Optional Chaining" ab ES2020
        const fotos = haustierDTO.fotos?.map((fotoDTO) => {
            const foto: Foto = {
                id: undefined,
                beschriftung: fotoDTO.beschriftung,
                contentType: fotoDTO.contentType,
                haustier: undefined,
            };
            return foto;
        });
        const haustier: Haustier = {
            id: undefined,
            version: undefined,
            name: haustierDTO.name,
            alter: haustierDTO.alter,
            art: haustierDTO.art,
            gewicht: Decimal(haustierDTO.gewicht),
            groesse: Decimal(haustierDTO.groesse ?? ''),
            vermittelt: haustierDTO.vermittelt,
            aufnahmedatum: haustierDTO.aufnahmedatum,
            rasse: haustierDTO.rasse,
            schlagwoerter: haustierDTO.schlagwoerter,
            beschreibung: beschreibung,
            fotos: fotos,
            file: undefined,
            erzeugt: new Date(),
            aktualisiert: new Date(),
        };

        // Rueckwaertsverweis
        haustier.beschreibung!.haustier = haustier;
        return haustier;
    }

    #haustierUpdateDtoToHaustier(haustierDTO: HaustierUpdateDTO): Haustier {
        return {
            id: undefined,
            version: undefined,
            name: haustierDTO.name,
            alter: haustierDTO.alter,
            art: haustierDTO.art,
            gewicht: Decimal(haustierDTO.gewicht),
            groesse: Decimal(haustierDTO.groesse ?? ''),
            vermittelt: haustierDTO.vermittelt,
            aufnahmedatum: haustierDTO.aufnahmedatum,
            rasse: haustierDTO.rasse,
            schlagwoerter: haustierDTO.schlagwoerter,
            beschreibung: undefined,
            fotos: undefined,
            file: undefined,
            erzeugt: undefined,
            aktualisiert: new Date(),
        };
    }
}
