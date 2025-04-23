/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    ArrayUnique,
    IsArray,
    IsBoolean,
    IsISO8601,
    IsInt,
    IsOptional,
    Matches,
    Max,
    Min,
    Validate,
    ValidateNested,
    type ValidationArguments,
    ValidatorConstraint,
    type ValidatorConstraintInterface,
} from 'class-validator';
import Decimal from 'decimal.js';
import { type HaustierArt } from '../entity/haustier.entity.js';
import { FotoDTO } from './fotoDTO.entity.js';
import { BeschreibungDTO } from './beschreibungDTO.entity.js';

export const MAX_AGE = 20; // max. Alter in Jahren

const number2Decimal = ({ value }: { value: Decimal.Value | undefined }) => {
    if (value === undefined) {
        return;
    }

    Decimal.set({ precision: 5 });
    return Decimal(value);
};

@ValidatorConstraint({ name: 'decimalMin', async: false })
class DecimalMin implements ValidatorConstraintInterface {
    validate(value: Decimal | undefined, args: ValidationArguments) {
        if (value === undefined) {
            return true;
        }
        const [minValue]: Decimal[] = args.constraints; // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        return value.greaterThan(minValue!);
    }

    defaultMessage(args: ValidationArguments) {
        return `Der Wert muss groesser ${(args.constraints[0] as Decimal).toNumber()} sein.`;
    }
}

/**
 * Entity-Klasse für Haustiere ohne TypeORM und ohne Referenzen.
 */
export class HaustierDtoOhneRef {
    @Matches(/^[A-ZÄÖÜ][a-zäöüß]+$/u)
    @ApiProperty({ example: 'Luna', type: String })
    readonly name!: string;

    @IsInt()
    @Min(0)
    @Max(MAX_AGE)
    @ApiProperty({ example: 5, type: Number })
    readonly alter!: number;

    @Matches(/^(HUND|KATZE|KLEINTIER)$/u)
    @ApiProperty({ example: 'HUND', type: String })
    readonly art: HaustierArt | undefined;

    @Transform(number2Decimal)
    @Validate(DecimalMin, [Decimal(0)], {
        message: 'gewicht muss positiv und groesser null sein.',
    })
    @IsOptional()
    @ApiProperty({ example: 33.45, type: Number })
    readonly gewicht!: Decimal;

    @Transform(number2Decimal)
    @Validate(DecimalMin, [Decimal(0)], {
        message: 'groesse muss positiv und groesser null sein.',
    })
    @IsOptional()
    @ApiProperty({ example: 23.45, type: Number })
    readonly groesse: Decimal | undefined;

    @IsBoolean()
    @ApiProperty({ example: true, type: Boolean })
    readonly vermittelt: boolean | undefined;

    @IsISO8601({ strict: true })
    @ApiProperty({ example: '2021-01-31' })
    readonly aufnahmedatum: Date | string | undefined;

    @Matches(/^[A-ZÄÖÜ][a-zäöüß]+([ -][A-ZÄÖÜ][a-zäöüß]+)*$/u)
    @ApiProperty({ example: 'Labrador', type: String })
    readonly rasse: string | undefined;

    @IsOptional()
    @ArrayUnique()
    @ApiProperty({ example: ['VERSPIELT', 'RUHIG'] })
    readonly schlagwoerter: string[] | undefined;
}

/**
 * Entity-Klasse für Haustiere ohne TypeORM.
 */
export class HaustierDTO extends HaustierDtoOhneRef {
    @ValidateNested()
    @Type(() => BeschreibungDTO)
    @ApiProperty({ type: BeschreibungDTO })
    readonly beschreibung!: BeschreibungDTO;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FotoDTO)
    @ApiProperty({ type: [FotoDTO] })
    readonly fotos: FotoDTO[] | undefined;
}
