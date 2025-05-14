-- Copyright (C) 2022 - present Juergen Zimmermann, Hochschule Karlsruhe
--
-- This program is free software: you can redistribute it and/or modify
-- it under the terms of the GNU General Public License as published by
-- the Free Software Foundation, either version 3 of the License, or
-- (at your option) any later version.
--
-- This program is distributed in the hope that it will be useful,
-- but WITHOUT ANY WARRANTY; without even the implied warranty of
-- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
-- GNU General Public License for more details.
--
-- You should have received a copy of the GNU General Public License
-- along with this program.  If not, see <https://www.gnu.org/licenses/>.

-- docker compose exec postgres bash
-- psql --dbname=haustier --username=haustier --file=/scripts/create-table-haustier.sql

-- text statt varchar(n):
-- "There is no performance difference among these three types, apart from a few extra CPU cycles
-- to check the length when storing into a length-constrained column"
-- ggf. CHECK(char_length(nachname) <= 255)

-- Indexe mit pgAdmin auflisten: "Query Tool" verwenden mit
--  SELECT   tablename, indexname, indexdef, tablespace
--  FROM     pg_indexes
--  WHERE    schemaname = 'haustier'
--  ORDER BY tablename, indexname;

-- https://www.postgresql.org/docs/devel/app-psql.html
-- https://www.postgresql.org/docs/current/ddl-schemas.html
-- https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-CREATE
-- "user-private schema" (Default-Schema: public)
CREATE SCHEMA IF NOT EXISTS AUTHORIZATION haustier;

ALTER ROLE haustier SET search_path = 'haustier';

-- https://www.postgresql.org/docs/current/sql-createtype.html
-- https://www.postgresql.org/docs/current/datatype-enum.html
CREATE TYPE haustierart AS ENUM ('HUND', 'KATZE', 'KLEINTIER');

-- https://www.postgresql.org/docs/current/sql-createtable.html
-- https://www.postgresql.org/docs/current/datatype.html
CREATE TABLE IF NOT EXISTS haustier (
                  -- https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-INT
                  -- https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-PRIMARY-KEYS
                  -- impliziter Index fuer Primary Key
                  -- "GENERATED ALWAYS AS IDENTITY" gemaess SQL-Standard
                  -- entspricht SERIAL mit generierter Sequenz haustier_id_seq
    id            integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE haustierspace,
                  -- https://www.postgresql.org/docs/current/ddl-constraints.html#id-1.5.4.6.6
    version       integer NOT NULL DEFAULT 0,
                  -- impliziter Index als B-Baum durch UNIQUE
                  -- https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-UNIQUE-CONSTRAINTS
    name          text NOT NULL UNIQUE USING INDEX TABLESPACE haustierspace,
                  -- https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-CHECK-CONSTRAINTS
                  -- https://www.postgresql.org/docs/current/functions-matching.html#FUNCTIONS-POSIX-REGEXP
    alter         integer NOT NULL CHECK (alter >= 0 AND alter <= 20),
    art           haustierart,
                  -- https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-NUMERIC-DECIMAL
                  -- 10 Stellen, davon 2 Nachkommastellen
    gewicht       decimal(5,2) NOT NULL,
    groesse       decimal(5,3) NOT NULL,
                  -- https://www.postgresql.org/docs/current/datatype-boolean.html
    vermittelt    boolean NOT NULL DEFAULT FALSE,
                  -- https://www.postgresql.org/docs/current/datatype-datetime.html
    aufnahmedatum date,
    rasse         text,
    -- schlagwoerter json,
    schlagwoerter text,
                  -- https://www.postgresql.org/docs/current/datatype-datetime.html
    erzeugt       timestamp NOT NULL DEFAULT NOW(),
    aktualisiert  timestamp NOT NULL DEFAULT NOW()
) TABLESPACE haustierspace;

CREATE TABLE IF NOT EXISTS beschreibung (
    id                integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE haustierspace,
    beschreibung      text NOT NULL,
    haltungshinweise  text,
    haustier_id       integer NOT NULL UNIQUE USING INDEX TABLESPACE haustierspace REFERENCES haustier
) TABLESPACE haustierspace;


CREATE TABLE IF NOT EXISTS foto (
    id              integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE haustierspace,
    beschriftung    text NOT NULL,
    content_type    text NOT NULL,
    haustier_id     integer NOT NULL REFERENCES haustier
) TABLESPACE haustierspace;
CREATE INDEX IF NOT EXISTS foto_haustier_id_idx ON foto(haustier_id) TABLESPACE haustierspace;

CREATE TABLE IF NOT EXISTS haustier_file (
    id              integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE haustierspace,
    data            bytea NOT NULL,
    filename        text NOT NULL,
    mimetype        text,
    haustier_id     integer NOT NULL REFERENCES haustier
) TABLESPACE haustierspace;
CREATE INDEX IF NOT EXISTS haustier_file_haustier_id_idx ON haustier_file(haustier_id) TABLESPACE haustierspace;
