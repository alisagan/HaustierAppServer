/**
 * Das Modul besteht aus der Klasse {@linkcode HaustierWriteService} für die
 * Schreiboperationen im Anwendungskern.
 * @packageDocumentation
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type DeleteResult, Repository } from 'typeorm';
import { getLogger } from '../../logger/logger.js';
import { MailService } from '../../mail/mail.service.js';
import { Foto } from '../entity/foto.entity.js';
import { Haustier } from '../entity/haustier.entity.js';
import { HaustierFile } from '../entity/haustierFile.entity.js';
import { Beschreibung } from '../entity/beschreibung.entity.js';
import { HaustierReadService } from './haustier-read.service.js';
import {
    NameHaustierExistsException,
    VersionInvalidException,
    VersionOutdatedException,
} from './exceptions.js';

/** Typdefinitionen zum Aktualisieren eines Haustiers mit `update`. */
export type UpdateParams = {
    /** ID des zu aktualisierenden Haustiers. */
    readonly id: number | undefined;
    /** Haustier-Objekt mit den aktualisierten Werten. */
    readonly haustier: Haustier;
    /** Versionsnummer für die aktualisierenden Werte. */
    readonly version: string;
};

// TODO Transaktionen, wenn mehr als 1 TypeORM-Schreibmethode involviert ist

/**
 * Die Klasse `HaustierWriteService` implementiert den Anwendungskern für das
 * Schreiben von Haustieren und greift mit _TypeORM_ auf die DB zu.
 */
@Injectable()
export class HaustierWriteService {
    private static readonly VERSION_PATTERN = /^"\d{1,3}"/u;

    readonly #repo: Repository<Haustier>;

    readonly #fileRepo: Repository<HaustierFile>;

    readonly #readService: HaustierReadService;

    readonly #mailService: MailService;

    readonly #logger = getLogger(HaustierWriteService.name);

    constructor(
        @InjectRepository(Haustier) repo: Repository<Haustier>,
        @InjectRepository(HaustierFile) fileRepo: Repository<HaustierFile>,
        readService: HaustierReadService,
        mailService: MailService,
    ) {
        this.#repo = repo;
        this.#fileRepo = fileRepo;
        this.#readService = readService;
        this.#mailService = mailService;
    }

    /**
     * Ein neues Haustier soll angelegt werden.
     * @param haustier Das neu anzulegende Haustier
     * @returns Die ID des neu angelegten Haustiers
     * @throws NameHaustierExistsException falls der Name bereits existiert
     */
    async create(haustier: Haustier) {
        this.#logger.debug('create: haustier=%o', haustier);
        await this.#validateCreate(haustier);

        const haustierDb = await this.#repo.save(haustier); // implizite Transaktion
        await this.#sendmail(haustierDb);

        return haustierDb.id!;
    }

    /**
     * Zu einem vorhandenen Haustier eine Binärdatei mit z.B. einem Bild abspeichern.
     * @param haustierId ID des vorhandenen Haustiers
     * @param data Bytes der Datei
     * @param filename Dateiname
     * @param mimetype MIME-Type
     * @returns Entity-Objekt für `HaustierFile`
     */
    async addFile(
        haustierId: number,
        data: Buffer,
        filename: string,
        mimetype: string,
    ): Promise<Readonly<HaustierFile>> {
        this.#logger.debug(
            'addFile: haustierId: %d, filename:%s, mimetype: %s',
            haustierId,
            filename,
            mimetype,
        );

        // Haustier ermitteln, falls vorhanden
        const haustier = await this.#readService.findById({ id: haustierId });

        // evtl. vorhandene Datei loeschen
        await this.#fileRepo
            .createQueryBuilder('haustier_file')
            .delete()
            .where('haustier_id = :id', { id: haustierId })
            .execute();

