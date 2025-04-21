/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import { ApiProperty } from '@nestjs/swagger';
import Decimal from 'decimal.js'; 
import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    VersionColumn,
} from 'typeorm';
import { dbType } from '../../config/db.js';
import { Foto } from './foto.entity.js';
import { HaustierFile } from './haustierFile.entity.js';
import { DecimalTransformer } from './decimal-transformer.js';
import { Beschreibung } from './beschreibung.entity.js';

/**
 * Alias-Typ für gültige Strings bei der Art eines Haustiers.
 */
export type HaustierArt = 'HUND' | 'KATZE' | 'KLEINTIER';

/**
 * Entity-Klasse zu einer relationalen Tabelle.
 * BEACHTE: Jede Entity-Klasse muss in einem JSON-Array deklariert sein, das in
 * TypeOrmModule.forFeature(...) verwendet wird.
 * Im Beispiel ist das JSON-Array in src\haustier\entity\entities.ts und
 * TypeOrmModule.forFeature(...) wird in src\haustier\haustier.module.ts aufgerufen.
 */
@Entity()
export class Haustier {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @VersionColumn()
    readonly version: number | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'Luna', type: String })
    readonly name: string | undefined;

    @Column('int')
    @ApiProperty({ example: 5, type: Number })
    readonly alter: number | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'HUND', type: String })
    readonly art: HaustierArt | undefined;

    @Column('decimal', {
        precision: 5,
        scale: 2,
        transformer: new DecimalTransformer(),
    })
    @ApiProperty({ example: 30.55, type: Number })
    readonly gewicht: Decimal | undefined;

    @Column('decimal', {
        precision: 5,
        scale: 2,
        transformer: new DecimalTransformer(),
    })
    @ApiProperty({ example: 23.45, type: Number })
    readonly groesse: Decimal | undefined;

    @Column('decimal')
    @ApiProperty({ example: true, type: Boolean })
    readonly vermittelt: boolean | undefined;

    @Column('date')
    @ApiProperty({ example: '2021-01-31' })
    readonly aufnahmedatum: Date | string | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'Labrador', type: String })
    readonly rasse: string | undefined;

    @Column('simple-array')
    schlagwoerter: string[] | null | undefined;

    @OneToOne(() => Beschreibung, (beschreibung) => beschreibung.haustier, {
        cascade: ['insert', 'remove'],
    })
    readonly beschreibung: Beschreibung | undefined;

    @OneToMany(() => Foto, (foto) => foto.haustier, {
        cascade: ['insert', 'remove'],
    })
    readonly fotos: Foto[] | undefined;

    @OneToOne(() => HaustierFile, (haustierFile) => haustierFile.haustier, {
        cascade: ['insert', 'remove'],
    })
    readonly file: HaustierFile | undefined;

    @CreateDateColumn({
        type: dbType === 'sqlite' ? 'datetime' : 'timestamp',
    })
    readonly erzeugt: Date | undefined;

    @UpdateDateColumn({
        type: dbType === 'sqlite' ? 'datetime' : 'timestamp',
    })
    readonly aktualisiert: Date | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            version: this.version,
            name: this.name,
            alter: this.alter,
            art: this.art,
            gewicht: this.gewicht,
            groesse: this.groesse,
            vermittelt: this.vermittelt,
            aufnahmedatum: this.aufnahmedatum,
            rasse: this.rasse,
            schlagwoerter: this.schlagwoerter,
            erzeugt: this.erzeugt,
            aktualisiert: this.aktualisiert,
        });
}
