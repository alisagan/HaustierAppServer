import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Haustier } from './haustier.entity.js';

@Entity()
export class Foto {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column('varchar')
    readonly beschriftung!: string | undefined;

    @Column('varchar')
    readonly contentType: string | undefined;

    @ManyToOne(() => Haustier, (haustier) => haustier.fotos)
    @JoinColumn({ name: 'haustier_id' })
    haustier: Haustier | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            beschriftung: this.beschriftung,
            contentType: this.contentType,
        });
}
