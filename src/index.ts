import { plainToClass } from "class-transformer";
import { validateOrReject } from "class-validator";
import dotenv from "dotenv";
import "es6-shim";
import express, { Express, Request, Response } from "express";
import { Pool } from "pg";
import "reflect-metadata";
import { Board } from "./dto/board.dto";
import { User } from "./dto/user.dto";
import { List } from "./dto/list.dto";
import { CardUser } from "./dto/card_userdto";
import { Card } from "./dto/card.dto";

dotenv.config();

//Conexion a la base de datos
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: +process.env.DB_PORT!,
});

const app: Express = express();
const port = process.env.PORT || 3000;
app.use(express.json());

//Endpoint para listar los usuarios
app.get("/users", async (req: Request, res: Response) => {
  try {
    const text = "SELECT id, name, email FROM users";
    const result = await pool.query(text);
    res.status(200).json(result.rows);
  } catch (errors) {
    return res.status(400).json(errors);
  }
});

//Endpoint para ingresar los datos de los usuarios
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

//Crear una lista asociada a un tablero
app.post("/boards/:boardId/lists", async (req: Request, res: Response) => {
  let listDto: List = plainToClass(List, req.body);
  listDto.boardId = req.params.boardId
  try {
    await validateOrReject(listDto);

    const text = "INSERT INTO lists(name, boardId) VALUES ($1, $2) RETURNING *";
    const values = [listDto.name, listDto.boardId];
    const result = await pool.query(text, values);
    res.status(201).json(result.rows[0]);
  }catch (errors) {
    return res.status(400).json(errors);
  }
});

//Endpoint para obtener las listas asociadas a un tablero
app.get("/boards/:boardId/lists", async (req: Request, res: Response) => {
  const { boardId } = req.params;
  try {
    const text = "SELECT * FROM lists WHERE boardId = $1";
    const values = [boardId];

    const result = await pool.query(text, values);

    res.status(201).json(result.rows);
  } catch (errors) {
    return res.status(422).json(errors);
  }
  });

  //Endpoint para obtener todas las listas
  app.get("/lists", async (req: Request, res: Response) =>{
    try {
      const text = "SELECT * FROM lists";
      const result = await pool.query(text);

      res.status(200).json(result.rows);
    
    } catch (errors) {
      return res.status(400).json(errors)
    }
  })

  //Enpoint para asignar un usuario o persona registrada a una tarjeta
  app.post("/cards/:card_Id/users/:user_Id", async (req: Request, res: Response) => {
    let card_userdto: CardUser = plainToClass(CardUser, req.body);
    card_userdto.card_Id = req.params.card_Id
    card_userdto.user_Id = req.params.user_Id

    try {
      await validateOrReject(card_userdto);

      const text = "INSERT INTO card_users(isOwner, user_Id, card_Id) VALUES ($1, $2, $3) RETURNING *";
      const values = [card_userdto.isOwner, card_userdto.user_Id, card_userdto.card_Id];

      const query = await pool.query(text, values)

      res.status(201).json(query.rows[0]);
    } catch (errors) {
      return res.status(422).json(errors);
    }
  });

  //Endpoint para obtener las tarjetas con su dueño asociado
  app.get("/cards/:card_Id/owner", async (req: Request, res: Response) => {
    const { card_Id } = req.params;
    try {
      const text = `
        SELECT card_users.card_Id, users.id as user_Id, users.name, card_users.isOwner 
        FROM card_users 
        INNER JOIN users ON card_users.user_Id = users.id 
        WHERE card_users.card_Id = $1 AND card_users.isOwner = true
      `;
      const values = [card_Id];
      const result = await pool.query(text, values);
      res.status(200).json(result.rows);
    } catch (errors) {
      return res.status(400).json(errors);
    }
  });

  //Endpoint para mostrar todas las tarjetas y usuarios asociados
  app.get("/card_users", async (req: Request, res: Response) => {
    try {
      const text = "SELECT * FROM card_users"
      const result = await pool.query(text);
      res.status(200).json(result.rows);

    } catch (errors) {
      return res.status(400).json(errors);
    }

  });
  
  //Endpoint para insertar los datos en las tarjetas
  app.post("/lists/:list_id/cards", async (req: Request, res: Response) => {

    let card_dto: Card = plainToClass(Card, req.body);
    card_dto.list_id = req.params.list_id

    try {
      await validateOrReject(card_dto)
      const text = "INSERT INTO cards(title, description, due_date, list_id) VALUES ($1, $2, $3, $4) RETURNING*";
      const values = [card_dto.title, card_dto.description, card_dto.due_date, card_dto.list_id];

      const result = await pool.query(text, values);

      res.status(201).json(result.rows[0]);
    } catch (errors) {
      return res.status(422).json(errors);
    }
});

//Endpoint para obtener una lista asociada a una tarjeta
app.get("/lists/:list_id/cards", async (req: Request, res: Response) => {
  const { list_id } = req.params;
  
  try {
    const text = "SELECT * FROM cards WHERE list_id = $1";
    const values = [list_id];
    const result = await pool.query(text, values);
    
    if(result.rows.length === 0) {  //Se valida que la foreign key de la lista le pertenezca a una tarjeta
      return res.status(404).json({ error: "No se encontró ninguna tarjeta con el id de lista proporcionado" });
    }
    
    res.status(200).json(result.rows);
  } catch (errors){
      return res.status(400).json(errors);
  }

});

//Endpoint para listar todas las tarjetas
app.get("/cards", async (req: Request, res: Response) => {
  try {
    const text = "SELECT * FROM cards";
    const result = await pool.query(text);

    return res.status(200).json(result.rows);

  }catch (errors) {
      return res.status(400).json(errors);
  }
});

//Endpoint para obtener los datos de los tableros con su administrador
app.get("/boards", async (req: Request, res: Response) => {
  try {
    const text =
      'SELECT b.id, b.name, bu.userId "adminUserId" FROM boards b JOIN board_users bu ON bu.boardId = b.id WHERE bu.isAdmin IS true';
    const result = await pool.query(text);
    res.status(200).json(result.rows);
  } catch (errors) {
    return res.status(400).json(errors);
  }
});

//Endpoint para ingresar los datos a los tableros mediante transaccion
app.post("/boards", async (req: Request, res: Response) => {
  let boardDto: Board = plainToClass(Board, req.body);
  const client = await pool.connect();
  try {
    client.query("BEGIN");
    await validateOrReject(boardDto, {});

    const boardText = "INSERT INTO boards(name) VALUES($1) RETURNING *";
    const boardValues = [boardDto.name];
    const boardResult = await client.query(boardText, boardValues);

    const boardUserText =
      "INSERT INTO board_users(isAdmin, boardId, userId) VALUES($1, $2, $3)";
    const boardUserValues = [
      true,
      boardResult.rows[0].id,
      boardDto.adminUserId,
    ];
    await client.query(boardUserText, boardUserValues);

    client.query("COMMIT");
    res.status(201).json(boardResult.rows[0]);
  } catch (errors) {
    client.query("ROLLBACK");
    return res.status(422).json(errors);
  } finally {
    client.release();
  }
});

//Activamos el puerto para la conexion con el servidor
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
