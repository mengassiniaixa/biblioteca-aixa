-- Portadas opcionales de libros
-- coverUrl es una URL externa (no upload local); el dominio valida que sea http(s).

ALTER TABLE books ADD COLUMN IF NOT EXISTS cover_url TEXT;
