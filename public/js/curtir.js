const btnCurtir = document.querySelectorAll(".btnCurtir");

const socket = io();

document.querySelectorAll(".minhasCurtidas").forEach((el) => {
    document.querySelectorAll(".post").forEach((post) => {
        const idPost = Number(post.getAttribute("id-post"));
        const post_id = Number(el.getAttribute("post_id"));

        if (idPost === post_id) {
            console.log(`${idPost} curtido`);
            const coracao = post.children[4].children[1].children[0];
            coracao.classList.remove("bi-heart");
            coracao.classList.add("bi-heart-fill");
        }
    });
});

btnCurtir.forEach((el) => {
    el.addEventListener("click", () => {
        const idPost = el.closest(".post").getAttribute("id-post");
        console.log(idPost);
        const numCurtidas = el.closest(".num-curtidas").children[1].textContent;
        const idUser = document.querySelector("#idUser").value;

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
        document.querySelector(
            `[id-post='${data.idPost}']`
        ).children[4].children[1].children[1].textContent =
            data.curtidas.curtidas;
    }
});

socket.on("descurtidas", (data) => {
    if (document.querySelector(`[id-post='${data.idPost}']`)) {
        document.querySelector(
            `[id-post='${data.idPost}']`
        ).children[4].children[1].children[1].textContent =
            data.curtidas.curtidas;
    }
});

document.querySelectorAll(".titulo-btnDeletar").forEach((el) => {
    el.addEventListener("click", () => {
        const postAtual = el.closest(".post");
        const idPostAtual = postAtual.getAttribute("id-post");

        socket.emit("deletarPost", { postAtual, idPostAtual });
    });
});

socket.on("postDeletado", (data) => {
    document.querySelector(`[id-post='${data.idPostAtual}']`).remove();
});
