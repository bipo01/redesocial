const showAddPostBtn = document.querySelector("#show-add-post-btn");
const addPostForm = document.querySelector("#add-post-form");
const posts = document.querySelector(".posts");

let msgSelecionadasArr = [];

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
const usuarioAtual = document.querySelector("#usuarioAtual").value;

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
            fetch(`http://localhost:3000/ler?idmensagem=${idsMensagens}`);
        }
    }

    const idAmigoInput = document.querySelector("#idAmigo").value;

    if (idUser.value == mensagem.idUser && idAmigoInput == mensagem.idAmigo) {
        mensagens.innerHTML = "";
        const datasMsg = [];
        const datasPostas = [];
        mensagem.mensagem.forEach((el) => {
            if (!datasMsg.includes(el.data)) {
                datasMsg.push(el.data);
            }
            el.mensagem = el.mensagem.replaceAll("\n", "<br>");
            const html = `
                            <p data-msg='${el.data}' id-msg='${
                el.id
            }' class='msg ${el.status}'>
                               <span> ${el.mensagem} </span>
                                <small id="hora">${el.hora}</small>
                            </p>
                            ${
                                datasPostas.includes(el.data)
                                    ? ""
                                    : `<h5 class='datasMsg'>${new Date(
                                          el.data
                                      ).toLocaleString("pt-br", {
                                          year: "numeric",
                                          month: "numeric",
                                          day: "numeric",
                                      })}</h5>`
                            }
                            `;
            mensagens.insertAdjacentHTML("afterbegin", html);
            datasPostas.push(el.data);

            document.querySelectorAll(".msg").forEach((btn) => {
                if (!btn.classList.contains("functionDelete")) {
                    console.log(btn);
                    btn.classList.add("functionDelete");
                    btn.addEventListener("dblclick", () => {
                        const idMsg = btn.getAttribute("id-msg");
                        btn.classList.toggle("msgSelecionada");
                        if (btn.classList.contains("msgSelecionada")) {
                            if (!msgSelecionadasArr.includes(idMsg)) {
                                msgSelecionadasArr.push(idMsg);
                            }
                        } else {
                            if (msgSelecionadasArr.includes(idMsg)) {
                                const index = msgSelecionadasArr.indexOf(idMsg);
                                msgSelecionadasArr.splice(index, 1);
                            }
                        }

                        console.log(msgSelecionadasArr);

                        if (msgSelecionadasArr.length > 0) {
                            document
                                .querySelector("#deletarMsgs")
                                .classList.remove("hidden");
                        } else {
                            document
                                .querySelector("#deletarMsgs")
                                .classList.add("hidden");
                        }
                    });
                }
            });
        });
    } else if (
        idUser.value == mensagem.idAmigo &&
        idAmigoInput == mensagem.idUser
    ) {
        mensagens.innerHTML = "";

        const datasMsg = [];
        const datasPostas = [];

        mensagem.mensagem1.forEach((el) => {
            if (!datasMsg.includes(el.data)) {
                datasMsg.push(el.data);
            }
            el.mensagem = el.mensagem.replaceAll("\n", "<br>");
            const html = `
                            <p data-msg='${el.data}' id-msg='${
                el.id
            }' class='msg ${el.status}'>
                                <span>${el.mensagem}</span>
                                <small id="hora">${el.hora}</small>
                            </p>
                            ${
                                datasPostas.includes(el.data)
                                    ? ""
                                    : `<h5 class='datasMsg'>${new Date(
                                          el.data
                                      ).toLocaleString("pt-br", {
                                          year: "numeric",
                                          month: "numeric",
                                          day: "numeric",
                                      })}</h5>`
                            }
                            `;
            mensagens.insertAdjacentHTML("afterbegin", html);
            datasPostas.push(el.data);
        });

        document.querySelectorAll(".msg").forEach((btn) => {
            if (!btn.classList.contains("functionDelete")) {
                console.log(btn);
                btn.classList.add("functionDelete");

                btn.addEventListener("dblclick", () => {
                    const idMsg = btn.getAttribute("id-msg");
                    btn.classList.toggle("msgSelecionada");
                    if (btn.classList.contains("msgSelecionada")) {
                        if (!msgSelecionadasArr.includes(idMsg)) {
                            msgSelecionadasArr.push(idMsg);
                        }
                    } else {
                        if (msgSelecionadasArr.includes(idMsg)) {
                            const index = msgSelecionadasArr.indexOf(idMsg);
                            msgSelecionadasArr.splice(index, 1);
                        }
                    }

                    console.log(msgSelecionadasArr);

                    if (msgSelecionadasArr.length > 0) {
                        document
                            .querySelector("#deletarMsgs")
                            .classList.remove("hidden");
                    } else {
                        document
                            .querySelector("#deletarMsgs")
                            .classList.add("hidden");
                    }
                });
            }
        });
    }
});

