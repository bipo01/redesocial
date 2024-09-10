const showAddPostBtn = document.querySelector("#show-add-post-btn");
const addPostForm = document.querySelector("#add-post-form");
const posts = document.querySelector(".posts");

const mensagens = document.querySelector(".mensagens");
const btnUsuarios = document.querySelectorAll(".btnUsuarios");
const pegarMensagensForm = document.querySelector("#pegarMensagens");
const enviarMensagemForm = document.querySelector("#enviarMensagem");
const enviarMensagemDiv = document.querySelector(".enviarMensagemDiv");
const mensagem = document.querySelector("#mensagem");
const idAmigoInp = document.querySelector("#idAmigo");
const publicacoes = document.querySelector("#publicacoes");
const lastMessage = document.querySelectorAll(".last-message");

const idUser = document.querySelector("#idUser");
const nomeUser = document.querySelector("#nomeUser");
const usuarioUser = document.querySelector("#usuarioUser");

const socket = io();

let dataAtual;

socket.on("receivedMessage", (mensagem) => {
    if (idUser.value == mensagem.idUser) {
        const idAmigoLastMessage = document.querySelector(
            `[id-amigo-p='${mensagem.idAmigo}']`
        );
        idAmigoLastMessage.innerHTML = `<small>Você: ${
            mensagem.mensagem.at(-1).mensagem
        }</small>`;
    } else if (idUser.value == mensagem.idAmigo) {
        const idAmigoLastMessage = document.querySelector(
            `[id-amigo-p='${mensagem.idUser}']`
        );

        idAmigoLastMessage.innerHTML = `<small>${
            mensagem.mensagem1.at(-1).nome_amigo
        }: ${mensagem.mensagem1.at(-1).mensagem}</small>`;

        const notificacoes = mensagem.mensagem1.filter(
            (el) => el.lida == "nao"
        ).length;

        console.log(notificacoes);

        const notificacao = document.querySelector(
            `[id-amigo-not='${mensagem.idUser}']`
        );
        const idAmigoC = document.querySelector(
            `[id-amigo='${mensagem.idUser}']`
        );

        if (!idAmigoC.classList.contains("selected")) {
            notificacao.textContent = notificacoes;
            notificacao.classList.add("nao-lidas-style");
        } else {
            const idsMensagens = mensagem.mensagem1.map((el) => el.id);
            console.log(idsMensagens);
            fetch(
                `https://redesocial-d5bx.onrender.com/ler?idmensagem=${idsMensagens}`
            );
        }
    }

    const idAmigoInput = document.querySelector("#idAmigo").value;

    if (idUser.value == mensagem.idUser && idAmigoInput == mensagem.idAmigo) {
        mensagens.innerHTML = "";
        mensagem.mensagem.forEach((el) => {
            el.mensagem = el.mensagem.replaceAll("\n", "<br>");
            const html = `
                            <p class='${el.status}'>
                                ${el.mensagem}
                                <small id="hora">${el.hora}</small>
                            </p>`;
            mensagens.insertAdjacentHTML("afterbegin", html);
        });
    } else if (
        idUser.value == mensagem.idAmigo &&
        idAmigoInput == mensagem.idUser
    ) {
        mensagens.innerHTML = "";

        mensagem.mensagem1.forEach((el) => {
            el.mensagem = el.mensagem.replaceAll("\n", "<br>");
            const html = `
                            <p class='${el.status}'>
                                ${el.mensagem}
                                <small id="hora">${el.hora}</small>
                            </p>`;
            mensagens.insertAdjacentHTML("afterbegin", html);
        });
    }
});

showAddPostBtn.addEventListener("click", () => {
    addPostForm.classList.toggle("hidden");
    const isHidden = addPostForm.classList.contains("hidden");

    showAddPostBtn.textContent = !isHidden ? "Cancelar" : "Nova publicação";
});

btnUsuarios.forEach((el) => {
    el.addEventListener("click", async (e) => {
        const idAmigo = el.getAttribute("id-amigo");
        const nomeAmigo = el.children[1].textContent;

        document.querySelector("#idAmigoP").value = idAmigo;
        document.querySelector("#idAmigo").value = idAmigo;
        document.querySelector("#nomeAmigoP").value = nomeAmigo;
        document.querySelector("#nomeAmigo").value = nomeAmigo;

        const formData = new FormData(pegarMensagensForm);
        const urlParams = new URLSearchParams(formData);

        const response = await fetch(
            "https://redesocial-d5bx.onrender.com/pegar-mensagens",
            {
                method: "post",
                body: urlParams,
            }
        );
        const data = await response.json();

        mensagens.innerHTML = "";

        dataAtual = data;

        data.forEach((el) => {
            el.mensagem = el.mensagem.replaceAll("\n", "<br>");
            const html = `<p class='${el.status}'>${el.mensagem}<small id="hora">${el.hora}</small></p>`;
            mensagens.insertAdjacentHTML("afterbegin", html);
        });

        document.querySelector(`[id-amigo-not='${idAmigo}']`).innerHTML = "";
        document
            .querySelector(`[id-amigo-not='${idAmigo}']`)
            .classList.remove("nao-lidas-style");

        const idsMensagens = data
            .filter((el) => el.amigo_id == idAmigo)
            .map((el) => el.id);

        fetch(
            `https://redesocial-d5bx.onrender.com/ler?idmensagem=${idsMensagens}`
        );

        btnUsuarios.forEach((el1) => {
            if (el1 !== el) {
                el1.classList.remove("selected");
            }
        });

        if (el.classList.contains("selected")) {
            enviarMensagemDiv.classList.add("hidden");
            publicacoes.classList.remove("hidden");
            el.classList.remove("selected");
        } else {
            el.classList.add("selected");
            enviarMensagemDiv.classList.remove("hidden");
            publicacoes.classList.add("hidden");
        }
    });
});

enviarMensagemForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(enviarMensagemForm);
    const urlParams = new URLSearchParams(formData);
    const idAmigo = enviarMensagemForm.children[0].children[1].value;

    const response = await fetch(
        "https://redesocial-d5bx.onrender.com/enviar-mensagem",
        {
            method: "post",
            body: urlParams,
        }
    );

    socket.emit("sendMessage", {
        idAmigo,
        idUser: idUser.value,
        mensagem: mensagem.value,
    });

    mensagem.value = "";
});

mensagens.scrollTop = mensagens.scrollHeight;
