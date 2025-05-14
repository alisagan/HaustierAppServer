-- Copyright (C) 2023 - present Juergen Zimmermann, Hochschule Karlsruhe
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

INSERT INTO haustier(id, version, name, alter, art, gewicht, groesse, vermittelt, aufnahmedatum, rasse, schlagwoerter, erzeugt, aktualisiert) VALUES 
    (1, 0, 'Bella', 4, 'HUND', 11.1, 20.0, false, '2025-02-01', 'Labrador', 'VERSPIELT', '2025-02-01 00:00:00', '2025-02-01 00:00:00');
INSERT INTO haustier(id, version, name, alter, art, gewicht, groesse, vermittelt, aufnahmedatum, rasse, schlagwoerter, erzeugt, aktualisiert) VALUES 
    (20, 0, 'Mila', 3, 'KATZE', 10.2, 10.5, true, '2025-02-02', 'Bengalkatze', 'RUHIG', '2025-02-02 00:00:00', '2025-02-02 00:00:00');
INSERT INTO haustier(id, version, name, alter, art, gewicht, groesse, vermittelt, aufnahmedatum, rasse, schlagwoerter, erzeugt, aktualisiert) VALUES 
    (30, 0, 'Bruno', 2, 'HUND', 33.3, 40.5, false, '2025-02-03', 'Schäferhund', 'VERSPIELT,RUHIG', '2025-02-03 00:00:00', '2025-02-03 00:00:00');
INSERT INTO haustier(id, version, name, alter, art, gewicht, groesse, vermittelt, aufnahmedatum, rasse, schlagwoerter, erzeugt, aktualisiert) VALUES 
    (40, 0, 'Schneeflocke', 1, 'KLEINTIER', 5.4, 5.25, true, '2025-02-04', 'Zwergkaninchen', 'RUHIG', '2025-02-04 00:00:00', '2025-02-04 00:00:00');
INSERT INTO haustier(id, version, name, alter, art, gewicht, groesse, vermittelt, aufnahmedatum, rasse, schlagwoerter, erzeugt, aktualisiert) VALUES 
    (50, 0, 'Fly', 1, 'KLEINTIER', 3.5, 4.2, false, '2025-02-05', 'Kanarienvogel', 'RUHIG', '2025-02-05 00:00:00', '2025-02-05 00:00:00');
INSERT INTO haustier(id, version, name, alter, art, gewicht, groesse, vermittelt, aufnahmedatum, rasse, schlagwoerter, erzeugt, aktualisiert) VALUES 
    (60, 0, 'Karla', 2, 'KATZE', 13.6, 20.0, false, '2025-02-06', 'Siamkatze', 'VERSPIELT', '2025-02-06 00:00:00', '2025-02-06 00:00:00');
INSERT INTO haustier(id, version, name, alter, art, gewicht, groesse, vermittelt, aufnahmedatum, rasse, schlagwoerter, erzeugt, aktualisiert) VALUES 
    (70, 0, 'Zeus', 3, 'HUND', 77.7, 90.5, false, '2025-02-07', 'Leonberger', 'RUHIG', '2025-02-07 00:00:00', '2025-02-07 00:00:00');
INSERT INTO haustier(id, version, name, alter, art, gewicht, groesse, vermittelt, aufnahmedatum, rasse, schlagwoerter, erzeugt, aktualisiert) VALUES 
    (80, 0, 'Argos', 4, 'HUND', 38.8, 55.34, true, '2025-02-08', 'Bernhardiner', 'VERSPIELT,RUHIG', '2025-02-08 00:00:00', '2025-02-08 00:00:00');
INSERT INTO haustier(id, version, name, alter, art, gewicht, groesse, vermittelt, aufnahmedatum, rasse, schlagwoerter, erzeugt, aktualisiert) VALUES 
    (90, 0, 'Susi', 5, 'KLEINTIER', 4.9, 12.0, true, '2025-02-09', 'Meerschweinchen', 'RUHIG', '2025-02-09 00:00:00', '2025-02-09 00:00:00');

INSERT INTO beschreibung(id, beschreibung, haltungshinweise, haustier_id) VALUES
    (1, 'Sehr verspielt und voller Lebensfreude', 'Viel Auslauf, Familienanschluss', 1);
INSERT INTO beschreibung(id, beschreibung, haltungshinweise, haustier_id) VALUES
    (20, 'Eine ruhige und ausgeglichene Gefährtin', 'Klettergelegenheiten, ruhige Umgebung', 20);
INSERT INTO beschreibung(id, beschreibung, haltungshinweise, haustier_id) VALUES
    (30, 'Verspielt mit einer ruhigen und treuen Art', 'Bewegung, geistige Auslastung', 30);
INSERT INTO beschreibung(id, beschreibung, haltungshinweise, haustier_id) VALUES
    (40, 'Sanft und ruhig, liebt es zu kuscheln', 'Artgenossen, Platz zum Hoppeln', 40);
INSERT INTO beschreibung(id, beschreibung, haltungshinweise, haustier_id) VALUES
    (50, 'Ruhig und friedlich, beobachtet gern seine Umgebung', 'Großer Käfig, täglicher Freiflug', 50);
INSERT INTO beschreibung(id, beschreibung, haltungshinweise, haustier_id) VALUES
    (60, 'Neugierig, verspielt und sehr anhänglich', 'Beschäftigung, Nähe zum Menschen', 60);
INSERT INTO beschreibung(id, beschreibung, haltungshinweise, haustier_id) VALUES
    (70, 'Ein ruhiger Riese mit sanftem Gemüt', 'Großer Garten, ruhiger Umgang', 70);
INSERT INTO beschreibung(id, beschreibung, haltungshinweise, haustier_id) VALUES
    (80, 'Verspielt, aber auch ruhig und sehr geduldig', 'Kühle Umgebung, ruhiges Zuhause', 80);
INSERT INTO beschreibung(id, beschreibung, haltungshinweise, haustier_id) VALUES
    (90, 'Zurückhaltend, aber sehr zutraulich', 'Artgenossen, Versteckmöglichkeiten', 90);

INSERT INTO foto(id, beschriftung, content_type, haustier_id) VALUES
    (1, 'Foto 1', 'img/png', 1);
INSERT INTO foto(id, beschriftung, content_type, haustier_id) VALUES
    (20, 'Foto 1', 'img/png', 20);
INSERT INTO foto(id, beschriftung, content_type, haustier_id) VALUES
    (21, 'Foto 2', 'img/png', 20);
INSERT INTO foto(id, beschriftung, content_type, haustier_id) VALUES
    (30, 'Foto 1', 'img/png', 30);
INSERT INTO foto(id, beschriftung, content_type, haustier_id) VALUES
    (31, 'Foto 2', 'img/png', 30);
INSERT INTO foto(id, beschriftung, content_type, haustier_id) VALUES
    (40, 'Foto 1', 'img/png', 40);
INSERT INTO foto(id, beschriftung, content_type, haustier_id) VALUES
    (50, 'Foto 1', 'img/png', 50);
INSERT INTO foto(id, beschriftung, content_type, haustier_id) VALUES
    (60, 'Foto 1', 'img/png', 60);
INSERT INTO foto(id, beschriftung, content_type, haustier_id) VALUES
    (70, 'Foto 1', 'img/png', 70);
