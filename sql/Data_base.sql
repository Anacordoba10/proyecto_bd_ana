BEGIN;


CREATE TABLE IF NOT EXISTS public.board
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name character varying(256) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT "boardPkey" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.boarduser
(
    board_id uuid NOT NULL,
    is_admin boolean DEFAULT false,
    user_id uuid NOT NULL,
    CONSTRAINT "user_id_PK" PRIMARY KEY (user_id, board_id)
);

CREATE TABLE IF NOT EXISTS public.card
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    title character varying(256) COLLATE pg_catalog."default" NOT NULL,
    description character varying(256) COLLATE pg_catalog."default",
    due_date date NOT NULL,
    list_id uuid NOT NULL,
    CONSTRAINT "CardPK" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.carduser
(
    card_id uuid NOT NULL,
    user_id uuid NOT NULL,
    is_owner boolean NOT NULL DEFAULT false,
    CONSTRAINT "Card_User_PK" PRIMARY KEY (card_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.list
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name character varying(256) COLLATE pg_catalog."default" NOT NULL,
    board_id uuid NOT NULL,
    CONSTRAINT "listPK" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."user"
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name character varying(256) COLLATE pg_catalog."default" NOT NULL,
    email character varying(256) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email)
);

ALTER TABLE IF EXISTS public.boarduser
    ADD CONSTRAINT boarduser_userid_fkey FOREIGN KEY (user_id)
    REFERENCES public."user" (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public.card
    ADD CONSTRAINT "CardFK" FOREIGN KEY (list_id)
    REFERENCES public.list (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public.carduser
    ADD CONSTRAINT "cardFK" FOREIGN KEY (card_id)
    REFERENCES public.card (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public.carduser
    ADD CONSTRAINT "userFK" FOREIGN KEY (user_id)
    REFERENCES public."user" (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public.list
    ADD CONSTRAINT "listFK" FOREIGN KEY (board_id)
    REFERENCES public.board (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE;

END;