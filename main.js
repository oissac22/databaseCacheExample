//@ts-check

// const cache = new Cache();

const dataBase = (() => {
    /** @type {{ [key:string]: import("./main").User }} */
    let list = {};

    const save = async () => {
        const cache = await caches.open("my-cache")
        cache.put("/users", new Response(JSON.stringify(list)));
    }

    const load = async () => {
        const cache = await caches.open("my-cache")
        const response = await cache.match("/users");
        const json = await response?.json() || {};
        list = json;
    }

    /**
     * @param {import("./main").UserInsert} data
     * @returns {Promise<import("./main").User>}
     */
    const insert = async (data) => {
        const id = newId();
        const newData = { ...data, id };
        list[id] = newData;
        save();
        return newData;
    }

    /**
     * @param {string} id
     * @param {import("./main").UserInsert} data
     */
    const update = async (id, data) => {
        const item = list[id];
        if (!item) throw new Error(`user ${id} not found`);
        item.name = data.name;
        item.age = data.age;
        save();
    }

    /**
     * @param {string} id 
     */
    const deleteData = async id => {
        if (!list[id]) throw new Error(`user ${id} not found`);
        delete list[id];
        save();
    }

    /**
     * @returns {Promise<import("./main").User[]>}
     */
    const getList = async () => {
        return Object.values(list);
    }

    /**
     * @param {string} id 
     * @returns {Promise<import("./main").User>}
     */
    const getDataById = async id => {
        const item = list[id];
        if (!item) throw new Error(`user ${id} not found`);
        return item;
    }

    return {
        initialize:load,
        insert,
        update,
        deleteData,
        getList,
        getDataById
    }
})()

function newId() {
    return new Date().toISOString().replace(/\D+/g,'');
}

/**
 * @param {string} query 
 * @returns {HTMLElement}
 */
function getForceElement(query) {
    /** @type {any} */
    const element = document.querySelector(query);
    if (!element) throw new Error(`Form "${query}" não encontrado`);
    return element;
}

const components = {
    /** @returns {HTMLFormElement} */
    get form(){
        /** @type {any} */
        const frm = getForceElement("#formData");
        return frm;
    },

    /** @returns {import("./main").User} */
    get formData() {
        const frm = new FormData(this.form);
        return {
            id: frm.get("id")?.toString() || "",
            name: frm.get("name")?.toString() || "",
            age: Number(frm.get("age")?.toString() || "0"),
        }
    },

    /** @returns {HTMLTableElement} */
    get tableBodyList() {
        /** @type {any} */
        const tbody = getForceElement("#list");
        return tbody;
    },

    /**
     * @returns {HTMLInputElement}
     */
    get inputName() {
        /** @type {any} */
        const input = getForceElement('input[name="name"]');
        return input;
    },

    /**
     * @returns {HTMLInputElement}
     */
    get inputAge() {
        /** @type {any} */
        const input = getForceElement('input[name="age"]');
        return input;
    }
}

/**
 * @param {"tr" | "td" | "button"} element 
 * @param {any[]} children 
 * @returns {HTMLElement}
 */
function newElement(element, children) {
    const el = document.createElement(element);
    children.forEach(c => {
        if (typeof c === 'string' || typeof c === 'number')
            c = document.createTextNode(typeof c === "string" ? c : c.toString());
        el.appendChild(c)
    });
    return el;
}

async function renderList() {
    const list = await dataBase.getList();
    const listSort = list.sort((a,b) => a.name < b.name ? -1 : 1);
    const tbody = components.tableBodyList;
    tbody.innerHTML = "";
    listSort.map(item => {
        const buttonDelete = newElement("button", ["Delete"]);
        buttonDelete.classList.add("deleteList");
        buttonDelete.addEventListener("click", () => {
            dataBase.deleteData(item.id);
            renderList();
        })
        const tr = newElement(
            "tr",
            [
                newElement("td", [item.id]),
                newElement("td", [item.name]),
                newElement("td", [item.age]),
                buttonDelete,
            ]
        )
        tbody.appendChild(tr);
    })
}

function startForm() {
    components.form.addEventListener("submit", e => {
        e.preventDefault();
        const dataInForm = components.formData;
        dataBase.insert(dataInForm);
        components.inputName.value = "";
        components.inputAge.value = "";
        components.inputName.focus();
        renderList();
    })
}

async function main() {
    startForm();
    await dataBase.initialize();
    renderList();
}

window.addEventListener("DOMContentLoaded", main);