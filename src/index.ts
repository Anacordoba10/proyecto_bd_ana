import { plainToClass } from "class-transformer";
import { validateOrReject } from "class-validator";
import dotenv from "dotenv";
import "es6-shim";
import express, { Express, Request, Response } from "express";
import { Pool } from "pg";
import "reflect-metadata";
import { Board } from "./dto/dto_boards";
import { User } from "./dto/dto_user";
import { Card } from "./dto/dto_cards";
import { List } from "./dto/dto_list";

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: +process.env.DB_PORT!,
});

//Express
const app: Express = express();
const port = process.env.PORT || 3000;
app.use(express.json());

app.get("/users", async (req: Request, res: Response) => {
  try {
    const text = "SELECT id, name, email FROM users";
    const result = await pool.query(text);
    res.status(200).json(result.rows);
  } catch (errors) {
    return res.status(400).json(errors);
  }
});

app.post("/users", async (req: Request, res: Response) => {
  let userDto: User = plainToClass(User, req.body);
  try {
    await validateOrReject(userDto);

    const text = "INSERT INTO users(name, email) VALUES($1, $2) RETURNING *";
    const values = [userDto.name, userDto.email];
    const result = await pool.query(text, values);
    res.status(201).json(result.rows[0]);
  } catch (errors) {
    return res.status(422).json(errors);
  }
});


// Crear tablero de usuario 
app.post('/boards/:userId', async (req: Request, res: Response) => {
  const userId: string = req.params.userId;
  let newBoard: Board = plainToClass(Board, req.body); 

  const resp = await pool.connect();
  try {
    await validateOrReject(newBoard); 

    resp.query("BEGIN");
    const query = 'INSERT INTO "board" (name) VALUES ($1) RETURNING *'; 
    const values = [newBoard.name]; // Extrae el nombre del formato JSON 
    const { rows } = await resp.query(query, values);

    const BoardUserId = rows[0].id; //Extrae el id generado por el INSERT de board.
    const assignQuery = 'INSERT INTO "boarduser" (board_id, user_id, is_admin) VALUES ($1, $2, true)'; 
    await resp.query(assignQuery, [BoardUserId, userId]); 

    resp.query("COMMIT");
    res.json({ board: rows[0] });
  } catch (error) {
    resp.query("ROLLBACK");
    res.status(500).json({ error: 'Ocurrió un error al crear el tablero' });
  }
});

// Crear tablero de usuario
app.post('/boards/:boardId/users', async (req: Request, res: Response) => {
  const boardId: string = req.params.boardId; 
  const userId: string = req.body.userId; 

  const resp = await pool.connect();
  try {
    resp.query("BEGIN");
    const query = 'INSERT INTO "boarduser" (board_id, user_id) VALUES ($1, $2)'; // DML - INSERT
    await resp.query(query, [boardId, userId]); 

    resp.query("COMMIT");
    res.json({ message: 'Usuario asignado al tablero' });
  } catch (error) {
    resp.query("ROLLBACK");
    res.status(500).json({ error: 'Ocurrió un error al asignar el usuario al tablero' });
  }
});

// Obtener listas de un tablero 
app.get('/boards/:boardId/lists', async (req: Request, res: Response) => {
  const boardId: string = req.params.boardId;

  try {
    const query: string = 'SELECT * FROM "list" WHERE board_id = $1'; // DQL - SELECT
    const { rows } = await pool.query(query, [boardId]); // DML - Query Execution
    res.json({ lists: rows });
  } catch (error) {
    res.status(500).json({ error: 'Ocurrió un error al obtener las listas' });
  }
});

