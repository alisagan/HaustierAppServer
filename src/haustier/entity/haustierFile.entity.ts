import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { binaryType } from '../../config/db.js';
import { Haustier } from './haustier.entity.js';

@Entity()
export class HaustierFile {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column('varchar')
    filename: string | undefined;

    @Column('varchar')
    mimetype: string | undefined;

    @OneToOne(() => Haustier, (haustier) => haustier.file)
    @JoinColumn({ name: 'haustier_id' })
    haustier: Haustier | undefined;

    @Column({ type: binaryType })
    data: Uint8Array | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            filename: this.filename,
            mimetype: this.mimetype,
        });
}
