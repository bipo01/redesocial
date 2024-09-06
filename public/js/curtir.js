const btnCurtir = document.querySelectorAll(".btnCurtir");

document.querySelectorAll(".minhasCurtidas").forEach((el) => {
    document.querySelectorAll(".post").forEach((post) => {
        const idPost = Number(post.getAttribute("id-post"));
        const post_id = Number(el.getAttribute("post_id"));

        if (idPost === post_id) {
            const coracao = post.children[4].children[1].children[0];
            console.log(coracao);
            coracao.classList.remove("bi-heart");
            coracao.classList.add("bi-heart-fill");
        }
    });
});

btnCurtir.forEach((el) => {
    el.addEventListener("click", () => {
        const idPost = el.closest(".post").getAttribute("id-post");
        const numCurtidas = el.closest(".num-curtidas").children[1];

        if (el.classList.contains("bi-heart-fill")) {
            el.classList.remove("bi-heart-fill");
            el.classList.add("bi-heart");

            curtir(numCurtidas, idPost, "descurtir");
        } else {
            el.classList.remove("bi-heart");
            el.classList.add("bi-heart-fill");

            curtir(numCurtidas, idPost, "curtir");
        }
    });
});

async function curtir(n, i, c) {
    try {
        const response = await fetch(
            `http://localhost:3000/curtir?idpost=${i}&ac=${c}`
        );
        const curtidas = await response.json();

        console.log(curtidas);

        n.textContent = curtidas;
    } catch (error) {
        location.reload();
    }
}