// Crear lista en un tablero 
app.post('/boards/:boardId/lists', async (req: Request, res: Response) => {
  const boardId: string = req.params.boardId;
  const newList: List = plainToClass(List, req.body); 

  const resp = await pool.connect();
  try {
    await validateOrReject(newList); 

    resp.query("BEGIN");
    const query: string = 'INSERT INTO "list" (name, board_id) VALUES ($1, $2) RETURNING *'; // DML - INSERT
    const values: any[] = [newList.name, boardId];
    const { rows } = await resp.query(query, values); // DML - Query Execution
    resp.query("COMMIT");
    res.json({ list: rows[0] });
  } catch (error) {
    resp.query("ROLLBACK");
    res.status(500).json({ error: 'Ocurrió un error al crear la lista' });
  }
});

// Crear tarjeta en una lista para un usuario 
app.post('/lists/:listId/users/:userId/cards', async (req: Request, res: Response) => {
  const listId: string = req.params.listId;
  const userId: string = req.params.userId;
  const newCard: Card = plainToClass(Card, req.body); 

  const resp = await pool.connect();
  try {
    await validateOrReject(newCard); 

    resp.query("BEGIN");
    const query: string = 'INSERT INTO "card" (title, description, due_date, list_id) VALUES ($1, $2, $3, $4) RETURNING *'; // DML - INSERT
    const values: any[] = [newCard.title, newCard.description, newCard.due_date, listId];
    const { rows } = await resp.query(query, values); 

    const cardId: string = rows[0].id; //Extrae el id generado por el INSERT de Card.
    const assignQuery: string = 'INSERT INTO "carduser" (card_id, user_id, is_owner) VALUES ($1, $2, true)'; // DML - INSERT
    await resp.query(assignQuery, [cardId, userId]); 

    resp.query("COMMIT");
    res.json({ card: rows[0] });
  } catch (error) {
    resp.query("ROLLBACK");
    console.log(error);
    res.status(500).json({ error: 'Ocurrió un error al crear la tarjeta' });
  }
});

// Obtener una tarjeta con el nombre del usuario que la creo
app.get("/cards/:listId", async (req: Request, res: Response) => {
  const listId = req.params.listId;
  try {
    const query1 = 'SELECT id FROM "card" WHERE list_id = $1';
    const values1 = [listId];
    const result1 = await pool.query(query1, values1);
    const cardId = result1.rows[0].id;

    const query2 = `
      SELECT U.name 
      FROM carduser CU
      JOIN "user" U ON CU.user_id = U.id
      WHERE CU.card_id = $1 AND CU.is_owner = true
    `;
    const values2 = [cardId];
    const result2 = await pool.query(query2, values2);

    const response = {
      cards: result1.rows,
      ownerName: result2.rows[0].name
    };

    res.status(200).json(response);
  } catch (error) {
    return res.status(400).json(error);
  }
});

// Obtener la información del creador de la tarjeta
app.get('/cards/:cardId/creator', async (req: Request, res: Response) => {
  const cardId: string = req.params.cardId;

  const resp = await pool.connect();
  try {
    const query: string = `
      SELECT u.username
      FROM "card" c
      JOIN "user" u ON c.created_by = u.id
      WHERE c.id = $1`;

    const { rows } = await resp.query(query, [cardId]);

    res.json({ creatorName: rows[0].username });
  } catch (error) {
    res.status(500).json({ error: 'Ocurrió un error al obtener el creador de la tarjeta' });
  }
});

// Asignar un usuario a la tarjeta
app.post('/cards/:cardId/users', async (req: Request, res: Response) => {
  const cardId: string = req.params.cardId;
  const userId: string = req.body.userId;

  const resp = await pool.connect();
  try {
    resp.query("BEGIN");
    const query: string = `
      INSERT INTO "carduser" (card_id, user_id)
      VALUES ($1, $2)
      RETURNING *;`;

    const { rows } = await resp.query(query, [cardId, userId]);

    resp.query("COMMIT");
    res.json({ message: 'Usuario asignado a la tarjeta', cardUser: rows[0] });
  } catch (error) {
    resp.query("ROLLBACK");
    res.status(500).json({ error: 'Ocurrió un error al asignar el usuario a la tarjeta' });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});








