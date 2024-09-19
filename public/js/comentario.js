const idUserC = document.querySelector("#idUser");

document.querySelectorAll(".comentarios").forEach((el) => {
    if (!el.nextElementSibling.innerHTML.trim().length) {
        el.classList.remove("comentarios");
        el.textContent = "Sem comentários";
    } else {
        el.classList.add("comentarios");
        el.textContent = "Ver comentários";
    }

    if (el.classList.contains("comentarios")) {
        el.addEventListener("click", () => {
            comentario(el);
        });
    }
});

function comentario(el) {
    el.textContent =
        el.textContent === "Ver comentários"
            ? "Ocultar comentários"
            : "Ver comentários";
    el.nextElementSibling.classList.toggle("hidden");
}

const socke = io();

document.querySelectorAll("#comentario-form").forEach((el) => {
    el.addEventListener("submit", (e) => {
        e.preventDefault();
        const idPostAtual = el.children[0].value;
        const user_nome = el.children[1].value;
        const user_usuario = el.children[2].value;
        const comentario = el.children[3];

        console.log(`ID USER NOVO COMENTARIO: ${idUserC.value}`);

        if (comentario.value.trim().length > 0) {
            socke.emit("comentar", {
                idPostAtual,
                user_nome,
                user_usuario,
                comentario: comentario.value,
                idUser: idUserC.value,
            });

            comentario.value = "";
        } else {
            alert("Comentário Vazio");
        }
    });
});

socke.on("comentario", (data) => {
    const post = data.data1;
    const idUserPost = document
        .querySelector(`[id-post='${post.post_id}']`)
        .getAttribute("id-user-post");
    let html;

    console.log(data);
    console.log(`ID USER ATUAL: ${idUserC.value}`);
    console.log(`ID USER POST: ${idUserPost}`);
    console.log(`ID USER: ${data.idUser}`);
    if (idUserC.value == idUserPost || data.idUser == idUserC.value) {
        html = `
    <div idComentario="${post.id}" class="comentarioDiv">
                <div class="pessoa-deletar">
                    <p>${post.user_nome}</p>
                    
                    <form
                        class="deletar-comentario"
                        action="/delete-comentario"
                        method="post"
                    >
                        <input
                            type="hidden"
                            name="idComentario"
                            value="${post.id}"
                        />
                        <button type="submit">
                            <i class="bi bi-trash3-fill"></i>
                        </button>
                    </form>
                    
                </div>
                <p>${post.comentario}</p>
            </div>
    `;
    } else {
        html = `
    <div idComentario="${post.id}" class="comentarioDiv">
                <div class="pessoa-deletar">
                    <p>${post.user_nome}</p>
                    
                </div>
                <p>${post.comentario}</p>
            </div>
    `;
    }

    const postComentario = document.querySelector(
        `[id-post-comentario='${post.post_id}']`
    );

    postComentario.insertAdjacentHTML("beforeend", html);

    document.querySelectorAll(".deletar-comentario").forEach((el) => {
        el.addEventListener("submit", (e) => {
            e.preventDefault();
            const idComentario = el.children[0].value;

            socke.emit("deletarComentario", { idComentario });
        });
    });

    const comentarioP = postComentario
        .closest(".post")
        .querySelector(".comentarioP");

    if (comentarioP.textContent === "Sem comentários") {
        comentarioP.classList.add("comentarios");
        comentarioP.textContent = "Ver comentários";

        if (comentarioP.classList.contains("comentarios")) {
            comentarioP.addEventListener("click", () => {
                comentario(comentarioP);
            });
        }
    }
});

socke.on("comentarioDeletado", (data) => {
    const comentarioAtual = document.querySelector(
        `[idComentario='${data.idComentario}']`
    );

    if (
        comentarioAtual.closest(".post").querySelector(".comentarios-container")
            .children.length === 1
    ) {
        comentarioAtual.closest(".post").querySelector(".comentarioP").remove();
        const p = document.createElement("p");
        p.textContent = "Sem comentários";
        p.classList.add("comentarioP");
        comentarioAtual
            .closest(".post")
            .insertBefore(
                p,
                comentarioAtual
                    .closest(".post")
                    .querySelector(".comentarios-container")
            );
        comentarioAtual
            .closest(".post")
            .querySelector(".comentarios-container")
            .classList.add("hidden");
    }

    comentarioAtual.remove();
});

document.querySelectorAll(".deletar-comentario").forEach((el) => {
    el.addEventListener("submit", (e) => {
        e.preventDefault();
        const idComentario = el.children[0].value;

        socke.emit("deletarComentario", { idComentario });
    });
});
