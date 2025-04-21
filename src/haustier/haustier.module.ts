import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module.js';
import { KeycloakModule } from '../security/keycloak/keycloak.module.js';
import { HaustierGetController } from './controller/haustier-get.controller.js';
import { HaustierWriteController } from './controller/haustier-write.controller.js';
import { entities } from './entity/entities.js';
import { HaustierMutationResolver } from './resolver/haustier-mutation.resolver.js';
import { HaustierQueryResolver } from './resolver/haustier-query.resolver.js';
import { HaustierReadService } from './service/haustier-read.service.js';
import { HaustierWriteService } from './service/haustier-write.service.js';
import { QueryBuilder } from './service/query-builder.js';

/**
 * Das Modul besteht aus Controller- und Service-Klassen für die Verwaltung von
 * Haustieren.
 * @packageDocumentation
 */

/**
 * Die dekorierte Modul-Klasse mit Controller- und Service-Klassen sowie der
 * Funktionalität für TypeORM.
 */
@Module({
    imports: [KeycloakModule, MailModule, TypeOrmModule.forFeature(entities)],
    controllers: [HaustierGetController, HaustierWriteController],
    // Provider sind z.B. Service-Klassen fuer DI
    providers: [
        HaustierReadService,
        HaustierWriteService,
        HaustierQueryResolver,
        HaustierMutationResolver,
        QueryBuilder,
    ],
    // Export der Provider fuer DI in anderen Modulen
    exports: [HaustierReadService, HaustierWriteService],
})
export class HaustierModule {}
