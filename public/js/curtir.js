const btnCurtir = document.querySelectorAll(".btnCurtir");
const usuarioAtual = document.querySelector("#usuarioAtual").value;
const usuarioNome = document.querySelector("#usuarioNome").value;

const idUser = document.querySelector("#idUser").value;

const socket = io();

document.querySelectorAll(".minhasCurtidas").forEach((el) => {
    document.querySelectorAll(".post").forEach((post) => {
        const idPost = Number(post.getAttribute("id-post"));
        const post_id = Number(el.getAttribute("post_id"));

        if (idPost === post_id) {
            console.log(`${idPost} curtido`);
            const coracao = post.querySelector(".btnCurtir");
            coracao.classList.remove("bi-heart");
            coracao.classList.add("bi-heart-fill");
        }
    });
});

btnCurtir.forEach((el) => {
    el.addEventListener("click", () => {
        const idPost = el.closest(".post").getAttribute("id-post");
        const numCurtidas = el.closest(".num-curtidas").children[1].textContent;

        if (el.classList.contains("bi-heart-fill")) {
            el.classList.remove("bi-heart-fill");
            el.classList.add("bi-heart");

            socket.emit("descurtir", {
                numCurtidas: Number(Number(numCurtidas) - 1),
                idPost,
                idUser,
            });
        } else {
            el.classList.remove("bi-heart");
            el.classList.add("bi-heart-fill");
            socket.emit("curtir", {
                numCurtidas: Number(Number(numCurtidas) + 1),
                idPost,
                idUser,
            });
        }
    });
});

socket.on("curtidas", (data) => {
    if (document.querySelector(`[id-post='${data.idPost}']`)) {
        document
            .querySelector(`[id-post='${data.idPost}']`)
            .querySelector(".num-curtidas")
            .querySelector("small").textContent = data.curtidas.curtidas;
    }
});

socket.on("descurtidas", (data) => {
    if (document.querySelector(`[id-post='${data.idPost}']`)) {
        document
            .querySelector(`[id-post='${data.idPost}']`)
            .querySelector(".num-curtidas")
            .querySelector("small").textContent = data.curtidas.curtidas;
    }
});

document.querySelectorAll(".deletar-post").forEach((el) => {
    el.addEventListener("click", () => {
        const postAtual = el.closest(".post");
        const idPostAtual = postAtual.getAttribute("id-post");

        socket.emit("deletarPost", { idPostAtual });
    });
});

socket.on("postDeletado", (data) => {
    document
        .querySelectorAll(`[id-post='${data.idPostAtual}']`)
        .forEach((el) => {
            el.remove();
        });

    if (!document.querySelector(".posts").children.length) {
        document.querySelector(".posts").innerHTML = `
            <div>
                <h3 id="no-posts" style="text-align: center">Nenhuma postagem...</h3>
            </div>
            `;
    }
});

