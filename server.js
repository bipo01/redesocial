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

import env from "dotenv";
env.config();

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
const io = new Server(server, {
    cors: {
        origin: "*", // Substitua pela URL do seu front-end se possível
        methods: ["GET", "POST"],
        credentials: true,
    },
}); // Crie o servidor socket.io

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
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "public/files")); // Garante que o caminho esteja correto
    },
    filename: function (req, file, cb) {
        cb(null, "file_" + Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

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

    socket.on("curtir", async (data) => {
        const idPost = Number(data.idPost);
        const numCurtidas = Number(data.numCurtidas);
        const idUser = data.idUser;

        const curtidasR = await db.query(
            "UPDATE redesocialposts SET curtidas = $1 WHERE id = $2 RETURNING *",
            [numCurtidas, idPost]
        );

        db.query(
            "INSERT INTO minhascurtidas (post_id, user_id) VALUES($1, $2)",
            [idPost, idUser]
        );

        const curtidas = curtidasR.rows[0];

        io.emit("curtidas", { idPost, curtidas });
    });

    socket.on("descurtir", async (data) => {
        const idPost = Number(data.idPost);
        const numCurtidas = Number(data.numCurtidas);
        const idUser = data.idUser;

        const curtidasR = await db.query(
            "UPDATE redesocialposts SET curtidas = $1 WHERE id = $2 RETURNING *",
            [numCurtidas, idPost]
        );

        db.query(
            "DELETE FROM minhascurtidas WHERE post_id = $1 AND user_id = $2",
            [idPost, idUser]
        );

        const curtidas = curtidasR.rows[0];

        io.emit("descurtidas", { idPost, curtidas });
    });

    socket.on("comentar", async (data) => {
        const idPostAtual = Number(data.idPostAtual);
        const user_nome = data.user_nome;
        const user_usuario = data.user_usuario;
        const comentario = data.comentario;
        const idUser = data.idUser;

        const result = await db.query(
            "INSERT INTO redesocialcomentarios (comentario, post_id, user_nome, user_id, user_usuario) VALUES($1,$2,$3, $4, $5) RETURNING *",
            [comentario, idPostAtual, user_nome, idUser, user_usuario]
        );
        const data1 = result.rows[0];

        io.emit("comentario", { data1, idUser: data.idUser });
    });

    socket.on("deletarComentario", (data) => {
        const idComentario = Number(data.idComentario);

        db.query("DELETE FROM redesocialcomentarios WHERE id = $1", [
            idComentario,
        ]);

        io.emit("comentarioDeletado", { idComentario });
    });

    socket.on("deletarPost", (data) => {
        const idPostAtual = Number(data.idPostAtual);

        db.query("DELETE FROM redesocialposts WHERE id = $1", [idPostAtual]);

        io.emit("postDeletado", { idPostAtual });
    });

    socket.on("novoPost", async (data) => {
        const idPost = Number(data.id);

        const result = await db.query(
            "SELECT * FROM redesocialposts WHERE id = $1",
            [idPost]
        );
        const post = result.rows[0];

        io.emit("postNovo", {
            post,
        });
    });

    socket.on("deletarMsg", (data) => {
        if (data?.msgSelecionadasArr.length > 0) {
            data.msgSelecionadasArr.forEach((el) => {
                db.query("DELETE FROM redesocialmensagens WHERE id = $1", [
                    Number(el),
                ]);
            });
        }
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

    const amigosR = await db.query(
        "SELECT * FROM redesocialamigos WHERE user_id = $1",
        [req.session.user.id]
    );
    const amigos = amigosR.rows;

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
    console.log(naoLidas);

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
        amigos,
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
    console.log(data1);

    const amigosR = await db.query(
        "SELECT * FROM redesocialamigos WHERE user_id = $1",
        [req.session.user.id]
    );
    const amigos = amigosR.rows;

    let data;
    let result;
    let comentariosR;
    let comentariosD;

    if (data1.length > 0) {
        result = await db.query(
            "SELECT * FROM redesocialposts WHERE user_id = ANY($1::int[]) ORDER BY id DESC",
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
        amigos,
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

app.post("/add-post", upload.single("image"), async (req, res) => {
    const titulo = req.body.titulo;
    const texto = req.body.texto;
    const data = new Date();
    const imagePath = req.file ? `/files/${req.file.filename}` : null; // Caminho da imagem

    console.log(imagePath);

    const result = await db.query(
        "INSERT INTO redesocialposts (titulo, texto, data, user_id, user_name, curtidas, imagem) VALUES($1,$2,$3, $4, $5, $6, $7) RETURNING id",
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
    const id = result.rows[0];
    console.log(id);

    return res.json(id);
});

app.post("/buscar-amigo", async (req, res) => {
    if (!req.session.user) return res.redirect("/");
    const amigosResult = await db.query(
        "SELECT * FROM redesocialamigos WHERE user_id = $1",
        [req.session.user.id]
    );
    const amigosJaAddId = amigosResult.rows.map((el) => el.amigo_id);
    const amigosJaAddResult = await db.query(
        "SELECT * FROM redesocialuser WHERE id = ANY($1::int[])",
        [amigosJaAddId]
    );
    const amigosJaAdd = amigosJaAddResult.rows;

    const amigosData = amigosResult.rows.map((el) => Number(el.amigo_id));

    const search = req.body.searchFriend;
    const placeholders = amigosData.map((_, i) => `$${i + 3}`).join(", ");
    req.session.search = search;
    const query =
        amigosData.length > 0
            ? `SELECT * FROM redesocialuser WHERE (usuario LIKE $1 OR nome LIKE $1) AND usuario != $2 AND id NOT IN (${placeholders})`
            : `SELECT * FROM redesocialuser WHERE (usuario LIKE $1 OR nome LIKE $1) AND usuario != $2`;

    // Adicionar os parâmetros à lista
    const params = [`%${search}%`, req.session.user.usuario, ...amigosData];

    const result = await db.query(query, params);
    const data = result.rows;

    return res.render("buscandoamigos.ejs", {
        data: data,
        search: search,
        amigosJaAdd,
        usuario: req.session.user,
        amigos: false,
        minhasCurtidas: false,
    });
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

    return res.redirect("/buscar-amigo");
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

app.post("/deletar-amigo", async (req, res) => {
    const idAmigo = req.body.idAmigo;
    db.query(
        "DELETE FROM redesocialamigos WHERE amigo_id = $1 AND user_id = $2",
        [idAmigo, req.session.user.id]
    );
    db.query(
        "DELETE FROM redesocialamigos WHERE amigo_id = $1 AND user_id = $2",
        [req.session.user.id, idAmigo]
    );

    return res.redirect("/buscar-amigo");
});

app.get("/buscar-amigo", async (req, res) => {
    if (!req.session.user) return res.redirect("/");
    const amigosResult = await db.query(
        "SELECT * FROM redesocialamigos WHERE user_id = $1",
        [req.session.user.id]
    );
    const amigosJaAddId = amigosResult.rows.map((el) => el.amigo_id);
    const amigosJaAddResult = await db.query(
        "SELECT * FROM redesocialuser WHERE id = ANY($1::int[])",
        [amigosJaAddId]
    );
    const amigosJaAdd = amigosJaAddResult.rows;

    const amigosData = amigosResult.rows.map((el) => Number(el.amigo_id));

    const placeholders = amigosData.map((_, i) => `$${i + 3}`).join(", ");

    const query =
        amigosData.length > 0
            ? `SELECT * FROM redesocialuser WHERE (usuario LIKE $1 OR nome LIKE $1) AND usuario != $2 AND id NOT IN (${placeholders})`
            : `SELECT * FROM redesocialuser WHERE (usuario LIKE $1 OR nome LIKE $1) AND usuario != $2`;

    // Adicionar os parâmetros à lista
    const params = [
        `%${req.session.search}%`,
        req.session.user.usuario,
        ...amigosData,
    ];

    const result = await db.query(query, params);
    const data = result.rows;

    return res.render("buscandoamigos.ejs", {
        data: data,
        search: req.session.search,
        amigosJaAdd,
        usuario: req.session.user,
        amigos: false,
        minhasCurtidas: false,
    });
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
