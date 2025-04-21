import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Haustier } from './haustier.entity.js';

@Entity()
export class Beschreibung {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column('varchar')
    readonly beschreibung!: string | undefined;

    @Column('varchar')
    readonly haltungshinweise: string | undefined;

    @OneToOne(() => Haustier, (haustier) => haustier.beschreibung)
    @JoinColumn({ name: 'haustier_id' })
    haustier: Haustier | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            beschreibung: this.beschreibung,
            haltungshinweise: this.haltungshinweise,
        });
}
