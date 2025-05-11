/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { type GraphQLRequest } from '@apollo/server';
import { beforeAll, describe, expect, test } from 'vitest';
import { HttpStatus } from '@nestjs/common';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    type Haustier,
    type HaustierArt,
} from '../../src/haustier/entity/haustier.entity.js';
import { type GraphQLResponseBody } from './graphql.mjs';
import { baseURL, httpsAgent } from '../constants.mjs';

type HaustierDTO = Omit<
    Haustier,
    'fotos' | 'aktualisiert' | 'erzeugt' | 'groesse'
> & {
    groesse: string;
};

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const idVorhanden = '1';

const beschreibungVorhanden = 'Sehr verspielt und voller Lebensfreude';
const teilBeschreibungVorhanden = 'e';
const teilBeschreibungNichtVorhanden = 'abc';

const nameVorhanden = 'Mila';

const alterMin = 3;
const alterNichtVorhanden = 99;

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
describe('GraphQL Queries', () => {
    let client: AxiosInstance;
    const graphqlPath = 'graphql';

    // Axios initialisieren
    beforeAll(async () => {
        const baseUrlGraphQL = `${baseURL}/`;
        client = axios.create({
            baseURL: baseUrlGraphQL,
            httpsAgent,
            // auch Statuscode 400 als gueltigen Request akzeptieren, wenn z.B.
            // ein Enum mit einem falschen String getestest wird
            validateStatus: () => true,
        });
    });

    test.concurrent('Haustier zu vorhandener ID', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    haustier(id: "${idVorhanden}") {
                        version
                        name
                        alter
                        art
                        gewicht
                        vermittelt
                        aufnahmedatum
                        rasse
                        schlagwoerter
                        beschreibung {
                            beschreibung
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { haustier } = data.data! as { haustier: HaustierDTO };

        expect(haustier.beschreibung?.beschreibung).toMatch(/^\w/u);
        expect(haustier.version).toBeGreaterThan(-1);
        expect(haustier.id).toBeUndefined();
    });

    test.concurrent('Haustier zu nicht-vorhandener ID', async () => {
        // given
        const id = '999999';
        const body: GraphQLRequest = {
            query: `
                {
                    haustier(id: "${id}") {
                        beschreibung {
                            beschreibung
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.haustier).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error;

        expect(message).toBe(`Es gibt kein Haustier mit der ID ${id}.`);
        expect(path).toBeDefined();
        expect(path![0]).toBe('haustier');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    test.concurrent('Haustier zu vorhandener Beschreibung', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    haustiere(suchkriterien: {
                        beschreibung: "${beschreibungVorhanden}"
                    }) {
                        art
                        beschreibung {
                            beschreibung
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { haustiere } = data.data! as { haustiere: HaustierDTO[] };

        expect(haustiere).not.toHaveLength(0);
        expect(haustiere).toHaveLength(1);

        const [haustier] = haustiere;

        expect(haustier!.beschreibung?.beschreibung).toBe(
            beschreibungVorhanden,
        );
    });

    test.concurrent('Haustier zu vorhandener Teil-Beschreibung', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    haustiere(suchkriterien: {
                        beschreibung: "${teilBeschreibungVorhanden}"
                    }) {
                        beschreibung {
                            beschreibung
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { haustiere } = data.data! as { haustiere: HaustierDTO[] };

        expect(haustiere).not.toHaveLength(0);

        haustiere
            .map((haustier) => haustier.beschreibung)
            .forEach((beschreibung) =>
                expect(beschreibung?.beschreibung?.toLowerCase()).toStrictEqual(
                    expect.stringContaining(teilBeschreibungVorhanden),
                ),
            );
    });

    test.concurrent('Haustier zu nicht vorhandener Beschreibung', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    haustiere(suchkriterien: {
                        beschreibung: "${teilBeschreibungNichtVorhanden}"
                    }) {
                        art
                        beschreibung {
                            beschreibung
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.haustiere).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error;

        expect(message).toMatch(/^Keine Haustiere gefunden:/u);
        expect(path).toBeDefined();
        expect(path![0]).toBe('haustiere');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    test.concurrent('Haustier zu vorhandenem Namen', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    haustiere(suchkriterien: {
                        name: "${nameVorhanden}"
                    }) {
                        name
                        beschreibung {
                            beschreibung
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { haustiere } = data.data! as { haustiere: HaustierDTO[] };

        expect(haustiere).not.toHaveLength(0);
        expect(haustiere).toHaveLength(1);

        const [haustier] = haustiere;
        const { name, beschreibung } = haustier!;

        expect(name).toBe(nameVorhanden);
        expect(beschreibung?.beschreibung).toBeDefined();
    });

    test.concurrent('Haustiere mit Mindestalter', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    haustiere(suchkriterien: {
                        alter: ${alterMin},
                        beschreibung: "${teilBeschreibungVorhanden}"
                    }) {
                        alter
                        beschreibung {
                            beschreibung
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();

        expect(data.data).toBeDefined();

        const { haustiere } = data.data! as { haustiere: HaustierDTO[] };

        expect(haustiere).not.toHaveLength(0);

        haustiere.forEach((haustier) => {
            const { alter, beschreibung } = haustier;

            expect(alter).toBeGreaterThanOrEqual(alterMin);
            expect(beschreibung?.beschreibung?.toLowerCase()).toStrictEqual(
                expect.stringContaining(teilBeschreibungVorhanden),
            );
        });
    });

    test.concurrent('Kein Haustier zu nicht-vorhandenem alter', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    haustiere(suchkriterien: {
                        alter: ${alterNichtVorhanden}
                    }) {
                        beschreibung {
                            beschreibung
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.haustiere).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error;

        expect(message).toMatch(/^Keine Haustiere gefunden:/u);
        expect(path).toBeDefined();
        expect(path![0]).toBe('haustiere');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    test.concurrent('Haustiere zur Art "HUND"', async () => {
        // given
        const haustierArt: HaustierArt = 'HUND';
        const body: GraphQLRequest = {
            query: `
                {
                    haustiere(suchkriterien: {
                        art: ${haustierArt}
                    }) {
                        art
                        beschreibung {
                            beschreibung
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { haustiere } = data.data! as { haustiere: HaustierDTO[] };

        expect(haustiere).not.toHaveLength(0);

        haustiere.forEach((haustier) => {
            const { art, beschreibung } = haustier;

            expect(art).toBe(haustierArt);
            expect(beschreibung?.beschreibung).toBeDefined();
        });
    });

    test.concurrent('Haustiere zur einer ungueltigen Art', async () => {
        // given
        const haustierArt = 'UNGUELTIG';
        const body: GraphQLRequest = {
            query: `
                {
                    haustiere(suchkriterien: {
                        art: ${haustierArt}
                    }) {
                        beschreibung {
                            beschreibung
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.BAD_REQUEST);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data).toBeUndefined();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { extensions } = error;

        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('GRAPHQL_VALIDATION_FAILED');
    });

    test.concurrent('Haustiere mit vermittelt=true', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    haustiere(suchkriterien: {
                        vermittelt: true
                    }) {
                        vermittelt
                        beschreibung {
                            beschreibung
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { haustiere } = data.data! as { haustiere: HaustierDTO[] };

        expect(haustiere).not.toHaveLength(0);

        haustiere.forEach((haustier) => {
            const { vermittelt, beschreibung } = haustier;

            expect(vermittelt).toBe(true);
            expect(beschreibung?.beschreibung).toBeDefined();
        });
    });
});

/* eslint-enable @typescript-eslint/no-non-null-assertion */
