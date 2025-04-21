import { UseFilters, UseInterceptors } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Public } from 'nest-keycloak-connect';
import { getLogger } from '../../logger/logger.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { HaustierReadService } from '../service/haustier-read.service.js';
import { createPageable } from '../service/pageable.js';
import { type Suchkriterien } from '../service/suchkriterien.js';
import { HttpExceptionFilter } from './http-exception.filter.js';

export type IdInput = {
    readonly id: number;
};

export type SuchkriterienInput = {
    readonly suchkriterien: Suchkriterien;
};

@Resolver('Haustier')
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ResponseTimeInterceptor)
export class HaustierQueryResolver {
    readonly #service: HaustierReadService;

    readonly #logger = getLogger(HaustierQueryResolver.name);

    constructor(service: HaustierReadService) {
        this.#service = service;
    }

    @Query('haustier')
    @Public()
    async findById(@Args() { id }: IdInput) {
        this.#logger.debug('findById: id=%d', id);

        const haustier = await this.#service.findById({ id });

        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug(
                'findById: haustier=%s, beschreibung=%o',
                haustier.toString(),
                haustier.beschreibung,
            );
        }
        return haustier;
    }

    @Query('haustiere')
    @Public()
    async find(@Args() input: SuchkriterienInput | undefined) {
        this.#logger.debug('find: input=%o', input);
        const pageable = createPageable({});
        const haustiereSlice = await this.#service.find(
            input?.suchkriterien,
            pageable,
        );
        this.#logger.debug('find: haustiereSlice=%o', haustiereSlice);
        return haustiereSlice.content;
    }
}