        // Entity-Objekt aufbauen, um es spaeter in der DB zu speichern (s.u.)
        const haustierFile = this.#fileRepo.create({
            filename,
            data,
            mimetype,
            haustier: haustier,
        });

        // Den Datensatz fuer Haustier mit der neuen Binaerdatei aktualisieren
        await this.#repo.save({
            id: haustier.id,
            file: haustierFile,
        });

        return haustierFile;
    }

    /**
     * Ein vorhandenes Haustier soll aktualisiert werden. "Destructured" Argument
     * mit id (ID des zu aktualisierenden Haustiers), haustier (zu aktualisierendes Haustier)
     * und version (Versionsnummer für optimistische Synchronisation).
     * @returns Die neue Versionsnummer gemäß optimistischer Synchronisation
     * @throws NotFoundException falls kein Haustier zur ID vorhanden ist
     * @throws VersionInvalidException falls die Versionsnummer ungültig ist
     * @throws VersionOutdatedException falls die Versionsnummer veraltet ist
     */
    async update({ id, haustier: haustier, version }: UpdateParams) {
        this.#logger.debug(
            'update: id=%d, haustier=%o, version=%s',
            id,
            haustier,
            version,
        );
        if (id === undefined) {
            this.#logger.debug('update: Keine gueltige ID');
            throw new NotFoundException(
                `Es gibt kein Haustier mit der ID ${id}.`,
            );
        }

        const validateResult = await this.#validateUpdate(
            haustier,
            id,
            version,
        );
        this.#logger.debug('update: validateResult=%o', validateResult);
        if (!(validateResult instanceof Haustier)) {
            return validateResult;
        }

        const haustierNeu = validateResult;
        const merged = this.#repo.merge(haustierNeu, haustier);
        this.#logger.debug('update: merged=%o', merged);
        const updated = await this.#repo.save(merged); // implizite Transaktion
        this.#logger.debug('update: updated=%o', updated);

        return updated.version!;
    }

    /**
     * Ein Haustier wird asynchron anhand seiner ID gelöscht.
     *
     * @param id ID des zu löschenden Haustiers
     * @returns true, falls das Haustier vorhanden war und gelöscht wurde. Sonst false.
     */
    async delete(id: number) {
        this.#logger.debug('delete: id=%d', id);
        const haustier = await this.#readService.findById({
            id,
            mitFotos: true,
        });

        let deleteResult: DeleteResult | undefined;
        await this.#repo.manager.transaction(async (transactionalMgr) => {
            // Das Haustier zur gegebenen ID mit Beschreibung und Foto asynchron loeschen

            // TODO "cascade" funktioniert nicht beim Loeschen
            const beschreibungId = haustier.beschreibung?.id;
            if (beschreibungId !== undefined) {
                await transactionalMgr.delete(Beschreibung, beschreibungId);
            }
            const fotos = haustier.fotos ?? [];
            for (const foto of fotos) {
                await transactionalMgr.delete(Foto, foto.id);
            }

            deleteResult = await transactionalMgr.delete(Haustier, id);
            this.#logger.debug('delete: deleteResult=%o', deleteResult);
        });

        return (
            deleteResult?.affected !== undefined &&
            deleteResult.affected !== null &&
            deleteResult.affected > 0
        );
    }

    async #validateCreate({ name }: Haustier): Promise<undefined> {
        this.#logger.debug('#validateCreate: name=%s', name);
        if (await this.#repo.existsBy({ name: name })) {
            throw new NameHaustierExistsException(name);
        }
    }

    async #sendmail(haustier: Haustier) {
        const subject = `Neues Haustier ${haustier.id}`;
        const beschreibung = haustier.beschreibung?.beschreibung ?? 'N/A';
        const body = `Das Haustier mit der Beschreibung <strong>${beschreibung}</strong> ist angelegt`;
        await this.#mailService.sendmail({ subject, body });
    }

    async #validateUpdate(
        haustier: Haustier,
        id: number,
        versionStr: string,
    ): Promise<Haustier> {
        this.#logger.debug(
            '#validateUpdate: haustier=%o, id=%s, versionStr=%s',
            haustier,
            id,
            versionStr,
        );
        if (!HaustierWriteService.VERSION_PATTERN.test(versionStr)) {
            throw new VersionInvalidException(versionStr);
        }

        const version = Number.parseInt(versionStr.slice(1, -1), 10);
        this.#logger.debug(
            '#validateUpdate: haustier=%o, version=%d',
            haustier,
            version,
        );

        const haustierDb = await this.#readService.findById({ id });

        // nullish coalescing
        const versionDb = haustierDb.version!;
        if (version < versionDb) {
            this.#logger.debug('#validateUpdate: versionDb=%d', version);
            throw new VersionOutdatedException(version);
        }
        this.#logger.debug('#validateUpdate: haustierDb=%o', haustierDb);
        return haustierDb;
    }
}
