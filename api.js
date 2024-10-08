import { renderApp } from "./render.js";
// import { fullDate } from "./index.js";
import { format } from "date-fns";

export let comments = [];

const host = 'https://wedev-api.sky.pro/api/v2/anna-shatilova/comments';
const loginHost = ' https://wedev-api.sky.pro/api/user/login';
const registerHost = 'https://wedev-api.sky.pro/api/user';

export let token = null;
function setToken(newToken) {
    token = newToken;
}
export let isInitionalLoading = true;
export const getInitionalLoading = () => isInitionalLoading;

export let isLikeLoading = false;
export const getLikeLoading = () => isLikeLoading;


export let isPostComment = false;
export const getPostComment = () => isPostComment;


export let userApi = null;
export const setUser = () => userApi;

// let commentDate = null;

export const fetchAndRenderComments = () => {
    renderApp();

    return fetch(host, {
        method: "GET",
        headers: {
            Authorization: token,
        }
    })
        .then((response) => {
            if (response.status === 401) {
                throw new Error("Нет авторизации");
            }
            if (response.status === 500) {
                throw new Error("Сервер сломался");
            }
            return response.json()
        })
        .then((responseData) => {
            isInitionalLoading = false;
            const appComments = responseData.comments.map((comment) => {
                // const createDate = format(new Date(comment.date), 'YYYY-MM-DD hh.mm.ss');
                // commentDate = comment.date;
                return {
                    author: comment.author.name,
                    date: format(new Date(comment.date), 'yyyy-MM-dd hh.mm.ss'),
                    text: comment.text,
                    likes: comment.likes,
                    isLiked: false,
                    id: comment.id
                }
            });
            comments = appComments;

            renderApp();
        })
        .catch((error) => {
            console.error(error);

            if (error.message === "Сервер сломался") {
                alert("Кажется, у вас сломался интернет, попробуйте позже");
                return;
            }
        })
}

export const handlePostClick = () => {
    const nameInputElement = document.getElementById('add-form-name');
    const textAreaElement = document.getElementById('add-form-text');
    isPostComment = true;
    renderApp();

    fetch(host, {
        method: "POST",
        body: JSON.stringify({
            name: nameInputElement.value
                .replaceAll("&", "&amp;")
                .replaceAll("<", "&lt;")
                .replaceAll(">", "&gt;")
                .replaceAll('"', "&quot;"),
            text: textAreaElement.value
                .replaceAll("&", "&amp;")
                .replaceAll("<", "&lt;")
                .replaceAll(">", "&gt;")
                .replaceAll('"', "&quot;")
                .replaceAll("QUOTE_BEGIN", "<div class='quote'>")
                .replaceAll("QUOTE_END", "</div>"),
            forceError: true
        }),
        headers: {
            Authorization: token,
        }
    })
        .then((response) => {

            if (response.status === 500) {
                throw new Error("Сервер сломался");
            }
            if (response.status === 400) {
                throw new Error("Плохой запрос");
            }
            return response.json()
        })
        .then(() => {
            isPostComment = false;
            renderApp();

            return fetchAndRenderComments().then(() => {
                nameInputElement.value = '';
                textAreaElement.value = '';
            })
        })
        .catch((error) => {
            if (error.message === "Сервер сломался") {
                handlePostClick();
                return;
            }
            if (error.message === "Плохой запрос") {
                alert("Имя и комментарий должны быть не короче 3 символов");
                return;
            }
            alert('Кажется, у вас отсутствует интернет');
            console.log(error);
        })
}

export const countLikesApi = (id) => {
    isLikeLoading = true;
    renderApp();
    fetch(host + "/" + id + "/" + "toggle-like", {
        method: "POST",
        headers: {
            Authorization: token,
        }
    })
        .then((result) => {
            result.isLiked
                ? result.likes - 1
                : result.likes + 1;
            result.isLiked = !result.isLiked;
            isLikeLoading = false;
            renderApp();
            return fetchAndRenderComments()
        })
}

export const deleteLastComment = (id) => {
    return fetch(host + "/" + id, {
        method: "DELETE",
        headers: {
            Authorization: token,
        }
    })
        .then(() => {
            return fetchAndRenderComments();
        })
}


export const loginUser = (login, password) => {
    return fetch(loginHost, {
        method: "POST",
        body: JSON.stringify({
            login: login,
            password: password
        })
    })
        .then((response) => {
            if (response.status === 400) {
                throw new Error("Неверный логин или пароль");
            }
            return response.json()
        })
        .then((user) => {
            userApi = user;
            setToken(`Bearer ${user.user.token}`);
            fetchAndRenderComments();
        })
        .catch((error) => {
            if (error.message === "Неверный логин или пароль") {
                alert("Неверный логин или пароль");
                return;
            }
        })
}

export const registerUser = (name, login, password) => {
    return fetch(registerHost, {
        method: "POST",
        body: JSON.stringify({
            login: login,
            name: name,
            password: password
        })
    })
        .then((response) => {
            if (response.status === 400) {
                throw new Error("Такой пользователь уже существует");
            }
            return response.json()
        })
        .then((user) => {
            setToken(`Bearer ${user.user.token}`);
            fetchAndRenderComments();
        })
        .catch((error) => {
            if (error.message === "Такой пользователь уже существует") {
                alert("Такой пользователь уже существует");
                return;
            }
        })
}