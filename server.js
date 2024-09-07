import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import cors from "cors";
import session from "express-session";
import multer from "multer";
import http from "http"; // Adicione esta linha
import { Server } from "socket.io"; // Adicione esta linha

import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const db = new pg.Client({
    connectionString:
        "postgres://default:Ef7gRnhwbD9B@ep-bold-limit-a48ldweb.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require",
});
db.connect();

const server = http.createServer(app); // Altere isso para suportar o socket.io
const io = new Server(server); // Crie o servidor socket.io

app.use(
    cors({
        origin: "*", // Permitir todas as origens (use com cuidado)
        methods: ["GET", "POST", "PUT", "DELETE"], // Definir os métodos permitidos
        credentials: true, // Habilitar cookies/sessões em pedidos CORS
    })
);

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // Permitir todas as origens
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
});

app.options("*", cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use(
    session({
        secret: "redesocial",
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false },
    })
);

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        // Defina o caminho correto dentro da pasta public
        callback(null, path.join(__dirname, "public", "files"));
    },
    filename: function (req, file, callback) {
        const ext = path.extname(file.originalname);

        console.log(file.originalname);

        const filename = `file_${Date.now()}${ext}`; // Use um timestamp único
        callback(null, filename);
    },
});

const upload = multer({
    storage: storage,
});

io.on("connection", (socket) => {
    socket.on("sendMessage", async (data) => {
        console.log(data);
        const idAmigo = Number(data.idAmigo);
        const idUser = Number(data.idUser);

        const result = await db.query(
            "SELECT * FROM redesocialmensagens WHERE amigo_id = $1 AND user_id = $2 ORDER BY id ASC",
            [idAmigo, idUser]
        );
        const mensagem = result.rows;

        const result1 = await db.query(
            "SELECT * FROM redesocialmensagens WHERE amigo_id = $1 AND user_id = $2 ORDER BY id ASC",
            [idUser, idAmigo]
        );
        const mensagem1 = result1.rows;

        io.emit("receivedMessage", { idUser, idAmigo, mensagem, mensagem1 });
    });
});

app.get("/", (req, res) => {
    if (req.session.user) return res.redirect("/home");
    return res.render("homepage.ejs");
});

app.get("/login", (req, res) => {
    if (req.session.user) {
        return res.redirect("/home");
    }
    return res.render("login.ejs", {
        wrongUser: req.session.wrongUser,
        wrongPass: req.session.wrongPass,
    });
});

app.get("/register", (req, res) => {
    req.session.wrongUser = false;
    return res.render("register.ejs", {
        userExists: req.session.userExists,
    });
});

app.get("/home", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    console.log(req.session.user);

    const result = await db.query(
        "SELECT * FROM redesocialposts WHERE user_id = $1 ORDER BY id DESC",
        [req.session.user.id]
    );
    const data = result.rows;
    const idPosts = data.map((el) => Number(el.id));

    const result1 = await db.query(
        "SELECT * FROM redesocialamigos WHERE user_id = $1",
        [req.session.user.id]
    );
    const data1 = result1.rows;

    const result2 = await db.query(
        "SELECT DISTINCT ON (amigo_id) * FROM redesocialmensagens WHERE user_id = $1 ORDER BY amigo_id, id DESC",
        [req.session.user.id]
    );
    const data2 = result2.rows;

    const result3 = await db.query(
        "SELECT * FROM redesocialmensagens WHERE user_id = $1",
        [req.session.user.id]
    );
    const data3 = result3.rows;

    const naoLidas = data3.filter((el) => el.lida === "nao");

    const result4 = await db.query(
        "SELECT * FROM minhascurtidas WHERE user_id = $1",
        [req.session.user.id]
    );
    const minhasCurtidas = result4.rows;

    const result5 = await db.query(
        "SELECT * FROM redesocialcomentarios WHERE post_id = ANY($1::int[]) ORDER BY id DESC",
        [idPosts]
    );
    const comentarios = result5.rows;

    return res.render("home.ejs", {
        data: data,
        data1: data1,
        data2: data2,
        naoLidas: naoLidas,
        usuario: req.session.user,
        minhasCurtidas: minhasCurtidas,
        comentarios,
    });
});

app.get("/all-posts", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    const result1 = await db.query(
        "SELECT * FROM redesocialamigos WHERE user_id = $1",
        [req.session.user.id]
    );
    const data1 = result1.rows?.map((el) => el.amigo_id);

    let data;
    let result;
    let comentariosR;
    let comentariosD;

    if (data1.length > 0) {
        result = await db.query(
            "SELECT * FROM redesocialposts WHERE user_id = ANY($1::int[])",
            [data1]
        );
        data = result.rows;

        const idsPosts = data.map((el) => el.id);

        comentariosR = await db.query(
            "SELECT * FROM redesocialcomentarios WHERE post_id = ANY($1::int[])",
            [idsPosts]
        );
        comentariosD = comentariosR.rows;
    }

    const result4 = await db.query(
        "SELECT * FROM minhascurtidas WHERE user_id = $1",
        [req.session.user.id]
    );
    const minhasCurtidas = result4.rows;

    return res.render("allposts.ejs", {
        data,
        minhasCurtidas,
        comentarios: comentariosD,
        usuario: req.session.user,
    });
});