socket.on("postNovo", (post) => {
    if (document.querySelectorAll(".idAmigos")) {
        const idsAmigos = [...document.querySelectorAll(".idAmigos")].map(
            (el) => el.value
        );
        if (
            idsAmigos.includes(String(post.post.user_id)) ||
            post.post.user_id == idUser
        ) {
            const data = post.post;
            console.log(data);
            const date = new Date(data.data).toLocaleDateString("pt-BR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            });
            const html = `<div
                id-post="${data.id}"
                id-user-post="${data.user_id}"
                class="post card p-4 mb-3 shadow-sm"
            >
                <div class="titulo-btnDeletar">
                    <h3 class="text-dark">${data.titulo}</h3>
                    ${
                        data.user_id == idUser
                            ? `
                        <button class="deletar-post">Deletar</button>
                        `
                            : ""
                    }
                   
                </div>
        
                
        
                <p class="mb-1">${data.texto}</p>
        
                ${
                    data.imagem
                        ? `
                        <div class='imagem-post'>
                        <img
                        id='post-img'
                    src="${data.imagem}"
                    alt="Post Image"
                    
                />
                </div>
                `
                        : ""
                }
               
               
               <small class="text-muted"
                    >${date}</small
                >
        
                
                <div class="user-curtida">
                    <em class="text-muted">@${data.user_name}</em>
                    <div class="num-curtidas">
                        <i class="bi bi-heart btnCurtir"></i>
                        <small numero-curtidas="${data.curtidas}"
                            >${data.curtidas}</small
                        >
                    </div>
                </div>
        
                <p class="comentarioP">Sem comentários</p>
                <div
                    class="comentarios-container hidden"
                    id-post-comentario="${data.id}"
                >
                    
                </div>
                <form id="comentario-form" action="/new-comentario" method="post">
                    <input
                        type="hidden"
                        name="idPostAtual"
                        id="idPostAtual"
                        value="${data.id}"
                    />
                    <input type="hidden" name="nomeUser" value="${usuarioNome}" />
                    <input
                        type="hidden"
                        name="usuarioUser"
                        value="${usuarioAtual}"
                    />
                    <input
                        type="text"
                        name="comentario"
                        id="comentarioInput"
                        placeholder="Comentário"
                    />
                    <button type="submit">Adicionar</button>
                </form>
            </div>`;

            if (
                document.querySelector(".posts").parentElement.id ==
                    "publicacoes" &&
                idUser != data.user_id
            ) {
                return;
            } else if (
                document.querySelector(".posts").parentElement.id !=
                    "publicacoes" &&
                idUser == data.user_id
            ) {
                return;
            } else {
                const h3NoPosts = document.querySelector("#no-posts");
                if (h3NoPosts) {
                    h3NoPosts.parentElement.remove();
                }
                document
                    .querySelector(".posts")
                    .insertAdjacentHTML("afterbegin", html);

                const pai = document.querySelector(`[id-post='${data.id}']`);
                const btnDeletar = pai.querySelector(".titulo-btnDeletar");

                btnDeletar.addEventListener("click", () => {
                    if (btnDeletar.querySelector(".deletar-post")) {
                        const idPostAtual = data.id;

                        socket.emit("deletarPost", { idPostAtual });
                    }
                });

                const btnCurtir = pai.querySelector(".btnCurtir");

                btnCurtir.addEventListener("click", () => {
                    const idPost = btnCurtir
                        .closest(".post")
                        .getAttribute("id-post");
                    console.log(idPost);
                    const numCurtidas =
                        btnCurtir.closest(".num-curtidas").children[1]
                            .textContent;

                    if (btnCurtir.classList.contains("bi-heart-fill")) {
                        btnCurtir.classList.remove("bi-heart-fill");
                        btnCurtir.classList.add("bi-heart");

                        socket.emit("descurtir", {
                            numCurtidas: Number(Number(numCurtidas) - 1),
                            idPost,
                            idUser,
                        });
                    } else {
                        btnCurtir.classList.remove("bi-heart");
                        btnCurtir.classList.add("bi-heart-fill");
                        socket.emit("curtir", {
                            numCurtidas: Number(Number(numCurtidas) + 1),
                            idPost,
                            idUser,
                        });
                    }
                });

                const comentarioForm = pai.querySelector("#comentario-form");
                comentarioForm.addEventListener("submit", (e) => {
                    e.preventDefault();
                    const idPostAtual = comentarioForm.children[0].value;
                    const user_nome = comentarioForm.children[1].value;
                    const user_usuario = comentarioForm.children[2].value;
                    const comentario = comentarioForm.children[3];

                    if (comentario.value.trim().length > 0) {
                        socket.emit("comentar", {
                            idPostAtual,
                            user_nome,
                            user_usuario,
                            comentario: comentario.value,
                            idUser,
                        });

                        comentario.value = "";
                    } else {
                        alert("Comentário Vazio");
                    }
                });
            }
        }
    }
});
