/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, Matches, MaxLength } from 'class-validator';

/**
 * Entity-Klasse für Beschreibung ohne TypeORM.
 */
export class BeschreibungDTO {
    @Matches(String.raw`^\w.*`)
    @MaxLength(100)
    @ApiProperty({
        example: 'Sehr verspielte, aber auch verschmuste Hündin.',
        type: String,
    })
    readonly beschreibung!: string;

    @IsOptional()
    @MaxLength(100)
    @ApiProperty({ example: 'Benötigt viel Auslauf', type: String })
    readonly haltungshinweise: string | undefined;
}