app.get("/nova-mensagem", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const result = await db.query(
        "SELECT * FROM redesocialamigos WHERE user_id = $1",
        [req.session.user.id]
    );
    const data = result.rows;

    return res.render("novamensagem.ejs", { data: data });
});

app.post("/login", async (req, res) => {
    const usuario = req.body.usuario;
    const senha = req.body.senha;

    const result = await db.query(
        "SELECT * FROM redesocialuser WHERE usuario = $1",
        [usuario]
    );
    const data = result.rows[0];

    if (!data) {
        req.session.wrongUser = true;
        return res.redirect("/login");
    } else {
        if (data.senha === senha) {
            req.session.user = data;
            //req.session.wrongUser = false;

            return res.redirect("/home");
        } else {
            req.session.wrongPass = true;
            return res.redirect("/login");
        }
    }
});

app.post("/register", async (req, res) => {
    const usuario = req.body.usuario;
    const senha = req.body.senha;
    const nome = req.body.nome;

    const result = await db.query(
        "SELECT * FROM redesocialuser WHERE usuario = $1",
        [usuario]
    );
    const data = result.rows;

    if (!data.length) {
        const result = await db.query(
            "INSERT INTO redesocialuser (usuario, senha, nome) VALUES($1,$2, $3) RETURNING *",
            [usuario, senha, nome]
        );
        const data = result.rows[0];

        req.session.user = data;
        return res.redirect("/home");
    } else {
        req.session.userExists = true;
        return res.redirect("/register");
    }
});

app.post("/add-post", upload.single("image"), (req, res) => {
    const titulo = req.body.titulo;
    const texto = req.body.texto;
    const data = new Date();
    const imagePath = req.file ? `/files/${req.file.filename}` : null; // Caminho da imagem

    console.log(imagePath);

    db.query(
        "INSERT INTO redesocialposts (titulo, texto, data, user_id, user_name, curtidas, imagem) VALUES($1,$2,$3, $4, $5, $6, $7)",
        [
            titulo,
            texto,
            data,
            req.session.user.id,
            req.session.user.usuario,
            0,
            imagePath,
        ]
    );

    return res.redirect("/home");
});

app.post("/buscar-amigo", async (req, res) => {
    const amigosResult = await db.query(
        "SELECT * FROM redesocialamigos WHERE user_id = $1",
        [req.session.user.id]
    );
    const amigosData = amigosResult.rows.map((el) => Number(el.amigo_id));

    const search = req.body.searchFriend;
    const placeholders = amigosData.map((_, i) => `$${i + 3}`).join(", ");

    const query =
        amigosData.length > 0
            ? `SELECT * FROM redesocialuser WHERE (usuario LIKE $1 OR nome LIKE $1) AND usuario != $2 AND id NOT IN (${placeholders})`
            : `SELECT * FROM redesocialuser WHERE (usuario LIKE $1 OR nome LIKE $1) AND usuario != $2`;

    // Adicionar os parâmetros à lista
    const params = [`%${search}%`, req.session.user.usuario, ...amigosData];

    const result = await db.query(query, params);
    const data = result.rows;

    return res.render("buscandoamigos.ejs", { data: data, search: search });
});

app.post("/add-amigo", (req, res) => {
    const idAmigo = req.body.idAmigo;
    const nomeAmigo = req.body.nomeAmigo;

    db.query(
        "INSERT INTO redesocialamigos (amigo_id, user_id, nome_amigo) VALUES ($1,$2, $3)",
        [idAmigo, req.session.user.id, nomeAmigo]
    );
    db.query(
        "INSERT INTO redesocialamigos (amigo_id, user_id, nome_amigo) VALUES ($1,$2, $3)",
        [req.session.user.id, idAmigo, req.session.user.usuario]
    );

    return res.redirect("/home");
});

