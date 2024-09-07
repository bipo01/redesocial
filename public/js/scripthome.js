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
    console.log(`ID USER: ${idUser.value}  ||  (${mensagem})`);
    mensagens.innerHTML = "";
    if (idUser.value == mensagem.idUser) {
        mensagem.mensagem.forEach((el) => {
            el.mensagem = el.mensagem.replaceAll("\n", "<br>");
            const html = `
                            <p class='${el.status}'>
                                ${el.mensagem}
                                <small id="hora">${el.hora}</small>
                            </p>`;
            mensagens.insertAdjacentHTML("afterbegin", html);
        });
    } else {
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

        const response = await fetch("http://localhost:3000/pegar-mensagens", {
            method: "post",
            body: urlParams,
        });
        const data = await response.json();

        mensagens.innerHTML = "";

        dataAtual = data;

        data.forEach((el) => {
            el.mensagem = el.mensagem.replaceAll("\n", "<br>");
            const html = `<p class='${el.status}'>${el.mensagem}</p>`;
            mensagens.insertAdjacentHTML("afterbegin", html);
        });

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

    const response = await fetch("http://localhost:3000/enviar-mensagem", {
        method: "post",
        body: urlParams,
    });

    socket.emit("sendMessage", { idAmigo, idUser: idUser.value });

    //const data = await response.json();

    mensagem.value = "";
});

// setInterval(async () => {
//     if (!idUser.value) return;

//     const response = await fetch(
//         `http://localhost:3000/pegar-mensagens-tempo-real`
//     );

//     const allData = await response.json();

//     const { data0: data, data1, data2 } = allData;

//     mensagens.innerHTML = "";

//     data.forEach((el) => {
//         mensagens.setAttribute("mensagem-id-amigo", idAmigoInp.value);
//         const mensagemIdAmigo = mensagens.getAttribute("mensagem-id-amigo");

//         if (mensagemIdAmigo == el.amigo_id) {
//             el.mensagem = el.mensagem.replaceAll("\n", "<br>");
//             const html = `
//                         <p class='${el.status}'>
//                             ${el.mensagem}
//                             <small id="hora">${el.hora}</small>
//                         </p>`;
//             mensagens.insertAdjacentHTML("afterbegin", html);
//         }
//     });

//     data2.forEach((el) => {
//         let p = document.querySelector(`[id-amigo-p="${el.amigo_id}"]`);

//         p.innerHTML = `

// <small>${el.status === "enviada" ? el.nome_user : el.nome_amigo}:</small>
// ${el.mensagem}

//                     `;
//     });
// }, 100);

// setInterval(async () => {
//     if (!idUser.value) return;

//     const response = await fetch("http://localhost:3000/notificacoes");
//     const data = await response.json();

//     document.querySelectorAll(".nao-lidas").forEach((el) => {
//         const text = el.textContent;
//         const idAmigo = el.getAttribute("id-amigo-not");

//         const notificacoes = data.filter((el) => el.amigo_id == idAmigo).length;

//         if (notificacoes != text) {
//             el.textContent = notificacoes;
//         }

//         if (el.textContent > 0) {
//             el.classList.add("nao-lidas-style");
//         }
//         if (el.textContent == 0 || !el.textContent) {
//             el.classList.remove("nao-lidas-style");
//             el.textContent = "";
//         }
//     });

//     const selecionado = document.querySelector(".selected");
//     if (selecionado) {
//         const idAmigoSelecionado = selecionado.getAttribute("id-amigo");

//         const idsMensagens = data
//             .filter((el) => el.amigo_id == idAmigoSelecionado)
//             .map((el) => el.id);

//         const response1 = await fetch(
//             `http://localhost:3000/ler?idmensagem=${idsMensagens}`
//         );
//         const data1 = await response1.json();
//     }
// }, 100);

mensagens.scrollTop = mensagens.scrollHeight;