showAddPostBtn.addEventListener("click", () => {
    addPostForm.querySelectorAll("input").forEach((el) => (el.value = ""));
    addPostForm.querySelectorAll("textarea").forEach((el) => (el.value = ""));

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

        const datasMsg = [];
        const datasPostas = [];
        data.forEach((el) => {
            if (!datasMsg.includes(el.data)) {
                datasMsg.push(el.data);
            }

            el.mensagem = el.mensagem.replaceAll("\n", "<br>");
            let html;

            html = `
                    
                    <p data-msg='${el.data}' id-msg='${el.id}' class='msg ${
                el.status
            }'>
                    <span>${el.mensagem}</span>
                    <small id="hora">${el.hora}</small></p>
                    ${
                        datasPostas.includes(el.data)
                            ? ""
                            : `<h5 class='datasMsg'>${new Date(
                                  el.data
                              ).toLocaleString("pt-br", {
                                  year: "numeric",
                                  month: "numeric",
                                  day: "numeric",
                              })}</h5>`
                    }
                    `;

            mensagens.insertAdjacentHTML("afterbegin", html);
            datasPostas.push(el.data);
        });

        console.log(datasMsg);

        document.querySelectorAll(".msg").forEach((btn) => {
            if (btn.classList.contains("functionDelete")) return;
            btn.classList.add("functionDelete");
            btn.addEventListener("dblclick", () => {
                const idMsg = btn.getAttribute("id-msg");
                btn.classList.toggle("msgSelecionada");
                if (btn.classList.contains("msgSelecionada")) {
                    if (!msgSelecionadasArr.includes(idMsg)) {
                        msgSelecionadasArr.push(idMsg);
                    }
                } else {
                    if (msgSelecionadasArr.includes(idMsg)) {
                        const index = msgSelecionadasArr.indexOf(idMsg);
                        msgSelecionadasArr.splice(index, 1);
                    }
                }

                console.log(msgSelecionadasArr);

                if (msgSelecionadasArr.length > 0) {
                    document
                        .querySelector("#deletarMsgs")
                        .classList.remove("hidden");
                } else {
                    document
                        .querySelector("#deletarMsgs")
                        .classList.add("hidden");
                }
            });
        });

        document.querySelector(`[id-amigo-not='${idAmigo}']`).innerHTML = "";
        document
            .querySelector(`[id-amigo-not='${idAmigo}']`)
            .classList.remove("nao-lidas-style");

        const idsMensagens = data
            .filter((el) => el.amigo_id == idAmigo)
            .map((el) => el.id);

        fetch(`http://localhost:3000/ler?idmensagem=${idsMensagens}`);

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

    if (!mensagem.value.trim().length) return;

    const formData = new FormData(enviarMensagemForm);
    const urlParams = new URLSearchParams(formData);
    const idAmigo = enviarMensagemForm.children[0].children[1].value;

    const response = await fetch("http://localhost:3000/enviar-mensagem", {
        method: "post",
        body: urlParams,
    });

    msgSelecionadasArr = [];

    socket.emit("sendMessage", {
        idAmigo,
        idUser: idUser.value,
        mensagem: mensagem.value,
    });

    mensagem.value = "";
});

mensagens.scrollTop = mensagens.scrollHeight;

addPostForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const titulo = document.querySelector("#titulo");
    const texto = document.querySelector("#texto");
    const image = document.querySelector("#image");

    const formData = new FormData(addPostForm);
    const response = await fetch(`http://localhost:3000/add-post`, {
        method: "post",
        body: formData,
    });
    const data = await response.json();
    console.log(data);

    titulo.value = "";
    texto.value = "";
    image.value = "";
    addPostForm.classList.add("hidden");
    showAddPostBtn.textContent = "Nova publicação";

    socket.emit("novoPost", {
        id: data.id,
    });
});

document.querySelector("#deletarMsgs").addEventListener("click", () => {
    msgSelecionadasArr.forEach((el) => {
        document.querySelector(`[id-msg='${el}']`).remove();
    });

    socket.emit("deletarMsg", {
        msgSelecionadasArr,
    });

    msgSelecionadasArr = [];

    document.querySelector("#deletarMsgs").classList.add("hidden");
    const idAmigoP = document.querySelector("#idAmigoP").value;

    const lastMessage = document
        .querySelector(".mensagens")
        .querySelectorAll(".msg")[0];

    const ultimaMensagem = document.querySelector(`[id-amigo-p='${idAmigoP}']`);

    if (lastMessage) {
        const statusLastMessage = lastMessage.classList.contains("enviada");
        const lastMessageText = lastMessage.querySelector("span").textContent;
        const nomeAmigo =
            ultimaMensagem.parentElement.querySelector("h3").textContent;
        ultimaMensagem.innerHTML = `<small>${
            statusLastMessage ? "Você" : `${nomeAmigo}`
        }: ${lastMessageText}</small>`;
    } else {
        ultimaMensagem.innerHTML = "";
        mensagens.innerHTML = "";
    }

    const allMsgs = [...mensagens.querySelectorAll(".msg")];
    const allDatas = [...mensagens.querySelectorAll("h5")];
    const allDatasText = [];
    const datasMsgArr = [];

    allDatas.forEach((el) => {
        allDatasText.push(el.textContent);
    });
    console.log(allDatasText);

    allMsgs.forEach((el) => {
        const dataAttr = el.getAttribute("data-msg");

        const dataEd = new Date(dataAttr).toLocaleString("pt-br", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
        });
        console.log(dataEd);

        if (!datasMsgArr.includes(dataEd)) {
            datasMsgArr.push(dataEd);
        }
    });

    allDatasText.forEach((dt) => {
        if (!datasMsgArr.includes(dt)) {
            console.log(dt);
            allDatas.forEach((el) => {
                if (el.textContent == dt) {
                    el.remove();
                }
            });
        }
    });
});