app.post("/enviar-mensagem", async (req, res) => {
    const idAmigo = Number(req.body.idAmigo);
    const mensagem = req.body.mensagem;
    const nomeAmigo = req.body.nomeAmigo;

    const dataEnvio = new Date();
    const horaEnvio = `${dataEnvio.getHours()}`.padStart(2, 0);
    const minutoEnvio = `${dataEnvio.getMinutes()}`.padStart(2, 0);
    const envio = `${horaEnvio}:${minutoEnvio}`;

    db.query(
        "INSERT INTO redesocialmensagens (mensagem, status, amigo_id, user_id, nome_amigo, nome_user, lida, data, hora) VALUES($1,$2,$3,$4,$5, $6, $7, $8, $9)",
        [
            mensagem,
            "enviada",
            idAmigo,
            req.session.user.id,
            nomeAmigo,
            req.session.user.usuario,
            "sim",
            dataEnvio,
            envio,
        ]
    );

    db.query(
        "INSERT INTO redesocialmensagens (mensagem, status, amigo_id, user_id, nome_amigo, nome_user, lida, data, hora) VALUES($1,$2,$3,$4, $5, $6, $7, $8, $9)",
        [
            mensagem,
            "recebida",
            req.session.user.id,
            idAmigo,
            req.session.user.usuario,
            nomeAmigo,
            "nao",
            dataEnvio,
            envio,
        ]
    );

    res.json("Adicionado");
});

app.post("/pegar-mensagens", async (req, res) => {
    const idAmigo = req.body.idAmigo;
    const result = await db.query(
        "SELECT * FROM redesocialmensagens WHERE amigo_id = $1 AND user_id = $2 ORDER BY id ASC",
        [idAmigo, req.session.user.id]
    );
    const data = result.rows;

    res.json(data);
});

app.get("/pegar-mensagens-tempo-real", async (req, res) => {
    if (!req.session.user) return;
    const result = await db.query(
        "SELECT * FROM redesocialmensagens WHERE user_id = $1 ORDER BY id ASC",
        [req.session.user.id]
    );
    const data0 = result.rows;

    const result1 = await db.query(
        "SELECT * FROM redesocialamigos WHERE user_id = $1",
        [req.session.user.id]
    );
    const data1 = result1.rows;

    const result2 = await db.query(
        "SELECT DISTINCT ON (amigo_id) * FROM redesocialmensagens WHERE user_id = $1 ORDER BY amigo_id, id DESC",
        [req.session.user.id]
    );
    const data2 = result2.rows;

    const data = {
        data0,
        data1,
        data2,
    };

    res.json(data);
});

app.get("/notificacoes", async (req, res) => {
    if (!req.session.user) return;

    const result3 = await db.query(
        "SELECT * FROM redesocialmensagens WHERE user_id = $1",
        [req.session.user.id]
    );
    const data3 = result3.rows;

    const naoLidas = data3.filter((el) => el.lida === "nao");

    res.json(naoLidas);
});

app.get("/ler", async (req, res) => {
    if (!req.session.user) return;

    const idMensagem = req.query.idmensagem.split(",");

    await idMensagem.forEach(async (el) => {
        await db.query(
            "UPDATE redesocialmensagens SET lida = $1 WHERE id = $2",
            ["sim", Number(el)]
        );
    });

    res.json("Lidas");
});

app.get("/curtir", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const idPost = Number(req.query.idpost);
    const ac = req.query.ac;

    const result = await db.query(
        "SELECT curtidas FROM redesocialposts WHERE id = $1",
        [idPost]
    );
    const curtidas = Number(result.rows[0].curtidas);

    let result1;
    let curtidasAtual;

    if (ac === "curtir") {
        result1 = await db.query(
            "UPDATE redesocialposts SET curtidas = $1 WHERE id = $2 RETURNING curtidas",
            [curtidas + 1, idPost]
        );
        curtidasAtual = result1.rows[0].curtidas;

        db.query(
            "INSERT INTO minhascurtidas (post_id, user_id) VALUES($1, $2)",
            [idPost, req.session.user.id]
        );
    } else {
        result1 = await db.query(
            "UPDATE redesocialposts SET curtidas = $1 WHERE id = $2 RETURNING curtidas",
            [curtidas - 1, idPost]
        );
        curtidasAtual = result1.rows[0].curtidas;

        db.query(
            "DELETE FROM minhascurtidas WHERE post_id = $1 AND user_id = $2",
            [idPost, req.session.user.id]
        );
    }

    res.json(curtidasAtual);
});

app.post("/new-comentario", async (req, res) => {
    const idPostAtual = req.body.idPostAtual;
    const comentario = req.body.comentario;
    const user_nome = req.body.nomeUser;
    const user_usuario = req.body.usuarioUser;

    const comentarioR = await db.query(
        "INSERT INTO redesocialcomentarios (comentario, post_id, user_nome, user_id, user_usuario) VALUES($1,$2,$3, $4, $5) RETURNING *",
        [comentario, idPostAtual, user_nome, req.session.user.id, user_usuario]
    );
    const comentarioD = comentarioR.rows;

    res.json(comentarioD);
});

app.post("/delete-comentario", (req, res) => {
    db.query("DELETE FROM redesocialcomentarios WHERE id = $1", [
        req.body.idComentario,
    ]);
});

app.get("/log-out", (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.redirect("/home");
        res.clearCookie("connect.sid");
        return res.redirect("/login");
    });
});

server.listen(port, () => {
    console.log(`Server on port ${port}`);
});
