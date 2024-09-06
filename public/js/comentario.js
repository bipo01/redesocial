const comentarioForm = document.querySelectorAll("#comentario-form");
const comentariosContainer = document.querySelectorAll(
    ".comentarios-container"
);
const deletarComentarioForm = document.querySelectorAll(".deletar-comentario");

comentarioForm.forEach((el, i) => {
    el.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(comentarioForm[i]);
        const urlParams = new URLSearchParams(formData);

        const response = await fetch(
            "https://redesocial-phi.vercel.app/new-comentario",
            {
                method: "post",
                body: urlParams,
            }
        );
        const data = await response.json();

        console.log(data);

        const idPostAtual = Number(e.target.children[0].value);
        console.log(idPostAtual);

        const containerAtual = document.querySelector(
            `[id-post-comentario='${idPostAtual}']`
        );

        data.forEach((el) => {
            const html = `
            <div idComentario="${el.id}" class="comentarioDiv">
                <div class="pessoa-deletar">
                    <p>${el.user_nome}</p>
                   
                    <form
                        class="deletar-comentario"
                        action="/delete-comentario"
                        method="post"
                    >
                        <input
                            type="hidden"
                            name="idComentario"
                            value="${el.id}"
                        />
                        <button type="submit">
                            <i class="bi bi-trash3-fill"></i>
                        </button>
                    </form>
                  
                </div>
                <p>${el.comentario}</p>
            </div>
            `;

            containerAtual.insertAdjacentHTML("afterbegin", html);
        });

        if (el.parentElement.children[6].children.length > 0) {
            if (
                el.parentElement.children[5].textContent === "Sem comentários"
            ) {
                el.parentElement.children[5].textContent = "Ver comentários";
                el.parentElement.children[5].classList.add("comentarios");
                el.parentElement.children[5].addEventListener("click", () => {
                    comentario(el.parentElement.children[5]);
                });
            }
        }

        el.children[3].value = "";

        document.querySelectorAll(".deletar-comentario").forEach((el, i) => {
            el.addEventListener("submit", (e) => {
                e.preventDefault();
                deletarComentario(el);
            });
        });
    });
});

deletarComentarioForm.forEach((el, i) => {
    el.addEventListener("submit", (e) => {
        e.preventDefault();
        deletarComentario(el);
    });
});

function deletarComentario(el) {
    const formData = new FormData(el);
    const urlParams = new URLSearchParams(formData);

    fetch("https://redesocial-phi.vercel.app/delete-comentario", {
        method: "post",
        body: urlParams,
    });

    if (el.closest(".post").children[6].children.length === 1) {
        el.closest(".post").children[5].remove();
        const p = document.createElement("p");
        p.textContent = "Sem comentários";
        p.classList.add("comentarioP");
        el.closest(".post").insertBefore(p, el.closest(".post").children[5]);
        el.closest(".post").children[6].classList.add("hidden");
    }

    el.parentElement.parentElement.remove();
}

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
    console.log(el);
    el.textContent =
        el.textContent === "Ver comentários"
            ? "Ocultar comentários"
            : "Ver comentários";
    el.nextElementSibling.classList.toggle("hidden");
}
